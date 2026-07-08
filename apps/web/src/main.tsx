import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  Bell,
  Check,
  CreditCard,
  Gift,
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
  wishlist: {
    id: string;
    title: string;
    price: number;
    categoryId: string;
    imageUrl: string;
    note: string;
  }[];
};

type Support = {
  id: string;
  creatorId: string;
  supporterName: string;
  message?: string;
  amount: number;
  status: string;
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

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const sessionKey = 'cssp-session';

function App() {
  const [page, setPage] = useState(location.hash.replace('#', '') || 'home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
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
  const [supportForm, setSupportForm] = useState({
    supporterName: '응원하는 팬',
    message: '늘 좋은 콘텐츠 고마워요!',
    amount: 15000,
    paymentProvider: 'MOCK'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const onHashChange = () => setPage(location.hash.replace('#', '') || 'home');
    addEventListener('hashchange', onHashChange);
    return () => removeEventListener('hashchange', onHashChange);
  }, []);

  const load = async () => {
    const [categoryData, creatorData, supportData] = await Promise.all([
      fetch(`${API}/api/categories`).then(res => res.json()).catch(() => []),
      fetch(`${API}/api/creators`).then(res => res.json()).catch(() => []),
      fetch(`${API}/api/supports`).then(res => res.json()).catch(() => [])
    ]);
    setCategories(categoryData);
    setCreators(creatorData);
    setSupports(supportData);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!page.startsWith('creator/')) {
      setSelected(null);
      return;
    }
    const slug = page.split('/')[1];
    fetch(`${API}/api/creators/${slug}`)
      .then(res => res.json())
      .then(setSelected)
      .catch(() => setSelected(null));
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

  async function submitSupport(itemId?: string) {
    if (!selected) return;
    const body = {
      ...supportForm,
      creatorId: selected.id,
      wishlistItemId: itemId,
      amount: Number(supportForm.amount)
    };
    const res = await fetch(`${API}/api/supports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      await load();
      location.hash = 'success';
    }
  }

  async function logout() {
    if (session?.token) {
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
        <CreatorPage
          creator={selected}
          form={supportForm}
          setForm={setSupportForm}
          submitSupport={submitSupport}
        />
      )}
      {page === 'login' && <AuthPage mode="login" session={session} setSession={setSession} />}
      {page === 'signup' && <AuthPage mode="signup" session={session} setSession={setSession} />}
      {page === 'success' && <Success />}
      {page === 'dashboard' && <Dashboard supports={supports} revenue={revenue} session={session} />}
      {page === 'admin' && <Admin supports={supports} creators={creators} categories={categories} />}
      <Footer />
    </main>
  );
}

function Nav({ session, onLogout }: { session: Session | null; onLogout: () => void }) {
  return (
    <nav className="nav">
      <a className="brand" href="#home">
        <ShieldCheck size={22} />
        SafeWish
      </a>
      <div className="nav-links">
        <a href="#categories">카테고리</a>
        <a href="#dashboard">대시보드</a>
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
  session
}: {
  categories: Category[];
  creators: Creator[];
  query: string;
  setQuery: (value: string) => void;
  session: Session | null;
}) {
  return (
    <>
      <section className="hero">
        <div className="hero-overlay">
          <span className="eyebrow">
            <Sparkles size={16} />
            Privacy-first creator gifting
          </span>
          <h1>팬은 쉽게 선물하고, 크리에이터는 주소를 지킵니다.</h1>
          <p>위시리스트, 카테고리 탐색, 안전 결제 흐름을 한 화면에서 시작하세요.</p>
          <div className="hero-actions">
            <SearchBox value={query} onChange={setQuery} />
            <a className="solid-button large" href={session ? '#dashboard' : '#signup'}>
              {session ? '내 대시보드' : '무료로 시작'}
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>
      <section className="content-band">
        <div className="section-head">
          <div>
            <span className="kicker">Featured Categories</span>
            <h2>인기 카테고리</h2>
          </div>
          <a className="text-link" href="#categories">
            전체 보기 <ArrowRight size={16} />
          </a>
        </div>
        <CategoryGrid categories={categories.filter(category => category.featured).slice(0, 3)} />
      </section>
      <section className="content-band muted">
        <div className="section-head">
          <div>
            <span className="kicker">Discover Creators</span>
            <h2>크리에이터 위시리스트</h2>
          </div>
        </div>
        <CreatorGrid creators={creators.slice(0, 6)} />
      </section>
      <section className="content-band">
        <div className="steps">
          <Step icon={<Grid3X3 />} title="위시리스트 구성" text="카테고리별 아이템을 모아 공개 페이지로 공유합니다." />
          <Step icon={<CreditCard />} title="안전 결제" text="팬은 선택한 선물이나 금액을 mock 결제 흐름으로 후원합니다." />
          <Step icon={<Bell />} title="도착 알림" text="후원 내역과 알림이 대시보드에 바로 쌓입니다." />
        </div>
      </section>
    </>
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
          <h1>{active ? active.name : '카테고리 탐색'}</h1>
          <p>{active ? active.description : '콘텐츠 유형에 맞는 크리에이터와 위시리스트를 찾아보세요.'}</p>
        </div>
        <SearchBox value={query} onChange={setQuery} compact />
      </div>
      <CategoryGrid categories={categories} activeCategory={activeCategory} />
      <div className="section-head compact-head">
        <h2>{active ? `${active.name} 크리에이터` : '전체 크리에이터'}</h2>
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
        placeholder="크리에이터, 플랫폼, 키워드 검색"
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
            {category.creatorCount} creators · {category.wishlistCount} wishes
          </small>
        </a>
      ))}
    </div>
  );
}

function CreatorGrid({ creators }: { creators: Creator[] }) {
  if (!creators.length) {
    return <div className="empty-state">검색 조건에 맞는 크리에이터가 아직 없습니다.</div>;
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
            <span>{creator.wishlist.length} wishes</span>
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
  submitSupport
}: {
  creator: Creator;
  form: { supporterName: string; message: string; amount: number; paymentProvider: string };
  setForm: (value: { supporterName: string; message: string; amount: number; paymentProvider: string }) => void;
  submitSupport: (itemId?: string) => void;
}) {
  return (
    <section className="page-shell">
      <div className="profile-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(12,18,32,.78), rgba(12,18,32,.16)), url(${creator.coverUrl})` }}>
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
            <h2>위시리스트</h2>
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
                  <b>{item.price.toLocaleString()}원</b>
                  <button className="solid-button" onClick={() => submitSupport(item.id)}>
                    <Gift size={17} />
                    선물
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <form
          className="support-panel"
          onSubmit={event => {
            event.preventDefault();
            submitSupport();
          }}
        >
          <h2>직접 후원</h2>
          <label>
            이름
            <input value={form.supporterName} onChange={event => setForm({ ...form, supporterName: event.target.value })} />
          </label>
          <label>
            메시지
            <textarea value={form.message} onChange={event => setForm({ ...form, message: event.target.value })} />
          </label>
          <label>
            금액
            <input
              type="number"
              min={1000}
              step={1000}
              value={form.amount}
              onChange={event => setForm({ ...form, amount: Number(event.target.value) })}
            />
          </label>
          <button className="solid-button large" type="submit">
            <WalletCards size={18} />
            결제 완료 처리
          </button>
        </form>
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
    const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload = mode === 'login' ? { email, password } : { name, email, password, role };
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => null);
    setBusy(false);
    if (!res) {
      setError('서버에 연결할 수 없습니다.');
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.code === 'EMAIL_ALREADY_EXISTS' ? '이미 가입된 이메일입니다.' : '입력 정보를 확인해주세요.');
      return;
    }
    const data = (await res.json()) as Session;
    setSession(data);
    location.hash = 'dashboard';
  }

  async function socialDemo(provider: string) {
    const demoEmail = `${provider.toLowerCase()}@safewish.local`;
    setBusy(true);
    setError('');
    const login = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: 'password123' })
    }).catch(() => null);
    if (login?.ok) {
      const data = (await login.json()) as Session;
      setSession(data);
      location.hash = 'dashboard';
      return;
    }
    const signup = await fetch(`${API}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `${provider} 데모`, email: demoEmail, password: 'password123', role: 'CREATOR' })
    }).catch(() => null);
    setBusy(false);
    if (!signup?.ok) {
      setError('소셜 데모 계정을 만들 수 없습니다.');
      return;
    }
    const data = (await signup.json()) as Session;
    setSession(data);
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
          {['Google', 'Apple', 'Twitch'].map(provider => (
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
              <input value={name} onChange={event => setName(event.target.value)} placeholder="크리에이터 이름" required />
            </label>
            <div className="segment">
              <button type="button" className={role === 'CREATOR' ? 'active' : ''} onClick={() => setRole('CREATOR')}>
                크리에이터
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
          <h1>{session ? `${session.user.name}님의 대시보드` : '크리에이터 대시보드'}</h1>
          <p>후원, 결제, 알림 흐름을 한 번에 확인합니다.</p>
        </div>
        {!session && (
          <a className="solid-button" href="#login">
            <LogIn size={17} />
            로그인
          </a>
        )}
      </div>
      <div className="stats">
        <Stat icon={<Gift />} label="총 후원" value={`${supports.length}건`} />
        <Stat icon={<CreditCard />} label="총액" value={`${revenue.toLocaleString()}원`} />
        <Stat icon={<Bell />} label="정산 대기" value={`${supports.filter(item => item.status === 'PAID').length}건`} />
      </div>
      <SupportTable supports={supports} />
    </section>
  );
}

function Admin({
  supports,
  creators,
  categories
}: {
  supports: Support[];
  creators: Creator[];
  categories: Category[];
}) {
  return (
    <section className="page-shell">
      <div className="section-head">
        <div>
          <span className="kicker">Admin</span>
          <h1>운영 관리</h1>
          <p>카테고리, 크리에이터, 후원 상태를 점검합니다.</p>
        </div>
      </div>
      <div className="stats">
        <Stat icon={<Grid3X3 />} label="카테고리" value={`${categories.length}개`} />
        <Stat icon={<HeartHandshake />} label="크리에이터" value={`${creators.length}명`} />
        <Stat icon={<Gift />} label="주문" value={`${supports.length}건`} />
      </div>
      <SupportTable supports={supports} />
    </section>
  );
}

function SupportTable({ supports }: { supports: Support[] }) {
  if (!supports.length) {
    return <div className="empty-state">아직 후원 내역이 없습니다.</div>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>후원자</th>
          <th>금액</th>
          <th>상태</th>
          <th>메시지</th>
        </tr>
      </thead>
      <tbody>
        {supports.map(support => (
          <tr key={support.id}>
            <td>{support.supporterName}</td>
            <td>{support.amount.toLocaleString()}원</td>
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
      <h1>후원이 완료되었습니다.</h1>
      <p>크리에이터에게 알림이 생성되었고 대시보드에서 내역을 확인할 수 있습니다.</p>
      <a className="solid-button large" href="#dashboard">
        <LayoutDashboard size={18} />
        대시보드 확인
      </a>
    </section>
  );
}

function Footer() {
  return <footer>SafeWish · Creator Safe Support Platform MVP</footer>;
}

createRoot(document.getElementById('root')!).render(<App />);
