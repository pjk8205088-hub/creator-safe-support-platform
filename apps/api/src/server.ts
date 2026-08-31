import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CreateSupportSchema, maskAddress } from '@cssp/shared';

type UserRole = 'FAN' | 'CREATOR';
type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  creatorSlug?: string;
  createdAt: string;
};

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  featured?: boolean;
};

type Creator = {
  id: string;
  slug: string;
  displayName: string;
  handle: string;
  bio: string;
  categoryId: string;
  platform: string;
  avatarUrl: string;
  coverUrl: string;
  safeAddress: string;
  wishlist: {
    id: string;
    title: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    note: string;
  }[];
};

type PaymentOrder = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  creatorInstagramId?: string;
  wishlistItemId?: string;
  supporterName: string;
  supporterId: string;
  supporterEmail: string;
  message?: string;
  amount: number;
  paymentProvider: string;
  paymentKey: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROVISIONING' | 'ACTIVE' | 'CANCELLED' | 'REFUNDED';
  adminFee: number;
  creatorPayout: number;
  payoutDestination: 'ADMIN_DASHBOARD' | 'CREATOR_ACCOUNT';
  payoutStatus: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
  paidAt?: string;
};

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());
const prisma = process.env.DATABASE_URL ? new PrismaClient() : null;

const categories: Category[] = [
  {
    id: 'streaming',
    name: 'Streaming Gear',
    description: '방송 장비, 조명, 마이크처럼 팬이 바로 응원하기 좋은 아이템',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900',
    featured: true
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    description: '카페, 건강, 데스크 셋업 등 크리에이터의 일상을 지켜주는 선물',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900',
    featured: true
  },
  {
    id: 'beauty',
    name: 'Beauty',
    description: '뷰티 촬영, 리뷰 콘텐츠, 셀프 케어에 맞춘 위시리스트',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900'
  },
  {
    id: 'digital',
    name: 'Digital',
    description: '구독권, 소프트웨어, 디지털 콘텐츠 패스와 멤버십 이용권',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900'
  }
];

const creators: Creator[] = [
  {
    id: 'cr_1',
    slug: 'hana',
    displayName: '하나 스튜디오',
    handle: '@hana.studio',
    bio: '일상, 뷰티, 데스크 셋업 콘텐츠를 만드는 크리에이터입니다.',
    categoryId: 'lifestyle',
    platform: 'YouTube',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200',
    safeAddress: '서울특별시 강남구 테헤란로 123 10층',
    wishlist: [
      {
        id: 'wi_1',
        title: '촬영용 무드 조명',
        price: 49000,
        categoryId: 'streaming',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        note: '밤 촬영 때 화면 톤을 안정적으로 맞추고 싶어요.'
      },
      {
        id: 'wi_2',
        title: '카페 작업 디지털 에디션',
        price: 15000,
        categoryId: 'lifestyle',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        note: '편집 비하인드 사진과 작업 노트를 열람할 수 있습니다.'
      }
    ]
  },
  {
    id: 'cr_2',
    slug: 'min-games',
    displayName: '민 게임즈',
    handle: '@mingames',
    bio: '게임 방송과 리뷰를 진행하며 안전한 선물 문화를 만들고 있습니다.',
    categoryId: 'streaming',
    platform: 'Twitch',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    safeAddress: '부산광역시 해운대구 센텀중앙로 55',
    wishlist: [
      {
        id: 'wi_3',
        title: '방송 비하인드 콘텐츠 패스',
        price: 30000,
        categoryId: 'streaming',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        note: '방송 비하인드 영상과 전용 공지를 이용할 수 있습니다.'
      },
      {
        id: 'wi_4',
        title: '게임 리뷰 구독권',
        price: 22000,
        categoryId: 'digital',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
        note: '신작 리뷰 콘텐츠 제작에 도움이 됩니다.'
      }
    ]
  },
  {
    id: 'cr_3',
    slug: 'yuri-beauty',
    displayName: '유리 뷰티',
    handle: '@yuri.beauty',
    bio: '스킨케어와 메이크업 루틴을 소개하는 뷰티 크리에이터입니다.',
    categoryId: 'beauty',
    platform: 'Instagram',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
    safeAddress: '경기도 성남시 분당구 판교역로 99',
    wishlist: [
      {
        id: 'wi_5',
        title: '뷰티 촬영 배경지',
        price: 18000,
        categoryId: 'beauty',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
        note: '제품 컬러가 잘 보이는 촬영 배경을 준비하려고 해요.'
      }
    ]
  }
];

