import express from 'express';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { nicepayClient, nicepayConfig, PaymentError, validateCallback, verifyTransaction } from './nicepay.js';
export function installNicepay(app, deps) {
    const config = nicepayConfig();
    const call = nicepayClient(config, deps.transport);
    const db = deps.prisma;
    const wrap = (fn) => (req, res) => {
        void fn(req, res).catch(error => {
            const known = error instanceof PaymentError;
            res.status(known ? error.status : 503).json({ code: known ? error.code : 'PAYMENT_SERVICE_UNAVAILABLE' });
        });
    };
    const ready = () => { if (!config.ready || !db)
        throw new PaymentError('PG_NOT_READY', 503); };
    async function viewer(req) {
        const user = await deps.getUser(req);
        if (!user)
            throw new PaymentError('UNAUTHORIZED', 401);
        return user;
    }
    async function findOrder(orderId) {
        const order = await db.digitalOrder.findUnique({ where: { orderNo: orderId } });
        const stored = await db.adminSetting.findUnique({ where: { key: `nicepay:order:${orderId}` } });
        if (!order || !stored)
            throw new PaymentError('ORDER_NOT_FOUND', 404);
        const meta = JSON.parse(stored.value);
        if (meta.clientId !== config.clientId || meta.mode !== config.mode)
            throw new PaymentError('PAYMENT_ENVIRONMENT_MISMATCH', 409);
        return { order, meta };
    }
    async function savePhase(orderId, meta, phase) {
        await db.adminSetting.update({ where: { key: `nicepay:order:${orderId}` }, data: { value: JSON.stringify({ ...meta, phase }) } });
    }
    async function synchronize(orderId) {
        const { order, meta } = await findOrder(orderId);
        if (!meta.tid)
            return order;
        const result = verifyTransaction(await call(`/v1/payments/${encodeURIComponent(meta.tid)}`), { tid: meta.tid, orderId, amount: order.pointAmount }, config.secretKey);
        // An unresolved network cancellation must not grant a paid entitlement.
        if (result.status === 'paid' && meta.phase === 'NETWORK_CANCEL_PENDING')
            return order;
        const status = result.status === 'paid' ? 'PAID' : result.status === 'cancelled' ? 'REFUNDED' : null;
        if (!status)
            return order;
        await db.$transaction(async (tx) => {
            const current = await tx.digitalOrder.findUniqueOrThrow({ where: { orderNo: orderId } });
            if (current.status === 'REFUNDED' && status === 'PAID')
                return;
            await tx.digitalOrder.update({ where: { orderNo: orderId }, data: {
                    status, paymentKey: meta.tid,
                    ...(status === 'PAID' ? { paidAt: current.paidAt || new Date() } : {})
                } });
            await tx.adminSetting.update({ where: { key: `nicepay:order:${orderId}` }, data: { value: JSON.stringify({ ...meta, phase: status }) } });
        });
        return db.digitalOrder.findUniqueOrThrow({ where: { orderNo: orderId } });
    }
    app.get('/api/payments/config', (_req, res) => res.json({
        provider: 'NICEPAY', ready: config.ready && Boolean(db), mode: config.mode,
        message: config.ready && db ? '카드 결제를 이용할 수 있습니다.' : 'NICEPAY 가맹점 연결 준비 중입니다.'
    }));
    app.post('/api/payments/checkout', wrap(async (req, res) => {
        ready();
        const user = await viewer(req);
        const parsed = z.object({ productId: z.string().min(1).max(100), creatorId: z.string().min(1).max(100), message: z.string().max(500).optional() }).safeParse(req.body);
        if (!parsed.success)
            throw new PaymentError('INVALID_ORDER');
        const product = await db.digitalProduct.findUnique({ where: { id: parsed.data.productId }, include: { creator: true } });
        if (!product?.isActive || !product.creator.isActive || ![product.creatorId, product.creator.slug].includes(parsed.data.creatorId))
            throw new PaymentError('PRODUCT_UNAVAILABLE', 404);
        if (!Number.isSafeInteger(product.pointPrice) || product.pointPrice <= 0)
            throw new PaymentError('INVALID_PRODUCT_PRICE');
        // Only explicitly reviewed products may be offered for real-money checkout.
        if (config.mode === 'production') {
            const approved = await db.adminSetting.findUnique({ where: { key: `nicepay:approved-product:${product.id}` } });
            if (approved?.value !== 'true')
                throw new PaymentError('PRODUCT_NOT_APPROVED', 409);
        }
        const rate = await deps.getRate();
        if (!Number.isFinite(rate) || rate < 0 || rate > 100)
            throw new PaymentError('INVALID_COMMISSION', 503);
        const adminFee = Math.round(product.pointPrice * rate / 100);
        const orderId = `np_${nanoid(24)}`;
        const meta = { clientId: config.clientId, mode: config.mode, phase: 'PENDING', goodsName: product.title };
        await db.$transaction(async (tx) => {
            await tx.digitalOrder.create({ data: {
                    orderNo: orderId, creatorId: product.creatorId, productId: product.id, fanId: user.id,
                    purchaserName: user.name, purchaserEmail: user.email, message: parsed.data.message,
                    pointAmount: product.pointPrice, paymentProvider: 'NICEPAY', commissionRate: rate,
                    adminFee, creatorPayout: product.pointPrice - adminFee
                } });
            await tx.adminSetting.create({ data: { key: `nicepay:order:${orderId}`, value: JSON.stringify(meta) } });
        });
        let goodsName = '';
        for (const character of product.title) {
            if (Buffer.byteLength(goodsName + character) > 40)
                break;
            goodsName += character;
        }
        res.status(201).json({ orderId, amount: product.pointPrice, sdkUrl: config.sdkUrl,
            checkout: { clientId: config.clientId, method: 'card', orderId, amount: product.pointPrice,
                goodsName, returnUrl: `${config.origin}/api/payments/return` } });
    }));
    app.post('/api/payments/return', express.urlencoded({ extended: false, limit: '16kb' }), wrap(async (req, res) => {
        ready();
        const auth = validateCallback(req.body, config);
        const { order, meta } = await findOrder(auth.orderId);
        if (auth.amount !== order.pointAmount)
            throw new PaymentError('PAYMENT_AMOUNT_MISMATCH');
        if (meta.tid && meta.tid !== auth.tid)
            throw new PaymentError('TRANSACTION_MISMATCH', 409);
        if (!meta.tid) {
            if (order.status !== 'PENDING_PAYMENT' || Date.now() - order.createdAt.getTime() > 30 * 60 * 1000)
                throw new PaymentError('ORDER_EXPIRED', 409);
            try {
                await db.$transaction(async (tx) => {
                    await tx.adminSetting.create({ data: { key: `nicepay:approval:${auth.orderId}`, value: auth.tid } });
                    await tx.adminSetting.create({ data: { key: `nicepay:tid:${auth.tid}`, value: auth.orderId } });
                    await tx.adminSetting.update({ where: { key: `nicepay:order:${auth.orderId}` }, data: { value: JSON.stringify({ ...meta, tid: auth.tid, phase: 'APPROVING' }) } });
                });
            }
            catch {
                throw new PaymentError('PAYMENT_ALREADY_PROCESSING', 409);
            }
            try {
                verifyTransaction(await call(`/v1/payments/${encodeURIComponent(auth.tid)}`, { amount: order.pointAmount }), { tid: auth.tid, orderId: auth.orderId, amount: order.pointAmount }, config.secretKey);
            }
            catch {
                await savePhase(auth.orderId, { ...meta, tid: auth.tid }, 'NETWORK_CANCEL_PENDING');
                // Do not retry an uncertain approval; ask NICEPAY to cancel it.
                await call('/v1/payments/netcancel', { orderId: auth.orderId }).catch(() => undefined);
            }
        }
        await synchronize(auth.orderId).catch(() => undefined);
        res.redirect(303, `${config.origin}/#payment-result/${encodeURIComponent(auth.orderId)}`);
    }));
    app.get('/api/payments/status', wrap(async (req, res) => {
        ready();
        const user = await viewer(req);
        const orderId = z.string().max(64).parse(req.query.orderId);
        const { order, meta } = await findOrder(orderId);
        if (order.fanId !== user.id && user.role !== 'ADMIN')
            throw new PaymentError('FORBIDDEN', 403);
        const current = meta.tid ? await synchronize(orderId) : order;
        res.json({ orderId, status: current.status, amount: current.pointAmount, mode: config.mode });
    }));
    app.post('/api/payments/webhook', wrap(async (req, res) => {
        ready();
        const parsed = z.object({ orderId: z.string().max(64), tid: z.string().max(64) }).safeParse(req.body);
        if (!parsed.success)
            throw new PaymentError('INVALID_WEBHOOK');
        const { meta } = await findOrder(parsed.data.orderId);
        if (!meta.tid || meta.tid !== parsed.data.tid)
            throw new PaymentError('TRANSACTION_MISMATCH');
        // Webhook body is only a signal: re-read the transaction from NICEPAY.
        await synchronize(parsed.data.orderId);
        res.status(200).send('OK');
    }));
    app.post('/api/admin/refund', wrap(async (req, res) => {
        ready();
        const user = await viewer(req);
        if (user.role !== 'ADMIN')
            throw new PaymentError('FORBIDDEN', 403);
        const parsed = z.object({ orderId: z.string().max(64), reason: z.string().min(1).max(30) }).safeParse(req.body);
        if (!parsed.success)
            throw new PaymentError('INVALID_REFUND');
        const { order, meta } = await findOrder(parsed.data.orderId);
        if (!meta.tid || order.payoutStatus === 'SENT')
            throw new PaymentError('REFUND_REQUIRES_REVIEW', 409);
        const current = await synchronize(order.orderNo);
        if (current.status === 'REFUNDED')
            return res.json({ status: 'REFUNDED' });
        if (current.status !== 'PAID')
            throw new PaymentError('ORDER_NOT_PAID', 409);
        try {
            await db.adminSetting.create({ data: { key: `nicepay:refund:${order.orderNo}`, value: JSON.stringify({ userId: user.id, reason: parsed.data.reason, at: new Date().toISOString() }) } });
        }
        catch {
            throw new PaymentError('REFUND_REQUIRES_RECONCILIATION', 409);
        }
        await call(`/v1/payments/${encodeURIComponent(meta.tid)}/cancel`, { reason: parsed.data.reason, orderId: `rf_${order.orderNo}` });
        const updated = await synchronize(order.orderNo);
        if (updated.status !== 'REFUNDED')
            throw new PaymentError('REFUND_REQUIRES_RECONCILIATION', 409);
        res.json({ status: updated.status });
    }));
}
