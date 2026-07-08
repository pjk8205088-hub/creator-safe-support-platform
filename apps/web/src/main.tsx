import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Gift, ShieldCheck, Bell, CreditCard, LayoutDashboard, UserRoundCheck } from 'lucide-react';
import './style.css';

type Creator = { id:string; slug:string; displayName:string; bio:string; addressMasked?:string; wishlist:{id:string;title:string;price:number;imageUrl:string}[] };
type Support = { id:string; creatorId:string; supporterName:string; message?:string; amount:number; status:string; createdAt:string };
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function App(){
 const [page,setPage]=useState(location.hash.replace('#','')||'home');
 const [creators,setCreators]=useState<Creator[]>([]); const [supports,setSupports]=useState<Support[]>([]); const [selected,setSelected]=useState<Creator|null>(null);
 const [form,setForm]=useState({supporterName:'익명팬',message:'응원합니다!',amount:15000,paymentProvider:'MOCK'});
 useEffect(()=>{ const h=()=>setPage(location.hash.replace('#','')||'home'); addEventListener('hashchange',h); return()=>removeEventListener('hashchange',h)},[]);
 const load=async()=>{ const cs=await fetch(`${API}/api/creators`).then(r=>r.json()).catch(()=>[]); setCreators(cs); const ss=await fetch(`${API}/api/supports`).then(r=>r.json()).catch(()=>[]); setSupports(ss); };
 useEffect(()=>{load()},[]);
 useEffect(()=>{ if(page.startsWith('creator/')){ fetch(`${API}/api/creators/${page.split('/')[1]}`).then(r=>r.json()).then(setSelected).catch(()=>null)}},[page]);
 const revenue=useMemo(()=>supports.reduce((s,x)=>s+x.amount,0),[supports]);
 async function submitSupport(itemId?:string){ if(!selected) return; const body={...form, creatorId:selected.id, wishlistItemId:itemId, amount:Number(form.amount)}; const res=await fetch(`${API}/api/supports`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); if(res.ok){ await load(); location.hash='success'; }}
 return <main><Nav/><section className="container">{page==='home'&&<Home creators={creators}/>} {page.startsWith('creator/')&&selected&&<CreatorPage c={selected} form={form} setForm={setForm} submitSupport={submitSupport}/>} {page==='success'&&<Success/>} {page==='dashboard'&&<Dashboard supports={supports} revenue={revenue}/>} {page==='admin'&&<Admin supports={supports} creators={creators}/>}</section><Footer/></main>
}
function Nav(){return <nav className="nav"><a className="brand" href="#home"><ShieldCheck/> 안심서포트</a><div><a href="#home">홈</a><a href="#dashboard">대시보드</a><a href="#admin">관리자</a></div></nav>}
function Home({creators}:{creators:Creator[]}){return <><div className="hero"><div><span className="badge">K-Creator Safe Gift Platform</span><h1>주소 공개 없이 팬에게 안전하게 선물받는 플랫폼</h1><p>Throne의 장점을 한국형 결제·카카오 알림톡·정산·주소보호에 맞춰 구현한 MVP입니다.</p><a className="primary" href="#creator/hana">선물하기 체험</a></div><div className="glass"><h3>실시간 후원 흐름</h3><p><Gift/> 위시리스트 선택</p><p><CreditCard/> 토스/카카오페이 결제 준비</p><p><Bell/> 카카오 알림톡 이벤트</p></div></div><div className="grid three"><Card icon={<ShieldCheck/>} title="주소보호" text="크리에이터 실제 주소는 저장 분리 및 마스킹 처리"/><Card icon={<UserRoundCheck/>} title="역할 기반" text="팬, 크리에이터, 관리자 권한 분리"/><Card icon={<LayoutDashboard/>} title="운영 대시보드" text="주문, 신고, 정산 흐름 관리"/></div><h2>크리에이터</h2><div className="grid">{creators.map(c=><a className="creator" href={`#creator/${c.slug}`} key={c.id}><b>{c.displayName}</b><p>{c.bio}</p><span>{c.wishlist.length}개 위시리스트</span></a>)}</div></>}
function Card(p:{icon:React.ReactNode;title:string;text:string}){return <div className="card">{p.icon}<h3>{p.title}</h3><p>{p.text}</p></div>}
function CreatorPage({c,form,setForm,submitSupport}:any){return <><div className="profile"><h1>{c.displayName}</h1><p>{c.bio}</p><small>배송지: {c.addressMasked}</small></div><div className="grid">{c.wishlist.map((w:any)=><article className="wish" key={w.id}><img src={w.imageUrl}/><h3>{w.title}</h3><p>{w.price.toLocaleString()}원</p><button onClick={()=>{setForm({...form,amount:w.price}); submitSupport(w.id)}}>이 선물 후원</button></article>)}</div><div className="panel"><h2>직접 후원</h2><input value={form.supporterName} onChange={e=>setForm({...form,supporterName:e.target.value})}/><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:Number(e.target.value)})}/><button className="primary" onClick={()=>submitSupport()}>결제 완료 처리</button></div></>}
function Success(){return <div className="center"><h1>후원이 완료되었습니다</h1><p>크리에이터에게 실시간 알림 이벤트가 생성되었습니다.</p><a className="primary" href="#dashboard">대시보드 확인</a></div>}
function Dashboard({supports,revenue}:any){return <><h1>크리에이터 대시보드</h1><div className="stats"><b>총 후원 {supports.length}건</b><b>총액 {revenue.toLocaleString()}원</b><b>정산대기 {supports.filter((s:any)=>s.status==='PAID').length}건</b></div><Table supports={supports}/></>}
function Admin({supports,creators}:any){return <><h1>관리자 대시보드</h1><div className="stats"><b>크리에이터 {creators.length}명</b><b>주문 {supports.length}건</b><b>신고 0건</b></div><Table supports={supports}/></>}
function Table({supports}:any){return <table><thead><tr><th>후원자</th><th>금액</th><th>상태</th><th>메시지</th></tr></thead><tbody>{supports.map((s:any)=><tr key={s.id}><td>{s.supporterName}</td><td>{s.amount.toLocaleString()}원</td><td>{s.status}</td><td>{s.message}</td></tr>)}</tbody></table>}
function Footer(){return <footer>Creator Safe Support Platform · MVP</footer>}
createRoot(document.getElementById('root')!).render(<App/>);
