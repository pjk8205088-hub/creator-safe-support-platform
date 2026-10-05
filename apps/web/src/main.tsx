import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { openLittly } from './Littly';
import {
  BadgeCheck,
  BarChart3,
  ArrowRight,
  BriefcaseBusiness,
  Bell,
  Check,
  CircleDollarSign,
  CreditCard,
  FileText,
  Grid3X3,
  HeartHandshake,
  Images,
  LayoutDashboard,
  PanelLeft,
  LockKeyhole,
  LogIn,
  LogOut,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UserRoundPlus,
  UserPlus,
  WalletCards,
  X
} from 'lucide-react';

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
  galleryImages?: string[];
  gallerySheetUrl?: string;
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
  role: 'FAN' | 'CREATOR' | 'ADMIN';
  creatorSlug?: string;
};

type Session = {
  token: string;
  user: SessionUser;
};

type SupportForm = {
  supporterName: string;
  message: string;
  paymentProvider: 'LITTLY';
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
  paymentProvider: 'LITTLY';
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

const API =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL : '') ||
  (typeof location !== 'undefined' ? (location.hostname === 'localhost' ? 'http://localhost:4000' : location.origin) : '');
const LITTLY_CHECKOUT_URL =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_LITTLY_CHECKOUT_URL : '') ||
  'https://litt.ly/eon8';
const LITTLY_ADMIN_URL = 'https://app.litt.ly/page';
const sessionKey = 'cssp-session';
const supportKey = 'cssp-demo-supports';
const walletKey = 'cssp-demo-point-wallet';

