import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { nanoid } from 'nanoid';
import { z } from 'zod';
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

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? '*' }));
app.use(express.json());

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
    email: 'creator@example.com',
    password: 'password123',
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

app.get('/api/creators', (req, res) => {
  const category = String(req.query.category ?? '');
  const filtered = category ? creators.filter(creator => creator.categoryId === category) : creators;
  res.json(filtered.map(creatorSummary));
});

app.get('/api/creators/:slug', (req, res) => {
  const creator = creators.find(item => item.slug === req.params.slug || item.id === req.params.slug);
  if (!creator) return res.status(404).json({ code: 'CREATOR_NOT_FOUND' });
  res.json({ ...creatorSummary(creator), addressMasked: maskAddress(creator.safeAddress) });
});

app.post('/api/auth/signup', (req, res) => {
  const parsed = SignupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ code: 'VALIDATION_ERROR', issues: parsed.error.issues });

  const input = parsed.data;
  const email = input.email.toLowerCase();
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
  const support = {
    id: `sp_${nanoid(8)}`,
    ...input,
    status: 'PAID',
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

app.get('/api/supports', (_req, res) => res.json(supports));
app.get('/api/admin/summary', (_req, res) =>
  res.json({
    creators: creators.length,
    users: users.length,
    supports: supports.length,
    revenue: supports.reduce((sum, item) => sum + item.amount, 0),
    openReports: 0,
    pendingSettlements: supports.filter(item => item.status === 'PAID').length
  })
);
app.get('/api/notifications', (_req, res) => res.json(notifications));
app.post('/api/reports', (req, res) =>
  res.status(201).json({ id: `rp_${nanoid(8)}`, status: 'OPEN', ...req.body, createdAt: new Date().toISOString() })
);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
