import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Bell,
  Check,
  CreditCard,
  Grid3X3,
  HeartHandshake,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  WalletCards
} from 'lucide-react';
import './style.css';

type Category = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  featured?: boolean;
  creatorCount: number;
  wishlistCount: number;
};

type WishlistItem = {
  id: string;
  title: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  note: string;
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
  addressMasked?: string;
  category?: Category;
  wishlist: WishlistItem[];
};

type Support = {
  id: string;
  creatorId: string;
  creatorName?: string;
  creatorHandle?: string;
  creatorInstagramId?: string;
  supporterName: string;
  supporterId?: string;
  supporterEmail?: string;
  message?: string;
  amount: number;
  paymentProvider?: string;
  paymentKey?: string;
  status: string;
  adminFee?: number;
  creatorPayout?: number;
  payoutDestination?: string;
  payoutStatus?: string;
  createdAt: string;
};

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: 'FAN' | 'CREATOR';
  creatorSlug?: string;
};

type Session = {
  token: string;
  user: SessionUser;
};

type SupportForm = {
  supporterName: string;
  message: string;
  paymentProvider: 'NICEPAY';
};

type PointPackage = {
  id: string;
  name: string;
  points: number;
  price: number;
  description: string;
};

type CheckoutDraft = {
  creatorId: string;
  creatorName: string;
  creatorHandle: string;
  wishlistItemId: string;
  itemTitle: string;
  amount: number;
  message: string;
  supporterName: string;
  paymentProvider: 'NICEPAY';
};

type PaymentOrderResponse = {
  orderId: string;
  paymentProvider: string;
  amount: number;
  adminFee: number;
  creatorPayout: number;
  payoutDestination: string;
  paymentKey: string;
};

const API = import.meta.env.VITE_API_URL || (location.hostname === 'localhost' ? 'http://localhost:4000' : '');
const sessionKey = 'cssp-session';
const supportKey = 'cssp-demo-supports';
const walletKey = 'cssp-demo-point-wallet';

const businessInfo = {
  shopName: '인플러언서 코리아',
  serviceName: '인플러언서 코리아',
  representative: '황성필',
  businessNumber: '168-06-03440',
  address: '전북특별자치도 부안군 줄포면 부안로 911-16',
  businessType: '도매 및 소매업',
  businessItem: '전자상거래 소매 중개업',
  openingDate: '2026.07.09',
  customerCenter: '010-8959-3256',
  email: 'hspjjang@naver.com',
  mailOrderNumber: '2026-4791022-30-2-00060',
  hostingProvider: 'GitHub Pages',
  pgProvider: 'NICEPAY'
};

const demoCategories: Category[] = [
  {
    id: 'digital-content',
    name: '디지털 콘텐츠',
    description: '포인트로 크리에이터별 사진, 영상, 비하인드 콘텐츠 패스를 구매합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=900',
    featured: true,
    creatorCount: 1,
    wishlistCount: 3
  },
  {
    id: 'kakao-alert',
    name: '카카오 알림톡',
    description: '포인트 충전, 디지털 상품 제공, DM 이용권 상태를 알림으로 확인합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900',
    featured: true,
    creatorCount: 1,
    wishlistCount: 1
  },
  {
    id: 'dm',
    name: 'DM 메시지',
    description: '구매한 이용권 범위에서 스팸 필터가 적용된 1:1 메시지를 주고받습니다.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900',
    creatorCount: 1,
    wishlistCount: 1
  },
  {
    id: 'membership',
    name: '멤버십 패스',
    description: '기간형 멤버십과 활동 등급, 디지털 콘텐츠 이용 현황을 운영자가 관리합니다.',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900',
    creatorCount: 1,
    wishlistCount: 1
  }
];

const pointPackages: PointPackage[] = [
  { id: 'point-5000', name: 'STARTER', points: 5000, price: 5000, description: '디지털 콘텐츠 이용 시작' },
  { id: 'point-12000', name: 'PLUS', points: 12000, price: 12000, description: 'DM 이용권과 콘텐츠 패스' },
  { id: 'point-30000', name: 'CLUB', points: 30000, price: 30000, description: '기간형 멤버십과 프리미엄 에디션' }
];

const demoCreators: Creator[] = [
  {
    id: 'cr_1',
    slug: 'hana',
    displayName: '하나 인플루언서',
    handle: '@hana.official',
    bio: '인스타그램과 유튜브에서 팬들과 소통하는 라이프스타일 인플루언서입니다.',
    categoryId: 'digital-content',
    platform: 'YouTube',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200',
    addressMasked: '센터 중계 주소로 실제 배송지 비공개',
    wishlist: [
      {
        id: 'wi_1',
        title: '뷰티 비하인드 콘텐츠 패스',
        price: 49000,
        categoryId: 'digital-content',
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        note: '구매 후 비하인드 사진과 영상 콘텐츠를 열람할 수 있습니다.'
      },
      {
        id: 'wi_2',
        title: '프리미엄 DM 이용권',
        price: 15000,
        categoryId: 'dm',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
        note: '구매 후 크리에이터에게 메시지를 보낼 수 있는 이용권입니다.'
      }
    ]
  },
  {
    id: 'cr_2',
    slug: 'min-games',
    displayName: '민 스트리머',
    handle: '@mingames',
    bio: '게임 방송과 리뷰를 진행하며 디지털 콘텐츠와 실시간 DM 이용권을 운영합니다.',
    categoryId: 'dm',
    platform: 'Twitch',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200',
    addressMasked: '가상 주소/센터 중계 사용',
    wishlist: [
      {
        id: 'wi_3',
        title: '실시간 DM 패스',
        price: 30000,
        categoryId: 'dm',
        imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
        note: '구매자와 인플루언서가 1:1 메시지로 소통합니다.'
      },
      {
        id: 'wi_4',
        title: '입금/결제 알림',
        price: 22000,
        categoryId: 'kakao-alert',
        imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
        note: 'NICEPAY 결제/입금정보를 알림톡으로 즉시 확인합니다.'
      }
    ]
  },
  {
    id: 'cr_3',
    slug: 'yuri-beauty',
    displayName: '유리 뷰티 인플루언서',
    handle: '@yuri.beauty',
    bio: '팬 등급과 활동 리포트를 기반으로 커뮤니티를 운영하는 뷰티 인플루언서입니다.',
    categoryId: 'membership',
    platform: 'Instagram',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    coverUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200',
    addressMasked: '주소 마스킹 대시보드 사용',
    wishlist: [
      {
        id: 'wi_5',
        title: 'VIP 멤버십 패스',
        price: 18000,
        categoryId: 'membership',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
        note: '기간형 멤버십과 전용 콘텐츠, 활동 등급 혜택을 제공합니다.'
      }
    ]
  }
];