const businessInfo = {
  shopName: 'EON Korea',
  serviceName: 'EON Korea',
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
  pgProvider: 'LITTLY'
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
    slug: 'kang-su-a',
    displayName: '강수아',
    handle: '@sua.daily',
    bio: '맑고 깨끗한 아름다움을 좋아하는 수아입니다. 자연스러운 데일리룩과 뷰티 팁을 나눠요.',
    categoryId: 'digital-content',
    platform: 'Instagram',
    avatarUrl: '/influencers/eon8-creator-luna.png',
    coverUrl: '/influencers/eon8-creator-luna.png',
    addressMasked: '센터 중계 주소로 실제 배송지 비공개',
    wishlist: [
      {
        id: 'wi_sua_1',
        title: '강수아 여름 리조트 에디션',
        price: 29000,
        categoryId: 'digital-content',
        imageUrl: '/influencers/eon8-creator-luna.png',
        note: '여름 리조트에서 촬영한 만화형 포토 다이어리와 비하인드 콘텐츠입니다.'
      },
      {
        id: 'wi_sua_2',
        title: '수아 뷰티 루틴 DM 이용권',
        price: 12000,
        categoryId: 'dm',
        imageUrl: '/influencers/eon8-creator-luna.png',
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
    avatarUrl: '/influencers/eon8-creator-jun.png',
    coverUrl: '/influencers/eon8-creator-jun.png',
    addressMasked: '가상 주소/센터 중계 사용',
    wishlist: [
      {
        id: 'wi_dojin_1',
        title: '도진 스트릿 에디션',
        price: 30000,
        categoryId: 'dm',
        imageUrl: '/influencers/eon8-creator-jun.png',
        note: '네온 스트릿 무드의 만화형 포토와 도진의 스타일 노트를 제공합니다.'
      },
      {
        id: 'wi_dojin_2',
        title: '도진 1:1 DM 이용권',
        price: 15000,
        categoryId: 'dm',
        imageUrl: '/influencers/eon8-creator-jun.png',
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
    avatarUrl: '/influencers/eon8-creator-neo.png',
    coverUrl: '/influencers/eon8-creator-neo.png',
    addressMasked: '주소 마스킹 대시보드 사용',
    wishlist: [
      {
        id: 'wi_jiyun_1',
        title: '지윤 나이트 룩북',
        price: 24000,
        categoryId: 'membership',
        imageUrl: '/influencers/eon8-creator-neo.png',
        note: '도시의 밤을 담은 만화형 룩북과 스타일링 메모를 열람할 수 있습니다.'
      },
      {
        id: 'wi_jiyun_2',
        title: '지윤 멤버십 패스',
        price: 18000,
        categoryId: 'membership',
        imageUrl: '/influencers/eon8-creator-neo.png',
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
    avatarUrl: '/influencers/eon8-creator-arin.png',
    coverUrl: '/influencers/eon8-creator-arin.png',
    addressMasked: '센터 중계 주소로 실제 배송지 비공개',
    wishlist: [
      {
        id: 'wi_areum_1',
        title: '아름 프레임 포토 에디션',
        price: 16000,
        categoryId: 'digital-content',
        imageUrl: '/influencers/eon8-creator-arin.png',
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
    avatarUrl: '/influencers/eon8-creator-luna.png',
    coverUrl: '/influencers/eon8-creator-luna.png',
    addressMasked: '주소 마스킹 대시보드 사용',
    wishlist: [
      {
        id: 'wi_harin_1',
        title: '하린의 비 오는 날 노트',
        price: 14000,
        categoryId: 'kakao-alert',
        imageUrl: '/influencers/eon8-creator-luna.png',
        note: '하린의 짧은 글과 만화형 일러스트를 담은 디지털 노트입니다.'
      }
    ]
  }
];

const creatorArtwork: Record<string, string> = {
  'kang-su-a': '/influencers/eon8-creator-luna.png',
  'moon-ha-rin': '/influencers/eon8-creator-luna.png',
  'han-areum': '/influencers/eon8-creator-arin.png',
  'lee-ji-yun': '/influencers/eon8-creator-neo.png',
  'kim-do-jin': '/influencers/eon8-creator-jun.png',
  '@hong.gilsun': '/influencers/eon8-creator-luna.png'
};

const creatorGallerySheets: Record<string, string> = {
  'han-areum': '/influencers/gallery/han-areum.png',
  'hong-gil-sun': '/influencers/gallery/hong-gil-sun.png',
  'creator-LDkgl': '/influencers/gallery/hong-gil-sun.png',
  'kang-su-a': '/influencers/gallery/kang-su-a.png',
  'kim-do-jin': '/influencers/gallery/kim-do-jin.png',
  'lee-ji-yun': '/influencers/gallery/lee-ji-yun.png',
  'moon-ha-rin': '/influencers/gallery/moon-ha-rin.png',
  '@hong.gilsun': '/influencers/gallery/hong-gil-sun.png'
};

const creatorPortraits: Record<string, string> = {
  'han-areum': '/influencers/portraits/han-areum.png',
  'hong-gil-sun': '/influencers/portraits/hong-gil-sun.png',
  'creator-LDkgl': '/influencers/portraits/hong-gil-sun.png',
  'kang-su-a': '/influencers/portraits/kang-su-a.png',
  'kim-do-jin': '/influencers/portraits/kim-do-jin.png',
  'lee-ji-yun': '/influencers/portraits/lee-ji-yun.png',
  'moon-ha-rin': '/influencers/portraits/moon-ha-rin.png',
  '@hong.gilsun': '/influencers/portraits/hong-gil-sun.png'
};

function withCreatorArtwork(creator: Creator): Creator {
  const artwork = creatorArtwork[creator.slug] || creatorArtwork[creator.handle] || '/influencers/eon8-creator-studio.png';
  const gallerySheetUrl = creatorGallerySheets[creator.slug] || creatorGallerySheets[creator.handle] || creatorGallerySheets['hong-gil-sun'];
  const hasLocalArtwork = creator.avatarUrl?.startsWith('/influencers/eon8-creator-');
  const registeredPhoto = creator.galleryImages?.[0];
  return {
    ...creator,
    gallerySheetUrl,
    avatarUrl: hasLocalArtwork ? creator.avatarUrl : registeredPhoto || artwork,
    coverUrl: creator.coverUrl?.startsWith('/influencers/eon8-creator-') ? creator.coverUrl : registeredPhoto || artwork,
    wishlist: (creator.wishlist || []).map(item => ({
      ...item,
      imageUrl: item.imageUrl?.startsWith('/influencers/eon8-creator-') ? item.imageUrl : artwork
    }))
  };
}

function CreatorSheetImage({ creator, className, tile = 0, cropY = '8.5%', alt = '' }: { creator: Creator; className: string; tile?: number; cropY?: string; alt?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const registeredPhoto = creator.galleryImages?.[0];
  if (registeredPhoto && !imageFailed) {
    return <img className={className} src={registeredPhoto} alt={alt} onError={() => setImageFailed(true)} />;
  }
  const portrait = creatorPortraits[creator.slug] || creatorPortraits[creator.handle] || creatorPortraits['hong-gil-sun'];
  if (tile === 0) {
    return <img className={`${className} creator-portrait-image`} src={portrait} alt={alt} />;
  }
  return (
    <span
      className={`${className} creator-sheet-crop`}
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      style={{
        backgroundImage: `url("${creator.gallerySheetUrl || creatorGallerySheets['hong-gil-sun']}")`,
        backgroundPosition: `${(tile % 5) * 25}% ${cropY}`
      }}
    />
  );
}

function creatorHeroStyle(creator: Creator) {
  return {
    backgroundImage: `linear-gradient(90deg, rgba(12,18,32,.72), rgba(12,18,32,.12)), url("${creator.gallerySheetUrl || creatorGallerySheets['hong-gil-sun']}")`,
    backgroundSize: '100% 100%, 500% auto',
    backgroundPosition: '0 0, 0% 5%'
  };
}

async function optimizeCreatorPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('이미지 파일만 선택할 수 있습니다.');
  if (file.size > 15 * 1024 * 1024) throw new Error('사진 파일은 15MB 이하로 선택해 주세요.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('사진을 처리하지 못했습니다.');
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (let quality = 0.82; quality >= 0.42; quality -= 0.08) {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.type !== 'image/webp') throw new Error('이 브라우저에서 사진 압축을 지원하지 않습니다.');
    if (blob.size <= 300 * 1024) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('사진을 읽지 못했습니다.'));
        reader.onerror = () => reject(new Error('사진을 읽지 못했습니다.'));
        reader.readAsDataURL(blob);
      });
    }
  }
  throw new Error('사진 용량을 줄이지 못했습니다. 더 작은 사진을 선택해 주세요.');
}

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
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
    const response = await fetch(`${API}${path}`, { headers: stored?.token ? { Authorization: `Bearer ${stored.token}` } : {} });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function App() {
  const [verifiedAdmin, setVerifiedAdmin] = useState(false);
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
    paymentProvider: 'LITTLY'
  });
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(null);
  const [walletPoints, setWalletPoints] = useState(readWalletPoints);
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    const [categoryData, creatorData, supportData] = await Promise.all([
      getJson<Category[]>('/api/categories', demoCategories),
      getJson<Creator[]>('/api/creators', demoCreators),
      getJson<Support[]>('/api/supports', [])
    ]);
    setCategories(categoryData);
    setCreators(creatorData.map(withCreatorArtwork));
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
    getJson<Creator | null>(`/api/creators/${slug}`, demoCreators.find(creator => creator.slug === slug) ?? null).then(creator => setSelected(creator ? withCreatorArtwork(creator) : null));
  }, [page]);

  useEffect(() => {
    if (!session) {
      setVerifiedAdmin(false);
      localStorage.removeItem(sessionKey);
      return;
    }
    localStorage.setItem(sessionKey, JSON.stringify(session));
    let active = true;
    setVerifiedAdmin(false);
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        if (active) {
          setVerifiedAdmin(data.user.role === 'ADMIN');
          await load();
        }
      }).catch(() => { if (active) setSession(null); });
    return () => { active = false; };
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
    localStorage.setItem('cssp-littly-pending-order', JSON.stringify({
      type: 'POINT_CHARGE',
      packageId: pointPackage.id,
      points: pointPackage.points,
      amount: pointPackage.price,
      createdAt: new Date().toISOString()
    }));
    window.location.assign(LITTLY_CHECKOUT_URL);
  }

  function beginCheckout(item: WishlistItem) {
    if (!selected) return;
    startCheckout(selected, item, supportForm.message, session?.user.name || supportForm.supporterName);
  }

  function startCheckout(creator: Creator, item: WishlistItem, message: string, supporterName: string) {
    setCheckoutDraft({ creatorId: creator.id, creatorName: creator.displayName, creatorHandle: creator.handle,
      wishlistItemId: item.id, itemTitle: item.title, amount: item.price, message, supporterName, paymentProvider: 'LITTLY' });
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
      {page === 'fan-login' && <AuthPage mode="login" loginRole="FAN" session={session} setSession={setSession} />}
      {page === 'creator-login' && <AuthPage mode="login" loginRole="CREATOR" session={session} setSession={setSession} />}
      {page === 'signup' && <AuthPage mode="signup" session={session} setSession={setSession} />}
      {page === 'fan-signup' && <AuthPage mode="signup" signupRole="FAN" session={session} setSession={setSession} />}
      {page === 'creator-signup' && <AuthPage mode="signup" signupRole="CREATOR" session={session} setSession={setSession} />}
      {page === 'success' && <Success />}
      {page.startsWith('payment-result/') && <PaymentResult orderId={page.slice('payment-result/'.length)} />}
      {page === 'wallet' && <WalletPage walletPoints={walletPoints} chargePoints={chargePoints} />}
      {page === 'fan-dashboard' && <FanPage session={session} creators={creators} startCheckout={startCheckout} />}
      {page === 'dashboard' && session?.user.role === 'CREATOR' && <CreatorDashboard session={session} />}
      {page === 'dashboard' && session?.user.role !== 'CREATOR' && <Dashboard supports={supports} revenue={revenue} session={session} />}
      {page === 'creator-dashboard' && session?.user.role === 'CREATOR' && <CreatorDashboard session={session} />}
      {(page === 'creator-dashboard' || page === 'dashboard') && !session && <section className="page-shell"><div className="section-head"><div><span className="kicker">Creator Studio</span><h1>셀럽 로그인이 필요합니다.</h1><p>등록한 프로필 상세 정보와 정산을 확인하려면 로그인해 주세요.</p></div><a className="solid-button" href="#creator-login"><LogIn size={17} /> 셀럽 로그인</a></div></section>}
      {(page === 'creator-dashboard' || page === 'dashboard') && session && session.user.role !== 'CREATOR' && <section className="page-shell"><p>셀럽 계정으로 로그인해 주세요.</p><a href="#creator-login">셀럽 로그인</a></section>}
      {page === 'admin-login' && <AuthPage mode="login" session={session} setSession={setSession} />}
      {page.startsWith('admin') && page !== 'admin-login' && !verifiedAdmin && (
        <section className="page-shell"><p>관리자 로그인이 필요합니다.</p><a href="#admin-login">관리자 로그인</a></section>
      )}
      {page.startsWith('admin') && page !== 'admin-login' && verifiedAdmin && (
        <Admin
          page={page}
          supports={supports}
          creators={creators}
          categories={categories}
          adminFeeTotal={adminFeeTotal}
          creatorPayoutTotal={creatorPayoutTotal}
        />
      )}
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
        <a href="#categories">크리에이터</a>
        <a href="#creator-signup">셀럽 등록</a>
        <a href="#fan-signup">팬 가입</a>
        {session?.user.role === 'CREATOR' ? <a href="#creator-dashboard">셀럽 스튜디오</a> : <a href="#fan-dashboard">{session?.user.role === 'FAN' ? '내 팬페이지' : '팬 페이지'}</a>}
        <a href="#business">안전 안내</a>
      </div>
      <div className="nav-actions">
        {session ? (
          <button className="ghost-button" type="button" onClick={onLogout}>
            <LogOut size={17} />
            로그아웃
          </button>
        ) : (
          <a className="ghost-button" href="#login">
            <LogIn size={17} />
            로그인
          </a>
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
      <section className="hero throne-hero">
        <div className="hero-overlay">
          <span className="eyebrow">
            <Sparkles size={16} />
            CREATOR COMMUNITY · SEOUL
          </span>
          <h1>좋아하는 셀럽과<br /><em>더 가까이.</em></h1>
          <p>EON Korea에서 팬과 크리에이터가 안전하게 만나고, 메시지와 특별한 순간을 나눕니다.</p>
        </div>
        <div className="hero-note"><span>01</span><b>Private by design</b><span>팬과 셀럽의 안전한 소통</span></div>
      </section>
      <section className="trust-metrics">
        <div><strong>100%</strong><span>주소 비공개 배송</span></div>
        <div><strong>1:1</strong><span>인스타그램 DM 알림</span></div>
        <div><strong>K-Pay</strong><span>국내 결제 연동 준비</span></div>
        <div><strong>∞</strong><span>팬과 크리에이터의 이야기</span></div>
      </section>
      <section className="content-band mission-band">
        <div className="mission-copy"><span className="kicker">Send a little love</span><h2>주소 없이<br /><em>마음을 전하는 법</em></h2><p>좋아하는 사람에게 선물과 응원 메시지를 보내고, 개인정보는 안전하게 지키세요.</p><a className="solid-button large" href="#fan-signup">팬으로 시작하기 <ArrowRight size={18} /></a></div>
        <div className="mission-cards"><article><ShieldCheck size={25} /><h3>개인정보 보호</h3><p>팬과 크리에이터의 주소와 본명을 직접 공유하지 않는 배송 구조를 준비합니다.</p></article><article><Bell size={25} /><h3>인스타그램 알림</h3><p>선물과 응원 소식이 크리에이터의 연결된 채널에 도착하도록 연동합니다.</p></article><article><HeartHandshake size={25} /><h3>감사와 인증</h3><p>감사 메시지와 스토리 인증으로 선물이 따뜻한 관계로 이어집니다.</p></article></div>
      </section>
      <section className="content-band creator-showcase">
        <div className="section-head">
          <div>
            <span className="kicker">Meet the creators</span>
            <h2>오늘, 누구를 만나볼까요?</h2>
            <p>당신의 타임라인을 빛내는 크리에이터를 발견하고 팬 커뮤니티에 참여해보세요.</p>
          </div>
          <a className="text-link" href="#categories">전체 크리에이터 보기 <ArrowRight size={16} /></a>
        </div>
        <CreatorGrid creators={creators.slice(0, 6)} />
      </section>
      <section className="content-band ranking-band"><div className="section-head"><div><span className="kicker">Trending now</span><h2>이번 주 주목받는 크리에이터</h2><p>활동과 팬 참여를 바탕으로 매주 새롭게 발견합니다.</p></div><a className="text-link" href="#categories">랭킹 전체 보기 <ArrowRight size={16} /></a></div><div className="ranking-list">{creators.slice(0, 5).map((creator, index) => <a className="ranking-row" href={`#creator/${creator.slug}`} key={creator.id}><strong>{String(index + 1).padStart(2, '0')}</strong><CreatorSheetImage creator={creator} className="ranking-avatar" /><span><b>{creator.displayName}</b><small>{creator.handle} · {creator.platform}</small></span><em>{index === 0 ? 'RISING' : index < 3 ? 'POPULAR' : 'NEW'}</em><ArrowRight size={17} /></a>)}</div></section>
      <section className="platform-strip"><span>CREATORS FROM EVERYWHERE</span><b>Instagram</b><b>YouTube</b><b>TikTok</b><b>Twitch</b><b>Live & private</b></section>
      <section className="content-band how-band">
        <div className="section-head"><div><span className="kicker">Simple by design</span><h2>시작은 가볍게,<br />연결은 오래도록.</h2></div></div>
        <div className="how-grid"><article><span>01</span><h3>프로필을 발견해요</h3><p>좋아하는 크리에이터의 이야기와 분위기를 한눈에 살펴보세요.</p></article><article><span>02</span><h3>팬이 되어보세요</h3><p>가입하고 셀럽의 공지, 메시지, 팬 전용 소식을 받아보세요.</p></article><article><span>03</span><h3>진짜 대화를 나눠요</h3><p>안전한 DM 공간에서 서로의 속도로 더 가까워집니다.</p></article></div>
      </section>
      <section className="content-band community-band">
        <div className="community-intro"><span className="kicker">How it feels</span><h2>팬의 하루에<br /><em>좋아하는 사람이</em> 머무는 곳</h2><p>공개 프로필부터 1:1 메시지까지, 관계의 속도는 당신이 정합니다.</p></div>
        <div className="community-features"><article><span>01</span><HeartHandshake size={24} /><h3>나만의 팬 커뮤니티</h3><p>셀럽이 직접 전하는 공지와 이야기를 가장 먼저 만나보세요.</p></article><article><span>02</span><Bell size={24} /><h3>놓치지 않는 알림</h3><p>새 메시지와 라이브 소식을 원하는 채널로 받아보세요.</p></article><article><span>03</span><ShieldCheck size={24} /><h3>안심할 수 있는 프라이버시</h3><p>개인정보와 실제 주소를 보호하는 안전한 소통 환경입니다.</p></article></div>
      </section>
      <section className="content-band flow-band"><div className="section-head"><div><span className="kicker">How WishSpot works</span><h2>선물부터 감사 인사까지,<br />네 단계로 이어져요.</h2></div></div><div className="flow-grid"><article><span>01</span><h3>선물을 골라요</h3><p>크리에이터의 위시리스트와 프로젝트를 살펴봅니다.</p></article><article><span>02</span><h3>안전하게 결제해요</h3><p>카카오페이, 네이버페이, 토스, 카드 결제 연동을 준비합니다.</p></article><article><span>03</span><h3>알림이 도착해요</h3><p>결제 검증 후 연결된 인스타그램 DM과 알림으로 안내합니다.</p></article><article><span>04</span><h3>감사를 나눠요</h3><p>크리에이터의 답장과 스토리 인증으로 마음을 확인합니다.</p></article></div></section>
      <section className="join-band"><div><span className="kicker">Your people are here</span><h2>당신의 이야기를<br />시작해보세요.</h2></div><div className="join-actions"><a className="solid-button large" href="#fan-signup">팬 가입하기 <ArrowRight size={18} /></a><a className="ghost-button large" href="#creator-signup">셀럽 등록하기</a></div></section>
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
          <h3>Littly 결제</h3>
          <p>
            PG사는 Littly 기준으로 진행하고, 결제 승인과 상품 제공 관리를 운영 대시보드에서 확인합니다.
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
          <h2>EON Korea 기능 명세</h2>
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
            <li>Littly 기반 간편결제</li>
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
            <li>Littly 결제 승인 및 입금 관리</li>
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
          <CreatorSheetImage creator={creator} className="creator-cover" tile={0} alt={`${creator.displayName} 프로필 사진`} />
          <div className="creator-body">
            <CreatorSheetImage creator={creator} className="avatar" />
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

function FanPage({
  session,
  creators,
  startCheckout
}: {
  session: Session | null;
  creators: Creator[];
  startCheckout: (creator: Creator, item: WishlistItem, message: string, supporterName: string) => void;
}) {
  const [creatorId, setCreatorId] = useState(creators[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [message, setMessage] = useState('');
  const [pg, setPg] = useState<{ provider: string; ready: boolean; mode: string; message: string } | null>(null);
  const [orders, setOrders] = useState<Array<{ id: string; creator: string; product: string; message: string; amount: number; paymentProvider: string; status: string; createdAt: string; paidAt: string | null }>>([]);
  const [loadError, setLoadError] = useState('');
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'REFUNDED'>('ALL');
  const creator = creators.find(item => item.id === creatorId) || creators[0];
  const products = creator?.wishlist || [];
  const product = products.find(item => item.id === productId) || products.find(item => item.categoryId === 'dm') || products[0];

  useEffect(() => {
    if (!creators.some(item => item.id === creatorId) && creators[0]) setCreatorId(creators[0].id);
  }, [creators, creatorId]);
  useEffect(() => {
    fetch(`${API}/api/payments/config`).then(response => response.ok ? response.json() : null).then(data => setPg(data)).catch(() => setPg(null));
  }, []);
  useEffect(() => {
    if (!session || session.user.role !== 'FAN') return;
    fetch(`${API}/api/fan/orders`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error('팬 결제 내역을 불러오지 못했습니다. 다시 로그인해 주세요.');
        setOrders(await response.json());
      }).catch(reason => setLoadError(reason instanceof Error ? reason.message : '내역 조회에 실패했습니다.'));
  }, [session]);

  if (!session) return <section className="page-shell"><div className="section-head"><div><span className="kicker">Fan Space</span><h1>나의 팬 페이지</h1><p>로그인하면 보낸 메시지와 결제 내역을 확인할 수 있습니다.</p></div></div><div className="fan-auth-actions"><a className="solid-button" href="#fan-login">팬 로그인</a><a className="ghost-button" href="#fan-signup">팬 가입</a></div></section>;
  if (session.user.role !== 'FAN') return <section className="page-shell"><h1>팬 계정으로 로그인해 주세요.</h1><a className="solid-button" href="#fan-login">팬 로그인</a></section>;

  const paidOrders = orders.filter(order => order.status === 'PAID');
  const pendingOrders = orders.filter(order => order.status === 'PENDING_PAYMENT' || order.status === 'PENDING');
  const refundedOrders = orders.filter(order => order.status === 'REFUNDED');
  const filteredOrders = orderFilter === 'ALL' ? orders : orderFilter === 'PAID' ? paidOrders : orderFilter === 'PENDING' ? pendingOrders : refundedOrders;
  const paidTotal = paidOrders.reduce((total, order) => total + order.amount, 0);

  return <section className="page-shell fan-page">
    <div className="fan-profile-header"><div className="fan-profile-title"><span className="fan-profile-avatar" aria-hidden="true">{session.user.name.slice(0, 1)}</span><div><span className="kicker">My Fan Space</span><h1>{session.user.name}님의 팬 페이지</h1><p>{session.user.email}</p></div></div><a className="solid-button" href="#categories">셀럽 둘러보기 <ArrowRight size={16} /></a></div>
    <div className="fan-overview" aria-label="팬 활동 요약"><article><span>누적 결제액</span><b>{paidTotal.toLocaleString()}원</b><small>결제 완료된 주문 기준</small></article><article><span>결제 완료</span><b>{paidOrders.length}건</b><small>보낸 메시지 {paidOrders.filter(order => order.message).length}건</small></article><article><span>결제 확인 중</span><b>{pendingOrders.length}건</b><small>승인 결과에 따라 갱신됩니다.</small></article></div>
    <div className={`fan-pg-status ${pg?.ready ? 'ready' : ''}`}><div><span className="kicker">Littly · {pg?.mode || '연결 확인 중'}</span><b>{pg?.ready ? 'PG 결제 이용 가능' : 'PG 결제 준비 중'}</b><span>{pg?.ready ? pg.message : pg?.message || '결제 PG 연결 상태를 확인할 수 없습니다.'}</span></div><span className="pg-indicator" aria-label={pg?.ready ? 'PG 연결됨' : 'PG 미연결'} /></div>
    <div className="fan-page-grid">
      <article className="fan-message-compose">
        <span className="kicker">Message + Support</span><h2>셀럽에게 메시지 보내기</h2>
        <label>셀럽<select value={creator?.id || ''} onChange={event => { setCreatorId(event.target.value); setProductId(''); }}>{creators.map(item => <option value={item.id} key={item.id}>{item.displayName} · {item.handle}</option>)}</select></label>
        <label>메시지 이용권<select value={product?.id || ''} onChange={event => setProductId(event.target.value)}>{products.map(item => <option value={item.id} key={item.id}>{item.title} · {item.price.toLocaleString()}원</option>)}</select></label>
        <label>응원 메시지<textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={500} placeholder="결제 주문과 함께 셀럽에게 전달할 메시지를 적어 주세요." /></label>
        <div className="fan-message-footer"><small>{message.length}/500자 · 결제 주문 내역에 저장됩니다.</small><b>{product ? `${product.price.toLocaleString()}원` : '상품 없음'}</b></div>
        <button className="solid-button large" type="button" disabled={!pg?.ready || !creator || !product || !message.trim()} onClick={() => creator && product && startCheckout(creator, product, message.trim(), session.user.name)}>{pg?.ready ? 'Littly로 결제하고 메시지 보내기' : 'PG 연결 후 결제 가능'}</button>
        <p className="form-hint">결제 완료된 주문의 메시지 내용이 내역에 남습니다. Instagram DM 자동 발송은 별도 Meta API 권한 및 연동 전까지 제공되지 않습니다.</p>
      </article>
      <aside className="fan-page-help"><h2>결제 흐름</h2><ol><li>셀럽과 메시지 이용권을 선택합니다.</li><li>메시지를 작성하고 Littly 결제를 진행합니다.</li><li>승인된 주문만 결제 완료로 기록되며, 아래 내역에서 확인할 수 있습니다.</li></ol><a href="#categories">셀럽 둘러보기 <ArrowRight size={16} /></a></aside>
    </div>
    <section className="fan-orders"><div className="fan-order-heading"><div><span className="kicker">My messages & payments</span><h2>보낸 메시지 · 결제 내역</h2></div><span className="account-chip">전체 {orders.length}건</span></div>
      <div className="fan-order-filters" role="group" aria-label="결제 내역 필터">{([{ key: 'ALL', label: '전체' }, { key: 'PAID', label: '결제 완료' }, { key: 'PENDING', label: '확인 중' }, { key: 'REFUNDED', label: '환불' }] as const).map(item => <button key={item.key} type="button" className={orderFilter === item.key ? 'active' : ''} aria-pressed={orderFilter === item.key} onClick={() => setOrderFilter(item.key)}>{item.label}<span>{item.key === 'ALL' ? orders.length : item.key === 'PAID' ? paidOrders.length : item.key === 'PENDING' ? pendingOrders.length : refundedOrders.length}</span></button>)}</div>
      {loadError ? <p className="form-error" role="alert">{loadError}</p> : filteredOrders.length ? <div className="fan-order-list">{filteredOrders.map(order => <article className="fan-order" key={order.id}><header><div><b>{order.creator}</b><small>{order.product} · {new Date(order.createdAt).toLocaleString('ko-KR')}</small></div><span className={`application-status ${order.status === 'PAID' ? 'approved' : order.status === 'REFUNDED' ? 'on-hold' : ''}`}>{order.status === 'PAID' ? '결제 완료' : order.status === 'REFUNDED' ? '환불' : '결제 확인 중'}</span></header><p>{order.message || '응원 메시지 없음'}</p><footer><span>{order.paymentProvider}{order.paidAt ? ` · 승인 ${new Date(order.paidAt).toLocaleString('ko-KR')}` : ''}</span><b>{order.amount.toLocaleString()}원</b></footer></article>)}</div> : <div className="empty-state">{orders.length ? '선택한 상태의 내역이 없습니다.' : '아직 메시지나 결제 내역이 없습니다. 셀럽을 둘러보고 첫 응원을 보내보세요.'}</div>}
    </section>
  </section>;
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
        style={creatorHeroStyle(creator)}
      >
        <CreatorSheetImage creator={creator} className="profile-avatar" />
        <span className="eyebrow">
          <ShieldCheck size={16} />
          {creator.addressMasked}
        </span>
        <h1>{creator.displayName}</h1>
        <p>{creator.bio}</p>
      </div>
      <section className="creator-community-summary" aria-label="후원 및 DM 안내">
        <div>
          <span className="kicker">Fan community</span>
          <h2>후원으로 더 가까운 대화</h2>
          <p>10,000하트 이상 후원하면 {creator.displayName}에게 카카오 알림 조건이 충족됩니다.</p>
          <div className="tier-row"><span>팬 등급</span><b>레벨 1 · 0P</b><b>레벨 2 · 10,000P</b><b>레벨 3 · 30,000P</b></div>
        </div>
        <div className="community-progress">
          <span>천만원 번지점프 방송</span>
          <progress max="10000000" value="0" />
          <b>0% 달성 · 0원 / 10,000,000원</b>
        </div>
      </section>
      <CreatorGallery creator={creator} />
      <div className="creator-layout">
        <div>
          <div className="section-head compact-head">
            <h2>디지털 콘텐츠</h2>
            <span className="account-chip">{creator.platform}</span>
          </div>
          <div className="wish-grid">
            {creator.wishlist.map(item => (
              <article className="wish-card" key={item.id}>
              <CreatorSheetImage creator={creator} className="wish-image" tile={3 + creator.wishlist.indexOf(item)} cropY="23%" />
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
          <article className="paid-dm-card">
            <div className="paid-dm-media"><CreatorSheetImage creator={creator} className="paid-dm-art" tile={4} cropY="13%" /><span>결제 후 공개</span></div>
            <div><span className="kicker">Paid DM</span><h3>팬 메시지와 사진 열람권</h3><p>결제 전 사진과 메시지는 블러 처리되며, 결제 후 {creator.displayName}에게 응원 메시지를 보낼 수 있습니다.</p></div>
            <button className="solid-button" type="button" onClick={() => { const item = creator.wishlist.find(entry => entry.categoryId === 'dm') || creator.wishlist[0]; if (item) beginCheckout(item); }}>DM 이용권 결제하기</button>
          </article>
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

function CreatorGallery({ creator }: { creator: Creator }) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const [failedUploads, setFailedUploads] = useState<string[]>([]);
  const uploads = (creator.galleryImages || []).filter(Boolean).slice(0, 10);
  const sheet = creatorGallerySheets[creator.slug] || creatorGallerySheets[creator.handle] || creatorGallerySheets['hong-gil-sun'];
  const photos = [
    ...uploads.map(src => ({ src, uploaded: true, tile: 0 })),
    ...Array.from({ length: 10 - uploads.length }, (_, index) => ({
      src: sheet,
      uploaded: false,
      tile: (index + uploads.length) % 10
    }))
  ];
  const galleryStyle = (tile: number) => ({
    backgroundImage: `url("${sheet}")`,
    backgroundPosition: `${(tile % 5) * 25}% ${Math.floor(tile / 5) * 100}%`
  });
  const isUploadedVisible = (index: number) => photos[index].uploaded && !failedUploads.includes(photos[index].src);

  const markUploadFailed = (src: string) => {
    setFailedUploads(current => current.includes(src) ? current : [...current, src]);
  };

  useEffect(() => {
    if (activePhoto === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActivePhoto(null);
    };
    addEventListener('keydown', onKeyDown);
    return () => removeEventListener('keydown', onKeyDown);
  }, [activePhoto]);

  return (
    <section className="creator-gallery" aria-labelledby="creator-gallery-title">
      <div className="section-head compact-head">
        <div>
          <span className="kicker"><Images size={15} /> Creator gallery</span>
          <h2 id="creator-gallery-title">{creator.displayName}의 갤러리</h2>
        </div>
        <span className="account-chip">사진 {photos.length}장</span>
      </div>
      <p className="creator-gallery-note">가입 시 등록한 사진을 먼저 보여드리며, 나머지는 프로필용 샘플 일러스트로 채웁니다.</p>
      <div className="creator-gallery-grid">
        {photos.map((photo, index) => (
          <button className="creator-gallery-item" type="button" key={`${photo.src}-${photo.tile}-${index}`} onClick={() => setActivePhoto(index)} aria-label={`${creator.displayName} 사진 ${index + 1} 크게 보기`}>
            {isUploadedVisible(index)
              ? <img className="creator-gallery-image" src={photo.src} alt={`${creator.displayName} 등록 사진 ${index + 1}`} loading="lazy" onError={() => markUploadFailed(photo.src)} />
              : <span className="creator-gallery-image creator-gallery-sprite" style={galleryStyle(photo.tile)} role="img" aria-label={`${creator.displayName} 샘플 일러스트 ${index + 1}`} />}
            <span className="creator-gallery-label">{isUploadedVisible(index) ? '등록 사진' : '샘플 일러스트'}</span>
          </button>
        ))}
      </div>
      {activePhoto !== null && (
        <div className="creator-gallery-lightbox" role="presentation" onClick={() => setActivePhoto(null)}>
          <section className="creator-gallery-dialog" role="dialog" aria-modal="true" aria-label={`${creator.displayName} 갤러리 사진`} onClick={event => event.stopPropagation()}>
            <button className="icon-button creator-gallery-close" type="button" onClick={() => setActivePhoto(null)} aria-label="사진 닫기"><X size={20} /></button>
            {isUploadedVisible(activePhoto)
              ? <img className="creator-gallery-large" src={photos[activePhoto].src} alt={`${creator.displayName} 등록 사진 ${activePhoto + 1}`} onError={() => markUploadFailed(photos[activePhoto].src)} />
              : <div className="creator-gallery-large creator-gallery-sprite" style={galleryStyle(photos[activePhoto].tile)} role="img" aria-label={`${creator.displayName} 샘플 일러스트 ${activePhoto + 1}`} />}
            <p>{activePhoto + 1} / {photos.length} · {isUploadedVisible(activePhoto) ? '등록 사진' : '샘플 일러스트'}</p>
          </section>
        </div>
      )}
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
  const provider = 'LITTLY';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pgStatus, setPgStatus] = useState<{ ready: boolean; mode: string; message: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/api/payments/config`).then(response => response.ok ? response.json() : null).then(data => setPgStatus(data)).catch(() => setPgStatus(null));
  }, []);

  const adminFee = Math.round((draft.amount * 25) / 100);
  const creatorPayout = draft.amount - adminFee;

  async function pay() {
    setBusy(true);
    setError('');
    const payload = {
      creatorId: draft.creatorId,
      productId: draft.wishlistItemId,
      supporterName: draft.supporterName,
      message: draft.message,
      amount: draft.amount,
      paymentProvider: provider
    };

    try {
      if (API) {
        const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
        if (!stored?.token) throw new Error('로그인 후 결제해 주세요.');
        const response = await fetch(`${API}/api/payments/littly-checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored.token}` },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const failure = await response.json().catch(() => ({}));
          throw new Error(failure.code === 'PG_NOT_READY' ? 'Littly 가맹점 연결 준비 중입니다. 결제되지 않았습니다.' : failure.code === 'PRODUCT_NOT_APPROVED' || failure.code === 'PRODUCT_UNAVAILABLE' ? '관리자 검토가 완료된 결제 상품이 아닙니다.' : failure.code === 'FAN_ONLY' ? '팬 계정으로 로그인해 결제해 주세요.' : `주문 생성 실패 (${response.status})`);
        }
        const order = await response.json();
                const littlyOrder = await response.json();
        localStorage.setItem('cssp-littly-pending-order', JSON.stringify({ ...payload, orderId: littlyOrder.orderId, createdAt: new Date().toISOString() }));
        window.location.assign(littlyOrder.littlyUrl || LITTLY_CHECKOUT_URL);
        return;
        return;
      }

      throw new Error('결제 서버에 연결할 수 없습니다. 결제되지 않았습니다.');
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
          <p>Littly 카드 결제 승인 후 주문 상태가 확인됩니다.</p>
          <span className={`fan-pg-inline ${pgStatus?.ready ? 'ready' : ''}`}>Littly · {pgStatus?.mode || '상태 확인 중'} · {pgStatus?.message || 'PG 연결 상태를 확인할 수 없습니다.'}</span>
        </div>
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
            <select value={provider} onChange={event => setProvider(event.target.value as 'Littly')}>
            <option value="Littly">Littly 카드</option>
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
            {busy ? '결제창 연결 중...' : pgStatus?.ready ? `${draft.amount.toLocaleString()}원 Littly 결제` : 'Littly 연결 후 결제 가능'}
          </button>
          {!pgStatus?.ready && <p className="form-hint">PG 가맹점 설정이 완료되지 않아 결제를 시작할 수 없습니다.</p>}
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
        <p>포인트는 디지털 콘텐츠, 프리미엄 DM 이용권, 기간형 멤버십 패스 구매에만 사용됩니다. 결제는 연결된 리틀리 페이지에서 진행합니다.</p>
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
              리틀리에서 {pointPackage.price.toLocaleString()}원 결제
            </button>
          </article>
        ))}
      </div>
      <div className="callout warning-callout">
        <b>리틀리 결제 연결</b>
        <p>결제 버튼을 누르면 고객용 리틀리 결제 페이지로 이동합니다. 결제 완료 후 주문번호를 보관해 주세요. 관리자가 결제 내역을 확인한 뒤 포인트를 반영합니다.</p>
        <a className="ghost-button" href={LITTLY_CHECKOUT_URL} target="_blank" rel="noopener noreferrer">리틀리 결제 페이지 열기</a>
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
  signupRole,
  loginRole,
  session,
  setSession
}: {
  mode: 'login' | 'signup';
  signupRole?: 'FAN' | 'CREATOR';
  loginRole?: 'FAN' | 'CREATOR';
  session: Session | null;
  setSession: (session: Session | null) => void;
}) {
  const [name, setName] = useState(signupRole === 'FAN' ? '팬 회원' : '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatorBio, setCreatorBio] = useState('');
  const [creatorPhotos, setCreatorPhotos] = useState<File[]>([]);
  const [instagramVideoUrl, setInstagramVideoUrl] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [dmAlertThreshold, setDmAlertThreshold] = useState('10000');
  const [dmNotice, setDmNotice] = useState('');
  const [role, setRole] = useState<'FAN' | 'CREATOR'>(signupRole || 'CREATOR');
  const [loginAs, setLoginAs] = useState<'ADMIN' | 'FAN' | 'CREATOR'>(loginRole || (location.hash.replace('#', '') === 'admin-login' ? 'ADMIN' : 'FAN'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isAdminLogin = mode === 'login' && location.hash.replace('#', '') === 'admin-login';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    if (mode === 'login') {
      if (API) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 10000);
        const response = await fetch(`${API}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
          signal: controller.signal
        }).catch(() => null).finally(() => window.clearTimeout(timeout));
        if (response?.ok) {
          const nextSession = (await response.json()) as Session;
          const isAdminAccount = nextSession.user.role === 'ADMIN';
          if ((isAdminLogin && !isAdminAccount) || (!isAdminLogin && !isAdminAccount && loginAs !== nextSession.user.role)) {
            setBusy(false);
            setError(isAdminLogin ? '관리자 계정만 관리자 페이지에 로그인할 수 있습니다.' : `${loginAs === 'FAN' ? '팬' : '인플루언서'} 계정으로 로그인해 주세요.`);
            return;
          }
          setSession(nextSession);
          location.hash = isAdminAccount ? 'admin' : loginAs === 'CREATOR' ? 'creator-dashboard' : 'fan-dashboard';
          return;
        }
        setBusy(false);
        setError(response?.status === 503 ? '로그인 서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.' : '이메일 또는 비밀번호를 확인해 주세요.');
        return;
      }
      setBusy(false);
      setError('로그인 서버에 연결할 수 없습니다.');
      return;
    }

    if (API) {
      const path = '/api/auth/signup';
      let photoUrls: string[] = [];
      if (role === 'CREATOR') {
        if (!creatorPhotos.length) {
          setBusy(false);
          setError('사진을 1장 이상 첨부해 주세요. 가입 후 최대 10장까지 추가할 수 있습니다.');
          return;
        }
        try {
          photoUrls = await Promise.all(creatorPhotos.map(optimizeCreatorPhoto));
        } catch (photoError) {
          setBusy(false);
          setError(photoError instanceof Error ? photoError.message : '사진을 처리하지 못했습니다.');
          return;
        }
      }
      const payload = {
        name, email, password, role,
        ...(role === 'CREATOR' ? {
          bio: creatorBio,
          photoUrls,
          instagramVideoUrl: instagramVideoUrl.trim() || undefined,
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
          accountNumber: accountNumber.trim(),
          instagramId: instagramId.trim().replace(/^@/, '') || undefined,
          dmAlertThreshold: Number(dmAlertThreshold),
          dmNotice: dmNotice.trim() || undefined
        } : {})
      };
      const response = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);
      if (response?.ok) {
        setSession((await response.json()) as Session);
        location.hash = role === 'CREATOR' ? 'creator-dashboard' : 'fan-dashboard';
        return;
      }
      if (response?.status === 409) {
        setBusy(false);
        setError('이미 가입된 이메일입니다. 로그인 화면에서 로그인해 주세요.');
        return;
      }
      if (response?.status === 400) {
        setBusy(false);
        setError('입력한 내용을 확인해 주세요. 이메일 형식과 비밀번호(4자 이상)를 확인해 주세요.');
        return;
      }
    }

    setBusy(false);
    setError('가입에 실패했습니다. 이메일 중복 여부와 서버 연결을 확인해 주세요.');
  }

  async function socialDemo(provider: string) {
    setError(`${provider} 로그인은 아직 연결되지 않았습니다. 이메일 로그인을 이용해 주세요.`);
  }

  if (session && mode === 'login' && !isAdminLogin) {
    return (
      <section className="auth-shell">
        <div className="auth-card">
          <Check size={34} />
          <h1>이미 로그인되어 있습니다.</h1>
          <p>{session.user.email}</p>
          <a className="solid-button large" href={session.user.role === 'CREATOR' ? '#creator-dashboard' : session.user.role === 'FAN' ? '#fan-dashboard' : '#admin'}>
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
          {isAdminLogin ? 'Operations Access' : mode === 'login' ? 'Welcome back' : 'Create account'}
        </span>
        <h1>{isAdminLogin ? '관리자 로그인' : mode === 'login' ? `${loginAs === 'FAN' ? '팬' : '인플러언서'} 로그인` : role === 'FAN' ? '팬 가입' : '인플러언서 가입'}</h1>
        {isAdminLogin ? (
          <p className="auth-copy">승인된 관리자 계정으로 로그인해 주세요.</p>
        ) : null}
        {mode === 'login' && !isAdminLogin && <div className="segment login-role-switch"><button type="button" className={loginAs === 'FAN' ? 'active' : ''} onClick={() => setLoginAs('FAN')}>팬 로그인</button><button type="button" className={loginAs === 'CREATOR' ? 'active' : ''} onClick={() => setLoginAs('CREATOR')}>인플루언서 로그인</button><a className="ghost-button" href="#admin-login">관리자 로그인</a></div>}
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
              <input value={name} onChange={event => setName(event.target.value)} placeholder={role === 'FAN' ? '팬 이름' : '인플러언서 이름'} required />
            </label>
            {!signupRole && <div className="segment">
              <button type="button" className={role === 'CREATOR' ? 'active' : ''} onClick={() => setRole('CREATOR')}>
                인플루언서
              </button>
              <button type="button" className={role === 'FAN' ? 'active' : ''} onClick={() => setRole('FAN')}>
                팬
              </button>
            </div>}
            {role === 'CREATOR' && <div className="creator-application-fields">
              <label>셀럽 자기소개<textarea value={creatorBio} onChange={event => setCreatorBio(event.target.value)} placeholder="팬들에게 보여줄 자기소개를 입력해 주세요." maxLength={500} required /></label>
              <label>프로필 사진 1~10장
                <input type="file" accept="image/*" multiple required={!creatorPhotos.length} onChange={event => {
                  const files = Array.from(event.target.files || []);
                  if (files.length > 10) {
                    setError('사진은 한 번에 최대 10장까지 선택할 수 있습니다.');
                    event.target.value = '';
                    return;
                  }
                  setError('');
                  setCreatorPhotos(files);
                }} />
              </label>
              <p className="form-hint">가입 시 최소 1장, 최대 10장까지 첨부할 수 있습니다. 이후 대시보드에서 남은 사진을 추가할 수 있어요. {creatorPhotos.length ? `선택 ${creatorPhotos.length}장` : ''}</p>
              <label>인스타그램 동영상 1개 <input type="url" value={instagramVideoUrl} onChange={event => setInstagramVideoUrl(event.target.value)} placeholder="https://www.instagram.com/reel/..." required /></label>
              <label>인스타그램 아이디 <input value={instagramId} onChange={event => setInstagramId(event.target.value)} placeholder="@your.instagram" /></label>
              <label>DM 알림 기준 (하트)<input type="number" min="0" max="100000000" step="1000" value={dmAlertThreshold} onChange={event => setDmAlertThreshold(event.target.value)} required /></label>
              <label>팬에게 보여줄 후원 알림 문구<textarea value={dmNotice} onChange={event => setDmNotice(event.target.value)} placeholder="예: 10,000하트 이상 후원 시 알림 메시지를 보내드립니다." maxLength={500} /></label>
              <p className="form-hint">알림 기준과 문구는 관리자 검토용 설정입니다. 실제 Instagram DM 자동 발송은 Meta API 권한 및 연동 후 이용할 수 있습니다.</p>
              <label>은행명 <input value={bankName} onChange={event => setBankName(event.target.value)} placeholder="예: 국민은행" autoComplete="off" required /></label>
              <label>예금주 <input value={accountHolder} onChange={event => setAccountHolder(event.target.value)} placeholder="예금주명" autoComplete="off" required /></label>
              <label>계좌번호 <input type="text" inputMode="numeric" value={accountNumber} onChange={event => setAccountNumber(event.target.value)} placeholder="계좌번호 입력" autoComplete="off" required /></label>
              <p className="form-hint">계좌번호는 관리자 정산 화면에서만 확인됩니다.</p>
            </div>}
          </>
        )}
        <label>
          이메일
          <input
            type={isAdminLogin ? 'text' : 'email'}
            value={email}
            onChange={event => setEmail(event.target.value)}
            placeholder={isAdminLogin ? '관리자 이메일' : 'you@example.com'}
            required
          />
        </label>
        <label>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="solid-button large" disabled={busy} type="submit">
          {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
          {busy ? '처리 중' : isAdminLogin ? '관리자 화면 열기' : mode === 'login' ? '로그인' : '가입 완료하기'}
        </button>
        <p className="auth-switch">
          {isAdminLogin ? '관리자 화면이 열리지 않으면 새로고침하세요.' : mode === 'login' ? '계정이 없나요?' : '이미 계정이 있나요?'}{' '}
          {isAdminLogin ? <a href="#admin">관리자 화면 보기</a> : <a href={mode === 'login' ? '#signup' : '#login'}>{mode === 'login' ? '가입하기' : '로그인'}</a>}
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
      <PaymentTable supports={supports} />
      {session?.user.role === 'CREATOR' && <CreatorApplicationStatus session={session} />}
      {session?.user.role === 'CREATOR' && <CreatorPayoutPanel session={session} />}
      {session?.user.role === 'CREATOR' && <CreatorPhotoManager session={session} />}
    </section>
  );
}

type CreatorProfileDraft = {
  name: string; email: string; bio: string; instagramId: string; instagramVideoUrl: string;
  dmAlertThreshold: number; dmNotice: string; bankName: string; accountHolder: string;
  accountNumber: string; reviewStatus: 'PENDING' | 'APPROVED' | 'ON_HOLD'; reviewNote: string;
};

function CreatorDashboard({ session }: { session: Session }) {
  const [profile, setProfile] = useState<CreatorProfileDraft | null>(null);
  const [draft, setDraft] = useState<CreatorProfileDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const loadProfile = () => fetch(`${API}/api/creators/me/profile`, { headers: { Authorization: `Bearer ${session.token}` } })
    .then(async response => {
      if (!response.ok) throw new Error('셀럽 상세 정보를 불러오지 못했습니다. 다시 로그인해 주세요.');
      const result = await response.json() as CreatorProfileDraft;
      setProfile(result);
      setDraft(result);
    });
  useEffect(() => { loadProfile().catch(reason => setError(reason instanceof Error ? reason.message : '정보를 불러오지 못했습니다.')); }, [session.token]);
  const setField = <K extends keyof CreatorProfileDraft>(key: K, value: CreatorProfileDraft[K]) => setDraft(current => current ? { ...current, [key]: value } : current);
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch(`${API}/api/creators/me/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ bio: draft.bio, instagramId: draft.instagramId, instagramVideoUrl: draft.instagramVideoUrl,
          dmAlertThreshold: Number(draft.dmAlertThreshold), dmNotice: draft.dmNotice, bankName: draft.bankName,
          accountHolder: draft.accountHolder, accountNumber: draft.accountNumber })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.code === 'INVALID_CREATOR_PROFILE' ? '입력 내용을 확인해 주세요. 소개와 계좌 정보는 필수입니다.' : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      await loadProfile();
      setMessage('프로필 변경 사항을 저장했습니다.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '저장하지 못했습니다.'); }
    finally { setBusy(false); }
  }
  const review = profile?.reviewStatus === 'APPROVED' ? '승인 완료' : profile?.reviewStatus === 'ON_HOLD' ? '검토 보류' : '검토 중';
  if (!draft) return <section className="page-shell"><p>{error || '셀럽 정보를 불러오는 중입니다.'}</p></section>;
  return <section className="creator-dashboard page-shell">
    <header className="creator-dashboard-head">
      <div><span className="kicker">Creator Studio / Profile</span><h1>{profile?.name}님의 스튜디오</h1><p>프로필과 팬 소통 정보를 관리하세요.</p></div>
      <span className={`creator-review-pill ${profile?.reviewStatus === 'APPROVED' ? 'is-approved' : ''}`}>{review}</span>
    </header>
    {profile?.reviewStatus !== 'APPROVED' && <div className={`creator-review-status ${profile?.reviewStatus === 'ON_HOLD' ? 'on-hold' : ''}`}><b>{profile?.reviewStatus === 'ON_HOLD' ? '프로필 검토가 보류되었습니다.' : '프로필 승인 검토 중입니다.'}</b><span>{profile?.reviewNote || '관리자 확인이 끝나면 크리에이터 프로필이 공개됩니다.'}</span></div>}
    <div className="creator-dashboard-grid">
      <div className="creator-dashboard-main">
        <form className="admin-panel creator-profile-editor" onSubmit={saveProfile}>
          <div className="admin-panel-head"><div><span className="kicker">Public profile</span><h2>프로필 상세 정보</h2></div></div>
          <p className="creator-private-note">이름과 이메일은 계정 정보에서 가져오며, 수정이 필요하면 관리자에게 문의해 주세요.</p>
          <div className="creator-profile-readonly"><span><small>이름</small><b>{profile?.name}</b></span><span><small>로그인 이메일</small><b>{profile?.email}</b></span></div>
          <label>팬에게 보여줄 자기소개<textarea value={draft.bio} onChange={event => setField('bio', event.target.value)} maxLength={500} required /></label>
          <div className="creator-profile-fields">
            <label>인스타그램 아이디<input value={draft.instagramId} onChange={event => setField('instagramId', event.target.value)} placeholder="@your.instagram" /></label>
            <label>대표 릴스/동영상 URL<input type="url" value={draft.instagramVideoUrl} onChange={event => setField('instagramVideoUrl', event.target.value)} placeholder="https://www.instagram.com/reel/..." /></label>
          </div>
          <div className="creator-editor-divider"><span>팬 알림 설정</span></div>
          <label>알림 기준 하트 수<input type="number" min="0" max="100000000" step="1000" value={draft.dmAlertThreshold} onChange={event => setField('dmAlertThreshold', Number(event.target.value))} required /></label>
          <label>후원 알림 안내 문구<textarea value={draft.dmNotice} onChange={event => setField('dmNotice', event.target.value)} maxLength={500} placeholder="예: 10,000하트 이상 후원 시 알림 메시지를 보내드립니다." /></label>
          <p className="form-hint">현재 설정은 프로필/관리자 안내용입니다. 카카오·Instagram 자동 알림은 해당 플랫폼 연동 권한이 있어야 발송됩니다.</p>
          <div className="creator-editor-divider"><span>정산 계좌</span><small>본인과 관리자만 확인할 수 있습니다.</small></div>
          <div className="creator-profile-fields bank-fields"><label>은행명<input value={draft.bankName} onChange={event => setField('bankName', event.target.value)} required /></label><label>예금주<input value={draft.accountHolder} onChange={event => setField('accountHolder', event.target.value)} required /></label><label>계좌번호<input inputMode="numeric" autoComplete="off" value={draft.accountNumber} onChange={event => setField('accountNumber', event.target.value)} required /></label></div>
          {message && <p className="creator-save-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
          <button className="solid-button" type="submit" disabled={busy}>{busy ? '저장 중' : '프로필 저장'}</button>
        </form>
        <CreatorPhotoManager session={session} />
      </div>
      <aside className="creator-dashboard-side"><CreatorPayoutPanel session={session} /><div className="creator-side-note"><span className="kicker">Visibility</span><h2>공개 범위</h2><p>자기소개와 프로필 사진은 승인 후 팬에게 공개됩니다. 계좌번호, 로그인 이메일, 관리자 검토 메모는 공개 프로필에 표시되지 않습니다.</p><a href="#home">홈페이지 보기 <ArrowRight size={15} /></a></div></aside>
    </div>
  </section>;
}

function CreatorApplicationStatus({ session }: { session: Session }) {
  const [application, setApplication] = useState<{ status: 'PENDING' | 'APPROVED' | 'ON_HOLD'; reviewNote: string } | null>(null);
  useEffect(() => {
    fetch(`${API}/api/creators/me/application`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) setApplication(data); })
      .catch(() => undefined);
  }, [session.token]);
  if (!application) return null;
  const approved = application.status === 'APPROVED';
  const held = application.status === 'ON_HOLD';
  return <div className={`creator-review-status ${approved ? 'approved' : held ? 'on-hold' : ''}`}>
    <b>{approved ? '프로필 승인 완료' : held ? '프로필 검토 보류' : '프로필 검토 대기 중'}</b>
    <span>{approved ? '크리에이터 프로필이 공개 중입니다.' : held ? '관리자 메모를 확인한 뒤 수정해 다시 검토를 요청해 주세요.' : '계좌와 프로필 정보 확인 후 승인되면 크리에이터 페이지가 공개됩니다.'}</span>
    {application.reviewNote && <p>관리자 메모: {application.reviewNote}</p>}
  </div>;
}

function CreatorPhotoManager({ session }: { session: Session }) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const remaining = Math.max(0, 10 - photos.length);

  useEffect(() => {
    fetch(`${API}/api/creators/me/photos`, { headers: { Authorization: `Bearer ${session.token}` } })
      .then(async response => {
        if (!response.ok) throw new Error('프로필 사진을 불러오지 못했습니다.');
        const result = await response.json();
        setPhotos(result.photos || []);
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : '프로필 사진을 불러오지 못했습니다.'));
  }, [session.token]);

  async function uploadPhotos() {
    if (!files.length || files.length > remaining) return;
    setBusy(true);
    setError('');
    try {
      const uploaded = await Promise.all(files.map(optimizeCreatorPhoto));
      const response = await fetch(`${API}/api/creators/me/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ photos: uploaded })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.code === 'GALLERY_LIMIT_REACHED' ? `사진은 총 10장까지 등록할 수 있습니다. 남은 장수: ${result.remaining}장` : '사진을 저장하지 못했습니다. 다시 시도해 주세요.');
      setPhotos(result.photos || []);
      setFiles([]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '사진을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return <section className="admin-panel creator-photo-manager">
    <div className="admin-panel-head"><div><span className="kicker">Creator Profile</span><h2>프로필 사진</h2></div><span className="admin-badge light">{photos.length} / 10장</span></div>
    <p>사진은 가입 후에도 추가할 수 있습니다. 크리에이터 프로필과 갤러리에 공개됩니다.</p>
    {photos.length > 0 && <div className="creator-photo-thumbnails">{photos.map((src, index) => <img key={`${src}-${index}`} src={src} alt={`프로필 사진 ${index + 1}`} loading="lazy" />)}</div>}
    {remaining > 0 && <div className="creator-photo-upload"><label>사진 추가<input type="file" accept="image/*" multiple onChange={event => {
      const selected = Array.from(event.target.files || []);
      if (selected.length > remaining) {
        setError(`현재 ${remaining}장까지 추가할 수 있습니다.`);
        event.target.value = '';
        return;
      }
      setError('');
      setFiles(selected);
    }} /></label><span>{files.length ? `${files.length}장 선택됨` : `최대 ${remaining}장 추가 가능`}</span><button className="solid-button" type="button" disabled={!files.length || busy} onClick={uploadPhotos}>{busy ? '업로드 중' : '사진 저장'}</button></div>}
    {error && <p className="form-error">{error}</p>}
  </section>;
}