const users: User[] = [
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

const sessions = new Map<string, string>();
const supports: any[] = [];
const notifications: any[] = [];
const paymentOrders: PaymentOrder[] = [];
const adminCommissionRate = Number(process.env.ADMIN_COMMISSION_RATE ?? 25);
const dbReady = () => prisma !== null;

async function seedDatabase() {
  if (!prisma) return;
  const count = await prisma.creatorProfile.count();
  if (count > 0) return;
  for (const creator of creators) {
    await prisma.creatorProfile.create({
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
        digitalProducts: {
          create: creator.wishlist.map(item => ({
            title: item.title,
            imageUrl: item.imageUrl,
            description: item.note,
            pointPrice: item.price
          }))
        }
      }
    });
  }
  await prisma.adminSetting.upsert({
    where: { key: 'commissionRate' },
    update: {},
    create: { key: 'commissionRate', value: String(adminCommissionRate) }
  });
}

async function getCommissionRate() {
  if (!prisma) return adminCommissionRate;
  await seedDatabase();
  const setting = await prisma.adminSetting.findUnique({ where: { key: 'commissionRate' } });
  const rate = Number(setting?.value ?? adminCommissionRate);
  return Math.max(1, Math.min(100, Number.isFinite(rate) ? rate : adminCommissionRate));
}

function dbCreatorSummary(creator: any) {
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
    wishlist: (creator.digitalProducts ?? []).map((item: any) => ({
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

function dbOrderToSupport(order: any): Support & { creatorName?: string; creatorHandle?: string } {
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
  password: z.string().min(8)
});

const SignupSchema = AuthSchema.extend({
  name: z.string().min(2).max(30),
  role: z.enum(['FAN', 'CREATOR']).default('FAN'),
  creatorSlug: z.string().min(2).max(30).optional()
});

function publicUser(user: User) {
  const { password, ...safe } = user;
  return safe;
}

function issueSession(user: User) {
  const token = `dev_${nanoid(32)}`;
  sessions.set(token, user.id);
  return { token, user: publicUser(user) };
}

function getUserFromRequest(req: express.Request) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = sessions.get(token);
  return users.find(user => user.id === userId);
}

function creatorSummary(creator: Creator) {
  const { safeAddress, ...safe } = creator;
  return {
    ...safe,
    category: categories.find(category => category.id === creator.categoryId)
  };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'creator-safe-support-api' }));

app.get('/api/categories', (_req, res) => {
  res.json(
    categories.map(category => ({
      ...category,
      creatorCount: creators.filter(creator => creator.categoryId === category.id).length,
      wishlistCount: creators.flatMap(creator => creator.wishlist).filter(item => item.categoryId === category.id).length
    }))
  );
});

app.get('/api/creators', async (req, res) => {
  if (dbReady()) {
    await seedDatabase();
    const query = String(req.query.q ?? '').trim();
    const dbCreators = await prisma!.creatorProfile.findMany({
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
    const creator = await prisma!.creatorProfile.findFirst({
      where: { OR: [{ slug: req.params.slug }, { id: req.params.slug }] },
      include: { digitalProducts: { where: { isActive: true }, orderBy: { priority: 'desc' } } }
    });
    if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    return res.json(dbCreatorSummary(creator));
  }
  const creator = creators.find(item => item.slug === req.params.slug || item.id === req.params.slug);
  if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
  res.json({ ...creatorSummary(creator), addressMasked: maskAddress(creator.safeAddress) });
});

app.post('/api/auth/signup', async (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });

  const input = parsed.data;
  const email = input.email.toLowerCase();
  if (dbReady()) {
    await seedDatabase();
    const exists = await prisma!.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });
    const requestedSlug = input.creatorSlug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const user = await prisma!.user.create({
      data: {
        email,
        displayName: input.name,
        passwordHash: input.password,
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
    return res.status(201).json({ token: `db_${user.id}`, user: publicUser({ id: user.id, name: user.displayName, email: user.email, password: '', role: user.role as UserRole, createdAt: user.createdAt.toISOString() }) });
  }
  if (users.some(user => user.email === email)) return res.status(409).json({ code: 'EMAIL_ALREADY_EXISTS' });

  const requestedSlug = input.creatorSlug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const creatorSlug = input.role === 'CREATOR' ? requestedSlug || `creator-${nanoid(5)}` : undefined;
  const user: User = {
    id: `usr_${nanoid(8)}`,
    name: input.name,
    email,
    password: input.password,
    role: input.role,
    creatorSlug,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  res.status(201).json(issueSession(user));
});

app.post('/api/auth/login', (req, res) => {
  const parsed = AuthSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });

  const email = parsed.data.email.toLowerCase();
  const user = users.find(item => item.email === email && item.password === parsed.data.password);
  if (!user) return res.status(401).json({ code: 'INVALID_CREDENTIALS' });

  res.json(issueSession(user));
});

app.get('/api/auth/me', (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ code: 'UNAUTHORIZED' });
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  sessions.delete(token);
  res.status(204).send();
});