function readStoredSupports() {
  try {
    return JSON.parse(localStorage.getItem(supportKey) || '[]') as Support[];
  } catch {
    return [];
  }
}

function saveStoredSupports(supports: Support[]) {
  localStorage.setItem(supportKey, JSON.stringify(supports));
}

function readWalletPoints() {
  return Math.max(0, Number(localStorage.getItem(walletKey)) || 0);
}

function saveWalletPoints(points: number) {
  localStorage.setItem(walletKey, String(Math.max(0, points)));
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  if (!API) return fallback;
  try {
    const response = await fetch(`${API}${path}`);
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function createDemoSession(name: string, email: string, role: 'FAN' | 'CREATOR' = 'CREATOR'): Session {
  return {
    token: `demo_${Date.now()}`,
    user: {
      id: `demo_${Date.now()}`,
      name,
      email,
      role,
      creatorSlug: role === 'CREATOR' ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined
    }
  };
}

function App() {
  const [page, setPage] = useState(location.hash.replace('#', '') || 'home');
  const [categories, setCategories] = useState<Category[]>(demoCategories);
  const [creators, setCreators] = useState<Creator[]>(demoCreators);
  const [supports, setSupports] = useState<Support[]>(readStoredSupports);
  const [selected, setSelected] = useState<Creator | null>(null);
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      localStorage.removeItem(sessionKey);
      return null;
    }
  });
  const [supportForm, setSupportForm] = useState<SupportForm>({
    supporterName: '응원하는 팬',
    message: '늘 좋은 콘텐츠 고마워요!',
    paymentProvider: 'NICEPAY'
  });
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(null);
  const [walletPoints, setWalletPoints] = useState(readWalletPoints);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    const [categoryData, creatorData, supportData] = await Promise.all([
      getJson<Category[]>('/api/categories', demoCategories),
      getJson<Creator[]>('/api/creators', demoCreators),
      getJson<Support[]>('/api/supports', readStoredSupports())
    ]);
    setCategories(categoryData);
    setCreators(creatorData);
    setSupports(supportData);
  };

  useEffect(() => {
    const onHashChange = () => setPage(location.hash.replace('#', '') || 'home');
    addEventListener('hashchange', onHashChange);
    return () => removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!page.startsWith('creator/')) {
      setSelected(null);
      return;
    }
    const slug = page.split('/')[1];
    getJson<Creator | null>(`/api/creators/${slug}`, demoCreators.find(creator => creator.slug === slug) ?? null).then(setSelected);
  }, [page]);

  useEffect(() => {
    if (!session) {
      localStorage.removeItem(sessionKey);
      return;
    }
    localStorage.setItem(sessionKey, JSON.stringify(session));
  }, [session]);

  const activeCategory = page.startsWith('category/') ? page.split('/')[1] : '';
  const visibleCreators = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return creators.filter(creator => {
      const categoryMatches = activeCategory ? creator.categoryId === activeCategory : true;
      const text = `${creator.displayName} ${creator.handle} ${creator.bio} ${creator.platform}`.toLowerCase();
      return categoryMatches && (!query || text.includes(query));
    });
  }, [activeCategory, creators, searchQuery]);
  const revenue = useMemo(() => supports.reduce((sum, item) => sum + item.amount, 0), [supports]);
  const adminFeeTotal = useMemo(() => supports.reduce((sum, item) => sum + Number((item as Support & { adminFee?: number }).adminFee || 0), 0), [supports]);
  const creatorPayoutTotal = useMemo(
    () => supports.reduce((sum, item) => sum + Number((item as Support & { creatorPayout?: number }).creatorPayout || 0), 0),
    [supports]
  );

  function chargePoints(pointPackage: PointPackage) {
    const nextPoints = walletPoints + pointPackage.points;
    saveWalletPoints(nextPoints);
    setWalletPoints(nextPoints);
    location.hash = 'wallet';
  }

  function beginCheckout(item: WishlistItem) {
    if (!selected) return;
    setCheckoutDraft({
      creatorId: selected.id,
      creatorName: selected.displayName,
      creatorHandle: selected.handle,
      wishlistItemId: item.id,
      itemTitle: item.title,
      amount: item.price,
      message: supportForm.message,
      supporterName: supportForm.supporterName,
      paymentProvider: 'NICEPAY'
    });
    location.hash = 'checkout';
  }

  async function logout() {
    if (API && session?.token) {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${session.token}` } }).catch(
        () => null
      );
    }
    setSession(null);
    location.hash = 'home';
  }

  return (
    <main>
      <Nav session={session} onLogout={logout} />
      {page === 'home' && (
        <Home
          categories={categories}
          creators={visibleCreators}
          query={searchQuery}
          setQuery={setSearchQuery}
          session={session}
          walletPoints={walletPoints}
          chargePoints={chargePoints}
        />
      )}
      {(page === 'categories' || page.startsWith('category/')) && (
        <Catalog
          categories={categories}
          creators={visibleCreators}
          activeCategory={activeCategory}
          query={searchQuery}
          setQuery={setSearchQuery}
        />
      )}
      {page.startsWith('creator/') && selected && (
        <CreatorPage creator={selected} form={supportForm} setForm={setSupportForm} beginCheckout={beginCheckout} walletPoints={walletPoints} />
      )}
      {page === 'checkout' && checkoutDraft && (
        <CheckoutPage
          draft={checkoutDraft}
          onCancel={() => {
            location.hash = `creator/${selected?.slug || checkoutDraft.creatorId}`;
          }}
          onComplete={async (order, support) => {
            if (support) {
              setSupports(prev => [support, ...prev.filter(item => item.id !== support.id)]);
            }
            await load();
            setCheckoutDraft(null);
            location.hash = 'success';
          }}
        />
      )}
      {page === 'login' && <AuthPage mode="login" session={session} setSession={setSession} />}
      {page === 'signup' && <AuthPage mode="signup" session={session} setSession={setSession} />}
      {page === 'success' && <Success />}
      {page === 'wallet' && <WalletPage walletPoints={walletPoints} chargePoints={chargePoints} />}
      {page === 'dashboard' && <Dashboard supports={supports} revenue={revenue} session={session} />}
      {page === 'admin' && <Admin supports={supports} creators={creators} categories={categories} adminFeeTotal={adminFeeTotal} creatorPayoutTotal={creatorPayoutTotal} />}
      {page === 'business' && <BusinessPage />}
      {page === 'policies' && <PolicyPage />}
      <Footer />
    </main>
  );
}

function Nav({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  return (
    <nav className="nav">
      <a className="brand" href="#home">
        <ShieldCheck size={22} />
        {businessInfo.serviceName}
      </a>
      <div className="nav-links">
        <a href="#categories">서비스 기능</a>
        <a href="#wallet">포인트 충전</a>
        <a href="#dashboard">대시보드</a>
        <a href="#business">사업자정보</a>
        <a href="#policies">약관/환불</a>
        <a href="#admin">관리</a>
      </div>
      <div className="nav-actions">
        {session ? (
          <>
            <span className="account-chip">{session.user.name}</span>
            <button className="icon-button" onClick={onLogout} aria-label="로그아웃" title="로그아웃">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <a className="ghost-button" href="#login">
              <LogIn size={17} />
              로그인
            </a>
            <a className="solid-button" href="#signup">
              <UserPlus size={17} />
              가입
            </a>
          </>
        )}
      </div>
    </nav>
  );
}

function Home({
  categories,
  creators,
  query,
  setQuery,
  session,
  walletPoints,
  chargePoints
}: {
  categories: Category[];
  creators: Creator[];
  query: string;
  setQuery: (value: string) => void;
  session: Session | null;
  walletPoints: number;
  chargePoints: (pointPackage: PointPackage) => void;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay">
          <span className="eyebrow">
            <Sparkles size={16} />
            포인트 기반 인플러언서 소통 플랫폼
          </span>
          <h1>포인트를 충전하고 인플러언서와 소통해보세요.</h1>
          <p>인플러언서 코리아는 포인트 충전, 소통형 콘텐츠, DM 이용권, 기간형 멤버십을 연결합니다.</p>
          <div className="hero-actions">
            <SearchBox value={query} onChange={setQuery} />
            <a className="solid-button large" href={session ? '#dashboard' : '#signup'}>
              {session ? '내 대시보드' : '간편 가입'}
              <ArrowRight size={18} />
            </a>
            <a className="ghost-button large" href="#categories">
              결제 시작
              <ArrowRight size={18} />
            </a>
            <a className="ghost-button large" href="https://app.litt.ly/login" target="_blank" rel="noreferrer">
              litt.ly 로그인 연결
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
      <section className="content-band point-wallet-band">
        <div className="section-head">
          <div>
            <span className="kicker">Point Wallet</span>
            <h2>포인트 충전</h2>
          <p>충전 포인트는 소통형 콘텐츠, 프리미엄 DM 이용권, 기간형 멤버십 패스 구매에만 사용됩니다. 현금 환전과 계정 간 이전은 지원하지 않습니다.</p>
          </div>
          <a className="solid-button" href="#wallet">
            보유 포인트 {walletPoints.toLocaleString()}P
            <ArrowRight size={16} />
          </a>
        </div>
        <div className="review-grid">
          {pointPackages.map(pointPackage => (
            <article key={pointPackage.id}>
              <CreditCard size={22} />
              <h3>{pointPackage.name} · {pointPackage.points.toLocaleString()}P</h3>
              <p>{pointPackage.description}</p>
              <button className="solid-button" type="button" onClick={() => chargePoints(pointPackage)}>
                {pointPackage.price.toLocaleString()}원 충전
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="content-band">
        <div className="section-head">
          <div>
            <span className="kicker">Core Concept</span>
            <h2>Throne의 한국형 재해석</h2>
          </div>
          <a className="text-link" href="#categories">
            기능 전체 보기 <ArrowRight size={16} />
          </a>
        </div>
        <CategoryGrid categories={categories.filter(category => category.featured).slice(0, 3)} />
      </section>
      <section className="content-band muted">
        <div className="section-head">
          <div>
            <span className="kicker">Influencers</span>
          <h2>인플러언서와 소통하는 페이지</h2>
          </div>
        </div>
        <CreatorGrid creators={creators.slice(0, 6)} />
      </section>
      <section className="content-band">
        <div className="steps">
          <Step icon={<WalletCards />} title="포인트 충전" text="NICEPAY 등 계약된 결제수단으로 포인트를 충전합니다." />
          <Step icon={<CreditCard />} title="소통형 상품 이용" text="콘텐츠 패스, DM 이용권, 기간형 멤버십을 포인트로 이용합니다." />
          <Step icon={<Bell />} title="이용 알림" text="결제와 디지털 상품 제공 상태를 카카오 알림톡으로 안내합니다." />
        </div>
      </section>
      <ReviewReadySection />
      <MvpSpecSection />
    </>
  );
}

function ReviewReadySection() {
  return (
    <section className="content-band review-ready">
      <div className="section-head">
        <div>
          <span className="kicker">MVP Priority</span>
          <h2>필수 기능 구성</h2>
          <p>
            팬, 인플루언서, 운영자가 바로 이해할 수 있도록 결제, 알림톡, DM, 상품 제공 흐름을 전면에 배치했습니다.
          </p>
        </div>
        <a className="solid-button" href="#business">
          사업자정보 확인
          <ArrowRight size={16} />
        </a>
      </div>
      <div className="review-grid">
        <article>
          <ShieldCheck size={22} />
          <h3>프라이버시</h3>
          <p>
            배송지 주소는 가상 주소와 센터 중계를 통해 마스킹하고, 대시보드에는 필요한 정보만 노출합니다.
          </p>
        </article>
        <article>
          <CreditCard size={22} />
          <h3>NICEPAY 결제</h3>
          <p>
            PG사는 NICEPAY 기준으로 진행하고, 결제 승인과 상품 제공 관리를 운영 대시보드에서 확인합니다.
          </p>
        </article>
        <article>
          <HeartHandshake size={22} />
          <h3>카카오 알림톡과 DM</h3>
          <p>
            결제/입금정보와 팬 메시지는 카카오 알림톡과 1:1 DM으로 즉각 전달됩니다.
          </p>
        </article>
      </div>
    </section>
  );
}

function MvpSpecSection() {
  return (
    <section className="content-band muted">
      <div className="section-head">
        <div>
          <span className="kicker">Service Blueprint</span>
          <h2>인플러언서 코리아 기능 명세</h2>
          <p>
            MVP는 포인트 충전, 소통형 상품 제공, 크리에이터 대시보드, DM 커뮤니티를 우선순위로 구성합니다.
          </p>
        </div>
      </div>
      <div className="spec-grid">
        <article>
          <h3>팬 기능</h3>
          <ul>
            <li>카카오/네이버 간편 회원가입</li>
            <li>인플러언서와 소통형 콘텐츠 조회</li>
            <li>NICEPAY 기반 간편결제</li>
            <li>메시지 카드 작성 및 전송</li>
          </ul>
        </article>
        <article>
          <h3>인플루언서 기능</h3>
          <ul>
            <li>디지털 콘텐츠와 멤버십 패스 등록</li>
            <li>카카오 알림톡 실시간 수신</li>
            <li>주소 마스킹 대시보드</li>
            <li>인스타그램 등록 후 DM 흐름 연결</li>
          </ul>
        </article>
        <article>
          <h3>관리자 기능</h3>
          <ul>
            <li>NICEPAY 결제 승인 및 입금 관리</li>
            <li>상품 제공 상태와 PG 연동 관리</li>
            <li>팬 등급 수동/자동 승급</li>
            <li>스팸 방지 필터와 DM 모니터링</li>
          </ul>
        </article>
        <article>
          <h3>실시간 메시지</h3>
          <ul>
            <li>Socket.io 기반 1:1 메시지 구조</li>
            <li>디지털 상품 이용 내역 기반 활동 지표</li>
            <li>활동 리포트와 팬 등급 반영</li>
            <li>카카오 비즈메시지 알림 연계</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function Catalog({
  categories,
  creators,
  activeCategory,
  query,
  setQuery
}: {
  categories: Category[];
  creators: Creator[];
  activeCategory: string;
  query: string;
  setQuery: (value: string) => void;
}) {
  const active = categories.find(category => category.id === activeCategory);
  return (
    <section className="page-shell">
      <div className="section-head">
        <div>
          <span className="kicker">Browse</span>
          <h1>{active ? active.name : '서비스 기능 탐색'}</h1>
          <p>{active ? active.description : '포인트 충전, 소통형 콘텐츠, DM 이용권, 멤버십 기능을 한눈에 확인하세요.'}</p>
        </div>
        <SearchBox value={query} onChange={setQuery} compact />
      </div>
      <CategoryGrid categories={categories} activeCategory={activeCategory} />
      <div className="section-head compact-head">
        <h2>{active ? `${active.name} 인플루언서` : '전체 인플루언서'}</h2>
        {active && (
          <a className="text-link" href="#categories">
            필터 해제
          </a>
        )}
      </div>
      <CreatorGrid creators={creators} />
    </section>
  );
}

function SearchBox({
  value,
  onChange,
  compact
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={compact ? 'search compact-search' : 'search'}>
      <Search size={18} />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="인플루언서, 플랫폼, 기능 검색"
      />
    </label>
  );
}

function CategoryGrid({ categories, activeCategory }: { categories: Category[]; activeCategory?: string }) {
  return (
    <div className="category-grid">
      {categories.map(category => (
        <a
          className={`category-tile ${activeCategory === category.id ? 'active' : ''}`}
          href={`#category/${category.id}`}
          key={category.id}
        >
          <img src={category.imageUrl} alt="" />
          <span>{category.name}</span>
          <p>{category.description}</p>
          <small>
            {category.creatorCount} influencers · {category.wishlistCount} flows
          </small>
        </a>
      ))}
    </div>
  );
}