function CreatorPayoutPanel({ session }: { session: Session }) {
  const [data, setData] = useState<{ creator: { name: string; email: string; bankName: string; accountHolder: string; accountNumber: string; payoutAccount: string }; agreement: { amount: number; note: string }; requests: Array<{ id: string; amount: number; status: string; note: string; createdAt: string }> } | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const load = () => fetch(`${API}/api/payouts/me`, { headers: { Authorization: `Bearer ${session.token}` } }).then(response => response.json()).then(setData).catch(() => setError('정산 정보를 불러오지 못했습니다.'));
  useEffect(() => { load(); }, [session.token]);
  async function requestPayout() {
    setError('');
    const response = await fetch(`${API}/api/payouts/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ amount: Number(amount), note }) });
    const result = await response.json();
    if (!response.ok) return setError(result.code === 'AGREEMENT_AMOUNT_EXCEEDED' ? `신청 가능 금액은 ${Number(result.available || 0).toLocaleString()}원입니다.` : '출금 신청에 실패했습니다.');
    setAmount(''); setNote(''); load();
  }
  const requested = data?.requests.filter(item => ['PENDING', 'APPROVED'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0) || 0;
  const available = Math.max(0, (data?.agreement.amount || 0) - requested);
  const account = data?.creator.bankName ? `${data.creator.bankName} / ${data.creator.accountHolder} / ${data.creator.accountNumber}` : data?.creator.payoutAccount;
  return <section className="admin-panel payout-panel"><div className="admin-panel-head"><div><span className="kicker">Creator Settlement</span><h2>약정 정산 및 출금 신청</h2></div><span className="admin-badge light">출금 가능 {available.toLocaleString()}원</span></div><p>등록 계좌: {account || '미등록'} · 관리자가 등록한 약정액 기준으로 출금 신청합니다. 실제 송금은 관리자 확인 후 진행됩니다.</p><div className="settings-metrics"><div><span>약정액</span><b>{(data?.agreement.amount || 0).toLocaleString()}원</b></div><div><span>신청 가능액</span><b>{available.toLocaleString()}원</b></div></div><div className="admin-form-grid"><label>출금 신청액<input type="number" min="1" value={amount} onChange={event => setAmount(event.target.value)} /></label><label>메모<input value={note} onChange={event => setNote(event.target.value)} placeholder="출금 메모" /></label></div>{error && <p className="form-error">{error}</p>}<button className="solid-button" type="button" disabled={!amount || Number(amount) > available} onClick={requestPayout}>출금 신청</button>{data?.requests.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>신청일</th><th>금액</th><th>상태</th></tr></thead><tbody>{data.requests.map(item => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</td><td>{item.amount.toLocaleString()}원</td><td>{item.status}</td></tr>)}</tbody></table></div> : null}</section>;
}

function Admin({
  page,
  supports,
  creators,
  categories,
  adminFeeTotal,
  creatorPayoutTotal
}: {
  page: string;
  supports: Support[];
  creators: Creator[];
  categories: Category[];
  adminFeeTotal: number;
  creatorPayoutTotal: number;
}) {
  const [query, setQuery] = useState('');
  const [feeRate, setFeeRate] = useState(25);
  const [dataError, setDataError] = useState('');
  const [littlyEmails, setLittlyEmails] = useState<Array<{ id: string; subject: string; from: string; text: string; receivedAt: string; status: string }>>([]);
  const [payoutRequests, setPayoutRequests] = useState<Array<{ id: string; creatorId: string; amount: number; status: string; note: string; createdAt: string }>>([]);
  const [payoutAgreements, setPayoutAgreements] = useState<Array<{ creatorId: string; amount: number; note: string; updatedAt: string }>>([]);
  const [agreementCreatorId, setAgreementCreatorId] = useState('');
  const [agreementAmount, setAgreementAmount] = useState('');
  const [members, setMembers] = useState<Array<{ id: string; email: string; displayName: string; role: string; grade: string; createdAt: string; application?: { bio: string; photoUrls: string[]; instagramVideoUrl: string; payoutAccount: string; bankName?: string; accountHolder?: string; accountNumber?: string; instagramId?: string; dmAlertThreshold?: number; dmNotice?: string; reviewStatus?: 'PENDING' | 'APPROVED' | 'ON_HOLD'; reviewNote?: string; reviewedAt?: string } }>>([]);
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
    const headers = { Authorization: `Bearer ${stored?.token || ''}` };
    Promise.all(['/api/admin/users', '/api/admin/settings', '/api/admin/littly-payment-emails'].map(async path => {
      const response = await fetch(`${API}${path}`, { headers });
      if (!response.ok) throw new Error('관리자 데이터를 불러올 수 없습니다. 다시 로그인해 주세요.');
      return response.json();
    })).then(([users, settings, emails]) => { setMembers(users); setFeeRate(settings.commissionRate); setLittlyEmails(emails); return Promise.all([fetch(`${API}/api/admin/payout-requests`, { headers }), fetch(`${API}/api/admin/payout-agreements`, { headers })]); })
      .then(async ([requestsResponse, agreementsResponse]) => { setPayoutRequests(await requestsResponse.json()); setPayoutAgreements(await agreementsResponse.json()); })
      .catch(error => setDataError(error.message));
  }, []);
  const section = page === 'admin' ? 'dashboard' : page.replace('admin-', '');
  const [fanDraft, setFanDraft] = useState({ name: '새 팬', email: '', level: 'B' });
  const [creatorDraft, setCreatorDraft] = useState({
    displayName: '새 인플러언서',
    handle: '@new.creator',
    platform: 'Instagram',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300'
  });
  const [localFans, setLocalFans] = useState<Array<{ name: string; email: string; total: number; count: number; lastSeen: string; tier: string }>>([]);
  const [localCreators, setLocalCreators] = useState<
    Array<{ id: string; displayName: string; handle: string; avatarUrl: string; platform: string; total: number; status: string }>
  >([]);
  const normalizedQuery = query.trim().toLowerCase();
  const paymentRows = useMemo(() => {
    return supports
      .filter(item => {
        if (!normalizedQuery) return true;
        const text = [
          item.id,
          item.creatorName ?? '',
          item.creatorHandle ?? '',
          item.creatorInstagramId ?? '',
          item.supporterName,
          item.supporterEmail ?? '',
          item.supporterId ?? '',
          item.message ?? ''
        ]
          .join(' ')
          .toLowerCase();
        return text.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [supports, normalizedQuery]);

  const creatorRows = useMemo(() => {
    return creators.map(creator => {
      const total = supports
        .filter(item => item.creatorId === creator.id)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
      ...creator,
      total,
        payoutAccount: (() => { const application = members.find(member => member.displayName === creator.displayName)?.application; return application?.bankName ? `${application.bankName} / ${application.accountHolder || ''} / ${application.accountNumber || ''}` : application?.payoutAccount || '-'; })(),
        agreedAmount: payoutAgreements.find(item => item.creatorId === creator.id)?.amount || 0,
        commissionRate: feeRate,
        payoutRate: Math.max(0, 100 - feeRate),
        status: total > 0 ? '활성' : '대기'
      };
    });
  }, [creators, supports, members, payoutAgreements, feeRate]);

  const fanRows = useMemo(() => {
    const map = new Map<string, { name: string; email: string; total: number; count: number; lastSeen: string }>();
    supports.forEach(item => {
      const key = item.supporterEmail ?? item.supporterName;
      const current = map.get(key) ?? {
        name: item.supporterName,
        email: item.supporterEmail ?? '-',
        total: 0,
        count: 0,
        lastSeen: item.createdAt
      };
      current.total += item.amount;
      current.count += 1;
      current.lastSeen = item.createdAt;
      map.set(key, current);
    });
    return [...map.values()]
      .sort((left, right) => right.total - left.total)
      .map((item, index) => ({
        ...item,
        tier: index === 0 ? 'S' : index < 3 ? 'A' : index < 6 ? 'B' : 'C'
      }));
  }, [supports]);

  const mergedFans = members.filter(member => member.role === 'FAN').map(member => ({
    name: member.displayName, email: member.email, tier: member.grade, lastSeen: member.createdAt,
    total: fanRows.find(row => row.email === member.email)?.total || 0,
    count: fanRows.find(row => row.email === member.email)?.count || 0
  }));
  const mergedCreators = [
    ...localCreators,
    ...creatorRows.map(creator => ({
      id: creator.id,
      displayName: creator.displayName,
      handle: creator.handle,
      avatarUrl: creator.avatarUrl,
      platform: creator.platform,
      total: creator.total,
      payoutAccount: creator.payoutAccount,
      agreedAmount: creator.agreedAmount,
      commissionRate: creator.commissionRate,
      payoutRate: creator.payoutRate,
      status: creator.status
    }))
  ];
  const totalMembers = members.length;
  const [dmRows, setDmRows] = useState<Array<{ id: string; fan: string; creator: string; channel: string; message: string; status: string; createdAt: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('cssp-dm-logs') || '[]'); } catch { return []; }
  });

  const settlementRows = mergedCreators.map(creator => {
    const adminFee = supports.filter(order => order.creatorId === creator.id && order.status === 'PAID').reduce((sum, order) => sum + (order.adminFee || 0), 0);
    return {
      ...creator,
      adminFee,
      payout: Math.max(0, creator.total - adminFee)
    };
  });
  const showDashboard = section === 'dashboard';

  function registerFan() {
    const email = fanDraft.email.trim() || `fan-${Date.now()}@example.com`;
    setLocalFans(prev => [
      {
        name: fanDraft.name.trim() || '새 팬',
        email,
        total: 0,
        count: 0,
        lastSeen: new Date().toISOString(),
        tier: fanDraft.level
      },
      ...prev
    ]);
    setFanDraft({ name: '', email: '', level: fanDraft.level });
  }

  function registerCreator() {
    const id = `creator-${Date.now()}`;
    setLocalCreators(prev => [
      {
        id,
        displayName: creatorDraft.displayName.trim() || '새 인플러언서',
        handle: creatorDraft.handle.trim() || '@new.creator',
        avatarUrl: creatorDraft.avatarUrl,
        platform: creatorDraft.platform,
        total: 0,
        status: '대기'
      },
      ...prev
    ]);
    setCreatorDraft(prev => ({ ...prev, displayName: '', handle: '' }));
  }

  async function savePayoutAgreement() {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
    await fetch(`${API}/api/admin/payout-agreements`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored?.token || ''}` }, body: JSON.stringify({ creatorId: agreementCreatorId, amount: Number(agreementAmount) }) });
    setPayoutAgreements(prev => [...prev.filter(item => item.creatorId !== agreementCreatorId), { creatorId: agreementCreatorId, amount: Number(agreementAmount), note: '', updatedAt: new Date().toISOString() }]);
    setAgreementAmount('');
  }
  async function updatePayoutRequest(id: string, status: 'APPROVED' | 'REJECTED' | 'PAID') {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
    const response = await fetch(`${API}/api/admin/payout-requests/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored?.token || ''}` }, body: JSON.stringify({ status }) });
    if (response.ok) setPayoutRequests(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  }
  async function reviewCreatorApplication(userId: string, status: 'PENDING' | 'APPROVED' | 'ON_HOLD', reviewNote: string) {
    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
    const response = await fetch(`${API}/api/admin/creator-applications/${encodeURIComponent(userId)}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored?.token || ''}` },
      body: JSON.stringify({ status, reviewNote })
    });
    if (!response.ok) throw new Error('신청 상태를 저장하지 못했습니다. 관리자 로그인을 확인해 주세요.');
    setMembers(prev => prev.map(member => member.id === userId ? { ...member, application: { ...member.application!, reviewStatus: status, reviewNote, reviewedAt: new Date().toISOString() } } : member));
  }

  return (
    <section className="admin-lte-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>IK</span>
          <div>
            <b>EON Korea</b>
            <small>AdminLTE 4.8.5-style</small>
          </div>
        </div>
        <nav>
          <a href="#admin" className={section === 'dashboard' ? 'active' : ''}>
            <PanelLeft size={16} />
            대시보드
          </a>
          <a href="#admin-payments" className={section === 'payments' ? 'active' : ''}>
            <ReceiptText size={16} />
            결제 관리
          </a>
          <a href="#admin-fans" className={section === 'fans' ? 'active' : ''}>
            <Users size={16} />
            팬 회원가입
          </a>
          <a href="#admin-creators" className={section === 'creators' ? 'active' : ''}>
            <UserRoundPlus size={16} />
            인플러언서 가입
          </a>
          <a href="#admin-settlement" className={section === 'settlement' ? 'active' : ''}>
            <CircleDollarSign size={16} />
            정산 현황
          </a>
          <a href="#admin-dm" className={section === 'dm' ? 'active' : ''}>
            <Bell size={16} />
            DM/카톡 로그
          </a>
          <a href="#admin-settings" className={section === 'settings' ? 'active' : ''}>
            <BriefcaseBusiness size={16} />
            설정
          </a>
        </nav>
        <div className="admin-sidebar-foot">
          <a href={LITTLY_ADMIN_URL} target="_blank" rel="noopener noreferrer">리틀리 결제 관리 열기</a>
          <span>AdminLTE 기반 운영 패널</span>
          <a href="https://github.com/ColorlibHQ/AdminLTE/releases" target="_blank" rel="noreferrer">
            Release notes
          </a>
        </div>
      </aside>

      <div className="admin-main">
        <p role="status">Littly 키 발급 대기 · 결제/환불/자동 지급 미연결</p>
        <a href="https://litt.ly/eon8" target="_blank" rel="noopener noreferrer">연결된 리틀리 페이지 확인</a>
        {dataError && <p role="alert">{dataError}</p>}
        <header className="admin-topbar">
          <div>
            <span className="kicker">Admin</span>
            <h1>운영 관리</h1>
            <p>Littly 승인, 결제, 팬 회원가입, 인플러언서 가입리스트를 한 번에 관리합니다.</p>
          </div>
          <label className="admin-search">
            <Search size={16} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="결제번호, 팬, 인플러언서 검색" />
          </label>
        </header>

        <div className="admin-info-grid">
          <article className="small-box blue">
            <div>
              <span>포인트 주문</span>
              <strong>{supports.length}</strong>
            </div>
            <BarChart3 />
          </article>
          <article className="small-box green">
            <div>
              <span>팬 회원가입</span>
              <strong>{mergedFans.length}</strong>
            </div>
            <Users />
          </article>
          <article className="small-box yellow">
            <div>
              <span>인플러언서 가입</span>
              <strong>{mergedCreators.length}</strong>
            </div>
            <UserRoundPlus />
          </article>
          <article className="small-box purple">
            <div>
              <span>관리 수수료율</span>
              <strong>{feeRate}%</strong>
            </div>
            <WalletCards />
          </article>
        </div>

        <div className="admin-grid">
          {(showDashboard || section === 'settings' || section === 'settlement') && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">설정</span>
                <h2>정산 수수료율</h2>
              </div>
              <span className="admin-badge light">1~100%</span>
            </div>
            <div className="settings-card">
              <label>
                현재 수수료율
                <input type="range" min={0} max={100} value={feeRate} onChange={event => setFeeRate(Number(event.target.value))} />
                <button type="button" onClick={async () => {
                  try {
                    const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
                    const response = await fetch(`${API}/api/admin/settings`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${stored?.token || ''}` },
                      body: JSON.stringify({ commissionRate: feeRate })
                    });
                    if (!response.ok) throw new Error('수수료를 저장하지 못했습니다.');
                    setDataError('');
                    alert('신규 주문 수수료를 저장했습니다. 기존 주문에는 변경되지 않습니다.');
                  } catch { setDataError('수수료를 저장하지 못했습니다. 다시 시도해 주세요.'); }
                }}>수수료 저장</button>
              </label>
              <div className="settings-metrics">
                <div>
                  <span>관리자 수수료</span>
                  <b>{adminFeeTotal.toLocaleString()}원</b>
                </div>
                <div>
                  <span>인플러언서 지급액</span>
                  <b>{creatorPayoutTotal.toLocaleString()}원</b>
                </div>
              </div>
            </div>
          </section>
          )}

          {(showDashboard || section === 'payments') && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">결제 관리</span>
                <h2>결제 및 정산 리스트</h2>
              </div>
              <span className="admin-badge">Littly</span>
            </div>
            <PaymentTable supports={paymentRows} />
          </section>
          )}

          {(showDashboard || section === 'payments') && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">Littly Integration</span>
                <h2>리틀리 결제 알림 수신 내역</h2>
              </div>
              <span className="admin-badge light">{littlyEmails.length}건 수신</span>
            </div>
            {littlyEmails.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>수신일</th><th>제목</th><th>발신자</th><th>내용</th><th>상태</th></tr></thead><tbody>{littlyEmails.slice(0, 20).map(email => <tr key={email.id}><td>{new Date(email.receivedAt).toLocaleString('ko-KR')}</td><td>{email.subject || '-'}</td><td>{email.from || '-'}</td><td><small>{email.text.slice(0, 180)}</small></td><td>{email.status}</td></tr>)}</tbody></table></div> : <div className="empty-state">아직 리틀리 결제 알림이 수신되지 않았습니다.</div>}
          </section>
          )}

          {showDashboard && (
          <section className="admin-panel">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">요약</span>
                <h2>핵심 지표</h2>
              </div>
            </div>
            <div className="metric-list">
              <div>
                <span>카테고리</span>
                <b>{categories.length}개</b>
              </div>
              <div>
                <span>관리자 수수료</span>
                <b>{adminFeeTotal.toLocaleString()}원</b>
              </div>
              <div>
                <span>인플러언서 지급액</span>
                <b>{creatorPayoutTotal.toLocaleString()}원</b>
              </div>
              <div>
                <span>총 회원</span>
                <b>{totalMembers}명</b>
              </div>
            </div>
          </section>
          )}

          {(showDashboard || section === 'fans') && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">팬 회원가입</span>
                <h2>가입 팬 리스트</h2>
              </div>
              <span className="admin-badge light"><BadgeCheck size={14} /> 등급 관리</span>
            </div>
            <div className="admin-form-grid">
              <label>
                팬 이름
                <input value={fanDraft.name} onChange={event => setFanDraft({ ...fanDraft, name: event.target.value })} />
              </label>
              <label>
                이메일
                <input value={fanDraft.email} onChange={event => setFanDraft({ ...fanDraft, email: event.target.value })} placeholder="fan@example.com" />
              </label>
              <label>
                등급
                <select value={fanDraft.level} onChange={event => setFanDraft({ ...fanDraft, level: event.target.value })}>
                  <option value="S">S</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </label>
              <button className="solid-button" type="button" onClick={() => alert('팬 계정은 홈페이지 회원가입에서 등록해 주세요. 관리자 대리 가입은 아직 지원하지 않습니다.')}>
                팬 등록
              </button>
            </div>
            <FanSignupTable fans={mergedFans} />
          </section>
          )}

          {(showDashboard || section === 'creators') && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head">
              <div>
                <span className="kicker">인플러언서 가입</span>
                <h2>가입 인플러언서 리스트</h2>
              </div>
              <span className="admin-badge light"><FileText size={14} /> 프로필 확인</span>
            </div>
            <div className="admin-form-grid creator-form">
              <label>
                이름
                <input value={creatorDraft.displayName} onChange={event => setCreatorDraft({ ...creatorDraft, displayName: event.target.value })} />
              </label>
              <label>
                아이디
                <input value={creatorDraft.handle} onChange={event => setCreatorDraft({ ...creatorDraft, handle: event.target.value })} placeholder="@creator.id" />
              </label>
              <label>
                플랫폼
                <select value={creatorDraft.platform} onChange={event => setCreatorDraft({ ...creatorDraft, platform: event.target.value })}>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Twitch">Twitch</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </label>
              <label>
                프로필 이미지
                <input value={creatorDraft.avatarUrl} onChange={event => setCreatorDraft({ ...creatorDraft, avatarUrl: event.target.value })} />
              </label>
              <button className="solid-button" type="button" onClick={() => alert('인플루언서 계정은 홈페이지 회원가입에서 등록해 주세요. 관리자 대리 가입은 아직 지원하지 않습니다.')}>
                인플러언서 등록
              </button>
            </div>
            <CreatorSignupTable creators={mergedCreators} />
            <CreatorApplicationTable applications={members.filter(member => member.role === 'CREATOR' && member.application)} onReview={reviewCreatorApplication} />
          </section>
          )}

          {(showDashboard || section === 'settlement') && (
          <section className="admin-panel admin-panel-wide">
            <div className="admin-panel-head"><div><span className="kicker">약정 정산</span><h2>인플루언서 약정액 및 출금 신청</h2></div><span className="admin-badge light">수동 지급 관리</span></div>
            <div className="admin-form-grid"><label>인플루언서<select value={agreementCreatorId} onChange={event => setAgreementCreatorId(event.target.value)}><option value="">선택하세요</option>{creators.map(creator => <option key={creator.id} value={creator.id}>{creator.displayName} ({creator.handle})</option>)}</select></label><label>약정 지급액<input type="number" min="0" value={agreementAmount} onChange={event => setAgreementAmount(event.target.value)} placeholder="원" /></label><button className="solid-button" type="button" disabled={!agreementCreatorId || !agreementAmount} onClick={savePayoutAgreement}>약정액 저장</button></div>
            {payoutRequests.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>인플루언서</th><th>신청액</th><th>신청일</th><th>상태</th><th>처리</th></tr></thead><tbody>{payoutRequests.map(item => <tr key={item.id}><td>{creators.find(creator => creator.id === item.creatorId)?.displayName || item.creatorId}</td><td>{item.amount.toLocaleString()}원</td><td>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</td><td>{item.status}</td><td>{item.status === 'PENDING' ? <><button type="button" onClick={() => updatePayoutRequest(item.id, 'APPROVED')}>승인</button> <button type="button" onClick={() => updatePayoutRequest(item.id, 'REJECTED')}>반려</button></> : item.status === 'APPROVED' ? <button type="button" onClick={() => updatePayoutRequest(item.id, 'PAID')}>지급 완료</button> : '-'}</td></tr>)}</tbody></table></div> : <div className="empty-state">출금 신청이 없습니다.</div>}
          </section>
          )}

          {(showDashboard || section === 'settlement') && (
          <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-head">
                <div>
                  <span className="kicker">정산 현황</span>
                  <h2>인플러언서별 지급 계산</h2>
                </div>
                <span className="admin-badge">수수료 {feeRate}% 적용</span>
              </div>
              <SettlementTable rows={settlementRows} />
            </section>
          )}

          {(showDashboard || section === 'dm') && (
            <section className="admin-panel admin-panel-wide">
              <div className="admin-panel-head">
                <div>
                  <span className="kicker">DM / Kakao Log</span>
                  <h2>DM 보낸 내용 및 카톡 알림 로그</h2>
                </div>
                <span className="admin-badge light">로그 저장</span>
              </div>
              <CreatorCommunicationPanel creators={creators} supports={supports} dmRows={dmRows} setDmRows={setDmRows} />
            </section>
          )}
        </div>
      </div>
    </section>
  );
}

function PaymentTable({ supports }: { supports: Support[] }) {
  if (!supports.length) {
    return <div className="empty-state">아직 구매 내역이 없습니다.</div>;
  }
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>결제번호</th>
            <th>팬</th>
            <th>인플러언서</th>
            <th>금액</th>
            <th>관리자 수수료</th>
            <th>지급액</th>
            <th>PG</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {supports.map(support => (
            <tr key={support.id}>
              <td>{support.id}</td>
              <td>
                <b>{support.supporterName}</b>
                <small>{support.supporterEmail ?? support.supporterId ?? '-'}</small>
              </td>
              <td>
                <b>{support.creatorName ?? support.creatorId}</b>
                <small>{support.creatorInstagramId ?? support.creatorHandle ?? '-'}</small>
              </td>
              <td>{support.amount.toLocaleString()}원</td>
              <td>{(support.adminFee ?? 0).toLocaleString()}원</td>
              <td>{(support.creatorPayout ?? support.amount).toLocaleString()}원</td>
              <td>{support.paymentProvider ?? 'Littly'}</td>
              <td>{support.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FanSignupTable({ fans }: { fans: { name: string; email: string; total: number; count: number; lastSeen: string; tier: string }[] }) {
  if (!fans.length) {
    return <div className="empty-state">아직 팬 가입 내역이 없습니다.</div>;
  }
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>팬 이름</th>
            <th>이메일</th>
            <th>결제 합계</th>
            <th>횟수</th>
            <th>등급</th>
            <th>최근 활동</th>
          </tr>
        </thead>
        <tbody>
          {fans.map(fan => (
            <tr key={fan.email}>
              <td>{fan.name}</td>
              <td>{fan.email}</td>
              <td>{fan.total.toLocaleString()}원</td>
              <td>{fan.count}회</td>
              <td><span className="tier-chip">{fan.tier}</span></td>
              <td>{new Date(fan.lastSeen).toLocaleString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettlementTable({
  rows
}: {
  rows: { id: string; displayName: string; handle: string; avatarUrl: string; platform: string; total: number; adminFee: number; payout: number; agreedAmount?: number; commissionRate?: number; payoutRate?: number; payoutAccount?: string; status: string }[];
}) {
  if (!rows.length) {
    return <div className="empty-state">아직 정산 대상 인플러언서가 없습니다.</div>;
  }
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>프로필</th>
            <th>인플러언서 / 아이디</th>
            <th>계좌</th>
            <th>결제금액</th>
            <th>고정 수수료율</th>
            <th>지급 비율</th>
            <th>약정 지급액</th>
            <th>지급액</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>
                <img className="table-avatar" src={row.avatarUrl} alt="" />
              </td>
              <td>
                <b>{row.displayName}</b>
                <small>{row.handle}</small>
              </td>
              <td>{row.payoutAccount || '-'}</td>
              <td>{row.total.toLocaleString()}원</td>
              <td>{row.commissionRate ?? 0}%</td>
              <td>{row.payoutRate ?? 0}%</td>
              <td>{(row.agreedAmount ?? 0).toLocaleString()}원</td>
              <td>{row.payout.toLocaleString()}원</td>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreatorCommunicationPanel({
  creators,
  supports,
  dmRows,
  setDmRows
}: {
  creators: Creator[];
  supports: Support[];
  dmRows: Array<{ id: string; fan: string; creator: string; channel: string; message: string; status: string; createdAt: string }>;
  setDmRows: React.Dispatch<React.SetStateAction<Array<{ id: string; fan: string; creator: string; channel: string; message: string; status: string; createdAt: string }>>>;
}) {
  const [creatorId, setCreatorId] = useState(creators[0]?.id || '');
  const [notice, setNotice] = useState('새 콘텐츠와 일정이 업데이트되었습니다.');
  const [dmText, setDmText] = useState('');
  const [snsText, setSnsText] = useState('후원해주신 팬 여러분, 정말 감사합니다!');
  const [threshold, setThreshold] = useState(10000);
  const [rankVisible, setRankVisible] = useState(true);
  const [tiers, setTiers] = useState([
    { name: 'S', amount: 50000 }, { name: 'A', amount: 30000 }, { name: 'B', amount: 10000 }, { name: 'C', amount: 0 }
  ]);
  const [campaign, setCampaign] = useState({ title: '천만원 번지점프 방송', target: 10000000, raised: 0 });
  const creator = creators.find(item => item.id === creatorId) || creators[0];
  const creatorSupports = supports.filter(item => item.creatorId === creator?.id);
  const total = creatorSupports.reduce((sum, item) => sum + item.amount, 0);
  const ranking = [...new Map(creatorSupports.map(item => [item.supporterEmail || item.supporterName, item])).values()]
    .sort((a, b) => b.amount - a.amount).slice(0, 10);

  function saveLogs(next: typeof dmRows) {
    setDmRows(next);
    localStorage.setItem('cssp-dm-logs', JSON.stringify(next));
  }
  function addLog(channel: string, message: string, status: string) {
    if (!creator || !message.trim()) return;
    saveLogs([{ id: `dm-${Date.now()}`, fan: channel === '공지' ? '전체 팬' : '관리자', creator: creator.displayName,
      channel, message: message.trim(), status, createdAt: new Date().toISOString() }, ...dmRows]);
  }
  function sendNotice() { addLog('전체 공지', notice, '발송 대기'); }
  function sendDm() { addLog('유료 DM', dmText, '결제 후 열람'); setDmText(''); }
  function testSocialPost() {
    if (!creator || !snsText.trim()) return;
    addLog('SNS 테스트', `${creator.displayName} 후원 내역 테스트: ${snsText}`, '테스트 완료 · 실제 게시 전송 안 함');
  }
  function saveSettings() { localStorage.setItem(`cssp-creator-settings-${creator?.id}`, JSON.stringify({ threshold, rankVisible, tiers, campaign })); }

  return <div className="communication-studio">
    <div className="admin-form-grid">
      <label>셀럽 선택<select value={creatorId} onChange={event => setCreatorId(event.target.value)}>{creators.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>
      <label>알림 기준 금액(원)<input type="number" min="0" value={threshold} onChange={event => setThreshold(Number(event.target.value))} /></label>
      <label className="checkbox-field"><input type="checkbox" checked={rankVisible} onChange={event => setRankVisible(event.target.checked)} /> 후원 순위 1~10위 공개</label>
      <button className="solid-button" type="button" onClick={saveSettings}>셀럽 설정 저장</button>
    </div>
    <div className="admin-form-grid">
      <label>전체 DM 공지<textarea value={notice} onChange={event => setNotice(event.target.value)} /></label>
      <button className="ghost-button" type="button" onClick={sendNotice}>전체 팬에게 공지</button>
      <label>팬에게 보낼 유료 DM<textarea value={dmText} onChange={event => setDmText(event.target.value)} placeholder="사진/메시지는 결제 전 블러 상태로 노출" /></label>
      <button className="ghost-button" type="button" onClick={sendDm}>유료 DM 등록</button>
      <label>SNS 후원 인증 문구<textarea value={snsText} onChange={event => setSnsText(event.target.value)} /></label>
      <button className="ghost-button" type="button" onClick={testSocialPost}>SNS 자동 게시 테스트</button>
    </div>
    <div className="settings-metrics">
      <div><span>셀럽 누적 팬 활동 금액</span><b>{total.toLocaleString()}원</b></div>
      <div><span>알림 조건</span><b>{threshold.toLocaleString()}원 이상</b></div>
      <div><span>카카오 알림</span><b>{threshold > 0 ? '조건 충족 시 발송' : '꺼짐'}</b></div>
    </div>
    <div className="admin-form-grid tier-settings">
      {tiers.map((tier, index) => <label key={tier.name}>등급명 {tier.name}<input value={tier.name} onChange={event => setTiers(prev => prev.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} /><input type="number" value={tier.amount} onChange={event => setTiers(prev => prev.map((item, i) => i === index ? { ...item, amount: Number(event.target.value) } : item))} /></label>)}
    </div>
    <div className="campaign-editor">
      <label>프로젝트형 모금 제목<input value={campaign.title} onChange={event => setCampaign({ ...campaign, title: event.target.value })} /></label>
      <label>목표 금액<input type="number" value={campaign.target} onChange={event => setCampaign({ ...campaign, target: Number(event.target.value) })} /></label>
      <label>현재 달성 금액<input type="number" value={campaign.raised} onChange={event => setCampaign({ ...campaign, raised: Number(event.target.value) })} /></label>
      <div><b>{campaign.title}</b><progress max={campaign.target || 1} value={Math.min(campaign.raised, campaign.target)} /><span>{Math.round((campaign.raised / Math.max(campaign.target, 1)) * 100)}% 달성 · {campaign.raised.toLocaleString()}원 / {campaign.target.toLocaleString()}원</span></div>
    </div>
    {rankVisible && <div className="table-scroll"><table className="admin-table"><thead><tr><th>순위</th><th>팬</th><th>등급</th><th>금액</th></tr></thead><tbody>{ranking.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td>{item.supporterName}</td><td>{tiers.find(tier => item.amount >= tier.amount)?.name || 'C'}</td><td>비공개</td></tr>)}</tbody></table></div>}
    <DmLogTable rows={dmRows} />
  </div>;
}

function DmLogTable({
  rows
}: {
  rows: { id: string; fan: string; creator: string; channel: string; message: string; status: string; createdAt: string }[];
}) {
  if (!rows.length) {
    return <div className="empty-state">검색된 DM/카톡 로그가 없습니다.</div>;
  }
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>로그번호</th>
            <th>팬</th>
            <th>인플러언서</th>
            <th>채널</th>
            <th>내용</th>
            <th>상태</th>
            <th>저장일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.fan}</td>
              <td>{row.creator}</td>
              <td>{row.channel}</td>
              <td>{row.message}</td>
              <td>{row.status}</td>
              <td>{new Date(row.createdAt).toLocaleString('ko-KR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreatorApplicationTable({
  applications,
  onReview
}: {
  applications: Array<{
    id: string; email: string; displayName: string; createdAt: string;
    application?: {
      bio: string; photoUrls: string[]; instagramVideoUrl: string; payoutAccount: string;
      bankName?: string; accountHolder?: string; accountNumber?: string;
      instagramId?: string; dmAlertThreshold?: number; dmNotice?: string;
      reviewStatus?: 'PENDING' | 'APPROVED' | 'ON_HOLD'; reviewNote?: string; reviewedAt?: string;
    };
  }>;
  onReview: (userId: string, status: 'PENDING' | 'APPROVED' | 'ON_HOLD', reviewNote: string) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, { status: 'PENDING' | 'APPROVED' | 'ON_HOLD'; note: string }>>({});
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  function draftFor(item: (typeof applications)[number]) {
    return drafts[item.id] || { status: item.application?.reviewStatus || 'PENDING', note: item.application?.reviewNote || '' };
  }
  async function save(item: (typeof applications)[number]) {
    const draft = draftFor(item);
    setSavingId(item.id);
    setError('');
    try { await onReview(item.id, draft.status, draft.note); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '상태를 저장하지 못했습니다.'); }
    finally { setSavingId(''); }
  }
  if (!applications.length) return <div className="empty-state">상세 프로필 신청서가 아직 없습니다.</div>;
  return <div className="creator-applications">
    {error && <p className="error-banner" role="alert">{error}</p>}
    {applications.map(item => {
      const app = item.application;
      const draft = draftFor(item);
      return <article className="creator-application" key={item.id}>
        <header><div><b>{item.displayName}</b><small>{item.email} · 신청 {new Date(item.createdAt).toLocaleDateString('ko-KR')}</small></div><span className={`application-status ${draft.status.toLowerCase()}`}>{draft.status === 'APPROVED' ? '승인됨' : draft.status === 'ON_HOLD' ? '보류' : '검토 대기'}</span></header>
        <p className="creator-application-bio">{app?.bio || '자기소개 없음'}</p>
        <div className="application-facts">
          <div className="application-bank"><small>정산 계좌</small>{app?.bankName ? <><span><b>은행명</b>{app.bankName}</span><span><b>예금주</b>{app.accountHolder || '미등록'}</span><span><b>계좌번호</b>{app.accountNumber || '미등록'}</span></> : <b>{app?.payoutAccount || '미등록'}</b>}</div>
          <div><small>Instagram</small><b>{app?.instagramId ? `@${app.instagramId.replace(/^@/, '')}` : '미등록'}</b>{app?.instagramVideoUrl && <a href={app.instagramVideoUrl} target="_blank" rel="noreferrer">동영상 열기</a>}</div>
          <div><small>DM 알림 기준</small><b>{(app?.dmAlertThreshold ?? 10000).toLocaleString()} 하트 이상</b></div>
          <div><small>팬 알림 문구</small><b>{app?.dmNotice || '별도 문구 없음'}</b></div>
        </div>
        <div className="application-gallery">{(app?.photoUrls || []).map((url, index) => <a href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`} aria-label={`프로필 사진 ${index + 1} 보기`}><img src={url} alt={`프로필 사진 ${index + 1}`} /></a>)}</div>
        <div className="application-review-controls">
          <label>검토 상태<select value={draft.status} onChange={event => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, status: event.target.value as typeof draft.status } }))}><option value="PENDING">검토 대기</option><option value="APPROVED">승인 및 공개</option><option value="ON_HOLD">보류 및 비공개</option></select></label>
          <label>관리자 메모<input value={draft.note} maxLength={500} onChange={event => setDrafts(prev => ({ ...prev, [item.id]: { ...draft, note: event.target.value } }))} placeholder="검토 메모 (관리자 전용)" /></label>
          <button type="button" className="solid-button" disabled={savingId === item.id} onClick={() => void save(item)}>{savingId === item.id ? '저장 중...' : '검토 저장'}</button>
        </div>
      </article>;
    })}
  </div>;
}

