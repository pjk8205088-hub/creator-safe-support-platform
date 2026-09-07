import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
export class PaymentError extends Error {
    code;
    status;
    constructor(code, status = 400) {
        super(code);
        this.code = code;
        this.status = status;
    }
}
export function nicepayConfig(env = process.env) {
    const mode = env.NICEPAY_MODE || 'sandbox';
    const clientId = env.NICEPAY_CLIENT_ID || '';
    const secretKey = env.NICEPAY_SECRET_KEY || '';
    let origin = '';
    try {
        const url = new URL(env.PUBLIC_APP_URL || '');
        if (url.protocol === 'https:' || (mode === 'sandbox' && ['localhost', '127.0.0.1'].includes(url.hostname)))
            origin = url.origin;
    }
    catch { /* Configuration is reported as unavailable below. */ }
    const ready = Boolean(origin && secretKey && ((mode === 'sandbox' && clientId.startsWith('S2_')) ||
        (mode === 'production' && clientId.startsWith('R2_') && env.NICEPAY_LIVE_ENABLED === 'true')));
    return { mode, clientId, secretKey, origin, ready,
        apiBase: mode === 'production' ? 'https://api.nicepay.co.kr' : 'https://sandbox-api.nicepay.co.kr',
        sdkUrl: 'https://pay.nicepay.co.kr/v1/js/' };
}
export function digest(value) { return createHash('sha256').update(value).digest('hex'); }
function signatureMatches(actual, expected) {
    return /^[a-f0-9]{64}$/i.test(actual) && timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}
const callbackSchema = z.object({
    authResultCode: z.literal('0000'), clientId: z.string().max(50),
    orderId: z.string().min(1).max(64), tid: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    amount: z.union([z.string().regex(/^\d+$/), z.number().int().positive()]),
    authToken: z.string().min(1).max(256), signature: z.string()
});
export function validateCallback(body, config) {
    const parsed = callbackSchema.safeParse(body);
    if (!parsed.success)
        throw new PaymentError('INVALID_PAYMENT_AUTH');
    const data = parsed.data;
    if (data.clientId !== config.clientId || !signatureMatches(data.signature, digest(`${data.authToken}${data.clientId}${data.amount}${config.secretKey}`))) {
        throw new PaymentError('INVALID_PAYMENT_SIGNATURE');
    }
    return { ...data, amount: Number(data.amount) };
}
const transactionSchema = z.object({
    resultCode: z.literal('0000'), tid: z.string(), orderId: z.string(),
    amount: z.number().int().positive(), ediDate: z.string().min(1), signature: z.string(),
    status: z.enum(['paid', 'ready', 'failed', 'cancelled', 'partialCancelled', 'expired']),
    currency: z.literal('KRW'), paidAt: z.string().optional(), balanceAmt: z.number().optional()
});
export function verifyTransaction(body, expected, secret) {
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success)
        throw new PaymentError('PG_RESPONSE_INVALID', 502);
    const data = parsed.data;
    if (data.tid !== expected.tid || data.orderId !== expected.orderId || data.amount !== expected.amount ||
        !signatureMatches(data.signature, digest(`${data.tid}${data.amount}${data.ediDate}${secret}`))) {
        throw new PaymentError('PG_RESPONSE_MISMATCH', 502);
    }
    return data;
}
export function nicepayClient(config, transport = fetch) {
    return async (path, body) => {
        if (!config.ready)
            throw new PaymentError('PG_NOT_READY', 503);
        try {
            const response = await transport(config.apiBase + path, {
                method: body ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(12000),
                headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.secretKey}`).toString('base64')}` },
                ...(body ? { body: JSON.stringify(body) } : {})
            });
            if (!response.ok)
                throw new PaymentError('PG_REQUEST_FAILED', 502);
            return await response.json();
        }
        catch (error) {
            if (error instanceof PaymentError)
                throw error;
            throw new PaymentError('PG_RESULT_UNCERTAIN', 502);
        }
    };
}