function CreatorGrid({ creators }: { creators: Creator[] }) {
  if (!creators.length) {
    return <div className="empty-state">검색 조건에 맞는 인플루언서가 아직 없습니다.</div>;
  }
  return (
    <div className="creator-grid">
      {creators.map(creator => (
        <a className="creator-card" href={`#creator/${creator.slug}`} key={creator.id}>
          <img className="creator-cover" src={creator.coverUrl} alt="" />
          <div className="creator-body">
            <img className="avatar" src={creator.avatarUrl} alt="" />
            <div>
              <h3>{creator.displayName}</h3>
              <span>{creator.handle}</span>
            </div>
          </div>
          <p>{creator.bio}</p>
          <div className="pill-row">
            <span>{creator.platform}</span>
            <span>{creator.wishlist.length} digital products</span>
          </div>
        </a>
      ))}
    </div>
  );
}

function CreatorPage({
  creator,
  form,
  setForm,
  beginCheckout,
  walletPoints
}: {
  creator: Creator;
  form: SupportForm;
  setForm: (value: SupportForm) => void;
  beginCheckout: (item: WishlistItem) => void;
  walletPoints: number;
}) {
  return (
    <section className="page-shell">
      <div
        className="profile-hero"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(12,18,32,.78), rgba(12,18,32,.16)), url(${creator.coverUrl})`
        }}
      >
        <img className="profile-avatar" src={creator.avatarUrl} alt="" />
        <span className="eyebrow">
          <ShieldCheck size={16} />
          {creator.addressMasked}
        </span>
        <h1>{creator.displayName}</h1>
        <p>{creator.bio}</p>
      </div>
      <div className="creator-layout">
        <div>
          <div className="section-head compact-head">
            <h2>디지털 콘텐츠</h2>
            <span className="account-chip">{creator.platform}</span>
          </div>
          <div className="wish-grid">
            {creator.wishlist.map(item => (
              <article className="wish-card" key={item.id}>
                <img src={item.imageUrl} alt="" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.note}</p>
                </div>
                <div className="wish-footer">
                  <b>{item.price.toLocaleString()}P</b>
                  <button className="ghost-button" type="button" onClick={() => beginCheckout(item)}>
                    결제하기
                  </button>
                </div>
              </article>
            ))}
          </div>
          <ProductNotice />
        </div>
        <aside className="support-panel">
          <h2>내 포인트 지갑</h2>
          <p>보유 포인트 <b>{walletPoints.toLocaleString()}P</b></p>
          <label>
            이름
            <input value={form.supporterName} onChange={event => setForm({ ...form, supporterName: event.target.value })} />
          </label>
          <label>
            메시지
            <textarea value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} />
          </label>
          <p>상품별 포인트가 차감됩니다. 포인트가 부족한 경우 충전 페이지에서 패키지를 선택해 주세요.</p>
          <a className="solid-button large" href="#wallet">
            <WalletCards size={18} />
            포인트 충전하기
          </a>
        </aside>
      </div>
    </section>
  );
}

function CheckoutPage({
  draft,
  onCancel,
  onComplete
}: {
  draft: CheckoutDraft;
  onCancel: () => void;
  onComplete: (order: PaymentOrderResponse, support?: Support) => Promise<void> | void;
}) {
  const [provider, setProvider] = useState<'NICEPAY'>('NICEPAY');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const adminFee = Math.round((draft.amount * 25) / 100);
  const creatorPayout = draft.amount - adminFee;

  async function pay() {
    setBusy(true);
    setError('');
    const payload = {
      creatorId: draft.creatorId,
      wishlistItemId: draft.wishlistItemId,
      supporterName: draft.supporterName,
      message: draft.message,
      amount: draft.amount,
      paymentProvider: provider
    };

    try {
      if (API) {
        const response = await fetch(`${API}/api/payments/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error(`주문 생성 실패 (${response.status})`);
        }
        const order = (await response.json()) as PaymentOrderResponse;
        const confirm = await fetch(`${API}/api/payments/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.orderId, paymentKey: order.paymentKey })
        });
        if (!confirm.ok) {
          throw new Error(`결제 승인 실패 (${confirm.status})`);
        }
        const confirmed = await confirm.json();
        await onComplete(order, {
          id: confirmed.supportId ?? `sp_${Date.now()}`,
          creatorId: draft.creatorId,
          supporterName: draft.supporterName,
          message: draft.message,
          amount: draft.amount,
          status: 'PAID',
          adminFee: confirmed.adminFee ?? order.adminFee,
          creatorPayout: confirmed.creatorPayout ?? order.creatorPayout,
          payoutDestination: confirmed.payoutDestination ?? order.payoutDestination,
          payoutStatus: confirmed.payoutStatus ?? 'PENDING',
          createdAt: new Date().toISOString()
        });
        return;
      }

      const fallbackOrder: PaymentOrderResponse = {
        orderId: `ord_${Date.now()}`,
        paymentProvider: provider,
        amount: draft.amount,
        adminFee,
        creatorPayout,
        payoutDestination: 'ADMIN_DASHBOARD',
        paymentKey: `mock_${Date.now()}`
      };
      const support: Support = {
        id: `sp_${Date.now()}`,
        creatorId: draft.creatorId,
        supporterName: draft.supporterName,
        message: draft.message,
        amount: draft.amount,
        status: 'PAID',
        adminFee,
        creatorPayout,
        payoutDestination: 'ADMIN_DASHBOARD',
        payoutStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };
      saveStoredSupports([support, ...readStoredSupports()]);
      await onComplete(fallbackOrder, support);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : '결제를 완료할 수 없습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-shell">
      <div className="section-head">
        <div>
          <span className="kicker">Checkout</span>
          <h1>{draft.creatorName} 결제창</h1>
          <p>이 화면에서 PG 주문을 만들고, 승인 후 관리자 정산과 인플러언서 지급 예정액을 함께 기록합니다.</p>
        </div>
        <a className="ghost-button" href="https://app.litt.ly/page" target="_blank" rel="noreferrer">
          litt.ly 결제 페이지 열기
        </a>
      </div>
      <div className="checkout-layout">
        <article className="checkout-summary">
          <span className="kicker">Order Summary</span>
          <h2>{draft.itemTitle}</h2>
          <p>{draft.creatorHandle}</p>
          <dl>
            <div>
              <dt>결제 금액</dt>
              <dd>{draft.amount.toLocaleString()}원</dd>
            </div>
            <div>
              <dt>관리자 수수료</dt>
              <dd>{adminFee.toLocaleString()}원</dd>
            </div>
            <div>
              <dt>인플러언서 지급액</dt>
              <dd>{creatorPayout.toLocaleString()}원</dd>
            </div>
            <div>
              <dt>지급 대상</dt>
              <dd>eon8.co.kr 관리자 페이지 / 인플러언서 계정</dd>
            </div>
          </dl>
          <p className="checkout-note">
            결제 승인이 끝나면 eon8.co.kr 관리자 페이지에는 수수료와 지급액이 남고, 인플러언서 대시보드에는 주문과 지급 예정 내역이 표시됩니다.
          </p>
        </article>
        <aside className="checkout-panel">
          <label>
            결제수단
            <select value={provider} onChange={event => setProvider(event.target.value as 'NICEPAY')}>
              <option value="NICEPAY">NICEPAY</option>
            </select>
          </label>
          <label>
            팬 이름
            <input value={draft.supporterName} readOnly />
          </label>
          <label>
            메시지
            <textarea value={draft.message} readOnly />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="solid-button large" type="button" onClick={pay} disabled={busy}>
            {busy ? '결제 처리 중' : `${draft.amount.toLocaleString()}원 결제하기`}
          </button>
          <button className="ghost-button large" type="button" onClick={onCancel}>
            돌아가기
          </button>
        </aside>
      </div>
    </section>
  );
}

function WalletPage({ walletPoints, chargePoints }: { walletPoints: number; chargePoints: (pointPackage: PointPackage) => void }) {
  return (
    <section className="page-shell legal-page">
      <div className="section-head">
        <div>
          <span className="kicker">Point Wallet</span>
          <h1>포인트 충전</h1>
          <p>포인트는 디지털 콘텐츠, 프리미엄 DM 이용권, 기간형 멤버십 패스 구매에만 사용됩니다.</p>
        </div>
        <span className="account-chip">보유 {walletPoints.toLocaleString()}P</span>
      </div>
      <div className="review-grid">
        {pointPackages.map(pointPackage => (
          <article key={pointPackage.id}>
            <WalletCards size={22} />
            <h2>{pointPackage.name}</h2>
            <p>{pointPackage.description}</p>
            <b>{pointPackage.points.toLocaleString()}P · {pointPackage.price.toLocaleString()}원</b>
            <button className="solid-button" type="button" onClick={() => chargePoints(pointPackage)}>
              충전 주문 미리보기
            </button>
          </article>
        ))}
      </div>
      <div className="callout warning-callout">
        <b>NICEPAY 연동 준비</b>
        <p>현재 버튼은 화면 검토용 미리보기입니다. 운영에서는 NICEPAY 결제 승인 콜백을 서버에서 검증한 뒤에만 포인트를 충전하고, 포인트는 현금 환전·양도·개인 간 전달 없이 사이트 내 디지털 상품 구매에만 사용해야 합니다.</p>
      </div>
    </section>
  );
}

function ProductNotice() {
  return (
    <section className="commerce-notice" aria-label="구매 및 환불 안내">
      <h2>포인트 및 디지털 상품 안내</h2>
      <div className="notice-grid">
        <div>
          <b>디지털 상품 제공</b>
          <p>포인트 충전 결제 완료 후 보유 포인트가 반영되며, 선택한 콘텐츠 패스나 이용권을 구매할 수 있습니다.</p>
        </div>
        <div>
          <b>DM 메시지</b>
          <p>DM 이용권을 구매한 회원은 스팸 필터링이 적용된 1:1 메시지 기능을 이용할 수 있습니다.</p>
        </div>
        <div>
          <b>취소/환불</b>
          <p>충전 오류 또는 미사용 포인트의 취소·환불은 고객센터로 접수할 수 있습니다. 이미 이용이 시작된 디지털 상품은 약관과 PG 기준을 따릅니다.</p>
        </div>
        <div>
          <b>문의</b>
          <p>
            고객센터: {businessInfo.customerCenter}
            <br />
            이메일: {businessInfo.email}
          </p>
        </div>
      </div>
    </section>
  );
}

function AuthPage({
  mode,
  session,
  setSession
}: {
  mode: 'login' | 'signup';
  session: Session | null;
  setSession: (session: Session | null) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(mode === 'login' ? 'creator@example.com' : '');
  const [password, setPassword] = useState(mode === 'login' ? 'password123' : '');
  const [role, setRole] = useState<'FAN' | 'CREATOR'>('CREATOR');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    if (API) {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = mode === 'login' ? { email, password } : { name, email, password, role };
      const response = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
      if (response?.ok) {
        setSession((await response.json()) as Session);
        location.hash = 'dashboard';
        return;
      }
    }

    setBusy(false);
    if (mode === 'login' && email !== 'creator@example.com' && password.length < 8) {
      setError('이메일과 비밀번호를 확인해주세요.');
      return;
    }
    setSession(createDemoSession(mode === 'login' ? '하나 인플루언서' : name || '새 인플루언서', email, role));
    location.hash = 'dashboard';
  }

  async function socialDemo(provider: string) {
    setBusy(true);
    setError('');
    const demoEmail = `${provider.toLowerCase()}@influencer-korea.local`;
    if (API) {
      const response = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${provider} 데모`, email: demoEmail, password: 'password123', role: 'CREATOR' })
      }).catch(() => null);
      if (response?.ok) {
        setSession((await response.json()) as Session);
        location.hash = 'dashboard';
        return;
      }
    }
    setBusy(false);
    setSession(createDemoSession(`${provider} 데모`, demoEmail));
    location.hash = 'dashboard';
  }

  if (session) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <Check size={34} />
          <h1>이미 로그인되어 있습니다.</h1>
          <p>{session.user.email}</p>
          <a className="solid-button large" href="#dashboard">
            대시보드로 이동
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">
          <LockKeyhole size={16} />
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </span>
        <h1>{mode === 'login' ? '로그인' : '가입하기'}</h1>
        <div className="social-row">
          {['Kakao', 'Naver', 'Instagram'].map(provider => (
            <button className="ghost-button social-button" type="button" onClick={() => socialDemo(provider)} key={provider}>
              {provider}
            </button>
          ))}
        </div>
        <div className="divider">or</div>
        {mode === 'signup' && (
          <>
            <label>
              이름
              <input value={name} onChange={event => setName(event.target.value)} placeholder="인플루언서 이름" required />
            </label>
            <div className="segment">
              <button type="button" className={role === 'CREATOR' ? 'active' : ''} onClick={() => setRole('CREATOR')}>
                인플루언서
              </button>
              <button type="button" className={role === 'FAN' ? 'active' : ''} onClick={() => setRole('FAN')}>
                팬
              </button>
            </div>
          </>
        )}
        <label>
          이메일
          <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            minLength={8}
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="8자 이상"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="solid-button large" disabled={busy} type="submit">
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {busy ? '처리 중' : mode === 'login' ? '로그인' : '계정 만들기'}
        </button>
        <p className="auth-switch">
          {mode === 'login' ? '계정이 없나요?' : '이미 계정이 있나요?'}{' '}
          <a href={mode === 'login' ? '#signup' : '#login'}>{mode === 'login' ? '가입하기' : '로그인'}</a>
        </p>
      </form>
    </section>
  );
}