function CreatorSignupTable({
  creators
}: {
  creators: { id: string; displayName: string; handle: string; avatarUrl: string; platform: string; total: number; status: string }[];
}) {
  if (!creators.length) {
    return <div className="empty-state">아직 인플러언서 가입 내역이 없습니다.</div>;
  }
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>프로필</th>
            <th>이름</th>
            <th>아이디</th>
            <th>플랫폼</th>
            <th>누적 결제</th>
            <th>상태</th>
          </tr>
        </thead>
        <tbody>
          {creators.map(creator => (
            <tr key={creator.id}>
              <td>
                <img className="table-avatar" src={creator.avatarUrl} alt="" />
              </td>
              <td>{creator.displayName}</td>
              <td>{creator.handle}</td>
              <td>{creator.platform}</td>
              <td>{creator.total.toLocaleString()}원</td>
              <td>{creator.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

function PaymentResult({ orderId }: { orderId: string }) {
  const [result, setResult] = useState<{ status: string; amount: number; mode: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const stored = JSON.parse(localStorage.getItem(sessionKey) || 'null') as Session | null;
      if (!stored?.token) throw new Error('결제한 계정으로 로그인 후 다시 확인해 주세요.');
      const response = await fetch(`${API}/api/payments/status?orderId=${encodeURIComponent(orderId)}`, { headers: { Authorization: `Bearer ${stored.token}` } });
      if (!response.ok) throw new Error('주문 상태를 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.');
      setResult(await response.json());
    } catch (error) { setError(error instanceof Error ? error.message : '조회에 실패했습니다.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, [orderId]);
  return <section className="page-shell">
    <h1>{result?.status === 'PAID' ? '결제가 확인되었습니다' : result?.status === 'REFUNDED' ? '결제가 취소되었습니다' : '결제 상태 확인'}</h1>
    <p>주문번호: {orderId}</p>
    {result && <p>{result.amount.toLocaleString()}원 {result.mode === 'sandbox' ? '(테스트 결제)' : ''}</p>}
    {result?.status === 'PENDING_PAYMENT' && <p>아직 결제 완료가 확인되지 않았습니다. 재결제 전 주문 상태를 다시 확인해 주세요.</p>}
    {error && <p role="alert">{error}</p>}
    <button className="solid-button" disabled={loading} onClick={refresh}>{loading ? '확인 중' : '상태 새로고침'}</button>
    <a className="ghost-button" href="#fan-dashboard">팬 페이지에서 메시지 확인</a>
    <a className="ghost-button" href="#home">홈으로</a>
  </section>;
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
            EON Korea는 팬과 크리에이터의 안전한 소통을 위한 커뮤니티 서비스입니다. 이용자는 표시된
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
            결제 처리는 Littly 등 결제대행사를 통해 진행되며, 카드번호 등 민감 결제정보는 본 서비스가 직접 저장하지 않습니다.
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