app.post('/api/supports', (req, res) => {
  const parsed = CreateSupportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
  const input = parsed.data;
  const creator = creators.find(item => item.id === input.creatorId);
  if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
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
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
  const input = parsed.data;
  if (dbReady()) {
    await seedDatabase();
    const creator = await prisma!.creatorProfile.findFirst({ where: { OR: [{ id: input.creatorId }, { slug: input.creatorId }] } });
    if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
    const rate = await getCommissionRate();
    const adminFee = Math.round((input.amount * rate) / 100);
    const creatorPayout = input.amount - adminFee;
    const order = await prisma!.digitalOrder.create({
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
  if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
  const adminFee = Math.round((input.amount * adminCommissionRate) / 100);
  const creatorPayout = input.amount - adminFee;
  const order: PaymentOrder = {
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
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });
  if (dbReady()) {
    const order = await prisma!.digitalOrder.update({
      where: { orderNo: parsed.data.orderId },
      data: { status: 'PAID', paymentKey: parsed.data.paymentKey, paidAt: new Date() },
      include: { creator: true }
    }).catch(() => null);
    if (!order) return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
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
  if (!order) return res.status(404).json({ code: 'ORDER_NOT_FOUND' });
  if (order.paymentKey !== parsed.data.paymentKey) return res.status(400).json({ code: 'PAYMENT_KEY_MISMATCH' });
  if (order.status === 'PAID') return res.json(order);

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
  if (dbReady()) {
    await seedDatabase();
    const orders = await prisma!.digitalOrder.findMany({ include: { creator: true }, orderBy: { createdAt: 'desc' }, take: 300 });
    return res.json(orders.map(dbOrderToSupport));
  }
  res.json(supports);
});
app.get('/api/payments/orders', (_req, res) => res.json(paymentOrders));
app.get('/api/admin/summary', async (_req, res) => {
  if (dbReady()) {
    await seedDatabase();
    const [creatorCount, userCount, orders] = await Promise.all([
      prisma!.creatorProfile.count({ where: { isActive: true } }),
      prisma!.user.count(),
      prisma!.digitalOrder.findMany({ where: { status: 'PAID' } })
    ]);
    return res.json({
      creators: creatorCount,
      users: userCount,
      supports: orders.length,
      revenue: orders.reduce((sum: number, item: any) => sum + item.pointAmount, 0),
      adminFeeTotal: orders.reduce((sum: number, item: any) => sum + item.adminFee, 0),
      creatorPayoutTotal: orders.reduce((sum: number, item: any) => sum + item.creatorPayout, 0),
      openReports: 0,
      pendingSettlements: orders.filter((item: any) => item.payoutStatus === 'PENDING').length,
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
  if (!dbReady()) return res.json(users.map(publicUser));
  await seedDatabase();
  const rows = await prisma!.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(rows.map((user: any) => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role, grade: user.grade, profileImage: user.profileImage, instagramId: user.instagramId, youtubeUrl: user.youtubeUrl, createdAt: user.createdAt })));
});
app.get('/api/admin/creators', async (_req, res) => {
  if (!dbReady()) return res.json(creators);
  await seedDatabase();
  const rows = await prisma!.creatorProfile.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  res.json(rows);
});
app.get('/api/admin/payments', async (_req, res) => {
  if (!dbReady()) return res.json(paymentOrders);
  const rows = await prisma!.digitalOrder.findMany({ include: { creator: true }, orderBy: { createdAt: 'desc' }, take: 300 });
  res.json(rows.map(dbOrderToSupport));
});
app.get('/api/admin/settings', async (_req, res) => res.json({ commissionRate: await getCommissionRate() }));
app.post('/api/admin/settings', async (req, res) => {
  const commissionRate = Math.max(1, Math.min(100, Number(req.body?.commissionRate ?? adminCommissionRate)));
  if (dbReady()) {
    await prisma!.adminSetting.upsert({
      where: { key: 'commissionRate' },
      update: { value: String(commissionRate) },
      create: { key: 'commissionRate', value: String(commissionRate) }
    });
  }
  res.json({ commissionRate });
});
app.get('/api/notifications', (_req, res) => res.json(notifications));
app.post('/api/reports', (req, res) =>
  res.status(201).json({ id: `rp_${nanoid(8)}`, status: 'OPEN', ...req.body, createdAt: new Date().toISOString() })
);

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const defaultWebOut = path.resolve(apiDir, '../../web/out');
const webOutDir = path.resolve(process.env.WEB_OUT_DIR ?? defaultWebOut);
if (fs.existsSync(path.join(webOutDir, 'index.html'))) {
  app.use(express.static(webOutDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webOutDir, 'index.html'));
  });
}

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