function Dashboard({ supports, revenue, session }: { supports: Support[]; revenue: number; session: Session | null }) {
  return (
    <section className="page-shell">
      <div className="section-head">
        <div>
          <span className="kicker">Dashboard</span>
          <h1>{session ? `${session.user.name}님의 대시보드` : '인플러언서 대시보드'}</h1>
          <p>포인트 충전, 결제 승인, 관리자 정산, DM 흐름을 한 번에 확인합니다.</p>
        </div>
        {!session && (
          <a className="solid-button" href="#login">
            <LogIn size={17} />
            로그인
          </a>
        )}
      </div>
      <div className="stats">
        <Stat icon={<HeartHandshake />} label="결제 완료" value={`${supports.length}건`} />
        <Stat icon={<CreditCard />} label="총 결제액" value={`${revenue.toLocaleString()}원`} />
        <Stat icon={<Bell />} label="정산 대기" value={`${supports.filter(item => item.status === 'PAID').length}건`} />
      </div>
      <SupportTable supports={supports} />
    </section>
  );
}

function Admin({
  supports,
  creators,
  categories,
  adminFeeTotal,
  creatorPayoutTotal
}: {
  supports: Support[];
  creators: Creator[];
  categories: Category[];
  adminFeeTotal: number;
  creatorPayoutTotal: number;
}) {
  return (
    <section className="page-shell">
      <div className="section-head">
        <div>
          <span className="kicker">Admin</span>
          <h1>운영 관리</h1>
          <p>NICEPAY 승인, 관리자 수수료, 인플러언서 지급액, DM 상태를 점검합니다.</p>
        </div>
      </div>
      <div className="stats">
        <Stat icon={<Grid3X3 />} label="카테고리" value={`${categories.length}개`} />
        <Stat icon={<HeartHandshake />} label="인플루언서" value={`${creators.length}명`} />
        <Stat icon={<CreditCard />} label="포인트 충전/상품 주문" value={`${supports.length}건`} />
        <Stat icon={<WalletCards />} label="관리자 수수료" value={`${adminFeeTotal.toLocaleString()}원`} />
        <Stat icon={<LayoutDashboard />} label="인플러언서 지급액" value={`${creatorPayoutTotal.toLocaleString()}원`} />
      </div>
      <SupportTable supports={supports} />
    </section>
  );
}

