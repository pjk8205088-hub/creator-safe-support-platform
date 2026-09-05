import 'dotenv/config';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { CreateSupportSchema, maskAddress } from '@cssp/shared';
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());
const prisma = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN
    ? new PrismaClient({
        adapter: new PrismaLibSQL({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN
        })
    })
    : process.env.DATABASE_URL
        ? new PrismaClient()
        : null;
const categories = [
    {
        id: 'digital-content',
        name: '디지털 콘텐츠',
        description: '포인트로 크리에이터별 사진, 영상, 비하인드 콘텐츠 패스를 구매합니다.',
        imageUrl: '/influencers/trendy-influencers-wall.png',
        featured: true
    },
    {
        id: 'kakao-alert',
        name: '카카오 알림톡',
        description: '포인트 충전, 디지털 상품 제공, DM 이용권 상태를 알림으로 확인합니다.',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900',
        featured: true
    },
    {
        id: 'dm',
        name: 'DM 메시지',
        description: '구매한 이용권 범위에서 스팸 필터가 적용된 1:1 메시지를 주고받습니다.',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900'
    },
    {
        id: 'membership',
        name: '멤버십 패스',
        description: '기간형 멤버십과 활동 등급, 디지털 콘텐츠 이용 현황을 관리합니다.',
        imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900'
    }
];
const creators = [
    {
        id: 'cr_1',
        slug: 'kang-su-a',
        displayName: '강수아',
        handle: '@sua.daily',
        bio: '맑고 깨끗한 아름다움을 좋아하는 수아입니다. 자연스러운 데일리룩과 뷰티 팁을 나눠요.',
        categoryId: 'digital-content',
        platform: 'Instagram',
        avatarUrl: '/influencers/kang-su-a.png',
        coverUrl: '/influencers/kang-su-a-summer-resort-v1.png',
        safeAddress: '서울특별시 강남구 테헤란로 123 10층',
        wishlist: [
            {
                id: 'wi_sua_1',
                title: '강수아 여름 리조트 에디션',
                price: 29000,
                categoryId: 'digital-content',
                imageUrl: '/influencers/kang-su-a-summer-resort-v1.png',
                note: '여름 리조트에서 촬영한 만화형 포토 다이어리와 비하인드 콘텐츠입니다.'
            },
            {
                id: 'wi_sua_2',
                title: '수아 뷰티 루틴 DM 이용권',
                price: 12000,
                categoryId: 'dm',
                imageUrl: '/influencers/kang-su-a.png',
                note: '구매 후 수아에게 메시지를 보내고 뷰티 루틴 이야기를 나눌 수 있습니다.'
            }
        ]
    },
    {
        id: 'cr_2',
        slug: 'kim-do-jin',
        displayName: '김도진',
        handle: '@dojin.street',
        bio: '도심의 네온사인처럼 빛나는 도진입니다. 힙합 스트릿 패션과 에너지를 나눠요.',
        categoryId: 'dm',
        platform: 'YouTube',
        avatarUrl: '/influencers/kim-do-jin.png',
        coverUrl: '/influencers/kim-do-jin.png',
        safeAddress: '부산광역시 해운대구 센텀중앙로 55',
        wishlist: [
            {
                id: 'wi_dojin_1',
                title: '도진 스트릿 에디션',
                price: 30000,
                categoryId: 'dm',
                imageUrl: '/influencers/kim-do-jin.png',
                note: '네온 스트릿 무드의 만화형 포토와 도진의 스타일 노트를 제공합니다.'
            },
            {
                id: 'wi_dojin_2',
                title: '도진 1:1 DM 이용권',
                price: 15000,
                categoryId: 'dm',
                imageUrl: '/influencers/kim-do-jin.png',
                note: '구매 후 도진에게 메시지를 보내고 스트릿 라이프 이야기를 나눌 수 있습니다.'
            }
        ]
    },
    {
        id: 'cr_3',
        slug: 'lee-ji-yun',
        displayName: '이지윤',
        handle: '@jiyun.look',
        bio: '보랏빛 밤을 사랑하는 지윤입니다. 유니크한 룩과 저만의 감성을 여러분과 나누고 싶어요.',
        categoryId: 'membership',
        platform: 'Instagram',
        avatarUrl: '/influencers/lee-ji-yun.png',
        coverUrl: '/influencers/lee-ji-yun.png',
        safeAddress: '경기도 성남시 분당구 판교역로 99',
        wishlist: [
            {
                id: 'wi_jiyun_1',
                title: '지윤 나이트 룩북',
                price: 24000,
                categoryId: 'membership',
                imageUrl: '/influencers/lee-ji-yun.png',
                note: '도시의 밤을 담은 만화형 룩북과 스타일링 메모를 열람할 수 있습니다.'
            },
            {
                id: 'wi_jiyun_2',
                title: '지윤 멤버십 패스',
                price: 18000,
                categoryId: 'membership',
                imageUrl: '/influencers/lee-ji-yun.png',
                note: '기간형 멤버십과 전용 콘텐츠, 활동 등급 혜택을 제공합니다.'
            }
        ]
    },
    {
        id: 'cr_4',
        slug: 'han-areum',
        displayName: '한아름',
        handle: '@areum.frames',
        bio: '매일의 순간을 한 장면처럼 기록합니다. 여행과 패션, 기분 좋은 이야기를 전해요.',
        categoryId: 'digital-content',
        platform: 'Instagram',
        avatarUrl: '/influencers/han-areum-v1.png',
        coverUrl: '/influencers/han-areum-v1.png',
        safeAddress: '서울특별시 중구 세종대로 100',
        wishlist: [
            {
                id: 'wi_areum_1',
                title: '아름 프레임 포토 에디션',
                price: 16000,
                categoryId: 'digital-content',
                imageUrl: '/influencers/han-areum-v1.png',
                note: '아름의 시선으로 담아낸 여행과 일상 만화형 포토 에디션입니다.'
            }
        ]
    },
    {
        id: 'cr_5',
        slug: 'moon-ha-rin',
        displayName: '문하린',
        handle: '@harin.notes',
        bio: '비 오는 날의 책방처럼 차분하고 따뜻한 이야기를 전하는 라이프스타일 크리에이터입니다.',
        categoryId: 'kakao-alert',
        platform: 'Instagram',
        avatarUrl: '/influencers/moon-ha-rin-v1.png',
        coverUrl: '/influencers/moon-ha-rin-v1.png',
        safeAddress: '대전광역시 유성구 대학로 291',
        wishlist: [
            {
                id: 'wi_harin_1',
                title: '하린의 비 오는 날 노트',
                price: 14000,
                categoryId: 'kakao-alert',
                imageUrl: '/influencers/moon-ha-rin-v1.png',
                note: '하린의 짧은 글과 만화형 일러스트를 담은 디지털 노트입니다.'
            }
        ]
    }
];
const users = [
    {
        id: 'usr_demo_creator',
        name: '하나 스튜디오',
        email: 'hspjjang@naver.com',
        password: '1111',
        role: 'CREATOR',
        creatorSlug: 'hana',
        createdAt: new Date().toISOString()
    },
    {
        id: 'usr_demo_fan',
        name: '응원하는 팬',
        email: 'fan@example.com',
        password: 'password123',
        role: 'FAN',
        createdAt: new Date().toISOString()
    }
];
const sessions = new Map();
const supports = [];
const notifications = [];
const paymentOrders = [];
const adminCommissionRate = Number(process.env.ADMIN_COMMISSION_RATE ?? 25);
const dbReady = () => prisma !== null;
async function seedDatabase() {
    if (!prisma)
        return;
    const catalogVersion = 'comic-public-v3';
    const catalogSetting = await prisma.adminSetting.findUnique({ where: { key: 'catalogVersion' } });
    if (catalogSetting?.value !== catalogVersion) {
        for (const creator of creators) {
            const existing = await prisma.creatorProfile.findUnique({
                where: { slug: creator.slug },
                include: { digitalProducts: { orderBy: { priority: 'asc' } } }
            });
            const profile = existing
                ? await prisma.creatorProfile.update({
                    where: { id: existing.id },
                    data: {
                        displayName: creator.displayName,
                        handle: creator.handle,
                        bio: creator.bio,
                        category: creator.categoryId,
                        platform: creator.platform,
                        avatarUrl: creator.avatarUrl,
                        coverUrl: creator.coverUrl,
                        instagramId: creator.slug,
                        safeAddressMemo: creator.safeAddress
                    }
                })
                : await prisma.creatorProfile.create({
                    data: {
                        slug: creator.slug,
                        displayName: creator.displayName,
                        handle: creator.handle,
                        bio: creator.bio,
                        category: creator.categoryId,
                        platform: creator.platform,
                        avatarUrl: creator.avatarUrl,
                        coverUrl: creator.coverUrl,
                        instagramId: creator.slug,
                        safeAddressMemo: creator.safeAddress
                    }
                });
            for (const [index, item] of creator.wishlist.entries()) {
                const existingProduct = existing?.digitalProducts[index];
                if (existingProduct) {
                    await prisma.digitalProduct.update({
                        where: { id: existingProduct.id },
                        data: { title: item.title, imageUrl: item.imageUrl, description: item.note, pointPrice: item.price, isActive: true }
                    });
                }
                else {
                    await prisma.digitalProduct.create({
                        data: { creatorId: profile.id, title: item.title, imageUrl: item.imageUrl, description: item.note, pointPrice: item.price }
                    });
                }
            }
        }
        await prisma.adminSetting.upsert({
            where: { key: 'catalogVersion' },
            update: { value: catalogVersion },
            create: { key: 'catalogVersion', value: catalogVersion }
        });
    }
    await prisma.adminSetting.upsert({
        where: { key: 'commissionRate' },
        update: {},
        create: { key: 'commissionRate', value: String(adminCommissionRate) }
    });
    const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? '';
    if (adminEmail && adminPassword) {
        const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (existingAdmin)
            return;
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: { email: adminEmail, passwordHash, role: 'ADMIN', displayName: '관리자' }
        });
    }
}
async function getCommissionRate() {
    if (!prisma)
        return adminCommissionRate;
    await seedDatabase();
    const setting = await prisma.adminSetting.findUnique({ where: { key: 'commissionRate' } });
    const rate = Number(setting?.value ?? adminCommissionRate);
    return Math.max(1, Math.min(100, Number.isFinite(rate) ? rate : adminCommissionRate));
}
function dbCreatorSummary(creator) {
    return {
        id: creator.id,
        slug: creator.slug,
        displayName: creator.displayName,
        handle: creator.handle,
        bio: creator.bio,
        categoryId: creator.category,
        platform: creator.platform,
        avatarUrl: creator.avatarUrl,
        coverUrl: creator.coverUrl,
        addressMasked: creator.safeAddressMemo ? maskAddress(creator.safeAddressMemo) : undefined,
        wishlist: (creator.digitalProducts ?? []).map((item) => ({
            id: item.id,
            title: item.title,
            price: item.pointPrice,
            categoryId: creator.category,
            imageUrl: item.imageUrl ?? creator.avatarUrl,
            note: item.description ?? ''
        })),
        category: categories.find(category => category.id === creator.category)
    };
}
function dbOrderToSupport(order) {
    return {
        id: order.orderNo,
        creatorId: order.creatorId,
        creatorName: order.creator?.displayName,
        creatorHandle: order.creator?.handle,
        creatorInstagramId: order.creator?.instagramId ? `@${order.creator.instagramId}` : order.creator?.handle,
        wishlistItemId: order.productId ?? undefined,
        supporterName: order.purchaserName,
        supporterId: order.fanId ?? undefined,
        supporterEmail: order.purchaserEmail ?? undefined,
        message: order.message ?? undefined,
        amount: order.pointAmount,
        paymentProvider: order.paymentProvider,
        paymentKey: order.paymentKey ?? undefined,
        status: order.status,
        adminFee: order.adminFee,
        creatorPayout: order.creatorPayout,
        payoutDestination: 'ADMIN_DASHBOARD',
        payoutStatus: order.payoutStatus,
        createdAt: order.createdAt.toISOString()
    };
}
const AuthSchema = z.object({
    email: z.string().email(),
    password: z.string().min(4)
});
const SignupSchema = AuthSchema.extend({
    name: z.string().min(2).max(30),
    role: z.enum(['FAN', 'CREATOR']).default('FAN'),
    creatorSlug: z.string().min(2).max(30).optional()
});
function publicUser(user) {
    const { password, ...safe } = user;
    return safe;
}
async function issueSession(user) {
    const token = `dev_${nanoid(32)}`;
    if (prisma) {
        await prisma.adminSetting.create({ data: {
                key: sessionStorageKey(token),
                value: JSON.stringify({ userId: user.id, expiresAt: Date.now() + 8 * 60 * 60 * 1000 })
            } });
    }
    else
        sessions.set(token, user.id);
    return { token, user: publicUser(user) };
}
function sessionStorageKey(token) {
    return `session:${createHash('sha256').update(token).digest('hex')}`;
}
async function getUserFromRequest(req) {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token || token.length > 200)
        return undefined;
    if (prisma) {
        const record = await prisma.adminSetting.findUnique({ where: { key: sessionStorageKey(token) } });
        if (!record)
            return undefined;
        const session = JSON.parse(record.value);
        if (session.expiresAt <= Date.now())
            return undefined;
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (!user)
            return undefined;
        return { id: user.id, name: user.displayName, email: user.email, password: '', role: user.role, createdAt: user.createdAt.toISOString() };
    }
    const userId = sessions.get(token);
    return users.find(user => user.id === userId);
}
app.use('/api/admin', async (req, res, next) => {
    try {
        const user = await getUserFromRequest(req);
        if (!user)
            return res.status(401).json({ code: 'UNAUTHORIZED' });
        if (user.role !== 'ADMIN')
            return res.status(403).json({ code: 'FORBIDDEN' });
        next();
    }
    catch {
        res.status(503).json({ code: 'AUTH_SERVICE_UNAVAILABLE' });
    }
});
// Fail closed until the complete provider checkout and reconciliation flow is configured.
app.use(['/api/payments/orders', '/api/payments/confirm', '/api/supports'], (req, res, next) => {
    if (req.method === 'POST')
        return res.status(503).json({ code: 'PG_NOT_READY', message: '결제 연동 점검 중입니다. 결제 및 포인트 지급은 진행되지 않습니다.' });
    next();
});
app.get('/api/admin/pg-status', (_req, res) => res.json({
    provider: 'NICEPAY', ready: false,
    credentialsConfigured: Boolean(process.env.NICEPAY_CLIENT_ID && process.env.NICEPAY_SECRET_KEY),
    checkoutVerified: false, refundVerified: false, payoutEnabled: false
}));
function creatorSummary(creator) {
    const { safeAddress, ...safe } = creator;
    return {
        ...safe,
        category: categories.find(category => category.id === creator.categoryId)
    };
}
app.get('/health', (_req, res) => res.json({ ok: true, service: 'creator-safe-support-api' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'creator-safe-support-api' }));
app.get('/api/categories', (_req, res) => {
    res.json(categories.map(category => ({
        ...category,
        creatorCount: creators.filter(creator => creator.categoryId === category.id).length,
        wishlistCount: creators.flatMap(creator => creator.wishlist).filter(item => item.categoryId === category.id).length
    })));
});
app.get('/api/creators', async (req, res) => {
    if (dbReady()) {
        await seedDatabase();
        const query = String(req.query.q ?? '').trim();
        const dbCreators = await prisma.creatorProfile.findMany({
            where: {
                isActive: true,
                ...(query
                    ? {
                        OR: [
                            { displayName: { contains: query } },
                            { handle: { contains: query } },
                            { bio: { contains: query } },
                            { instagramId: { contains: query } }
                        ]
                    }
                    : {})
            },
            include: { digitalProducts: { where: { isActive: true }, orderBy: { priority: 'desc' } } },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(dbCreators.map(dbCreatorSummary));
    }
    const category = String(req.query.category ?? '');
    const filtered = category ? creators.filter(creator => creator.categoryId === category) : creators;
    res.json(filtered.map(creatorSummary));
});
app.get('/api/creators/:slug', async (req, res) => {
    if (dbReady()) {
        await seedDatabase();
        const creator = await prisma.creatorProfile.findFirst({
            where: { OR: [{ slug: req.params.slug }, { id: req.params.slug }] },
            include: { digitalProducts: { where: { isActive: true }, orderBy: { priority: 'desc' } } }
        });
        if (!creator)
            return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
        return res.json(dbCreatorSummary(creator));
    }
    const creator = creators.find(item => item.slug === req.params.slug || item.id === req.params.slug);
    if (!creator)
        return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    res.json({ ...creatorSummary(creator), addressMasked: maskAddress(creator.safeAddress) });
});
app.post('/api/auth/signup', async (req, res) => {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const input = parsed.data;
    const email = input.email.toLowerCase();
    if (dbReady()) {
        await seedDatabase();
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists)
            return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
        const requestedSlug = input.creatorSlug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const user = await prisma.user.create({
            data: {
                email,
                displayName: input.name,
                passwordHash: await bcrypt.hash(input.password, 12),
                role: input.role,
                ...(input.role === 'CREATOR'
                    ? {
                        creatorProfile: {
                            create: {
                                slug: requestedSlug || `creator-${nanoid(5)}`,
                                displayName: input.name,
                                handle: `@${requestedSlug || input.name}`,
                                bio: '인플러언서 코리아 크리에이터입니다.',
                                category: 'creator',
                                platform: 'Instagram',
                                avatarUrl: '/influencers/trendy-influencers-wall.png',
                                coverUrl: '/influencers/trendy-influencers-wall.png'
                            }
                        }
                    }
                    : {})
            }
        });
        return res.status(201).json(await issueSession({ id: user.id, name: user.displayName, email: user.email, password: '', role: user.role, createdAt: user.createdAt.toISOString() }));
    }
    if (users.some(user => user.email === email))
        return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
    const requestedSlug = input.creatorSlug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const creatorSlug = input.role === 'CREATOR' ? requestedSlug || `creator-${nanoid(5)}` : undefined;
    const user = {
        id: `usr_${nanoid(8)}`,
        name: input.name,
        email,
        password: input.password,
        role: input.role,
        creatorSlug,
        createdAt: new Date().toISOString()
    };
    users.push(user);
    res.status(201).json(await issueSession(user));
});
app.post('/api/auth/login', async (req, res) => {
    const parsed = AuthSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const email = parsed.data.email.toLowerCase();
    if (dbReady()) {
        return seedDatabase().then(async () => {
            const dbUser = await prisma.user.findUnique({ where: { email } });
            const valid = dbUser?.passwordHash ? await bcrypt.compare(parsed.data.password, dbUser.passwordHash) : false;
            if (!dbUser || !valid)
                return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
            const user = {
                id: dbUser.id,
                name: dbUser.displayName,
                email: dbUser.email,
                password: '',
                role: dbUser.role,
                creatorSlug: undefined,
                createdAt: dbUser.createdAt.toISOString()
            };
            users.push(user);
            return res.json(await issueSession(user));
        }).catch(() => res.status(503).json({ code: 'AUTH_SERVICE_UNAVAILABLE' }));
    }
    const user = users.find(item => item.email === email && item.password === parsed.data.password);
    if (!user)
        return res.status(401).json({ code: 'INVALID_CREDENTIALS' });
    res.json(await issueSession(user));
});
app.get('/api/auth/me', async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user)
        return res.status(401).json({ code: 'UNAUTHORIZED' });
    res.json({ user: publicUser(user) });
});
app.post('/api/auth/logout', async (req, res) => {
    const header = req.header('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    sessions.delete(token);
    if (prisma && token)
        await prisma.adminSetting.deleteMany({ where: { key: sessionStorageKey(token) } });
    res.status(204).send();
});
app.post('/api/supports', (req, res) => {
    const parsed = CreateSupportSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const input = parsed.data;
    const creator = creators.find(item => item.id === input.creatorId);
    if (!creator)
        return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    const adminFee = Math.round((input.amount * adminCommissionRate) / 100);
    const creatorPayout = input.amount - adminFee;
    const support = {
        id: `sp_${nanoid(8)}`,
        ...input,
        status: 'PAID',
        adminFee,
        creatorPayout,
        payoutDestination: 'ADMIN_DASHBOARD',
        payoutStatus: 'PENDING',
        paymentKey: `mock_${nanoid(10)}`,
        createdAt: new Date().toISOString()
    };
    supports.unshift(support);
    notifications.unshift({
        id: `nt_${nanoid(8)}`,
        creatorId: creator.id,
        channel: 'KAKAO_ALIMTALK',
        title: '새 디지털 상품 주문이 접수되었습니다',
        body: `${input.supporterName}님의 ${input.amount.toLocaleString()}원 디지털 상품 주문이 접수되었습니다.`,
        createdAt: new Date().toISOString()
    });
    res.status(201).json(support);
});
app.post('/api/payments/orders', async (req, res) => {
    const parsed = CreateSupportSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    const input = parsed.data;
    if (dbReady()) {
        await seedDatabase();
        const creator = await prisma.creatorProfile.findFirst({ where: { OR: [{ id: input.creatorId }, { slug: input.creatorId }] } });
        if (!creator)
            return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
        const rate = await getCommissionRate();
        const adminFee = Math.round((input.amount * rate) / 100);
        const creatorPayout = input.amount - adminFee;
        const order = await prisma.digitalOrder.create({
            data: {
                orderNo: `ord_${nanoid(10)}`,
                creatorId: creator.id,
                productId: undefined,
                purchaserName: input.supporterName,
                purchaserEmail: 'guest@eon8.co.kr',
                message: input.message,
                pointAmount: input.amount,
                paymentProvider: input.paymentProvider,
                paymentKey: `pending_${nanoid(12)}`,
                commissionRate: rate,
                adminFee,
                creatorPayout
            }
        });
        return res.status(201).json({
            orderId: order.orderNo,
            paymentProvider: order.paymentProvider,
            amount: order.pointAmount,
            adminFee: order.adminFee,
            creatorPayout: order.creatorPayout,
            payoutDestination: 'ADMIN_DASHBOARD',
            paymentKey: order.paymentKey
        });
    }
    const creator = creators.find(item => item.id === input.creatorId);
    if (!creator)
        return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    const adminFee = Math.round((input.amount * adminCommissionRate) / 100);
    const creatorPayout = input.amount - adminFee;
    const order = {
        id: `ord_${nanoid(10)}`,
        creatorId: creator.id,
        creatorName: creator.displayName,
        creatorHandle: creator.handle,
        creatorInstagramId: creator.id ? `@${creator.slug}` : undefined,
        wishlistItemId: input.wishlistItemId,
        supporterName: input.supporterName,
        supporterId: `guest_${nanoid(6)}`,
        supporterEmail: 'guest@eon8.co.kr',
        message: input.message,
        amount: input.amount,
        paymentProvider: input.paymentProvider,
        paymentKey: `pending_${nanoid(12)}`,
        status: 'PENDING_PAYMENT',
        adminFee,
        creatorPayout,
        payoutDestination: 'ADMIN_DASHBOARD',
        payoutStatus: 'PENDING',
        createdAt: new Date().toISOString()
    };
    paymentOrders.unshift(order);
    res.status(201).json({
        orderId: order.id,
        paymentProvider: order.paymentProvider,
        amount: order.amount,
        adminFee: order.adminFee,
        creatorPayout: order.creatorPayout,
        payoutDestination: order.payoutDestination,
        paymentKey: order.paymentKey
    });
});
app.post('/api/payments/confirm', async (req, res) => {
    const schema = z.object({
        orderId: z.string().min(1),
        paymentKey: z.string().min(1)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
    if (dbReady()) {
        const order = await prisma.digitalOrder.update({
            where: { orderNo: parsed.data.orderId },
            data: { status: 'PAID', paymentKey: parsed.data.paymentKey, paidAt: new Date() },
            include: { creator: true }
        }).catch(() => null);
        if (!order)
            return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
        const support = dbOrderToSupport(order);
        return res.json({
            ...support,
            supportId: support.id,
            support,
            payoutDestination: 'ADMIN_DASHBOARD',
            payoutStatus: order.payoutStatus
        });
    }
    const order = paymentOrders.find(item => item.id === parsed.data.orderId);
    if (!order)
        return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
    if (order.paymentKey !== parsed.data.paymentKey)
        return res.status(400).json({ code: 'PAYMENT_KEY_MISMATCH' });
    if (order.status === 'PAID')
        return res.json(order);
    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    const support = {
        id: `sp_${nanoid(8)}`,
        creatorId: order.creatorId,
        creatorName: order.creatorName,
        creatorHandle: order.creatorHandle,
        creatorInstagramId: order.creatorInstagramId,
        supporterName: order.supporterName,
        supporterId: order.supporterId,
        supporterEmail: order.supporterEmail,
        message: order.message,
        amount: order.amount,
        paymentProvider: order.paymentProvider,
        adminFee: order.adminFee,
        creatorPayout: order.creatorPayout,
        payoutDestination: order.payoutDestination,
        payoutStatus: 'PENDING',
        status: 'PAID',
        paymentKey: order.paymentKey,
        createdAt: order.paidAt
    };
    supports.unshift(support);
    notifications.unshift({
        id: `nt_${nanoid(8)}`,
        creatorId: order.creatorId,
        channel: 'PG_SETTLEMENT',
        title: '결제가 승인되었습니다',
        body: `${order.supporterName}님의 ${order.amount.toLocaleString()}원 결제가 승인되었고, 관리자 정산 ${order.adminFee.toLocaleString()}원 / 인플러언서 지급 ${order.creatorPayout.toLocaleString()}원으로 기록되었습니다.`,
        createdAt: order.paidAt
    });
    res.json({
        ...order,
        supportId: support.id,
        support,
        payoutDestination: order.payoutDestination,
        payoutStatus: support.payoutStatus
    });
});
app.get('/api/supports', async (_req, res) => {
    const viewer = await getUserFromRequest(_req);
    if (!viewer)
        return res.status(401).json({ code: 'UNAUTHORIZED' });
    if (viewer.role !== 'ADMIN')
        return res.status(403).json({ code: 'FORBIDDEN' });
    if (dbReady()) {
        await seedDatabase();
        const orders = await prisma.digitalOrder.findMany({ include: { creator: true }, orderBy: { createdAt: 'desc' }, take: 300 });
        return res.json(orders.map(dbOrderToSupport));
    }
    res.json(supports);
});
app.get('/api/payments/orders', async (req, res) => {
    const viewer = await getUserFromRequest(req);
    if (viewer?.role !== 'ADMIN')
        return res.status(403).json({ code: 'FORBIDDEN' });
    res.json(paymentOrders);
});
app.get('/api/admin/summary', async (_req, res) => {
    if (dbReady()) {
        await seedDatabase();
        const [creatorCount, userCount, orders] = await Promise.all([
            prisma.creatorProfile.count({ where: { isActive: true } }),
            prisma.user.count(),
            prisma.digitalOrder.findMany({ where: { status: 'PAID' } })
        ]);
        return res.json({
            creators: creatorCount,
            users: userCount,
            supports: orders.length,
            revenue: orders.reduce((sum, item) => sum + item.pointAmount, 0),
            adminFeeTotal: orders.reduce((sum, item) => sum + item.adminFee, 0),
            creatorPayoutTotal: orders.reduce((sum, item) => sum + item.creatorPayout, 0),
            openReports: 0,
            pendingSettlements: orders.filter((item) => item.payoutStatus === 'PENDING').length,
            commissionRate: await getCommissionRate()
        });
    }
    res.json({
        creators: creators.length,
        users: users.length,
        supports: supports.length,
        revenue: supports.reduce((sum, item) => sum + item.amount, 0),
        adminFeeTotal: supports.reduce((sum, item) => sum + (item.adminFee ?? 0), 0),
        creatorPayoutTotal: supports.reduce((sum, item) => sum + (item.creatorPayout ?? 0), 0),
        openReports: 0,
        pendingSettlements: supports.filter(item => item.status === 'PAID').length
    });
});
app.get('/api/admin/users', async (_req, res) => {
    if (!dbReady())
        return res.json(users.map(publicUser));
    await seedDatabase();
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(rows.map((user) => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role, grade: user.grade, profileImage: user.profileImage, instagramId: user.instagramId, youtubeUrl: user.youtubeUrl, createdAt: user.createdAt })));
});
app.get('/api/admin/creators', async (_req, res) => {
    if (!dbReady())
        return res.json(creators);
    await seedDatabase();
    const rows = await prisma.creatorProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(rows);
});
app.get('/api/admin/payments', async (_req, res) => {
    if (!dbReady())
        return res.json(paymentOrders);
    const rows = await prisma.digitalOrder.findMany({ include: { creator: true }, orderBy: { createdAt: 'desc' }, take: 300 });
    res.json(rows.map(dbOrderToSupport));
});
app.get('/api/admin/settings', async (_req, res) => res.json({ commissionRate: await getCommissionRate() }));
app.post('/api/admin/settings', async (req, res) => {
    const parsed = z.object({ commissionRate: z.number().min(0).max(100).finite() }).safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ code: 'VALIDATION_ERROR' });
    const commissionRate = parsed.data.commissionRate;
    if (dbReady()) {
        await prisma.adminSetting.upsert({
            where: { key: 'commissionRate' },
            update: { value: String(commissionRate) },
            create: { key: 'commissionRate', value: String(commissionRate) }
        });
    }
    res.json({ commissionRate });
});
app.get('/api/notifications', (_req, res) => res.json(notifications));
app.post('/api/reports', (req, res) => res.status(201).json({ id: `rp_${nanoid(8)}`, status: 'OPEN', ...req.body, createdAt: new Date().toISOString() }));
const apiDir = path.dirname(fileURLToPath(import.meta.url));
const defaultWebOut = path.resolve(apiDir, '../../web/out');
const webOutDir = path.resolve(process.env.WEB_OUT_DIR ?? defaultWebOut);
if (fs.existsSync(path.join(webOutDir, 'index.html'))) {
    app.use(express.static(webOutDir));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(webOutDir, 'index.html'));
    });
}
export default app;
if (process.env.VERCEL !== '1') {
    const port = Number(process.env.PORT ?? 4000);
    app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
}