function SupportTable({ supports }: { supports: Support[] }) {
  if (!supports.length) {
    return <div className="empty-state">아직 구매 내역이 없습니다.</div>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>구매자</th>
          <th>금액</th>
          <th>관리자 수수료</th>
          <th>인플러언서 지급액</th>
          <th>지급 상태</th>
          <th>상태</th>
          <th>메시지</th>
        </tr>
      </thead>
      <tbody>
        {supports.map(support => (
          <tr key={support.id}>
            <td>{support.supporterName}</td>
            <td>{support.amount.toLocaleString()}원</td>
            <td>{(support.adminFee ?? 0).toLocaleString()}원</td>
            <td>{(support.creatorPayout ?? support.amount).toLocaleString()}원</td>
            <td>{support.payoutStatus ?? 'PENDING'}</td>
            <td>{support.status}</td>
            <td>{support.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="stat">
      {icon}
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <article className="step">
      {icon}
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function Success() {
  return (
    <section className="center">
      <Check size={42} />
      <h1>디지털 상품 주문이 접수되었습니다.</h1>
      <p>결제 승인과 포인트 차감이 확인되면 구매한 디지털 상품의 이용 권한이 활성화됩니다.</p>
      <a className="solid-button large" href="#dashboard">
        <LayoutDashboard size={18} />
        대시보드 확인
      </a>
    </section>
  );
}

function BusinessPage() {
  return (
    <section className="page-shell legal-page">
      <div className="section-head">
        <div>
          <span className="kicker">Business Information</span>
          <h1>사업자 정보</h1>
          <p>PG 및 카드사 심사를 위해 사업자등록증 기준 정보를 공개합니다.</p>
        </div>
      </div>
      <div className="business-card">
        <dl>
          <div>
            <dt>상호</dt>
            <dd>{businessInfo.shopName}</dd>
          </div>
          <div>
            <dt>서비스명</dt>
            <dd>{businessInfo.serviceName}</dd>
          </div>
          <div>
            <dt>대표자</dt>
            <dd>{businessInfo.representative}</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>{businessInfo.businessNumber}</dd>
          </div>
          <div>
            <dt>사업장 주소</dt>
            <dd>{businessInfo.address}</dd>
          </div>
          <div>
            <dt>업태</dt>
            <dd>{businessInfo.businessType}</dd>
          </div>
          <div>
            <dt>종목</dt>
            <dd>{businessInfo.businessItem}</dd>
          </div>
          <div>
            <dt>개업일</dt>
            <dd>{businessInfo.openingDate}</dd>
          </div>
          <div>
            <dt>통신판매업 신고번호</dt>
            <dd>{businessInfo.mailOrderNumber}</dd>
          </div>
          <div>
            <dt>고객센터</dt>
            <dd>{businessInfo.customerCenter}</dd>
          </div>
          <div>
            <dt>이메일</dt>
            <dd>{businessInfo.email}</dd>
          </div>
          <div>
            <dt>호스팅 제공</dt>
            <dd>{businessInfo.hostingProvider}</dd>
          </div>
          <div>
            <dt>결제대행 예정</dt>
            <dd>{businessInfo.pgProvider}</dd>
          </div>
        </dl>
      </div>
      <div className="callout warning-callout">
        <b>심사 전 확인 필요</b>
        <p>
          고객센터와 대표자 연락처는 요청하신 정보로 반영했습니다. 통신판매업 신고번호는 구매안전서비스 확인증 발급 후 실제 신고번호로
          교체해야 심사 반려 가능성을 줄일 수 있습니다.
        </p>
      </div>
    </section>
  );
}

function PolicyPage() {
  return (
    <section className="page-shell legal-page">
      <div className="section-head">
        <div>
          <span className="kicker">Policies</span>
          <h1>이용약관 및 환불 정책</h1>
          <p>주문, 결제, 개인정보, 환불 기준을 한 페이지에서 확인할 수 있습니다.</p>
        </div>
      </div>
      <div className="policy-grid">
        <article>
          <h2>이용약관</h2>
          <p>
            인플러언서 코리아는 포인트 충전으로 디지털 콘텐츠, 프리미엄 DM 이용권, 기간형 멤버십 패스를 구매하는 서비스입니다. 이용자는 표시된
            충전 패키지와 디지털 상품의 가격, 제공 내용, 이용 기간을 확인한 뒤 결제하며, 결제 완료 후 내역은 대시보드와 고객센터를 통해 확인할 수 있습니다.
          </p>
          <p>
            부정 사용, 타인의 권리 침해, 허위 주문, 결제수단 도용이 확인되는 경우 서비스 이용이 제한될 수 있습니다.
          </p>
        </article>
        <article>
          <h2>개인정보처리방침</h2>
          <p>
            회원가입, 포인트 충전, 디지털 상품 제공, 결제 확인, DM 전달, 고객 상담을 위해 이름, 이메일, 주문·결제 정보, 문의 내용을 수집할 수 있습니다.
            수집한 정보는 서비스 제공과 법령상 보관 의무 이행 목적에 한해 사용합니다.
          </p>
          <p>
            결제 처리는 NICEPAY 등 결제대행사를 통해 진행되며, 카드번호 등 민감 결제정보는 본 서비스가 직접 저장하지 않습니다.
          </p>
        </article>
        <article>
          <h2>취소 및 환불 정책</h2>
          <p>
            충전 오류 또는 아직 사용하지 않은 포인트는 고객센터 접수 후 취소·환불을 요청할 수 있습니다. 이미 이용이 시작된 디지털 상품은
            제공 상태, 약관, 결제대행사 기준에 따라 환불 가능 여부가 달라질 수 있습니다.
          </p>
          <p>환불 요청은 결제번호, 결제자명, 연락처, 요청 사유를 포함해 고객센터로 접수해 주세요.</p>
        </article>
        <article>
          <h2>주소 보호 및 제공 안내</h2>
          <p>
            구매 내역은 결제 완료 후 즉시 대시보드에 반영됩니다. 배송이 필요한 제휴 상품을 향후 제공하는 경우 실제 주소는 가상 주소와
            센터 중계 방식으로 보호하고, 배송비와 예상 배송일은 별도 안내합니다.
          </p>
        </article>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <b>{businessInfo.shopName}</b>
          <p>{businessInfo.serviceName} · 포인트 충전, 디지털 콘텐츠, DM 이용권, 멤버십 서비스</p>
        </div>
        <div>
          <span>대표자: {businessInfo.representative}</span>
          <span>사업자등록번호: {businessInfo.businessNumber}</span>
          <span>통신판매업: {businessInfo.mailOrderNumber}</span>
        </div>
        <div>
          <span>주소: {businessInfo.address}</span>
          <span>고객센터: {businessInfo.customerCenter}</span>
          <span>이메일: {businessInfo.email}</span>
        </div>
        <div className="footer-links">
          <a href="#business">사업자정보</a>
          <a href="#policies">이용약관</a>
          <a href="#policies">개인정보처리방침</a>
          <a href="#policies">취소/환불정책</a>
        </div>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
