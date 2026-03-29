import { createClient } from "@supabase/supabase-js";
import { useState, useEffect, useRef, useCallback } from "react";

// ── DOMPurify (sanitização XSS) ───────────────────────
let purifyInstance = null;
const stripHtml = (html) => String(html || '').replace(/<[^>]*>/g, '');
const getPurify = () => {
  if (purifyInstance) return Promise.resolve(purifyInstance);
  if (window.DOMPurify) { purifyInstance = window.DOMPurify; return Promise.resolve(purifyInstance); }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js';
    s.onload = () => { purifyInstance = window.DOMPurify; resolve(purifyInstance); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
};
const clean = (html) => {
  if (!html) return '';
  if (purifyInstance) return purifyInstance.sanitize(html);
  if (window.DOMPurify) return window.DOMPurify.sanitize(html);
  return stripHtml(html);
  return html; // fallback antes do load (seguro pois DOMPurify carrega rápido)
};
// Pré-carrega DOMPurify assim que o app inicia
getPurify().catch(() => null);

// ── Supabase Config & Dynamic Loader ──────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL || "https://jwpsptwqcjhmnicuhgyw.supabase.co";
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cHNwdHdxY2pobW5pY3VoZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTI5NDUsImV4cCI6MjA5MDE4ODk0NX0.RjWrKGjziNAKDZH-OjE-SlIwihhmzUW_42n01V0atE4";

// Carregamento dinâmico via injeção de script para Supabase e html2pdf
let supabaseInstance = null;
const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON);
  return supabaseInstance;
};

const loadHtml2Pdf = () => {
  if (window.html2pdf) return Promise.resolve(window.html2pdf);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => resolve(window.html2pdf);
    document.head.appendChild(script);
  });
};

// ── Hook de Roteamento Nativo ──────────────────────────
const useRoute = () => {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = useCallback((newPath) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo(0, 0); // Sobe para o topo ao trocar de página
  }, []);
  return [path, navigate];
};

const useIsMobile = (bp = 640) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return m;
};

const RESPONSIVE_CSS = `
  .rp-hero { padding: 52px 24px 44px !important; }
  .rp-hero h1 { font-size: 30px !important; }
  .rp-grid-proto { grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)) !important; }
  .rp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .rp-grid-home { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .rp-nav { display: flex; gap: 4px; }
  .rp-hero-product { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
  .rp-pad { padding: 36px 24px !important; }
  .rp-pad-inner { padding: 28px !important; }
  .rp-tooltip { width: 320px !important; }
  .print-only { display: none; }
  .avoid-break { page-break-inside: avoid; break-inside: avoid; }
  
  @media (max-width: 640px) {
    .rp-hero { padding: 32px 16px 28px !important; }
    .rp-hero h1 { font-size: 22px !important; }
    .rp-grid-proto { grid-template-columns: 1fr !important; }
    .rp-grid-2 { grid-template-columns: 1fr !important; }
    .rp-grid-home { grid-template-columns: 1fr !important; }
    .rp-nav { display: none; }
    .rp-nav-open { display: flex; flex-direction: column; position: fixed; top: 58px; right: 0; background: #2C1F40; padding: 12px; gap: 6px; z-index: 300; border-radius: 0 0 0 12px; }
    .rp-hero-product { flex-direction: column !important; gap: 16px !important; }
    .rp-pad { padding: 16px !important; }
    .rp-pad-inner { padding: 16px !important; }
    .rp-tooltip { width: calc(100vw - 32px) !important; max-width: 340px !important; }
    .rp-card-pad { padding: 16px !important; }
    .rp-step-gap { padding-bottom: 14px !important; }
    .rp-bkbar { padding: 8px 14px !important; }
    .rp-bkbar button { font-size: 13px !important; }
    .rp-cost-summary { padding: 16px 18px !important; }
    .rp-cost-total { flex-direction: column !important; gap: 4px !important; text-align: center !important; }
    .rp-cost-total div:last-child { font-size: 22px !important; }
    .rp-admin-tabs { flex-wrap: wrap !important; }
    .rp-admin-tab { font-size: 12px !important; padding: 7px 10px !important; }
    .rp-section-inner { padding: 16px 14px !important; }
    .rp-proto-meta { flex-direction: column !important; gap: 6px !important; align-items: flex-start !important; }
  }
  @media print {
    .no-print { display: none !important; }
    .print-only { display: block !important; }
    body { background: white !important; }
    a { text-decoration: none !important; color: inherit !important; }
    .rp-bkbar { display: none !important; }
    .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block; }
  }
`;

const B = {
  purple: '#5E3D8F', purpleDark: '#2C1F40', purpleLight: '#EDE5F5', purpleMid: '#8B6AB0',
  gold: '#C8A96E', goldLight: '#FBF5E8', cream: '#F7F4F0', white: '#FFFFFF',
  text: '#1A1A2E', muted: '#6B7280', border: '#E2D9F3', green: '#1E7E46',
  greenLight: '#E8F5E9', red: '#C0392B', redLight: '#FDECEA', blue: '#1A56DB', blueLight: '#EBF5FF',
};

const INIT_BRAND = {
  companyName: 'Extratos da Terra',
  logoUrl: '',
  colorMain: '#5E3D8F',
  colorAccent: '#C8A96E',
  showCalculator: false
};

const INIT_INDICATIONS = [
  {id:'clareamento',label:'Clareamento'},{id:'acne',label:'Acne'},
  {id:'antienvelhecimento',label:'Antienvelhecimento'},{id:'hidratacao',label:'Hidratação'},
  {id:'lifting',label:'Lifting'},{id:'relaxamento',label:'Relaxamento'},
  {id:'rejuvenescimento',label:'Rejuvenescimento'},{id:'oleosidade',label:'Oleosidade'},
  {id:'estrias',label:'Estrias'},{id:'celulite',label:'Celulite'},
];

const INIT_CATEGORIES = [
  {id:'facial',label:'Facial'},{id:'corporal',label:'Corporal'},{id:'capilar',label:'Capilar'}
];

const INIT_PHASES = [
  {id:'higienizacao', label:'Higienização'}, {id:'esfoliacao', label:'Esfoliação Química'},
  {id:'eletroterapia', label:'Eletroterapia'}, {id:'clareamento', label:'Clareamento'},
  {id:'mascara', label:'Máscara'}, {id:'regeneracao', label:'Regeneração'},
  {id:'protecao', label:'Proteção'}
];

// ── RBAC ──────────────────────────────────────────────
const PERM_KEYS = {
  dashboard:   ['view'],
  products:    ['view','edit','delete'],
  protocols:   ['view','edit','delete','publish'],
  categories:  ['view','edit','delete'],
  indications: ['view','edit','delete'],
  phases:      ['view','edit','delete'],
  alerts:      ['view'],
  settings:    ['view','edit'],
  marketing:   ['view','edit'],
  users:       ['view','edit','delete'],
};

const FULL_PERMS = Object.fromEntries(
  Object.entries(PERM_KEYS).map(([k,actions]) => [k, Object.fromEntries(actions.map(a=>[a,true]))])
);
const EMPTY_PERMS = Object.fromEntries(
  Object.entries(PERM_KEYS).map(([k,actions]) => [k, Object.fromEntries(actions.map(a=>[a,false]))])
);

const hasPerm = (user, section, action) => !!user?.perms?.[section]?.[action];
const USERS_KEY = 'edt_users_v10';
const BRAND_KEY = 'edt_brand_v10';
const PRODUCTS_KEY = 'edt_products_v10';
const PROTOCOLS_KEY = 'edt_protocols_v10';
const INDICATIONS_KEY = 'edt_indications_v10';
const CATEGORIES_KEY = 'edt_categories_v10';
const PHASES_KEY = 'edt_phases_v10';
const MARKETING_KEY = 'edt_marketing_v10';
const VIEWS_KEY = 'edt_views_v10';
const ADMIN_SESSION_KEY = 'edt_admin_session_v1';
const ADMIN_LOGIN_GUARD_KEY = 'edt_admin_login_guard_v1';
const ADMIN_LOGIN_MAX_ATTEMPTS = 5;
const ADMIN_LOGIN_LOCK_MS = 5 * 60 * 1000;

const INIT_USERS = [
  { id:'u_admin', name:'Admin', passwordHash:'c34e5438ee9a41a666e0a07824cdb5c955f100aead223eb951eaefebb34e0921', perms: FULL_PERMS }
];

const INIT_MARKETING = {
  banners: [],          // [{id, imageUrl, link, label, active}]
  notice: { active: false, text: '', bgColor: '#5E3D8F', textColor: '#ffffff' },
  campaign: { active: false, protocolId: '', title: '', subtitle: '' },
};

const EMPTY_PRODUCT = {
  id:'', name:'', categories:['facial'], uso:['profissional'], active:true, image:'', mainFunction:'', benefits:'', description:'',
  actives:'', differentials:'', howToUse:'', indications:'', contra:'', size:'',
  yieldApplications:'', yieldGramsPerUse:'', cost:'', anvisa:'', faq:'', composition:'',
  homeUseNote:'', siteUrl:'', metaDescription:'', keywords:'', badge:'',
};

const INIT_PRODUCTS = [{"name":"Advanced Detox Creme de Massagem 700g - Profissional","uso":["profissional"],"categories":["corporal"],"mainFunction":"Ação detox, eliminando toxinas e líquidos em excesso.","description":"Creme de massagem corporal com ação detox e anticelulítica.","active":true,"cost":"190.50","yieldApplications":"70","id":"p_001"}];

const INIT_PROTOCOLS = [{
  id:'prot1', name:'Peeling de Diamante – Clareamento e Uniformização',
  description:'Protocolo facial completo associado ao peeling de diamante para auxiliar no clareamento e uniformização da pele, ideal para manchas e tom irregular.',
  concerns:['clareamento'], category:'facial', frequency:'1 sessão a cada 15 dias',
  associations:'Peeling de diamante', published:true, youtubeUrl:'',
  steps:[],
  homeUse:{morning:[],night:[]},
}];

// ── Supabase Storage ──────────────────────────────────
const load = async (key, fallback) => {
  try {
    const supabaseClient = await getSupabase();
    const { data, error } = await supabaseClient.from('app_data').select('value').eq('key', key).single();
    if (!error && data) return data.value;
  } catch (e) { console.warn('Supabase load error:', e); }
  return fallback;
};

const save = async (key, val) => {
  try {
    const supabaseClient = await getSupabase();
    await supabaseClient.from('app_data').upsert({ key, value: val }, { onConflict: 'key' });
  } catch (e) { console.warn('Supabase save error:', e); }
};

const uploadImageSafe = async (file) => {
  const ALLOWED = ['image/jpeg','image/png','image/webp','image/gif'];
  const MAX_MB = 5;
  if (!ALLOWED.includes(file.type)) { alert('Apenas imagens JPEG, PNG, WebP ou GIF são permitidas.'); return null; }
  if (file.size > MAX_MB * 1024 * 1024) { alert(`Imagem muito grande. Máximo ${MAX_MB}MB.`); return null; }
  return new Promise(async (resolve) => {
    try {
      const supabaseClient = await getSupabase();
      const fileExt = file.name.split('.').pop();
      const fileName = `${uid()}.${fileExt}`;
      const { data, error } = await supabaseClient.storage.from('images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabaseClient.storage.from('images').getPublicUrl(fileName);
      resolve(publicUrl);
    } catch (e) {
      console.warn('Storage indisponível ou sem permissão. Usando fallback Base64.', e);
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target.result);
      reader.readAsDataURL(file);
    }
  });
};

const uid = () => Math.random().toString(36).slice(2, 9);

const hashSecret = async (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (window.crypto?.subtle) {
    const bytes = new TextEncoder().encode(normalized);
    const buffer = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return normalized;
};

const normalizeStoredUser = async (user) => {
  const safeUser = { ...user };
  if (!safeUser.passwordHash && safeUser.password) {
    safeUser.passwordHash = await hashSecret(safeUser.password);
  }
  delete safeUser.password;
  return safeUser;
};

const secureUsersForStorage = async (users) => Promise.all((users || []).map(normalizeStoredUser));

const verifyPassword = async (user, password) => {
  if (!password) return false;
  if (user?.passwordHash) return user.passwordHash === await hashSecret(password);
  if (user?.password) return user.password === password;
  return false;
};

const isStrongPassword = (password) => {
  const value = String(password || '');
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);
};

const readJsonStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJsonStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const getLoginGuardState = () => readJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: 0, lockedUntil: 0 });
const clearLoginGuardState = () => writeJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: 0, lockedUntil: 0 });
const registerLoginFailure = () => {
  const state = getLoginGuardState();
  const nextAttempts = (state.attempts || 0) + 1;
  const lockedUntil = nextAttempts >= ADMIN_LOGIN_MAX_ATTEMPTS ? Date.now() + ADMIN_LOGIN_LOCK_MS : 0;
  writeJsonStorage(ADMIN_LOGIN_GUARD_KEY, { attempts: lockedUntil ? 0 : nextAttempts, lockedUntil });
  return { attempts: nextAttempts, lockedUntil };
};

const getStoredAdminSessionId = () => {
  try {
    return window.sessionStorage.getItem(ADMIN_SESSION_KEY) || '';
  } catch {
    return '';
  }
};

const setStoredAdminSessionId = (userId) => {
  try {
    if (userId) window.sessionStorage.setItem(ADMIN_SESSION_KEY, userId);
    else window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
};

const costPerApp = p => {
  const c = parseFloat(p?.cost), y = parseFloat(p?.yieldApplications);
  if (!c || !y || y === 0) return null;
  return c / y;
};

const fmtCurrency = v => v != null ? `R$ ${v.toFixed(2).replace('.', ',')}` : '—';
const sortByName = arr => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', {sensitivity:'base'}));
const isActive = p => p?.active !== false; 
const getAffectedProtocols = (product, protocols) =>
  protocols.filter(prot =>
    prot.steps.some(s => s.productId === product.id) ||
    prot.homeUse?.morning?.some(h => h.productId === product.id) ||
    prot.homeUse?.night?.some(h => h.productId === product.id)
  );

// ── Atoms ─────────────────────────────────────────────
// ── Notice Banner ─────────────────────────────────────
const NoticeBanner = ({ notice }) => {
  const [closed, setClosed] = useState(false);
  if (!notice?.active || !notice?.text || closed) return null;
  return (
    <div style={{background: notice.bgColor||B.purple, color: notice.textColor||'#fff', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontSize:13, fontWeight:600, position:'relative', zIndex:100}}>
      <span dangerouslySetInnerHTML={{__html: clean(notice.text)}} />
      <button onClick={()=>setClosed(true)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:18,lineHeight:1,padding:0,opacity:0.7,position:'absolute',right:16}}>×</button>
    </div>
  );
};

// ── Hero Banner Carousel ───────────────────────────────
const HeroBanner = ({ banners, navigate }) => {
  const active = (banners||[]).filter(b=>b.active && b.imageUrl);
  const [idx, setIdx] = useState(0);
  useEffect(()=>{
    if(active.length<=1) return;
    const t = setInterval(()=>setIdx(i=>(i+1)%active.length), 5000);
    return ()=>clearInterval(t);
  },[active.length]);
  if(!active.length) return null;
  const cur = active[idx];
  const go = (link) => {
    if(!link) return;
    if(link.startsWith('http')) window.open(link,'_blank');
    else navigate(link);
  };
  return (
    <div style={{position:'relative', width:'100%', overflow:'hidden', cursor: cur.link?'pointer':'default', background:'#1a1a2e'}} onClick={()=>go(cur.link)}>
      <img src={cur.imageUrl} alt={cur.label||'Banner'} style={{width:'100%', maxHeight:420, objectFit:'cover', display:'block'}} loading="lazy" />
      {active.length>1&&(
        <div style={{position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6}}>
          {active.map((_,i)=>(
            <button key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:i===idx?24:8,height:8,borderRadius:4,background:i===idx?'#fff':'rgba(255,255,255,0.5)',border:'none',cursor:'pointer',padding:0,transition:'width 0.3s'}} />
          ))}
        </div>
      )}
      {active.length>1&&<>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+active.length)%active.length);}} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:'none',borderRadius:'50%',width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%active.length);}} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:'none',borderRadius:'50%',width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
      </>}
    </div>
  );
};

// ── Campaign Section ───────────────────────────────────
const CampaignSection = ({ campaign, protocols, navigate }) => {
  if(!campaign?.active || !campaign?.protocolId) return null;
  const prot = protocols.find(p=>p.id===campaign.protocolId);
  if(!prot) return null;
  return (
    <div style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, #3d2060 100%)`, padding:'32px 24px', marginBottom:0}}>
      <div style={{maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:16}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span style={{background:B.gold, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.08em'}}>⭐ Destaque do Mês</span>
        </div>
        <div style={{color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600}}>{campaign.title||'Protocolo em Destaque'}</div>
        <div style={{color:'#fff', fontSize:22, fontWeight:700, fontFamily:'Georgia,serif', lineHeight:1.3}}>{prot.name}</div>
        {campaign.subtitle&&<div style={{color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.6}}>{campaign.subtitle}</div>}
        <button onClick={()=>navigate(`/protocolo/${prot.id}`)} style={{alignSelf:'flex-start', background:B.gold, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit'}}>Ver protocolo completo →</button>
      </div>
    </div>
  );
};

const Logo = ({ brand, size = 34 }) => {
  if (brand?.logoUrl) {
    return <img src={brand.logoUrl} alt={brand.companyName || 'Logo'} style={{ height: size, objectFit: 'contain', flexShrink: 0 }} />;
  }
  return <div style={{width:size,height:size,background:`linear-gradient(135deg, ${B.gold}, #e8b96a)`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size/2,flexShrink:0,color:B.white}}>🌿</div>;
};

const AppFooter = ({ brand }) => (
  <footer className="no-print" style={{ background: B.purpleDark, padding: '30px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <Logo brand={brand} size={40} />
    </div>
    <div style={{ fontWeight: 700, color: B.white, marginBottom: 8, fontSize: 16 }}>{brand?.companyName || 'Extratos da Terra'}</div>
    <p style={{margin: '0 0 8px 0', fontSize: 13}}>Protocolos Profissionais e Cuidados com a Pele</p>
    <a href="https://www.extratosdaterrapro.com.br" target="_blank" rel="noreferrer" style={{ color: B.gold, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>www.extratosdaterrapro.com.br</a>
  </footer>
);

const Tag = ({ label, color = B.purpleLight, text = B.purple, size = 'sm' }) => (
  <span style={{ background:color, color:text, padding:size==='sm'?'2px 10px':'4px 14px', borderRadius:20, fontSize:size==='sm'?11:13, fontWeight:700, letterSpacing:'0.03em', whiteSpace:'nowrap' }}>{label}</span>
);

const Btn = ({ children, onClick, variant='primary', size='md', disabled=false, sx={} }) => {
  const v = { primary:{background:B.purple,color:B.white,border:'none'}, secondary:{background:'transparent',color:B.purple,border:`1.5px solid ${B.purple}`}, ghost:{background:'transparent',color:B.muted,border:`1.5px solid ${B.border}`}, danger:{background:B.red,color:B.white,border:'none'}, green:{background:B.green,color:B.white,border:'none'} };
  const s = { sm:'5px 12px', md:'9px 20px', lg:'12px 28px' };
  return <button onClick={onClick} disabled={disabled} style={{...v[variant], padding:s[size], borderRadius:8, fontWeight:700, fontSize:size==='sm'?12:14, cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1, fontFamily:'inherit', ...sx}}>{children}</button>;
};

const BuyLink = ({ href, children, isMobile, sx = {} }) => {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="no-print" style={{
      background: B.purpleDark, color: B.white, padding: isMobile ? '8px 14px' : '9px 22px',
      borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 12 : 14,
      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...sx
    }}>
      🛒 {children || 'Comprar'}
    </a>
  );
};

// Componente RichText
const RichTextField = ({ label, value, onChange, placeholder, rows=3, note }) => {
  const ref = useRef(null);

  const applyTag = (tagOpen, tagClose) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);
    const inserted = `${tagOpen}${sel || 'texto'}${tagClose}`;
    onChange(before + inserted + after);
    setTimeout(() => {
      ta.focus();
      const newPos = start + tagOpen.length + (sel ? sel.length : 5);
      ta.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>}
      <div style={{border:`1.5px solid ${B.border}`, borderRadius:8, background:B.white, overflow:'hidden'}}>
        <div style={{display:'flex', gap:4, padding:'6px 10px', background:B.cream, borderBottom:`1.5px solid ${B.border}`}}>
          <button type="button" onClick={()=>applyTag('<b>','</b>')} style={{fontWeight:'bold', padding:'2px 8px', border:'none', background:'transparent', cursor:'pointer', color:B.purpleDark}}>N</button>
          <button type="button" onClick={()=>applyTag('<i>','</i>')} style={{fontStyle:'italic', padding:'2px 8px', border:'none', background:'transparent', cursor:'pointer', color:B.purpleDark}}>I</button>
          <button type="button" onClick={()=>applyTag('<u>','</u>')} style={{textDecoration:'underline', padding:'2px 8px', border:'none', background:'transparent', cursor:'pointer', color:B.purpleDark}}>S</button>
          <div style={{width:1, background:B.border, margin:'0 4px'}} />
          <button type="button" onClick={()=>applyTag('<ul>\n<li>','</li>\n</ul>')} style={{padding:'2px 8px', border:'none', background:'transparent', cursor:'pointer', color:B.purpleDark}}>• Lista</button>
        </div>
        <textarea 
          ref={ref}
          value={value} 
          onChange={e=>onChange(e.target.value)} 
          placeholder={placeholder} 
          rows={rows} 
          style={{width:'100%',padding:'9px 12px',border:'none',fontSize:14,color:B.text,resize:'vertical',boxSizing:'border-box',outline:'none',fontFamily:'inherit',lineHeight:1.5}} 
        />
      </div>
      {note && <div style={{fontSize:11,color:B.muted,marginTop:4}}>{note}</div>}
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, type='text', multi=false, rows=3, note }) => {
  if (multi) return <RichTextField label={label} value={value} onChange={onChange} placeholder={placeholder} rows={rows} note={note} />;
  return (
    <div style={{marginBottom:14}}>
      {label && <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,color:B.text,background:B.white,boxSizing:'border-box',outline:'none',fontFamily:'inherit'}} />
      {note && <div style={{fontSize:11,color:B.muted,marginTop:4}}>{note}</div>}
    </div>
  );
};

const Sel = ({ label, value, onChange, options }) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,color:B.text,background:B.white,outline:'none',fontFamily:'inherit'}}>
      {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`2px solid ${B.purpleLight}`,paddingBottom:8,marginBottom:16,marginTop:8}}>{children}</div>
);

const InfoText = ({ text, isMobile }) => {
  if (!text) return null;
  return (
    <div 
      style={{fontSize:isMobile?14:15,color:B.text,lineHeight:1.75,margin:0, whiteSpace: 'pre-wrap'}}
      dangerouslySetInnerHTML={{ __html: clean(text) }}
    />
  );
};

// ── Product Tooltip ───────────────────────────────────
const ProductTooltip = ({ product: p, children, navigate }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({top:0,left:0});
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const cpa = costPerApp(p);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popW = 320;
    const spaceRight = window.innerWidth - r.left;
    const left = spaceRight < popW + 16 ? Math.max(8, r.right - popW) : r.left;
    setPos({ top: r.bottom + 8, left });
  };

  const handleOpen = () => { calcPos(); setOpen(true); };

  useEffect(() => {
    const close = e => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <span style={{display:'inline-block'}}>
      <span ref={triggerRef} style={{display:'inline-flex', alignItems:'center', gap:4}}>
        {children}
        <span onClick={() => open ? setOpen(false) : handleOpen()} style={{width:16,height:16,borderRadius:'50%',background:B.purple,color:B.white,fontSize:10,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:2,cursor:'pointer'}}>i</span>
      </span>
      {open && (
        <div ref={popoverRef} style={{position:'fixed',zIndex:9999,top:pos.top,left:pos.left,width:320,background:B.white,border:`1.5px solid ${B.purple}`,borderRadius:12,boxShadow:'0 12px 40px rgba(44,31,64,0.22)',padding:'16px 18px'}}>
          <div style={{fontWeight:700,fontSize:14,color:B.purpleDark,marginBottom:10,lineHeight:1.3}}>{p.name}</div>
          {p.actives && (
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>Ativos Principais</div>
              <div style={{fontSize:13,color:B.text,lineHeight:1.5}} dangerouslySetInnerHTML={{__html: clean(p.actives)}} />
            </div>
          )}
          {p.indications && (
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>Indicações</div>
              <div style={{fontSize:13,color:B.text,lineHeight:1.5}} dangerouslySetInnerHTML={{__html: clean(p.indications)}} />
            </div>
          )}
          {p.differentials && (
            <div style={{marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>Diferenciais</div>
              <div style={{fontSize:13,color:B.text,lineHeight:1.5}} dangerouslySetInnerHTML={{__html: clean(p.differentials.slice(0,140) + (p.differentials.length>140?'...':''))}} />
            </div>
          )}
          {cpa != null && (
            <div style={{background:B.purpleLight,borderRadius:8,padding:'8px 12px',marginBottom:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:B.muted,fontWeight:600}}>Custo/aplicação</span>
              <span style={{fontSize:14,fontWeight:700,color:B.purple}}>{fmtCurrency(cpa)}</span>
            </div>
          )}
          <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
            {p.fichaUrl && <a href={p.fichaUrl} target="_blank" rel="noreferrer" style={{flex:1,background:B.purpleDark,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',textDecoration:'none',display:'block'}}>📄 Ficha Técnica</a>}
            <button onClick={()=>{setOpen(false);navigate(`/produto/${p.id}`);}} style={{flex:1,background:B.purple,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',border:'none',cursor:'pointer',fontFamily:'inherit'}}>🔍 Ver produto</button>
            {p.siteUrl && <a href={p.siteUrl} target="_blank" rel="noreferrer" style={{flex:1,background:B.purpleDark,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',textDecoration:'none',display:'block'}}>🛒 Comprar</a>}
            <button onClick={() => setOpen(false)} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer',color:B.muted,fontFamily:'inherit'}}>Fechar</button>
          </div>
        </div>
      )}
    </span>
  );
};

// ── Header ────────────────────────────────────────────
const Header = ({ navigate, adminAuth, setAdminAuth, brand }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navItems = [{l:'Protocolos',v:'/'},{l:'Buscar por Produto',v:'/busca'}];

  return (
    <header className="no-print" style={{background:B.purpleDark,padding:`0 ${isMobile?14:24}px`,display:'flex',alignItems:'center',justifyContent:'space-between',height:58,position:'sticky',top:0,zIndex:200}}>
      <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>{ navigate('/'); setMenuOpen(false); }}>
        <Logo brand={brand} size={34} />
        <div>
          <div style={{color:B.white,fontWeight:700,fontSize:isMobile?13:14,lineHeight:1.1,fontFamily:'Georgia, serif'}}>{brand?.companyName || 'Extratos da Terra'}</div>
          <div style={{color:B.gold,fontSize:9,letterSpacing:'0.12em',fontWeight:700}}>PROTOCOLOS PRO</div>
        </div>
      </div>

      {!isMobile && (
        <nav style={{display:'flex',gap:4}}>
          {navItems.map(n=>(
            <button key={n.v} onClick={()=>navigate(n.v)} style={{background:'transparent',color:'rgba(255,255,255,0.65)',border:'none',padding:'7px 14px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{n.l}</button>
          ))}
          <button onClick={()=>adminAuth?navigate('/admin'):navigate('/login')} style={{background:B.gold,color:B.white,border:'none',padding:'7px 16px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:8,fontFamily:'inherit'}}>
            {adminAuth?'⚙ Admin':'🔐 Admin'}
          </button>
        </nav>
      )}

      {isMobile && (
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button onClick={()=>adminAuth?navigate('/admin'):navigate('/login')} style={{background:B.gold,color:B.white,border:'none',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{adminAuth?'⚙':'🔐'}</button>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:'rgba(255,255,255,0.15)',color:B.white,border:'none',width:38,height:38,borderRadius:8,fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>{menuOpen ? '✕' : '☰'}</button>
        </div>
      )}

      {isMobile && menuOpen && (
        <div style={{position:'fixed',top:58,right:0,background:B.purpleDark,padding:'12px 16px',zIndex:300,borderRadius:'0 0 0 14px',boxShadow:'0 8px 24px rgba(0,0,0,0.4)',display:'flex',flexDirection:'column',gap:6,minWidth:200}}>
          {navItems.map(n=>(
            <button key={n.v} onClick={()=>{navigate(n.v);setMenuOpen(false);}} style={{background:'transparent',color:B.white,border:'none',padding:'10px 16px',borderRadius:8,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>{n.l}</button>
          ))}
        </div>
      )}
    </header>
  );
};

// ── Public Home ───────────────────────────────────────
const PublicHome = ({ protocols, products, indications, categories, favorites, setFavorites, navigate, brand, marketing }) => {
  const [filterInd, setFilterInd] = useState('all');
  const [filterCat, setFilterCat] = useState('all');
  const [filterProd, setFilterProd] = useState('all');
  const [search, setSearch] = useState('');
  
  const isMobile = useIsMobile();
  const pub = protocols.filter(p=>p.published);
  
  const filtered = pub.filter(p => {
    if (filterInd === 'favorites' && !favorites.includes(p.id)) return false;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchInd = filterInd === 'all' || filterInd === 'favorites' || p.concerns?.includes(filterInd);
    const matchCat = filterCat === 'all' || p.category === filterCat || p.categories?.includes(filterCat);
    const matchProd = filterProd === 'all' || p.steps?.some(s => s.productId === filterProd) || p.homeUse?.morning?.some(h => h.productId === filterProd) || p.homeUse?.night?.some(h => h.productId === filterProd);
    
    return matchSearch && matchInd && matchCat && matchProd;
  });

  return (
    <div style={{background:B.cream, flex: 1}}>
      <HeroBanner banners={marketing?.banners} navigate={navigate} />
      <CampaignSection campaign={marketing?.campaign} protocols={protocols} navigate={navigate} />
      <div className="rp-hero" style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, ${B.purple} 60%, ${B.purpleMid} 100%)`,textAlign:'center'}}>
        <div style={{fontSize:10,color:B.gold,fontWeight:700,letterSpacing:'0.16em',marginBottom:8,textTransform:'uppercase'}}>Cosmetologia Avançada</div>
        <h1 className="rp-hero" style={{color:B.white,fontWeight:700,fontFamily:'Georgia, serif',margin:'0 0 10px',letterSpacing:'-0.01em'}}>Protocolos Profissionais</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:isMobile?13:15,margin:`0 0 ${isMobile?18:28}px`,lineHeight:1.5}}>Passo a passo completo para esteticistas, com os produtos {brand?.companyName || 'Extratos da Terra'}</p>
        
        <div style={{maxWidth:900, margin:'0 auto', padding:`0 ${isMobile?4:0}px`}}>
          <div style={{background:'rgba(255,255,255,0.12)', padding: '16px', borderRadius: 16, display:'flex', flexDirection:'column', gap: 10, border: '1px solid rgba(255,255,255,0.2)'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar protocolo por nome ou descrição..."
              style={{width:'100%',padding:'11px 16px',borderRadius:10,border:'none',fontSize:14,outline:'none',boxSizing:'border-box',background:B.white,color:B.text,fontFamily:'inherit'}} />
            <div style={{display:'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row'}}>
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={{flex:1, padding:'11px 16px',borderRadius:10,border:'none',fontSize:14,outline:'none',background:B.white,color:B.text,fontFamily:'inherit'}}>
                <option value="all">Todas as Categorias</option>
                {[...categories].sort((a,b)=>a.label.localeCompare(b.label)).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <select value={filterProd} onChange={e=>setFilterProd(e.target.value)} style={{flex:2, padding:'11px 16px',borderRadius:10,border:'none',fontSize:14,outline:'none',background:B.white,color:B.text,fontFamily:'inherit'}}>
                <option value="all">Todos os Produtos Vinculados</option>
                {sortByName(products).filter(p=>isActive(p)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{marginTop:16,color:'rgba(255,255,255,0.55)',fontSize:12}}>{filtered.length} protocolo{filtered.length!==1?'s':''} encontrado{filtered.length!==1?'s':''}</div>
      </div>

      <div className="no-print" style={{background:B.white,borderBottom:`1px solid ${B.border}`,padding:`10px ${isMobile?12:24}px`,display:'flex',gap:8,overflowX:'auto',WebkitOverflowScrolling:'touch', alignItems:'center'}}>
        <span style={{fontSize:11, fontWeight:700, color:B.muted, textTransform:'uppercase', letterSpacing:'0.05em', flexShrink:0, marginRight: 4}}>Filtros:</span>
        <button onClick={()=>setFilterInd('all')} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${filterInd==='all'?B.purple:B.border}`,background:filterInd==='all'?B.purple:B.white,color:filterInd==='all'?B.white:B.text,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',flexShrink:0}}>Todos</button>
        <button onClick={()=>setFilterInd('favorites')} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${filterInd==='favorites'?B.red:B.border}`,background:filterInd==='favorites'?B.redLight:B.white,color:filterInd==='favorites'?B.red:B.text,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',flexShrink:0}}>❤️ Meus Favoritos</button>
        <div style={{width: 1, background: B.border, alignSelf: 'stretch', margin: '0 4px'}} />
        {[...indications].sort((a,b)=>a.label.localeCompare(b.label)).map(c=>(
          <button key={c.id} onClick={()=>setFilterInd(c.id)} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${filterInd===c.id?B.purple:B.border}`,background:filterInd===c.id?B.purple:B.white,color:filterInd===c.id?B.white:B.text,fontSize:12,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',flexShrink:0}}>{c.label}</button>
        ))}
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:`${isMobile?20:32}px ${isMobile?12:24}px`}}>
        {filtered.length===0
          ? <div style={{textAlign:'center',padding:'70px 0',color:B.muted}}><div style={{fontSize:52,marginBottom:14}}>📋</div><div style={{fontSize:16,fontWeight:600,color:B.text,marginBottom:6}}>Nenhum protocolo encontrado com estes filtros</div></div>
          : <div className="rp-grid-proto" style={{display:'grid',gap:16}}>
              {filtered.map(p=><ProtocolCard key={p.id} protocol={p} products={products} indications={indications} categories={categories} onClick={()=>navigate(`/protocolo/${p.id}`)} isFav={favorites.includes(p.id)} toggleFav={(e)=>{e.stopPropagation(); setFavorites(prev => prev.includes(p.id)? prev.filter(x=>x!==p.id) : [...prev, p.id])}} />)}
            </div>
        }
      </div>
    </div>
  );
};

const ProtocolCard = ({ protocol:p, products, indications, categories, onClick, isFav, toggleFav }) => {
  const [hov, setHov] = useState(false);
  const prodCount = p.steps.filter(s=>s.productId).length;
  // Custo base apenas para ter um cheiro do valor
  const totalCost = p.steps.reduce((acc,s)=>{ const prod=products.find(x=>x.id===s.productId); const c=costPerApp(prod); return acc+(c||0); },0);
  const categoryLabel = categories.find(c => c.id === p.category)?.label || p.category;

  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:'relative', background:B.white,borderRadius:14,border:`1px solid ${hov?B.purpleMid:B.border}`,padding:22,cursor:'pointer',transition:'all 0.18s',transform:hov?'translateY(-3px)':'none',boxShadow:hov?'0 10px 35px rgba(94,61,143,0.13)':'none'}}>
      {p.badge&&<span style={{position:'absolute',top:-8,left:14,background:B.gold,color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,textTransform:'uppercase',letterSpacing:'0.07em',zIndex:3}}>{p.badge}</span>}
      <button onClick={toggleFav} style={{position:'absolute', top: 18, right: 18, background:'none', border:'none', fontSize: 22, cursor:'pointer', color: isFav ? B.red : B.border, zIndex: 2}}>
        {isFav ? '❤️' : '🤍'}
      </button>
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap', paddingRight: 30}}>
        {(p.concerns || []).map(c=><Tag key={c} label={indications.find(x=>x.id===c)?.label||c} />)}
        {categoryLabel && <Tag label={categoryLabel} color={B.goldLight} text={'#7A5C1E'} />}
      </div>
      <h3 style={{margin:'0 0 8px',color:B.purpleDark,fontSize:15,fontWeight:700,lineHeight:1.35}}>{p.name}</h3>
      <p style={{margin:'0 0 16px',color:B.muted,fontSize:13,lineHeight:1.6}} dangerouslySetInnerHTML={{__html: clean((p.description||'').slice(0,100) + ((p.description||'').length>100?'...':''))}} />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1px solid ${B.border}`,paddingTop:12}}>
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontSize:12,color:B.muted}}>🧪 {p.steps.length} etapas · {prodCount} produtos</span>
        </div>
        <span style={{fontSize:13,color:B.purple,fontWeight:700}}>Ver protocolo →</span>
      </div>
    </div>
  );
};

// ── Protocol Detail ───────────────────────────────────
const ProtocolDetail = ({ protocol:p, products, indications, categories, navigate, brand, onView }) => {
  const isMobile = useIsMobile();
  const get = id => products.find(x=>x.id===id);

  useEffect(()=>{ if(onView) onView('protocol', p.id); },[p.id]);

  const [sessions, setSessions] = useState(1);
  const [charge, setCharge] = useState('');

  const protocolProducts = p.steps.filter(s=>s.productId).map(s=>get(s.productId)).filter(Boolean);
  const uniqueProducts = [...new Map(protocolProducts.map(pr=>[pr.id,pr])).values()];
  
  // LÓGICA DE RENTABILIDADE
  const totalInvestment = uniqueProducts.reduce((acc, pr) => acc + (parseFloat(pr.cost) || 0), 0);
  const yields = uniqueProducts.map(pr => parseFloat(pr.yieldApplications)).filter(y => y > 0 && !isNaN(y));
  const protocolYield = yields.length > 0 ? Math.min(...yields) : 0;
  const bottleneckProduct = uniqueProducts.find(pr => parseFloat(pr.yieldApplications) === protocolYield);
  const avgCostPerSession = protocolYield > 0 ? totalInvestment / protocolYield : 0;
  const hasCostData = totalInvestment > 0 && protocolYield > 0;

  const pad = isMobile ? '16px 14px' : '28px 28px 24px';
  const secPad = isMobile ? '16px 14px' : '24px 28px';
  const categoryLabel = categories.find(c => c.id === p.category)?.label || p.category;

  const handlePrint = async () => {
    const html2pdf = await loadHtml2Pdf();
    const element = document.getElementById('protocol-content');
    html2pdf().set({ 
      margin: [10, 10, 10, 10], 
      filename: `${p.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' }
    }).from(element).save();
  };

  const shareText = encodeURIComponent(`Confira o protocolo: *${p.name}*\n\n${brand?.companyName || 'Extratos da Terra'}\nMais detalhes disponíveis no sistema!`);

  return (
    <div style={{background:B.cream, flex: 1}}>
      <div className="no-print rp-bkbar" style={{background:B.white,borderBottom:`1px solid ${B.border}`,padding:'10px 24px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <div style={{display:'flex', gap:8}}>
          <button onClick={()=>{navigator.clipboard.writeText(window.location.href); alert('Link copiado!');}} style={{background:B.purpleLight,color:B.purple,border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,cursor:'pointer',fontFamily:'inherit'}}>🔗 Copiar link</button>
          <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noreferrer" style={{background:'#25D366',color:B.white,textDecoration:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,display:'inline-flex',alignItems:'center'}}>📱 Compartilhar</a>
          <button onClick={handlePrint} style={{background:B.purple,color:B.white,border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,cursor:'pointer',fontFamily:'inherit'}}>🖨️ {isMobile?'PDF':'Salvar PDF'}</button>
        </div>
      </div>

      <div id="protocol-content" style={{maxWidth:740,margin:'0 auto',padding:isMobile?'16px 12px':'36px 24px', background: B.cream}}>
        
        {/* Header para Impressão */}
        <div className="print-only" style={{ textAlign: 'center', marginBottom: '30px', borderBottom: `2px solid ${B.purple}`, paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo brand={brand} size={60} />
          </div>
          <h1 style={{ color: B.purpleDark, margin: '0 0 6px', fontFamily: 'Georgia, serif', fontSize: 24 }}>{brand?.companyName || 'Extratos da Terra'}</h1>
          <p style={{ margin: 0, color: B.muted, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Protocolo Profissional</p>
        </div>

        {/* Header */}
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:pad,marginBottom:16}}>
          <div className="no-print" style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {(p.concerns || []).map(c=><Tag key={c} label={indications.find(x=>x.id===c)?.label||c} size="md" />)}
            {categoryLabel && <Tag label={categoryLabel} color={B.goldLight} text={'#7A5C1E'} size="md" />}
          </div>
          <h1 style={{margin:'0 0 10px',color:B.purpleDark,fontSize:isMobile?20:24,fontWeight:700,fontFamily:'Georgia, serif',lineHeight:1.3}}>{p.name}</h1>
          <InfoText text={p.description} isMobile={isMobile} />
          <div className="rp-proto-meta" style={{display:'flex',gap:isMobile?10:28,flexWrap:'wrap',paddingTop:12,borderTop:`1px solid ${B.border}`, marginTop: 14}}>
            {p.frequency&&<div><span style={{fontSize:11,color:B.muted,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.06em'}}>Frequência</span><br/><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.frequency}</span></div>}
            {p.associations&&<div><span style={{fontSize:11,color:B.muted,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.06em'}}>Associações</span><br/><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.associations}</span></div>}
            {p.youtubeUrl&&(
              <a href={p.youtubeUrl} target="_blank" rel="noreferrer" className="no-print" style={{display:'inline-flex',alignItems:'center',gap:7,background:'#FF0000',color:B.white,padding:'7px 14px',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none'}}>▶ YouTube</a>
            )}
          </div>
        </div>

        {/* Steps */}
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:secPad,marginBottom:16}}>
          <h2 style={{margin:'0 0 20px',fontSize:15,fontWeight:700,color:B.text}}>💆 Protocolo em Cabine</h2>
          {p.steps.map((step,i)=>{
            const prod = step.productId ? get(step.productId) : null;
            const cpa = costPerApp(prod);
            return (
              <div key={step.id} className="avoid-break" style={{display:'flex',gap:isMobile?10:16,marginBottom:i<p.steps.length-1?4:0}}>
                <div className="no-print" style={{display:'flex',flexDirection:'column',alignItems:'center',width:isMobile?30:38,flexShrink:0}}>
                  <div style={{width:isMobile?28:36,height:isMobile?28:36,borderRadius:'50%',background:B.purple,color:B.white,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:isMobile?12:14,flexShrink:0}}>{i+1}</div>
                  {i<p.steps.length-1&&<div style={{width:2,flex:1,minHeight:16,background:B.border,margin:'4px 0'}} />}
                </div>
                <div className="rp-step-gap avoid-break" style={{flex:1,paddingBottom:20}}>
                  <div style={{fontSize:10,fontWeight:700,color:B.purpleMid,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:5}}>{step.phase}</div>
                  {prod
                    ? <div style={{background:B.purpleLight,border:`1px solid ${B.border}`,borderRadius:10,padding:isMobile?'8px 10px':'10px 14px',marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:6,flexWrap:'wrap'}}>
                          <ProductTooltip product={prod} navigate={navigate}>
                            <span style={{fontWeight:700,fontSize:isMobile?13:14,color:isActive(prod)?B.purpleDark:B.red}}>{prod.name}{!isActive(prod)&&' ⚠️'}</span>
                          </ProductTooltip>
                          {cpa!=null&&<span className="no-print" style={{fontSize:11,fontWeight:700,color:B.green,whiteSpace:'nowrap'}}>{fmtCurrency(cpa)}/apl.</span>}
                        </div>
                        {!isActive(prod)&&<div className="no-print" style={{fontSize:11,color:B.red,fontWeight:700,marginTop:3}}>⚠️ Produto inativo</div>}
                        {prod.actives&&isActive(prod)&&<div style={{fontSize:11,color:B.muted,marginTop:3,lineHeight:1.4}} dangerouslySetInnerHTML={{__html: clean('Ativos: ' + prod.actives.slice(0,isMobile?80:999) + (isMobile&&prod.actives.length>80?'...':''))}} /> }
                      </div>
                    : <div style={{background:'#F3F4F6',borderRadius:10,padding:'8px 12px',marginBottom:8,fontSize:13,color:B.muted,fontStyle:'italic'}}>Equipamento / técnica manual</div>
                  }
                  <InfoText text={step.instruction} isMobile={isMobile} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Home Use */}
        {p.homeUse&&(p.homeUse.morning?.length>0||p.homeUse.night?.length>0)&&(
          <div className="avoid-break" style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:secPad,marginBottom:16}}>
            <h2 style={{margin:'0 0 4px',fontSize:15,fontWeight:700,color:B.text}}>🏠 Uso em Casa</h2>
            <p style={{margin:'0 0 16px',fontSize:12,color:B.muted}}>Orientações de rotina domiciliar para potencializar os resultados entre as sessões</p>
            <div className="rp-grid-home" style={{display:'grid',gap:12}}>
              {[{slot:'morning',icon:'☀️',label:'Manhã'},{slot:'night',icon:'🌙',label:'Noite'}].map(({slot,icon,label})=>
                p.homeUse[slot]?.length>0&&(
                  <div key={slot} style={{background:B.cream,borderRadius:10,padding:'14px 16px'}}>
                    <div style={{fontWeight:700,fontSize:13,color:B.text,marginBottom:12}}>{icon} {label}</div>
                    {p.homeUse[slot].map((item,i)=>{
                      const prod = item.productId ? get(item.productId) : null;
                      return (
                        <div key={i} className="avoid-break" style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                          <span className="no-print" style={{width:20,height:20,background:B.purple,color:B.white,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</span>
                          <div>
                            {prod ? (
                              <div style={{display:'flex', alignItems:'center', gap: 6, flexWrap: 'wrap'}}>
                                <ProductTooltip product={prod} navigate={navigate}>
                                  <span style={{fontWeight:700,fontSize:12,color:B.purpleDark,lineHeight:1.3}}>{prod.name}</span>
                                </ProductTooltip>
                                <BuyLink href={prod.siteUrl} isMobile={isMobile} sx={{padding: '2px 8px', fontSize: 10}} />
                              </div>
                            ) : null}
                            <div style={{fontSize:12,color:B.text,marginTop:4}}><InfoText text={item.instruction} isMobile={isMobile} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Product & Cost Summary */}
        {uniqueProducts.length > 0 && (
          <div className="rp-cost-summary avoid-break" style={{background:`linear-gradient(135deg, ${B.purpleLight}, ${B.goldLight})`,borderRadius:14,border:`1px solid ${B.border}`,padding:'22px 28px', pageBreakInside: 'avoid'}}>
            <h2 style={{margin:'0 0 14px',fontSize:16,fontWeight:700,color:B.purpleDark}}>🛍️ Resumo de Produtos do Protocolo</h2>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {uniqueProducts.map(pr=>{
                const c=costPerApp(pr);
                return (
                  <div key={pr.id} className="avoid-break" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'12px 14px', border:`1px solid rgba(255,255,255,0.4)`}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      {pr.image ? (
                        <img src={pr.image} alt={pr.name} style={{width:40,height:40,objectFit:'contain',borderRadius:6,background:B.white, border:`1px solid ${B.border}`}}/>
                      ) : (
                        <div style={{width:40,height:40,borderRadius:6,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🧴</div>
                      )}
                      <div style={{display:'flex', flexDirection:'column', alignItems: 'flex-start', justifyContent: 'center'}}>
                        <span style={{fontSize:isMobile?13:14,color:B.text,fontWeight:700,lineHeight:1.2, marginBottom: 4}}>{pr.name}</span>
                        <BuyLink href={pr.siteUrl} isMobile={isMobile} sx={{padding: '5px 12px', fontSize: 11}} />
                      </div>
                    </div>
                    {c!=null && <span className="no-print" style={{fontSize:13,fontWeight:700,color:B.green,flexShrink:0, marginLeft: 10}}>{fmtCurrency(c)}/apl.</span>}
                  </div>
                );
              })}
            </div>
            
            {hasCostData && (
              <div className="avoid-break" style={{background:B.white, borderRadius:10, padding:'16px', marginTop:16, border:`1px solid ${B.border}`}}>
                 <h3 style={{margin:'0 0 12px',fontSize:15,color:B.purpleDark}}>📊 Análise de Rentabilidade do Kit</h3>
                 <ul style={{listStyle:'none', padding:0, margin:0, fontSize:13, color:B.text, lineHeight:1.8}}>
                   <li style={{display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${B.cream}`, paddingBottom:6, marginBottom:6}}>
                     <span><strong>Investimento Total:</strong> <span style={{color:B.muted, fontSize:11}}>(soma dos produtos)</span></span>
                     <span style={{fontWeight:'bold'}}>{fmtCurrency(totalInvestment)}</span>
                   </li>
                   <li style={{display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${B.cream}`, paddingBottom:6, marginBottom:6}}>
                     <span><strong>Rendimento Médio:</strong> {bottleneckProduct && <span className="no-print" style={{color:B.muted, fontSize:11}}>(limitado por: {bottleneckProduct.name})</span>}</span>
                     <span style={{fontWeight:'bold', color:B.purple}}>{protocolYield} aplicações</span>
                   </li>
                   <li style={{display:'flex', justifyContent:'space-between', paddingTop:2}}>
                     <span style={{fontWeight:700, color:B.purpleDark}}>Custo Médio por Sessão:</span>
                     <span style={{color:B.green, fontWeight:'bold', fontSize:16}}>{fmtCurrency(avgCostPerSession)}</span>
                   </li>
                 </ul>
              </div>
            )}

            {brand?.showCalculator && (
              <div className="no-print avoid-break" style={{marginTop: 20, paddingTop: 20, borderTop: `1px solid rgba(0,0,0,0.1)`}}>
                 <h3 style={{margin:'0 0 12px',fontSize:15,color:B.purpleDark}}>🧮 Calculadora de Lucratividade</h3>
                 
                 {!hasCostData && (
                   <div style={{fontSize:12, color:B.red, marginBottom: 14, background: B.redLight, padding: '10px 14px', borderRadius: 8, fontWeight: 600}}>
                     ⚠️ Configure o "Rendimento" (nº de aplicações) no cadastro de cada produto para calcular o custo exato.
                   </div>
                 )}

                 <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14}}>
                    <Field label="Qtd. de Sessões" value={sessions} onChange={v=>setSessions(v)} type="number" />
                    <Field label="Valor Cobrado por Sessão (R$)" value={charge} onChange={v=>setCharge(v)} type="number" />
                 </div>
                 
                 <div className="rp-cost-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:B.purple,borderRadius:10,padding:'14px 18px',gap:10}}>
                  <div>
                    <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>Lucro Estimado</div>
                    <div style={{color:'rgba(255,255,255,0.6)',fontSize:10,marginTop:2}}>Receita Bruta - Custo dos Produtos ({fmtCurrency(avgCostPerSession)}/sessão)</div>
                  </div>
                  <div style={{color:B.gold,fontSize:isMobile?22:26,fontWeight:700,flexShrink:0}}>
                     {fmtCurrency(((Number(charge)||0) * (Number(sessions)||0)) - (avgCostPerSession * (Number(sessions)||0)))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Imagem Destaque */}
            {p.featuredImage && (
              <div className="avoid-break" style={{marginTop: 24, textAlign: 'center', paddingTop: 20, borderTop: `1px solid rgba(0,0,0,0.1)`}}>
                <img src={p.featuredImage} alt="Destaque do Protocolo" style={{maxWidth: '100%', height: 'auto', borderRadius: 12, border: `1px solid ${B.border}`, display: 'block', margin: '0 auto'}} />
                {p.featuredLink && (
                  <div style={{marginTop: 14}}>
                    <BuyLink href={p.featuredLink} isMobile={isMobile}>Acessar Oferta / Comprar Kit</BuyLink>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Public Product Page ───────────────────────────────
const CompositionSection = ({ composition, isMobile }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = composition.slice(0, 120);
  const hasMore = composition.length > 120;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Composição (INCI)</span>
        {hasMore && (
          <button onClick={()=>setExpanded(e=>!e)} style={{background:'none',border:'none',color:B.purple,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:0}}>
            {expanded ? '▲ Recolher' : '▼ Ver completa'}
          </button>
        )}
      </div>
      <p style={{margin:0,fontSize:12,color:B.muted,lineHeight:1.7,fontStyle:'italic'}}>
        {expanded || !hasMore ? composition : preview + '...'}
      </p>
    </div>
  );
};

const PublicProductPage = ({ product: p, protocols, categories, navigate, brand, onView }) => {
  const isMobile = useIsMobile();
  useEffect(()=>{ if(onView) onView('product', p.id); },[p.id]);
  const usedIn = protocols.filter(prot =>
    prot.published && (
      prot.steps.some(s => s.productId === p.id) ||
      prot.homeUse?.morning?.some(h => h.productId === p.id) ||
      prot.homeUse?.night?.some(h => h.productId === p.id)
    )
  );
  const cats = (p.categories || [p.category]);
  const uso = p.uso || [];

  const Section = ({ title, children }) => (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${B.purpleLight}`}}>{title}</div>
      {children}
    </div>
  );

  const shareText = encodeURIComponent(`Conheça o produto: *${p.name}*\n\nVeja mais detalhes no site!`);

  return (
    <div style={{background:B.cream, flex: 1}}>
      <div className="no-print" style={{background:B.white,borderBottom:`1px solid ${B.border}`,padding:`10px ${isMobile?14:24}px`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <button onClick={()=>navigate('/')} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <div style={{display:'flex', gap:8}}>
          <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noreferrer" style={{background:'#25D366',color:B.white,textDecoration:'none',padding:isMobile?'8px 14px':'9px 22px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:14,display:'inline-flex',alignItems:'center'}}>📱 Partilhar</a>
          <BuyLink href={p.siteUrl} isMobile={isMobile}>Comprar / Saiba mais</BuyLink>
        </div>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:isMobile?'14px 12px':'36px 24px'}}>
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?'18px 14px':'32px',marginBottom:16,display:'flex',flexDirection:isMobile?'column':'row',gap:isMobile?14:32,alignItems:'flex-start'}}>
          {p.image && (
            <div style={{width:isMobile?80:180,height:isMobile?80:180,flexShrink:0,borderRadius:12,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:`1px solid ${B.border}`}}>
              <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {cats.map(c=><Tag key={c} label={categories.find(x=>x.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} size="md" />)}
              {uso.includes('profissional')&&<Tag label="Profissional" color={B.blueLight} text={B.blue} size="md" />}
              {uso.includes('homecare')&&<Tag label="Home Care" color={B.greenLight} text={B.green} size="md" />}
              {!isActive(p)&&<Tag label="Inativo" color={B.redLight} text={B.red} size="md" />}
            </div>
            <h1 style={{margin:'0 0 8px',color:B.purpleDark,fontSize:isMobile?19:26,fontWeight:700,fontFamily:'Georgia, serif',lineHeight:1.25}}>{p.name}</h1>
            {p.mainFunction && <p style={{margin:'0 0 10px',color:B.muted,fontSize:isMobile?13:15,lineHeight:1.6}}>{p.mainFunction}</p>}
            <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
              {p.size&&<div style={{fontSize:12,color:B.muted}}><span style={{fontWeight:700,color:B.text}}>Tamanho:</span> {p.size}</div>}
              {p.anvisa&&<div style={{fontSize:12,color:B.muted}}><span style={{fontWeight:700,color:B.text}}>ANVISA:</span> {p.anvisa}</div>}
            </div>
            {!isMobile && (
              <div style={{marginTop: 18}}>
                <BuyLink href={p.siteUrl} isMobile={false} sx={{padding: '11px 24px', fontSize: 15}}>Comprar / Saiba mais</BuyLink>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:0}}>
          <div>
            {p.description && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Descrição"><InfoText text={p.description} isMobile={isMobile} /></Section>
              </div>
            )}
            {p.benefits && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Benefícios">
                  {p.benefits.split(';').map((b,i)=>b.trim()&&(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:7,alignItems:'flex-start'}}>
                      <span style={{color:B.purple,fontWeight:700,flexShrink:0,marginTop:3}}>✦</span>
                      <span style={{fontSize:isMobile?13:15,color:B.text,lineHeight:1.6}} dangerouslySetInnerHTML={{__html: clean(b.trim())}} />
                    </div>
                  ))}
                </Section>
              </div>
            )}
            {p.actives && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Ativos Principais"><InfoText text={p.actives} isMobile={isMobile} /></Section>
              </div>
            )}
            {p.differentials && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Diferenciais"><InfoText text={p.differentials} isMobile={isMobile} /></Section>
              </div>
            )}
          </div>
          <div>
            {(p.howToUse||p.indications||p.contra) && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                {p.howToUse&&<Section title="Modo de Uso"><InfoText text={p.howToUse} isMobile={isMobile} /></Section>}
                {p.indications&&<Section title="Indicações"><InfoText text={p.indications} isMobile={isMobile} /></Section>}
                {p.contra&&<Section title="Contraindicações"><InfoText text={p.contra} isMobile={isMobile} /></Section>}
              </div>
            )}
            {(p.yieldApplications||p.cost) && (
              <div style={{background:B.purpleLight,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Rendimento & Custo">
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {p.yieldApplications&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Rendimento</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{p.yieldApplications} aplicações</span></div>}
                    {p.yieldGramsPerUse&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Por aplicação</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{p.yieldGramsPerUse} g/ml</span></div>}
                    {p.cost&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Custo produto</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{fmtCurrency(parseFloat(p.cost))}</span></div>}
                    {costPerApp(p)!=null&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:B.purple,borderRadius:8,padding:'10px 14px'}}><span style={{fontSize:13,color:'rgba(255,255,255,0.8)',fontWeight:600}}>Custo/aplicação</span><span style={{fontSize:16,fontWeight:700,color:B.gold}}>{fmtCurrency(costPerApp(p))}</span></div>}
                  </div>
                </Section>
              </div>
            )}
            {p.homeUseNote && (
              <div style={{background:B.greenLight,borderRadius:14,border:'1px solid #A5D6A7',padding:isMobile?14:24,marginBottom:14}}>
                <Section title="🏠 Home Care">
                  <InfoText text={p.homeUseNote} isMobile={isMobile} />
                </Section>
              </div>
            )}
            {p.composition && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <CompositionSection composition={p.composition} isMobile={isMobile} />
              </div>
            )}
            {p.faq && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Perguntas Frequentes">
                  <InfoText text={p.faq} isMobile={isMobile} />
                </Section>
              </div>
            )}
            {usedIn.length>0 && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title={`Usado em ${usedIn.length} protocolo${usedIn.length>1?'s':''}`}>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {usedIn.map(prot=>(
                      <button key={prot.id} onClick={()=>navigate(`/protocolo/${prot.id}`)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:B.cream,border:`1px solid ${B.border}`,borderRadius:10,padding:'10px 14px',cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>
                        <span style={{fontSize:13,fontWeight:700,color:B.purpleDark,lineHeight:1.3}}>{prot.name}</span>
                        <span style={{fontSize:12,color:B.purple,fontWeight:700,flexShrink:0,marginLeft:8}}>Ver →</span>
                      </button>
                    ))}
                  </div>
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Product Search ────────────────────────────────────
const ProductSearch = ({ products, protocols, indications, categories, navigate }) => {
  const [q, setQ] = useState('');
  const matched = q.length>1 ? products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())) : [];
  const getProtos = id => protocols.filter(p=>p.published&&(p.steps.some(s=>s.productId===id)||p.homeUse?.morning?.some(h=>h.productId===id)||p.homeUse?.night?.some(h=>h.productId===id)));
  return (
    <div style={{background:B.cream, flex: 1}}>
      <div style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, ${B.purple} 100%)`,padding:'44px 24px 36px',textAlign:'center'}}>
        <h1 style={{color:B.white,fontSize:26,fontWeight:700,fontFamily:'Georgia, serif',margin:'0 0 8px'}}>Buscar por Produto</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,margin:'0 0 24px'}}>Descubra em quais protocolos um produto é utilizado</p>
        <div style={{maxWidth:480,margin:'0 auto'}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex: Sérum Melan T-Block..." autoFocus
            style={{width:'100%',padding:'13px 20px',borderRadius:30,border:'none',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:'inherit'}} />
        </div>
      </div>
      <div style={{maxWidth:720,margin:'0 auto',padding:'32px 24px'}}>
        {q.length>1&&matched.length===0&&<div style={{textAlign:'center',color:B.muted,padding:40,fontSize:15}}>Nenhum produto encontrado</div>}
        {matched.map(prod=>{
          const protos=getProtos(prod.id);
          const cpa=costPerApp(prod);
          return (
            <div key={prod.id} style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:'20px 22px',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <h3 style={{margin:'0 0 4px',color:B.purpleDark,fontSize:16,fontWeight:700}}>{prod.name}</h3>
                  {prod.actives&&<div style={{fontSize:13,color:B.muted,marginBottom:2}} dangerouslySetInnerHTML={{__html: clean('Ativos: ' + prod.actives.slice(0, 100))}} /> }
                  {cpa!=null&&<div style={{fontSize:13,color:B.green,fontWeight:700}}>Custo/aplicação: {fmtCurrency(cpa)}</div>}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:4,alignItems:'flex-end'}}>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{(prod.categories||[prod.category]).map(c=><Tag key={c} label={categories.find(cat=>cat.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} />)}{(prod.uso||[]).includes('homecare')&&<Tag label='Home Care' color='#E8F5E9' text='#1E7E46' />}</div>
                  <div style={{display:'flex', gap:6, alignItems:'center'}}>
                    <button onClick={()=>navigate(`/produto/${prod.id}`)} style={{background:'none',border:'none',color:B.purple,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:0}}>🔍 Ver página ↗</button>
                    <BuyLink href={prod.siteUrl} isMobile={false} sx={{padding: '5px 12px', fontSize: 12}} />
                  </div>
                </div>
              </div>
              {protos.length>0
                ? <><div style={{fontSize:13,fontWeight:700,color:B.text,marginBottom:10}}>Utilizado em {protos.length} protocolo(s):</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {protos.map(pr=><button key={pr.id} onClick={()=>navigate(`/protocolo/${pr.id}`)} style={{background:B.purpleLight,border:`1px solid ${B.border}`,borderRadius:8,padding:'10px 14px',textAlign:'left',cursor:'pointer',fontSize:14,color:B.purple,fontWeight:700,fontFamily:'inherit'}}>{pr.name} →</button>)}
                    </div></>
                : <div style={{fontSize:13,color:B.muted,fontStyle:'italic'}}>Não vinculado a nenhum protocolo publicado</div>
              }
            </div>
          );
        })}
        {q.length<=1&&<div style={{textAlign:'center',padding:'70px 0'}}><div style={{fontSize:52,marginBottom:16}}>🔍</div><p style={{color:B.muted,fontSize:15,maxWidth:340,margin:'0 auto'}}>Digite o nome de um produto para descobrir em quais protocolos ele é utilizado</p></div>}
      </div>
    </div>
  );
};

// ── Admin Login ───────────────────────────────────────
const AdminLogin = ({ setLoggedUser, navigate, brand, users }) => {
  const [pwd,setPwd]=useState('');
  const [err,setErr]=useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lockRemainingMs, setLockRemainingMs] = useState(() => Math.max(0, (getLoginGuardState().lockedUntil || 0) - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setLockRemainingMs(Math.max(0, (getLoginGuardState().lockedUntil || 0) - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const tryLogin = async () => {
    if (submitting || lockRemainingMs > 0) return;
    setSubmitting(true);
    const matched = [];
    for (const user of users) {
      if (await verifyPassword(user, pwd)) matched.push(user);
    }
    if (matched.length === 1) {
      clearLoginGuardState();
      setLoggedUser(matched[0]);
      setPwd('');
      navigate('/admin');
    } else {
      const state = registerLoginFailure();
      setLockRemainingMs(Math.max(0, (state.lockedUntil || 0) - Date.now()));
      setErr(true);
      setPwd('');
      setTimeout(()=>setErr(false),2500);
    }
    setSubmitting(false);
  };

  const lockMinutes = Math.ceil(lockRemainingMs / 60000);
  return (
    <div style={{background:B.cream, flex: 1, display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:B.white,borderRadius:18,padding:'44px 40px',width:380,boxShadow:'0 8px 50px rgba(44,31,64,0.12)',border:`1px solid ${B.border}`}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}><Logo brand={brand} size={56}/></div>
          <h2 style={{margin:'0 0 6px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Área Administrativa</h2>
          <p style={{color:B.muted,fontSize:14,margin:0}}>Acesso restrito à equipe interna</p>
        </div>
        <Field label="Senha" value={pwd} onChange={setPwd} type="password" placeholder="Digite sua senha de acesso" />
        {err&&<div style={{background:B.redLight,color:B.red,padding:'9px 14px',borderRadius:8,fontSize:13,fontWeight:600,marginBottom:14}}>❌ Senha incorreta</div>}
        {lockRemainingMs > 0 && <div style={{background:B.goldLight,color:'#7A5C1E',padding:'9px 14px',borderRadius:8,fontSize:13,fontWeight:600,marginBottom:14}}>⏳ Muitas tentativas. Tente novamente em cerca de {lockMinutes} min.</div>}
        <Btn onClick={tryLogin} disabled={submitting || lockRemainingMs > 0} sx={{width:'100%',padding:'12px 0',borderRadius:10,fontSize:15}}>{submitting ? 'Verificando...' : 'Entrar'}</Btn>
        <button onClick={()=>navigate('/')} style={{width:'100%',marginTop:12,background:'none',border:'none',color:B.muted,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>← Voltar ao site</button>
      </div>
    </div>
  );
};

// ── TextProtocolImporter ───────────────────────────────────────
const TextProtocolImporter = ({ onImport, products }) => {
  const [text, setText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const processText = () => {
    if (!text.trim()) {
      alert("Cole o texto do PDF antes de processar.");
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let name = '';
    let category = '';
    let frequency = '';
    let associations = '';
    let steps = [];
    let currentStep = null;
    let homeUse = { morning: [], night: [] };
    let parsingHomeUse = false;
    let homeUseTime = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('--- PAGE')) continue;
        const lower = line.toLowerCase();
        
        // Ignora rodapés e cabeçalhos genéricos
        if (lower === 'protocolo' || lower.includes('versão') || lower === 'extratos' || lower === 'da terra' || lower.includes('cosmetologia') || lower === 'beleza' || lower === 'que faz' || lower === 'bem' || lower.includes('protocolo clareamento')) continue;

        if (!category && (lower === 'corporal' || lower === 'facial' || lower === 'capilar')) {
            category = lower;
            continue;
        }

        if (!name && line.length > 5 && !line.match(/^\d+\./)) {
            name = line;
            continue;
        }

        if (lower.includes('uso em casa') || lower.includes('para continuar o tratamento')) {
            parsingHomeUse = true;
            if (currentStep) { steps.push(currentStep); currentStep = null; }
            continue;
        }

        if (parsingHomeUse) {
            if (lower.includes('manhã:')) { homeUseTime = 'morning'; continue; }
            if (lower.includes('noite:')) { homeUseTime = 'night'; continue; }
            if (homeUseTime && line.match(/^\d+\.\s*/)) {
                homeUse[homeUseTime].push({ instruction: line.replace(/^\d+\.\s*/, ''), productId: null });
            } else if (homeUseTime && line.length > 3) {
                let arr = homeUse[homeUseTime];
                if (arr.length > 0) arr[arr.length-1].instruction += ' ' + line;
                else arr.push({ instruction: line, productId: null });
            }
            continue;
        }

        if (lower.includes('frequência:')) {
            frequency = line.replace(/.*frequência:\s*/i, '').replace(/☐/g, '').trim();
            continue;
        }
        if (lower.includes('associações:')) {
            associations = line.replace(/.*associações:\s*/i, '').replace(/☐/g, '').trim();
            continue;
        }

        const stepMatch = line.match(/^\d+\.\s*(.+)$/);
        if (stepMatch) {
            if (currentStep) steps.push(currentStep);
            currentStep = { id: uid(), phase: stepMatch[1].trim(), instruction: '', productId: null };
            continue;
        }

        if (currentStep && !lower.includes('☐')) {
            currentStep.instruction += (currentStep.instruction ? '\n' : '') + line;
        }
    }
    if (currentStep) steps.push(currentStep);

    const tryMatchProduct = (textInstruction) => {
        const lowerText = textInstruction.toLowerCase();
        let matched = null;
        for (const p of products) {
            if (!isActive(p)) continue;
            const simpleName = p.name.split('-')[0].trim().toLowerCase(); 
            if (lowerText.includes(simpleName)) {
                if (!matched || p.name.length > matched.name.length) matched = p;
            }
        }
        return matched ? matched.id : null;
    };

    steps.forEach(s => { s.productId = tryMatchProduct(s.instruction); });
    homeUse.morning.forEach(h => { h.productId = tryMatchProduct(h.instruction); });
    homeUse.night.forEach(h => { h.productId = tryMatchProduct(h.instruction); });

    onImport({
        id: uid(),
        name,
        description: '',
        category,
        frequency,
        associations,
        concerns: [],
        youtubeUrl: '',
        published: false,
        steps,
        homeUse,
        featuredImage: '',
        featuredLink: '',
        _new: true
    });
    
    setText('');
    setShowImport(false);
  };

  return (
    <div style={{ marginBottom: 20, padding: 18, background: B.purpleLight, borderRadius: 12, border: `1px solid ${B.purple}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: B.purpleDark, fontSize: 16 }}>Importar Protocolo via Texto (PDF)</h3>
          <p style={{ margin: 0, fontSize: 13, color: B.purpleDark }}>Cole o texto extraído do PDF para adiantar o preenchimento.</p>
        </div>
        <button 
          onClick={() => setShowImport(!showImport)}
          style={{ background: B.purple, color: B.white, border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
        >
          {showImport ? '✕ Fechar' : '📄 Importar de PDF'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginTop: 16, borderTop: `1px solid rgba(94, 61, 143, 0.2)`, paddingTop: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 10, color: B.purpleDark }}>
            Abra o PDF, selecione todo o texto do protocolo (Ctrl+C) e cole na caixa abaixo (Ctrl+V). 
            Nós vamos tentar separar o Título, as Fases e as Instruções. Depois é só você revisar e salvar.
          </p>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole o texto do protocolo aqui..."
            style={{ width: '100%', height: '180px', padding: 12, borderRadius: 8, border: '1px solid #CCC', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button 
            onClick={processText}
            style={{ marginTop: 12, background: B.green, color: B.white, border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}
          >
            ▶ Processar e Preencher
          </button>
        </div>
      )}
    </div>
  );
};


// ── Admin XML Importer ────────────────────────────────
const XMLImporter = ({ products, saveProducts }) => {
  const [xmlInput, setXmlInput] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleXMLImport = () => {
    if (!xmlInput.trim()) {
      alert("Cole o código XML antes de processar.");
      return;
    }

    let cleanXmlInput = xmlInput;
    const rssStartIndex = cleanXmlInput.indexOf('<rss');
    if (rssStartIndex !== -1) {
      cleanXmlInput = cleanXmlInput.substring(rssStartIndex);
    } else {
      const firstTagIndex = cleanXmlInput.indexOf('<');
      if (firstTagIndex !== -1) {
        cleanXmlInput = cleanXmlInput.substring(firstTagIndex);
      }
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(cleanXmlInput, "text/xml");
    const items = xmlDoc.getElementsByTagName("item");

    if (!items || items.length === 0) {
      alert("Nenhum <item> encontrado no XML. Verifique se copiou o código correto.");
      return;
    }

    let updatedCount = 0;
    let addedCount = 0;
    const newProducts = [...products];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item.getElementsByTagName("title")[0]?.textContent || item.getElementsByTagName("g:title")[0]?.textContent;
      const priceStr = item.getElementsByTagName("g:price")[0]?.textContent || item.getElementsByTagName("price")[0]?.textContent;
      const image = item.getElementsByTagName("g:image_link")[0]?.textContent || item.getElementsByTagName("image_link")[0]?.textContent || '';
      const link = item.getElementsByTagName("link")[0]?.textContent || item.getElementsByTagName("g:link")[0]?.textContent || '';
      const description = item.getElementsByTagName("description")[0]?.textContent || item.getElementsByTagName("g:description")[0]?.textContent || '';

      if (name && priceStr) {
        let cleanStr = priceStr.replace(/[^\d.,]/g, '');
        let numericPrice = 0;
        if (cleanStr.includes(',') && cleanStr.includes('.')) {
          numericPrice = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
        } else if (cleanStr.includes(',')) {
          numericPrice = parseFloat(cleanStr.replace(',', '.'));
        } else {
          numericPrice = parseFloat(cleanStr);
        }

        const index = newProducts.findIndex(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());

        if (index !== -1) {
          if (newProducts[index].cost !== numericPrice.toString()) {
            newProducts[index] = { 
              ...newProducts[index], 
              cost: numericPrice.toString() 
            };
            updatedCount++;
          }
        } else {
          newProducts.push({
            ...EMPTY_PRODUCT,
            id: uid(),
            name: name.trim(),
            cost: numericPrice.toString(),
            image: image.trim(),
            siteUrl: link.trim(),
            description: description.trim(),
            uso: ['profissional', 'homecare'],
            categories: ['facial']
          });
          addedCount++;
        }
      }
    }

    if (updatedCount > 0 || addedCount > 0) {
      saveProducts(newProducts);
      alert(`${updatedCount} produtos atualizados e ${addedCount} novos produtos cadastrados com sucesso!`);
    } else {
      alert("Processamento concluído. Nenhum produto novo encontrado e os preços já estavam atualizados.");
    }
    setXmlInput('');
    setShowImport(false);
  };

  return (
    <div style={{ marginBottom: 20, padding: 18, background: B.goldLight, borderRadius: 12, border: `1px solid ${B.gold}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#7A5C1E', fontSize: 16 }}>Sincronização via XML</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#7A5C1E' }}>Importe preços e cadastre produtos novos automaticamente.</p>
        </div>
        <button 
          onClick={() => setShowImport(!showImport)}
          style={{ background: B.gold, color: B.white, border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
        >
          {showImport ? '✕ Fechar Importador' : '🔄 Abrir Importador'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginTop: 16, borderTop: `1px solid rgba(200, 169, 110, 0.3)`, paddingTop: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 10, color: '#7A5C1E' }}>
            Abra <a href="https://extratosdaterrapro.com.br/xml/shopping.xml" target="_blank" rel="noreferrer" style={{color: B.purple, fontWeight: 'bold'}}>extratosdaterrapro.com.br/xml/shopping.xml</a>, copie todo o código (Ctrl+A, Ctrl+C) e cole abaixo:
          </p>
          <textarea 
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            placeholder="<rss version='2.0'>... Cole o XML aqui ..."
            style={{ width: '100%', height: '140px', padding: 12, borderRadius: 8, border: '1px solid #CCC', fontFamily: 'monospace', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button 
            onClick={handleXMLImport}
            style={{ marginTop: 12, background: B.purple, color: B.white, border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}
          >
            ▶ Processar XML
          </button>
        </div>
      )}
    </div>
  );
};

// ── Admin Dictionary ──────────────────────────────────
const AdminDictionary = ({ title, items, saveItems, placeholder }) => {
  const [newLabel, setNewLabel] = useState('');
  
  const add = () => {
    if(!newLabel.trim()) return;
    const lbl = newLabel.trim();
    if (!items.find(i => i.label.toLowerCase() === lbl.toLowerCase())) {
        const id = uid();
        saveItems([...items, { id, label: lbl }]);
    }
    setNewLabel('');
  };

  const remove = id => {
    if(window.confirm('Excluir este item? Isso não removerá as marcações existentes nos protocolos, mas elas ficarão sem o selo visual correspondente.'))
      saveItems(items.filter(c => c.id !== id));
  };

  return (
    <div style={{maxWidth: 600}}>
      <h2 style={{margin:'0 0 24px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>{title}</h2>
      <div style={{display:'flex', gap: 10, marginBottom: 20}}>
        <input 
          value={newLabel} 
          onChange={e => setNewLabel(e.target.value)} 
          placeholder={placeholder} 
          style={{flex:1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${B.border}`, fontFamily: 'inherit', outline: 'none'}}
        />
        <Btn onClick={add}>Adicionar</Btn>
      </div>
      <div style={{background: B.white, borderRadius: 12, border: `1px solid ${B.border}`}}>
        {[...items].sort((a,b)=>a.label.localeCompare(b.label)).map((c, i) => (
          <div key={c.id} style={{display:'flex', justifyContent:'space-between', padding: '14px 20px', borderBottom: i < items.length - 1 ? `1px solid ${B.border}` : 'none'}}>
            <span style={{fontWeight: 600, color: B.text}}>{c.label}</span>
            <button onClick={() => remove(c.id)} style={{color: B.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit'}}>✕ Excluir</button>
          </div>
        ))}
        {items.length === 0 && <div style={{padding: 30, textAlign: 'center', color: B.muted}}>Nenhum item cadastrado</div>}
      </div>
    </div>
  );
};

// ── Admin Settings ────────────────────────────────────
// ── Admin Marketing ───────────────────────────────────
const AdminMarketing = ({ marketing, saveMarketing, protocols }) => {
  const [m, setM] = useState(JSON.parse(JSON.stringify(marketing)));
  const [bannerImg, setBannerImg] = useState(null);

  const save = () => { saveMarketing(m); alert('Marketing salvo!'); };

  // Banners
  const addBanner = () => setM(prev=>({...prev, banners:[...prev.banners,{id:uid(),imageUrl:'',link:'',label:'',active:true}]}));
  const updateBanner = (id,field,val) => setM(prev=>({...prev,banners:prev.banners.map(b=>b.id===id?{...b,[field]:val}:b)}));
  const removeBanner = (id) => { if(window.confirm('Remover banner?')) setM(prev=>({...prev,banners:prev.banners.filter(b=>b.id!==id)})); };
  const moveBanner = (id, dir) => {
    const arr = [...m.banners];
    const i = arr.findIndex(b=>b.id===id);
    if(i+dir<0||i+dir>=arr.length) return;
    [arr[i],arr[i+dir]]=[arr[i+dir],arr[i]];
    setM(prev=>({...prev,banners:arr}));
  };
  const handleBannerFile = async (id, file) => {
    if(!file) return;
    const url = await uploadImageSafe(file);
    if(url) updateBanner(id,'imageUrl',url);
  };

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Marketing</h2>
        <Btn onClick={save} sx={{padding:'10px 24px'}}>💾 Salvar tudo</Btn>
      </div>

      {/* Notice Bar */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>🔔 Barra de Aviso</SectionTitle>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <div style={{width:40,height:22,borderRadius:11,background:m.notice.active?B.purple:'#ccc',position:'relative',transition:'background 0.2s',cursor:'pointer'}} onClick={()=>setM(prev=>({...prev,notice:{...prev.notice,active:!prev.notice.active}}))}>
              <div style={{position:'absolute',top:3,left:m.notice.active?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}} />
            </div>
            <span style={{fontSize:13,fontWeight:700,color:m.notice.active?B.purple:B.muted}}>{m.notice.active?'Ativa':'Inativa'}</span>
          </label>
        </div>
        <Field label="Texto do aviso (aceita HTML básico)" value={m.notice.text} onChange={v=>setM(prev=>({...prev,notice:{...prev.notice,text:v}}))} placeholder="Ex: 🌸 Promoção de Abril: frete grátis acima de R$ 300" multi rows={2} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:8}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Cor de fundo</label>
            <input type="color" value={m.notice.bgColor||'#5E3D8F'} onChange={e=>setM(prev=>({...prev,notice:{...prev.notice,bgColor:e.target.value}}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${B.border}`,cursor:'pointer',padding:2}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Cor do texto</label>
            <input type="color" value={m.notice.textColor||'#ffffff'} onChange={e=>setM(prev=>({...prev,notice:{...prev.notice,textColor:e.target.value}}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${B.border}`,cursor:'pointer',padding:2}} />
          </div>
        </div>
        {m.notice.active&&m.notice.text&&(
          <div style={{marginTop:14,borderRadius:8,overflow:'hidden'}}>
            <div style={{fontSize:11,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase'}}>Prévia</div>
            <div style={{background:m.notice.bgColor||B.purple,color:m.notice.textColor||'#fff',padding:'10px 20px',fontSize:13,fontWeight:600,textAlign:'center'}} dangerouslySetInnerHTML={{__html:clean(m.notice.text)}} />
          </div>
        )}
      </div>

      {/* Campaign */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>⭐ Destaque do Mês</SectionTitle>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <div style={{width:40,height:22,borderRadius:11,background:m.campaign.active?B.purple:'#ccc',position:'relative',transition:'background 0.2s',cursor:'pointer'}} onClick={()=>setM(prev=>({...prev,campaign:{...prev.campaign,active:!prev.campaign.active}}))}>
              <div style={{position:'absolute',top:3,left:m.campaign.active?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}} />
            </div>
            <span style={{fontSize:13,fontWeight:700,color:m.campaign.active?B.purple:B.muted}}>{m.campaign.active?'Ativo':'Inativo'}</span>
          </label>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Protocolo em destaque</label>
          <select value={m.campaign.protocolId} onChange={e=>setM(prev=>({...prev,campaign:{...prev.campaign,protocolId:e.target.value}}))} style={{width:'100%',padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit',background:B.white}}>
            <option value="">— Selecione um protocolo —</option>
            {[...protocols].sort((a,b)=>a.name.localeCompare(b.name)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Field label="Título da campanha" value={m.campaign.title} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,title:v}}))} placeholder="Ex: Abril da Limpeza de Pele" />
        <Field label="Subtítulo / descrição" value={m.campaign.subtitle} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,subtitle:v}}))} placeholder="Breve descrição da campanha" multi rows={2} />
      </div>

      {/* Banners */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>🖼️ Banners (Hero)</SectionTitle>
          <Btn size="sm" onClick={addBanner}>+ Adicionar banner</Btn>
        </div>
        {m.banners.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhum banner cadastrado. Adicione um para exibir o carrossel na home.</p>}
        {m.banners.map((b,i)=>(
          <div key={b.id} style={{border:`1px solid ${B.border}`,borderRadius:10,padding:16,marginBottom:12,background:B.cream}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:13,color:B.purpleDark}}>Banner {i+1}</span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>moveBanner(b.id,-1)} disabled={i===0} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===0?0.3:1}}>↑</button>
                <button onClick={()=>moveBanner(b.id,1)} disabled={i===m.banners.length-1} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===m.banners.length-1?0.3:1}}>↓</button>
                <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',padding:'3px 8px',borderRadius:6,border:`1px solid ${b.active?B.purple:B.border}`,background:b.active?B.purpleLight:'none',fontSize:12,fontWeight:700,color:b.active?B.purple:B.muted}}>
                  <input type="checkbox" checked={b.active} onChange={e=>updateBanner(b.id,'active',e.target.checked)} style={{display:'none'}} />
                  {b.active?'Ativo':'Inativo'}
                </label>
                <button onClick={()=>removeBanner(b.id)} style={{background:'none',border:`1px solid ${B.red}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',color:B.red,fontSize:12,fontWeight:700}}>Remover</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.06em'}}>Imagem do banner</label>
                {b.imageUrl&&<img src={b.imageUrl} alt="banner" style={{width:'100%',height:80,objectFit:'cover',borderRadius:8,marginBottom:8,border:`1px solid ${B.border}`}} />}
                <label style={{display:'inline-block',padding:'7px 14px',background:B.purpleLight,color:B.purple,borderRadius:7,fontWeight:700,fontSize:12,cursor:'pointer',border:`1.5px dashed ${B.purple}`}}>
                  📷 {b.imageUrl?'Trocar imagem':'Enviar imagem'}
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>handleBannerFile(b.id,e.target.files[0])} />
                </label>
              </div>
              <div>
                <Field label="Link (interno ou externo)" value={b.link} onChange={v=>updateBanner(b.id,'link',v)} placeholder="Ex: /protocolo/p_001 ou https://..." />
                <Field label="Legenda (opcional)" value={b.label} onChange={v=>updateBanner(b.id,'label',v)} placeholder="Texto alternativo" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Btn onClick={save} sx={{padding:'12px 28px'}}>💾 Salvar Marketing</Btn>
    </div>
  );
};

const AdminSettings = ({ brand, saveBrand }) => {
  const [f, setF] = useState(brand);
  const handleSave = () => { saveBrand(f); alert('Configurações salvas!'); };
  return (
    <div style={{maxWidth:600}}>
      <h2 style={{margin:'0 0 24px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Configurações da Marca</h2>
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24}}>
        <Field label="Nome da Empresa" value={f.companyName} onChange={v=>setF({...f,companyName:v})} />
        <Field label="URL da Logo (Imagem)" value={f.logoUrl} onChange={v=>setF({...f,logoUrl:v})} placeholder="https://..." note="Cole o link da imagem (JPG/PNG). Se vazio, usa ícone padrão." />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Field label="Cor Principal (HEX)" value={f.colorMain} onChange={v=>setF({...f,colorMain:v})} type="color" />
          <Field label="Cor Secundária (HEX)" value={f.colorAccent} onChange={v=>setF({...f,colorAccent:v})} type="color" />
        </div>
        <div style={{marginTop: 16}}>
           <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontWeight:700,fontSize:14}}>
             <input type="checkbox" checked={f.showCalculator} onChange={e=>setF({...f,showCalculator:e.target.checked})} style={{width: 18, height: 18}} />
             Ativar Calculadora de Lucratividade nos Protocolos
           </label>
           <div style={{fontSize:11,color:B.muted,marginTop:4, marginLeft: 26}}>Se ativado, os visitantes poderão calcular o lucro por sessão nas páginas dos protocolos.</div>
        </div>
        <Btn onClick={handleSave} sx={{marginTop: 20}}>💾 Salvar Configurações</Btn>
      </div>
    </div>
  );
};

// ── Admin Panel ───────────────────────────────────────
// ── Admin Users ───────────────────────────────────────
const PERM_LABELS = {
  dashboard:   { label:'Dashboard',    icon:'📊' },
  products:    { label:'Produtos',     icon:'🧴' },
  protocols:   { label:'Protocolos',   icon:'📋' },
  categories:  { label:'Categorias',   icon:'🗂️' },
  indications: { label:'Indicações',   icon:'🏷️' },
  phases:      { label:'Fases',        icon:'⏳' },
  alerts:      { label:'Alertas',      icon:'⚠️' },
  settings:    { label:'Configurações',icon:'⚙️' },
  marketing:   { label:'Marketing',    icon:'📣' },
  users:       { label:'Usuários',     icon:'👥' },
};
const ACTION_LABELS = { view:'Ver', edit:'Editar', delete:'Excluir', publish:'Publicar' };

const AdminUsers = ({ users, saveUsers, loggedUser }) => {
  const EMPTY_USER = { id:'', name:'', password:'', passwordHash:'', perms: EMPTY_PERMS };
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(null);

  const startEdit = (u) => {
    const clone = JSON.parse(JSON.stringify(u));
    setF({ ...clone, password: '' });
    setEditing(u.id||'new');
  };
  const startNew = () => { startEdit({...EMPTY_USER, id: uid()}); };
  const cancel = () => { setEditing(null); setF(null); };

  const doSave = async () => {
    if(!f.name.trim()) return alert('Nome obrigatório');
    const isNew = !users.find(u=>u.id===f.id);
    const nextPassword = f.password.trim();
    const hasExistingPassword = !!f.passwordHash;

    if(!nextPassword && !hasExistingPassword) return alert('Senha obrigatória');
    if(nextPassword && !isStrongPassword(nextPassword)) return alert('Use pelo menos 8 caracteres, com letras e números.');

    let passwordHash = f.passwordHash || '';
    if (nextPassword) {
      passwordHash = await hashSecret(nextPassword);
      if(users.find(u=>u.id!==f.id&&u.passwordHash===passwordHash)) return alert('Esta senha já está em uso por outro usuário.');
    }

    const payload = { ...f, passwordHash };
    delete payload.password;
    saveUsers(isNew ? [...users,payload] : users.map(u=>u.id===f.id?payload:u));
    cancel();
  };

  const doDelete = (id) => {
    if(id===loggedUser.id) return alert('Você não pode excluir seu próprio acesso.');
    if(window.confirm('Excluir este usuário?')) saveUsers(users.filter(u=>u.id!==id));
  };

  const togglePerm = (section, action) => {
    setF(prev => ({
      ...prev,
      perms: { ...prev.perms, [section]: { ...prev.perms[section], [action]: !prev.perms[section][action] } }
    }));
  };

  const toggleAllSection = (section) => {
    const actions = PERM_KEYS[section];
    const allOn = actions.every(a => f.perms[section][a]);
    setF(prev => ({
      ...prev,
      perms: { ...prev.perms, [section]: Object.fromEntries(actions.map(a=>[a, !allOn])) }
    }));
  };

  if (editing !== null && f) return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={cancel} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:20,fontFamily:'Georgia, serif'}}>{editing==='new'?'Novo Usuário':'Editar Usuário'}</h2>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Identificação</SectionTitle>
        <Field label="Nome *" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="Ex: Ana Lima" />
        <Field label={`Senha de Acesso ${f.passwordHash ? '(opcional)' : '*'}`} value={f.password} onChange={v=>setF({...f,password:v})} type="password" placeholder={f.passwordHash ? 'Preencha apenas para trocar a senha' : 'Mínimo 8 caracteres'} note={f.passwordHash ? 'Deixe em branco para manter a senha atual.' : 'Use ao menos 8 caracteres, com letras e números.'} />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <SectionTitle>Permissões</SectionTitle>
        <p style={{margin:'0 0 16px',fontSize:13,color:B.muted}}>Defina o que este usuário pode visualizar, editar ou excluir em cada área.</p>
        <div style={{display:'flex',flexDirection:'column',gap:3}}>
          {Object.entries(PERM_KEYS).map(([section, actions]) => {
            const allOn = actions.every(a=>f.perms[section]?.[a]);
            return (
              <div key={section} style={{display:'flex',alignItems:'center',gap:0,padding:'10px 14px',borderRadius:9,background:allOn?B.purpleLight:B.cream,border:`1px solid ${allOn?B.purple:B.border}`}}>
                <div style={{width:150,display:'flex',alignItems:'center',gap:6,cursor:'pointer'}} onClick={()=>toggleAllSection(section)}>
                  <span style={{fontSize:15}}>{PERM_LABELS[section].icon}</span>
                  <span style={{fontSize:13,fontWeight:700,color:allOn?B.purple:B.text}}>{PERM_LABELS[section].label}</span>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {actions.map(action=>(
                    <label key={action} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',padding:'4px 10px',borderRadius:6,background:f.perms[section]?.[action]?B.purple:'#fff',border:`1px solid ${f.perms[section]?.[action]?B.purple:B.border}`,userSelect:'none'}}>
                      <input type="checkbox" checked={!!f.perms[section]?.[action]} onChange={()=>togglePerm(section,action)} style={{display:'none'}} />
                      <span style={{fontSize:12,fontWeight:700,color:f.perms[section]?.[action]?'#fff':B.muted}}>{ACTION_LABELS[action]||action}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        <Btn onClick={doSave} sx={{padding:'12px 28px'}}>💾 Salvar Usuário</Btn>
        <Btn variant="ghost" onClick={cancel}>Cancelar</Btn>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Usuários ({users.length})</h2>
        <Btn onClick={startNew}>+ Novo Usuário</Btn>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {users.map(u=>(
          <div key={u.id} style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:B.text,marginBottom:4}}>
                {u.name} {u.id===loggedUser.id&&<span style={{background:B.gold,color:'#fff',fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:20,marginLeft:6}}>VOCÊ</span>}
              </div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {Object.entries(u.perms||{}).filter(([,v])=>Object.values(v).some(Boolean)).map(([k])=>(
                  <span key={k} style={{background:B.purpleLight,color:B.purple,fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20}}>{PERM_LABELS[k]?.label}</span>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" variant="secondary" onClick={()=>startEdit(u)}>Editar</Btn>
              {u.id!==loggedUser.id && <Btn size="sm" variant="danger" onClick={()=>doDelete(u.id)}>Excluir</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminPanel = ({ products, protocols, indications, categories, phases, brand, saveProducts, saveProtocols, saveIndications, saveCategories, savePhases, saveBrand, navigate, setLoggedUser, loggedUser, users, saveUsers, marketing, saveMarketing, views }) => {
  const [aView,setAView]=useState(()=>{
    const first = ['dashboard','products','protocols','categories','indications','phases','alerts','settings','users'].find(s=>hasPerm(loggedUser,s,'view'));
    return first||'dashboard';
  });
  const [editProd,setEditProd]=useState(null);
  const [editProt,setEditProt]=useState(null);
  const EMPTY_PROD_FILTERS = { status: 'all', category: 'all', uso: 'all' };
  const EMPTY_PROT_FILTERS = { status: 'all', category: 'all', indication: 'all' };
  const [prodFilters, setProdFilters] = useState(EMPTY_PROD_FILTERS);
  const [prodSearch, setProdSearch] = useState('');
  const [protFilters, setProtFilters] = useState(EMPTY_PROT_FILTERS);
  const [protSearch, setProtSearch] = useState('');

  const nav=[
    {id:'dashboard',  label:'Dashboard',      icon:'📊'},
    {id:'products',   label:'Produtos',        icon:'🧴'},
    {id:'protocols',  label:'Protocolos',      icon:'📋'},
    {id:'categories', label:'Categorias',      icon:'🗂️'},
    {id:'indications',label:'Indicações',      icon:'🏷️'},
    {id:'phases',     label:'Fases (Etapas)',  icon:'⏳'},
    {id:'settings',   label:'Configurações',   icon:'⚙️'},
    {id:'marketing',  label:'Marketing',       icon:'📣'},
    {id:'alerts',     label:'Alertas',         icon:'⚠️'},
    {id:'users',      label:'Usuários',        icon:'👥'},
  ].filter(n=>hasPerm(loggedUser, n.id, 'view'));

  return (
    <div style={{display:'flex',minHeight:'calc(100vh - 58px)',background:B.cream}}>
      <div style={{width:210,background:B.white,borderRight:`1px solid ${B.border}`,padding:'24px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
        <div style={{padding:'0 18px 18px',borderBottom:`1px solid ${B.border}`,marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,color:B.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Painel Admin</div>
          <div style={{background:B.purpleLight,borderRadius:8,padding:'8px 10px'}}>
            <div style={{fontSize:12,fontWeight:700,color:B.purpleDark}}>{loggedUser.name}</div>
            <div style={{fontSize:11,color:B.muted,marginTop:1}}>
              {Object.entries(loggedUser.perms||{}).filter(([,v])=>Object.values(v).some(Boolean)).length} áreas com acesso
            </div>
          </div>
        </div>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>{setAView(n.id);setEditProd(null);setEditProt(null);}}
            style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 18px',background:aView===n.id&&!editProd&&!editProt?B.purpleLight:'none',border:'none',color:aView===n.id&&!editProd&&!editProt?B.purple:B.text,fontWeight:aView===n.id?700:500,fontSize:14,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
            <span style={{fontSize:16}}>{n.icon}</span> {n.label}
          </button>
        ))}
        <div style={{flex:1}} />
        <div style={{borderTop:`1px solid ${B.border}`,padding:'12px 0'}}>
          <button onClick={()=>navigate('/')} style={{display:'block',width:'100%',padding:'9px 18px',background:'none',border:'none',color:B.muted,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>← Ver site público</button>
          <button onClick={()=>{setLoggedUser(null);navigate('/');}} style={{display:'block',width:'100%',padding:'9px 18px',background:'none',border:'none',color:B.red,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>🚪 Sair</button>
        </div>
      </div>
      <div style={{flex:1,padding:28,overflowY:'auto'}}>
        {aView==='dashboard'&&!editProd&&!editProt&&hasPerm(loggedUser,'dashboard','view')&&<AdminDash products={products} protocols={protocols} indications={indications} views={views} />}
        {aView==='alerts'&&!editProd&&!editProt&&hasPerm(loggedUser,'alerts','view')&&<AdminAlerts products={products} protocols={protocols} saveProducts={saveProducts} setEditProt={setEditProt} setAView={setAView} />}
        {aView==='settings'&&!editProd&&!editProt&&hasPerm(loggedUser,'settings','view')&&<AdminSettings brand={brand} saveBrand={saveBrand} />}
        {aView==='marketing'&&!editProd&&!editProt&&hasPerm(loggedUser,'marketing','view')&&<AdminMarketing marketing={marketing} saveMarketing={saveMarketing} protocols={protocols} />}
        {aView==='users'&&!editProd&&!editProt&&hasPerm(loggedUser,'users','view')&&<AdminUsers users={users} saveUsers={saveUsers} loggedUser={loggedUser} />}
        {aView==='categories'&&!editProd&&!editProt&&hasPerm(loggedUser,'categories','view')&&<AdminDictionary title="Gerenciar Categorias (Protocolos)" items={categories} saveItems={hasPerm(loggedUser,'categories','edit')?saveCategories:null} placeholder="Nova categoria (ex: Facial)..." readOnly={!hasPerm(loggedUser,'categories','edit')} />}
        {aView==='indications'&&!editProd&&!editProt&&hasPerm(loggedUser,'indications','view')&&<AdminDictionary title="Gerenciar Indicações" items={indications} saveItems={hasPerm(loggedUser,'indications','edit')?saveIndications:null} placeholder="Nova indicação (ex: Acne)..." readOnly={!hasPerm(loggedUser,'indications','edit')} />}
        {aView==='phases'&&!editProd&&!editProt&&hasPerm(loggedUser,'phases','view')&&<AdminDictionary title="Gerenciar Fases (Etapas)" items={phases} saveItems={hasPerm(loggedUser,'phases','edit')?savePhases:null} placeholder="Nova fase (ex: Higienização)..." readOnly={!hasPerm(loggedUser,'phases','edit')} />}
        {aView==='products'&&!editProd&&hasPerm(loggedUser,'products','view')&&<AdminProducts products={products} categories={categories} saveProducts={saveProducts} setEditProd={setEditProd} filters={prodFilters} setFilters={setProdFilters} search={prodSearch} setSearch={setProdSearch} onClearFilters={()=>{setProdFilters(EMPTY_PROD_FILTERS);setProdSearch('');}} loggedUser={loggedUser} />}
        {aView==='products'&&editProd&&hasPerm(loggedUser,'products','edit')&&<AdminProdForm prod={editProd} products={products} categories={categories} saveProducts={saveProducts} setEditProd={setEditProd} />}
        {aView==='protocols'&&!editProt&&hasPerm(loggedUser,'protocols','view')&&<AdminProtocols products={products} protocols={protocols} indications={indications} categories={categories} saveProtocols={saveProtocols} setEditProt={setEditProt} filters={protFilters} setFilters={setProtFilters} search={protSearch} setSearch={setProtSearch} onClearFilters={()=>{setProtFilters(EMPTY_PROT_FILTERS);setProtSearch('');}} loggedUser={loggedUser} />}
        {aView==='protocols'&&editProt&&hasPerm(loggedUser,'protocols','edit')&&<AdminProtForm prot={editProt} products={products} protocols={protocols} indications={indications} categories={categories} phases={phases} saveProtocols={saveProtocols} saveIndications={saveIndications} savePhases={savePhases} setEditProt={setEditProt} loggedUser={loggedUser} />}
      </div>
    </div>
  );
};

const AdminDash = ({ products, protocols, indications, views }) => {
  const withCost = products.filter(p=>p.cost&&p.yieldApplications);

  const topProtocols = [...protocols]
    .map(p=>({...p, views: views[`protocol_${p.id}`]||0}))
    .sort((a,b)=>b.views-a.views)
    .slice(0,5);

  const topProducts = [...products]
    .map(p=>({...p, views: views[`product_${p.id}`]||0}))
    .filter(p=>p.views>0)
    .sort((a,b)=>b.views-a.views)
    .slice(0,5);

  return (
    <div>
      <h2 style={{margin:'0 0 24px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Dashboard</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:32}}>
        {[
          {l:'Produtos',v:products.length,i:'🧴',bg:B.purpleLight},
          {l:'Publicados',v:protocols.filter(p=>p.published).length,i:'✅',bg:B.greenLight},
          {l:'Rascunhos',v:protocols.filter(p=>!p.published).length,i:'📝',bg:B.goldLight},
          {l:'Com custo',v:withCost.length,i:'💰',bg:B.blueLight},
          {l:'Indicações',v:indications.length,i:'🏷️',bg:B.purpleLight},
        ].map(c=>(
          <div key={c.l} style={{background:c.bg,borderRadius:14,padding:'18px 20px',border:`1px solid ${B.border}`}}>
            <div style={{fontSize:24,marginBottom:6}}>{c.i}</div>
            <div style={{fontSize:30,fontWeight:700,color:B.purpleDark,lineHeight:1}}>{c.v}</div>
            <div style={{fontSize:12,color:B.muted,marginTop:3}}>{c.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:20}}>
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:'20px 24px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,color:B.purpleDark,fontWeight:700}}>👁️ Protocolos mais vistos</h3>
          {topProtocols.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhuma visualização registrada ainda.</p>}
          {topProtocols.map((p,i)=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<topProtocols.length-1?`1px solid ${B.border}`:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:B.muted,width:18}}>{i+1}.</span>
                <span style={{fontSize:13,color:B.text,fontWeight:600,lineHeight:1.3}}>{p.name}</span>
              </div>
              <span style={{background:B.purpleLight,color:B.purple,fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:20,flexShrink:0}}>{p.views} views</span>
            </div>
          ))}
        </div>

        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:'20px 24px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,color:B.purpleDark,fontWeight:700}}>👁️ Produtos mais vistos</h3>
          {topProducts.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhuma visualização registrada ainda.</p>}
          {topProducts.map((p,i)=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<topProducts.length-1?`1px solid ${B.border}`:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:12,fontWeight:700,color:B.muted,width:18}}>{i+1}.</span>
                <span style={{fontSize:13,color:B.text,fontWeight:600,lineHeight:1.3}}>{p.name}</span>
              </div>
              <span style={{background:B.goldLight,color:'#7A5C1E',fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:20,flexShrink:0}}>{p.views} views</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:'20px 24px'}}>
        <h3 style={{margin:'0 0 16px',fontSize:15,color:B.text}}>Todos os Protocolos</h3>
        {protocols.map(p=>(
          <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${B.border}`}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:B.text}}>{p.name}</div>
              <div style={{fontSize:12,color:B.muted}}>{p.steps.length} etapas · {(p.concerns || []).map(c=>indications.find(x=>x.id===c)?.label).join(', ')}</div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {(views[`protocol_${p.id}`]||0)>0&&<span style={{fontSize:11,color:B.muted}}>👁️ {views[`protocol_${p.id}`]}</span>}
              <span style={{padding:'3px 10px',borderRadius:20,background:p.published?B.greenLight:B.goldLight,color:p.published?B.green:'#7A5C1E',fontSize:12,fontWeight:700}}>{p.published?'✅ Publicado':'📝 Rascunho'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminProducts = ({ products, categories, saveProducts, setEditProd, filters, setFilters, search, setSearch, onClearFilters, loggedUser }) => {
  const hasActiveFilters = search || filters.status !== 'all' || filters.category !== 'all' || filters.uso !== 'all';

  const del = id => { if(window.confirm('Excluir produto?')) saveProducts(products.filter(p=>p.id!==id)); };
  const duplicate = (p) => {
    setEditProd({ ...p, id: uid(), name: `${p.name} (Cópia)`, _new: true });
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filters.status === 'all' || (filters.status === 'active' ? isActive(p) : !isActive(p));
    const matchCategory = filters.category === 'all' || (p.categories || [p.category]).includes(filters.category);
    const matchUso = filters.uso === 'all' || (p.uso || []).includes(filters.uso);
    return matchSearch && matchStatus && matchCategory && matchUso;
  });

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Produtos ({products.length})</h2>
        <Btn onClick={()=>setEditProd({...EMPTY_PRODUCT,id:uid(),_new:true})}>+ Novo Produto</Btn>
      </div>

      <XMLImporter products={products} saveProducts={saveProducts} />

      <div style={{background:B.white, padding: '16px 20px', borderRadius: 12, border:`1px solid ${B.border}`, marginBottom: 20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight: 700, color: B.purpleDark, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Filtros de Pesquisa</div>
          {hasActiveFilters && <button onClick={onClearFilters} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:700,color:B.muted,cursor:'pointer',fontFamily:'inherit'}}>✕ Limpar filtros</button>}
        </div>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto por nome..." style={{flex: 1, minWidth: 200, padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit'}} />
           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
             <option value="all">Status: Todos</option>
             <option value="active">🟢 Ativos</option>
             <option value="inactive">🔴 Inativos</option>
           </select>
           <select value={filters.category} onChange={e=>setFilters({...filters, category: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
             <option value="all">Área: Todas</option>
             {[...categories].sort((a,b)=>a.label.localeCompare(b.label)).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
           </select>
           <select value={filters.uso} onChange={e=>setFilters({...filters, uso: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
             <option value="all">Uso: Todos</option>
             <option value="profissional">🏥 Profissional</option>
             <option value="homecare">🏠 Home Care</option>
           </select>
        </div>
        <div style={{marginTop: 12, fontSize: 12, color: B.muted, fontWeight: 600}}>
          Mostrando {filtered.length} de {products.length} produtos
        </div>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,overflow:'hidden'}}>
        {sortByName(filtered).map((p,i)=>{
          const cpa=costPerApp(p);
          return (
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px',borderBottom:i<filtered.length-1?`1px solid ${B.border}`:'none'}}>
              <div>
                <div style={{fontWeight:700,fontSize:14,color:B.text,marginBottom:3}}>{p.name}</div>
                <div style={{fontSize:12,color:B.muted,display:'flex',gap:12}}>
                  <span dangerouslySetInnerHTML={{__html: clean((p.actives||'').slice(0,60) + ((p.actives||'').length>60?'...':''))}} />
                  {cpa!=null&&<span style={{color:B.green,fontWeight:700}}>💰 {fmtCurrency(cpa)}/apl.</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                <div style={{display:'flex',gap:4,flexShrink:0,flexWrap:'wrap'}}>{(p.categories||[p.category]).map(c=><Tag key={c} label={categories.find(cat=>cat.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} />)}{(p.uso||[]).includes('homecare')&&<Tag label='Home Care' color='#E8F5E9' text='#1E7E46' />}{(p.uso||[]).includes('profissional')&&<Tag label='Profissional' color='#EBF5FF' text='#1A56DB' />}{!isActive(p)&&<Tag label='Inativo' color={B.redLight} text={B.red} />}</div>
                {hasPerm(loggedUser,'products','edit')&&<Btn size="sm" variant="secondary" onClick={()=>setEditProd(p)}>Editar</Btn>}
                {hasPerm(loggedUser,'products','edit')&&<Btn size="sm" variant="ghost" onClick={()=>duplicate(p)}>Duplicar</Btn>}
                {hasPerm(loggedUser,'products','edit')&&<button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,active:!isActive(x)}:x))} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${isActive(p)?B.border:B.red}`,background:isActive(p)?B.white:B.redLight,color:isActive(p)?B.muted:B.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{isActive(p)?'Inativar':'Reativar'}</button>}
                {hasPerm(loggedUser,'products','delete')&&<Btn size="sm" variant="danger" onClick={()=>del(p.id)}>✕</Btn>}
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{padding:40,textAlign:'center',color:B.muted}}>Nenhum produto cadastrado nesta aba</div>}
      </div>
    </div>
  );
};

const AdminProdForm = ({ prod, products, categories, saveProducts, setEditProd }) => {
  const [f, setF] = useState({...prod});
  const set = k => v => setF(x=>({...x,[k]:v}));
  const cpa = costPerApp(f);
  const [jsonModal, setJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonErr, setJsonErr] = useState('');

  const applyJson = () => {
    setJsonErr('');
    let parsed;
    try { parsed = JSON.parse(jsonText.trim()); }
    catch { setJsonErr('JSON inválido. Verifique a formatação e tente novamente.'); return; }
    const benefits = Array.isArray(parsed.benefits)
      ? parsed.benefits.join('; ')
      : (parsed.benefits || '');
    setF(x => ({
      ...x,
      ...(parsed.mainFunction && { mainFunction:  parsed.mainFunction }),
      ...(parsed.description  && { description:   parsed.description }),
      ...(benefits            && { benefits }),
      ...(parsed.actives      && { actives:        parsed.actives }),
      ...(parsed.composition  && { composition:    parsed.composition }),
      ...(parsed.differentials && { differentials: parsed.differentials }),
      ...(parsed.howToUse     && { howToUse:       parsed.howToUse }),
      ...(parsed.indications  && { indications:    parsed.indications }),
      ...(parsed.size         && { size:           parsed.size }),
      ...(parsed.faq          && { faq:            parsed.faq }),
    }));
    setJsonModal(false);
    setJsonText('');
  };

  const doSave = () => {
    if(!f.name.trim()) return alert('Nome obrigatório');
    const {_new,...clean}=f;
    if(prod._new) saveProducts([...products,clean]);
    else saveProducts(products.map(p=>p.id===clean.id?clean:p));
    setEditProd(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await uploadImageSafe(file);
    setF(x => ({...x, image: url}));
  };

  return (
    <div style={{maxWidth:680}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        <button onClick={()=>setEditProd(null)} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:20,fontFamily:'Georgia, serif',flex:1}}>{prod._new?'Novo Produto':'Editar Produto'}</h2>
        <button onClick={()=>{setJsonModal(true);setJsonErr('');}} style={{background:B.gold,color:B.white,border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✨ Preencher com IA (Colar JSON)</button>
      </div>

      {jsonModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:B.white,borderRadius:14,padding:28,maxWidth:580,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
            <h3 style={{margin:'0 0 6px',color:B.purpleDark,fontFamily:'Georgia,serif',fontSize:18}}>✨ Preencher com JSON</h3>
            <p style={{margin:'0 0 16px',fontSize:13,color:B.muted,lineHeight:1.5}}>Cole o JSON do produto abaixo. Os campos de texto serão preenchidos automaticamente. Preço, rendimento, foto e links <strong>não serão alterados</strong>.</p>
            <textarea
              value={jsonText}
              onChange={e=>setJsonText(e.target.value)}
              placeholder={'{\n  "name": "Nome do Produto",\n  "mainFunction": "...",\n  ...\n}'}
              style={{width:'100%',height:260,padding:'10px 12px',border:`1.5px solid ${jsonErr?B.red:B.border}`,borderRadius:8,fontSize:12,fontFamily:'monospace',resize:'vertical',boxSizing:'border-box',outline:'none',lineHeight:1.5}}
            />
            {jsonErr && <p style={{margin:'6px 0 0',fontSize:12,color:B.red,fontWeight:600}}>{jsonErr}</p>}
            <div style={{display:'flex',gap:10,marginTop:16}}>
              <button onClick={applyJson} style={{flex:1,background:B.purple,color:B.white,border:'none',padding:'11px 0',borderRadius:8,fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>Aplicar</button>
              <button onClick={()=>{setJsonModal(false);setJsonText('');setJsonErr('');}} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:8,padding:'11px 18px',fontSize:13,cursor:'pointer',color:B.muted,fontFamily:'inherit'}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Identificação</SectionTitle>
        <Field label="Nome do produto *" value={f.name} onChange={set('name')} placeholder="Ex: Ômega 7 Creme de Massagem Corporal" />
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Foto do Produto</label>
          <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
            {f.image && <img src={f.image} alt="produto" style={{width:90,height:90,objectFit:'contain',borderRadius:10,border:`1px solid ${B.border}`,background:B.cream,flexShrink:0}} />}
            <div style={{flex:1}}>
              <label style={{display:'inline-block',padding:'9px 18px',background:B.purpleLight,color:B.purple,borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',border:`1.5px dashed ${B.purple}`}}>
                📷 {f.image?'Trocar foto':'Enviar foto'}
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
              </label>
              {f.image&&<button onClick={()=>setF(x=>({...x,image:''}))} style={{marginLeft:10,background:'none',border:'none',color:B.red,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>✕ Remover</button>}
              <div style={{fontSize:11,color:B.muted,marginTop:6}}>Recomendado: fundo branco, quadrado. JPG ou PNG até 2MB.</div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#6B7280',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Área de Aplicação</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {categories.map(c => {
                const cat = c.id;
                const icons = { facial: '👤', corporal: '💪', capilar: '💆' };
                return (
                <label key={cat} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 14px',borderRadius:8,border:`1.5px solid ${(f.categories||[]).includes(cat)?'#5E3D8F':'#E2D9F3'}`,background:(f.categories||[]).includes(cat)?'#EDE5F5':'#fff',fontWeight:700,fontSize:13,userSelect:'none'}}>
                  <input type="checkbox" checked={(f.categories||[]).includes(cat)} onChange={()=>{const cur=f.categories||[];setF({...f,categories:cur.includes(cat)?cur.filter(x=>x!==cat):[...cur,cat]});}} style={{display:'none'}} />
                  {icons[cat] || '✨'} {c.label}
                </label>
              )})}
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#6B7280',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Tipo de Uso</label>
            <div style={{display:'flex',gap:10}}>
              {[{v:'profissional',l:'🏥 Profissional'},{v:'homecare',l:'🏠 Home Care'}].map(u => (
                <label key={u.v} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 14px',borderRadius:8,border:`1.5px solid ${(f.uso||[]).includes(u.v)?'#5E3D8F':'#E2D9F3'}`,background:(f.uso||[]).includes(u.v)?'#EDE5F5':'#fff',fontWeight:700,fontSize:13,userSelect:'none'}}>
                  <input type="checkbox" checked={(f.uso||[]).includes(u.v)} onChange={()=>{const cur=f.uso||[];setF({...f,uso:cur.includes(u.v)?cur.filter(x=>x!==u.v):[...cur,u.v]});}} style={{display:'none'}} />
                  {u.l}
                </label>
              ))}
            </div>
          </div>
        </div>
        <Field label="Função Principal" value={f.mainFunction} onChange={set('mainFunction')} placeholder="Função principal resumida do produto" />
        <Field label="Badge de Destaque" value={f.badge||''} onChange={set('badge')} placeholder="Ex: Lançamento, Novo, Exclusivo, Black Friday" note="Deixe em branco para não exibir. Aparece como etiqueta sobre o card." />
        <Field label="Link no Site Oficial" value={f.siteUrl} onChange={set('siteUrl')} placeholder="https://extratosdaterrapro.com.br/produto/..." note="URL da página do produto no site" />
        <Field label="Link Ficha Técnica (Google Drive)" value={f.fichaUrl} onChange={set('fichaUrl')} placeholder="https://drive.google.com/file/d/..." note="Pré-preenchido automaticamente do docx" />
        <Field label="Número de Registro ANVISA" value={f.anvisa} onChange={set('anvisa')} placeholder="Ex: 25351.953989/2024-82" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Descrição & Benefícios</SectionTitle>
        <Field label="Descrição Completa" value={f.description} onChange={set('description')} placeholder="Descrição detalhada do produto e seu mecanismo de ação" multi rows={4} />
        <Field label="Benefícios" value={f.benefits} onChange={set('benefits')} placeholder="Liste os benefícios separados por ponto e vírgula" multi rows={3} note="Ex: Hidrata profundamente; Aumenta a elasticidade; Previne o ressecamento" />
        <Field label="Diferenciais" value={f.differentials} onChange={set('differentials')} placeholder="O que torna este produto único" multi rows={3} />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Ingredientes & Técnica</SectionTitle>
        <Field label="Ativos / Ingredientes Principais" value={f.actives} onChange={set('actives')} placeholder="Ex: Blend de óleos vegetais, Ômegas 3, 6, 7 e 9, Óleo de Macadâmia" multi rows={2} />
        <Field label="Modo de Uso (Cabine)" value={f.howToUse} onChange={set('howToUse')} placeholder="Instruções de aplicação profissional" multi rows={3} />
        <Field label="Indicações e Associações" value={f.indications} onChange={set('indications')} placeholder="Para quem é indicado, combinações possíveis" multi rows={2} />
        <Field label="Contraindicações" value={f.contra} onChange={set('contra')} placeholder="Situações em que não deve ser usado" multi rows={2} />
        <Field label="Indicação para Uso em Casa" value={f.homeUseNote} onChange={set('homeUseNote')} placeholder="Como o cliente pode usar em casa, ou produto equivalente retail" multi rows={2} />
        <Field label="Composição (INCI)" value={f.composition} onChange={set('composition')} placeholder="Aqua, Glycerin, Cetearyl Alcohol..." multi rows={4} note="Lista completa de ingredientes na nomenclatura INCI" />
        <Field label="Tamanho / Embalagem" value={f.size} onChange={set('size')} placeholder="Ex: 700g" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Custo & Rendimento</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
          <Field label="Custo do Produto (R$)" value={f.cost} onChange={set('cost')} placeholder="Ex: 89.00" type="number" note="Custo de compra" />
          <Field label="Rendimento (nº aplicações)" value={f.yieldApplications} onChange={set('yieldApplications')} placeholder="Ex: 70" type="number" note="Quantidade de aplicações" />
          <Field label="Qtd por Aplicação (g/ml)" value={f.yieldGramsPerUse} onChange={set('yieldGramsPerUse')} placeholder="Ex: 10" type="number" note="Gramas ou ml por sessão" />
        </div>
        {cpa!=null&&(
          <div style={{background:B.greenLight,border:`1px solid ${B.green}`,borderRadius:10,padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:B.green}}>✅ Custo por Aplicação Calculado</div>
              <div style={{fontSize:12,color:B.muted,marginTop:2}}>R$ {f.cost} ÷ {f.yieldApplications} aplicações</div>
            </div>
            <div style={{fontSize:24,fontWeight:700,color:B.green}}>{fmtCurrency(cpa)}</div>
          </div>
        )}
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>FAQ & Perguntas Frequentes</SectionTitle>
        <Field label="Principais Dúvidas" value={f.faq} onChange={set('faq')} placeholder="Ex: Pode usar em gestantes? Sim, após o 4º mês com orientação médica..." multi rows={5} note="Inclua perguntas e respostas separadas por linha" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <SectionTitle>SEO & Indexação para IA</SectionTitle>
        <Field label="Meta Description" value={f.metaDescription} onChange={set('metaDescription')} placeholder="Descrição de 150-160 caracteres para buscadores e IAs" multi rows={2} note={`${(f.metaDescription||'').length}/160 caracteres`} />
        <Field label="Palavras-chave" value={f.keywords} onChange={set('keywords')} placeholder="hidratação profissional, omega 7, creme massagem corporal..." note="Separe por vírgula. Usadas para indexação em buscadores e respostas de IA." />
      </div>

      <div style={{display:'flex',gap:10}}>
        <Btn onClick={doSave} sx={{padding:'12px 28px'}}>💾 Salvar Produto</Btn>
        <Btn variant="ghost" onClick={()=>setEditProd(null)}>Cancelar</Btn>
      </div>
    </div>
  );
};

// ── Admin Protocol List ───────────────────────────────
const AdminProtocols = ({ products, protocols, indications, categories, saveProtocols, setEditProt, filters, setFilters, search, setSearch, onClearFilters, loggedUser }) => {
  const hasActiveFilters = search || filters.status !== 'all' || filters.category !== 'all' || filters.indication !== 'all';

  const toggle = id => saveProtocols(protocols.map(p=>p.id===id?{...p,published:!p.published}:p));
  const del = id => { if(window.confirm('Excluir protocolo?')) saveProtocols(protocols.filter(p=>p.id!==id)); };
  const moveProtocol = (id, dir) => {
    const arr = [...protocols];
    const i = arr.findIndex(p=>p.id===id);
    if(i+dir<0||i+dir>=arr.length) return;
    [arr[i],arr[i+dir]]=[arr[i+dir],arr[i]];
    saveProtocols(arr);
  };
  const duplicate = (p) => {
    setEditProt({ ...p, id: uid(), name: `${p.name} (Cópia)`, _new: true });
  };
  const newP = () => setEditProt({id:uid(),name:'',description:'',concerns:[],category:'',frequency:'',associations:'',youtubeUrl:'',published:false,steps:[],homeUse:{morning:[],night:[]},_new:true});
  
  const filtered = protocols.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filters.status === 'all' || (filters.status === 'published' ? p.published : !p.published);
    const matchCat = filters.category === 'all' || p.category === filters.category;
    const matchInd = filters.indication === 'all' || (p.concerns && p.concerns.includes(filters.indication));
    return matchSearch && matchStatus && matchCat && matchInd;
  });

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Protocolos ({protocols.length})</h2>
        <Btn onClick={newP}>+ Novo Protocolo</Btn>
      </div>
      
      <TextProtocolImporter onImport={p => setEditProt(p)} products={products} />

      <div style={{background:B.white, padding: '16px 20px', borderRadius: 12, border:`1px solid ${B.border}`, marginBottom: 20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight: 700, color: B.purpleDark, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Filtros de Pesquisa</div>
          {hasActiveFilters && <button onClick={onClearFilters} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:700,color:B.muted,cursor:'pointer',fontFamily:'inherit'}}>✕ Limpar filtros</button>}
        </div>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar protocolo por nome ou descrição..." style={{flex: 1, minWidth: 200, padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit'}} />
          <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
            <option value="all">Status: Todos</option>
            <option value="published">✅ Publicados</option>
            <option value="draft">📝 Rascunhos</option>
          </select>
          <select value={filters.category} onChange={e=>setFilters({...filters, category: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
            <option value="all">Categoria: Todas</option>
            {[...categories].sort((a,b)=>a.label.localeCompare(b.label)).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={filters.indication} onChange={e=>setFilters({...filters, indication: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white}}>
            <option value="all">Indicação: Todas</option>
            {[...indications].sort((a,b)=>a.label.localeCompare(b.label)).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div style={{marginTop: 12, fontSize: 12, color: B.muted, fontWeight: 600}}>
          Mostrando {filtered.length} de {protocols.length} protocolos
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.map(p=>(
          <div key={p.id} style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:'16px 20px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:B.text,marginBottom:5}}>{p.name}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                {(p.concerns || []).map(c=><Tag key={c} label={indications.find(x=>x.id===c)?.label||c} />)}
                <div style={{display:'flex',gap:4,flexShrink:0}}><Tag label={categories.find(c => c.id === p.category)?.label || p.category} color={B.goldLight} text={'#7A5C1E'} />{(p.uso||[]).includes('homecare')&&<Tag label='Home Care' color='#E8F5E9' text='#1E7E46' />}{(p.uso||[]).includes('profissional')&&<Tag label='Profissional' color='#EBF5FF' text='#1A56DB' />}</div>
                <span style={{fontSize:12,color:B.muted}}>{p.steps.length} etapas</span>
                {p.youtubeUrl&&<span style={{fontSize:12,background:'#FF0000',color:B.white,padding:'1px 7px',borderRadius:10,fontWeight:700}}>▶ YT</span>}
                {(()=>{const n=p.steps.filter(s=>s.productId&&!isActive(products.find(x=>x.id===s.productId))).length;return n>0&&<span style={{fontSize:12,background:B.redLight,color:B.red,padding:'2px 8px',borderRadius:10,fontWeight:700,border:`1px solid ${B.red}`}}>⚠️ {n} inativo{n>1?'s':''}</span>;})()}
                {(()=>{const inact=p.steps.filter(s=>s.productId&&!isActive(products.find(x=>x.id===s.productId))).length;return inact>0&&<span style={{fontSize:12,background:B.redLight,color:B.red,padding:'1px 8px',borderRadius:10,fontWeight:700,border:`1px solid ${B.red}`}}>⚠️ {inact} produto{inact>1?'s':''} inativo{inact>1?'s':''}</span>;})()}
              </div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
              {hasPerm(loggedUser,'protocols','publish')
                ? <button onClick={()=>toggle(p.id)} style={{padding:'5px 12px',borderRadius:20,border:'none',background:p.published?B.greenLight:B.goldLight,color:p.published?B.green:'#7A5C1E',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{p.published?'✅ Publicado':'📝 Rascunho'}</button>
                : <span style={{padding:'5px 12px',borderRadius:20,background:p.published?B.greenLight:B.goldLight,color:p.published?B.green:'#7A5C1E',fontSize:12,fontWeight:700}}>{p.published?'✅ Publicado':'📝 Rascunho'}</span>
              }
              {hasPerm(loggedUser,'protocols','edit')&&<button onClick={()=>moveProtocol(p.id,-1)} title="Mover para cima" style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:13}}>↑</button>}
              {hasPerm(loggedUser,'protocols','edit')&&<button onClick={()=>moveProtocol(p.id,1)} title="Mover para baixo" style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'4px 8px',cursor:'pointer',fontSize:13}}>↓</button>}
              {hasPerm(loggedUser,'protocols','edit')&&<Btn size="sm" variant="secondary" onClick={()=>setEditProt(p)}>Editar</Btn>}
              {hasPerm(loggedUser,'protocols','edit')&&<Btn size="sm" variant="ghost" onClick={()=>duplicate(p)}>Duplicar</Btn>}
              {hasPerm(loggedUser,'protocols','delete')&&<Btn size="sm" variant="danger" onClick={()=>del(p.id)}>✕</Btn>}
            </div>
          </div>
        ))}
        {filtered.length===0&&<div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:40,textAlign:'center',color:B.muted}}>Nenhum protocolo encontrado</div>}
      </div>
    </div>
  );
};

// ── Admin Protocol Form ───────────────────────────────
const AdminProtForm = ({ prot, products, protocols, indications, categories, phases, saveProtocols, saveIndications, savePhases, setEditProt, loggedUser }) => {
  const [f,setF]=useState({...prot,steps:[...(prot.steps||[])],homeUse:{morning:[...(prot.homeUse?.morning||[])],night:[...(prot.homeUse?.night||[])]}, concerns: [...(prot.concerns||[])]});
  
  const [newIndication, setNewIndication] = useState('');
  const [showNewIndication, setShowNewIndication] = useState(false);
  
  const [addingPhaseFor, setAddingPhaseFor] = useState(null);
  const [newPhaseLabel, setNewPhaseLabel] = useState('');

  const [draggedIdx, setDraggedIdx] = useState(null);

  // Dropdown de produtos deve conter apenas os ativos E os já selecionados (mesmo que inativos)
  const getProductOptions = (selectedId) => {
      const activeProducts = [...products].filter(p => isActive(p)).sort((a,b)=>a.name.localeCompare(b.name));
      const opts = [{v:'', l:'— Sem produto (equipamento/técnica) —'}];
      
      activeProducts.forEach(p => opts.push({v: p.id, l: p.name}));
      
      if (selectedId) {
          const currentProd = products.find(p => p.id === selectedId);
          if (currentProd && !isActive(currentProd)) {
              opts.push({v: currentProd.id, l: `⚫ [INATIVO] ${currentProd.name}`});
          }
      }
      return opts;
  };
  
  const addStep=()=>setF(x=>({...x,steps:[...x.steps,{id:uid(),phase:'',productId:null,instruction:''}]}));
  const rmStep=id=>setF(x=>({...x,steps:x.steps.filter(s=>s.id!==id)}));
  const updStep=(id,k,v)=>setF(x=>({...x,steps:x.steps.map(s=>s.id===id?{...s,[k]:v}:s)}));
  
  const addHome=sl=>setF(x=>({...x,homeUse:{...x.homeUse,[sl]:[...x.homeUse[sl],{productId:null,instruction:''}]}}));
  const rmHome=(sl,i)=>setF(x=>({...x,homeUse:{...x.homeUse,[sl]:x.homeUse[sl].filter((_,idx)=>idx!==i)}}));
  const updHome=(sl,i,k,v)=>setF(x=>({...x,homeUse:{...x.homeUse,[sl]:x.homeUse[sl].map((h,idx)=>idx===i?{...h,[k]:v}:h)}}));
  
  const togConcern=id=>setF(x=>({...x,concerns:x.concerns.includes(id)?x.concerns.filter(c=>c!==id):[...x.concerns,id]}));
  
  const handleAddIndication = () => {
    if (!newIndication.trim()) return;
    const lbl = newIndication.trim();
    let id;
    const existing = indications.find(i => i.label.toLowerCase() === lbl.toLowerCase());
    if (!existing) {
       id = uid();
       saveIndications([...indications, { id, label: lbl }]);
    } else {
       id = existing.id;
    }
    setF(x => ({...x, concerns: x.concerns.includes(id) ? x.concerns : [...x.concerns, id]}));
    setNewIndication('');
    setShowNewIndication(false);
  };

  const handleAddPhase = (stepId) => {
    if (!newPhaseLabel.trim()) return;
    const lbl = newPhaseLabel.trim();
    const existing = phases.find(p => p.label.toLowerCase() === lbl.toLowerCase());
    if (!existing) {
       const id = uid();
       savePhases([...phases, {id, label: lbl}]);
       updStep(stepId, 'phase', lbl);
    } else {
       updStep(stepId, 'phase', existing.label);
    }
    setAddingPhaseFor(null);
    setNewPhaseLabel('');
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    const newSteps = [...f.steps];
    const draggedItem = newSteps[draggedIdx];
    newSteps.splice(draggedIdx, 1);
    newSteps.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setF({ ...f, steps: newSteps });
  };

  const handleDragEnd = () => setDraggedIdx(null);

  const doSave=(pub=null)=>{
    if(!f.name.trim()) return alert('Nome obrigatório');
    const {_new,...clean}=f;
    if(pub!==null) clean.published=pub;
    if(prot._new) saveProtocols([...protocols,clean]);
    else saveProtocols(protocols.map(p=>p.id===clean.id?clean:p));
    setEditProt(null);
  };
  
  const inpSt={width:'100%',padding:'7px 10px',border:`1.5px solid ${B.border}`,borderRadius:7,fontSize:13,outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:B.white};
  
  // CÁLCULOS DE RENTABILIDADE NO ADMIN
  const protocolProducts = f.steps.filter(s=>s.productId).map(s=>products.find(x=>x.id===s.productId)).filter(Boolean);
  const uniqueProducts = [...new Map(protocolProducts.map(pr=>[pr.id,pr])).values()];
  const totalInvestment = uniqueProducts.reduce((acc, pr) => acc + (parseFloat(pr.cost) || 0), 0);
  const yields = uniqueProducts.map(pr => parseFloat(pr.yieldApplications)).filter(y => y > 0 && !isNaN(y));
  const protocolYield = yields.length > 0 ? Math.min(...yields) : 0;
  const bottleneckProduct = uniqueProducts.find(pr => parseFloat(pr.yieldApplications) === protocolYield);
  const avgCostPerSession = protocolYield > 0 ? totalInvestment / protocolYield : 0;
  
  const phaseOptions = [...phases];
  f.steps.forEach(s => {
      if (s.phase && !phaseOptions.find(p => p.label === s.phase)) {
          phaseOptions.push({ id: uid(), label: s.phase });
      }
  });
  phaseOptions.sort((a,b)=>a.label.localeCompare(b.label));

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={()=>setEditProt(null)} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:20,fontFamily:'Georgia, serif'}}>{prot._new?'Novo Protocolo':'Editar Protocolo'}</h2>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Informações Básicas</SectionTitle>
        <Field label="Nome do protocolo *" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="Ex: Peeling de Diamante – Clareamento" />
        <Field label="Badge de Destaque" value={f.badge||''} onChange={v=>setF({...f,badge:v})} placeholder="Ex: Lançamento, Novo, Exclusivo" note="Aparece como etiqueta dourada sobre o card na home." />
        <Field label="Descrição" value={f.description} onChange={v=>setF({...f,description:v})} placeholder="Objetivo e indicação do protocolo" multi rows={3} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <Sel label="Categoria" value={f.category} onChange={v=>setF({...f,category:v})} options={[{v:'',l:'— Selecione —'}, ...categories.map(c => ({v: c.id, l: c.label}))]} />
          <Field label="Frequência" value={f.frequency} onChange={v=>setF({...f,frequency:v})} placeholder="1 sessão a cada 15 dias" />
        </div>
        <Field label="Associações (equipamentos)" value={f.associations} onChange={v=>setF({...f,associations:v})} placeholder="Ex: Peeling de diamante, LED" />
        <Field label="Link do Vídeo no YouTube" value={f.youtubeUrl} onChange={v=>setF({...f,youtubeUrl:v})} placeholder="https://youtube.com/watch?v=..." note="Aparecerá como botão no protocolo público" />
        
        <div style={{marginTop: 16, paddingTop: 16, borderTop: `1px dashed ${B.border}`}}>
          <div style={{fontSize:12,fontWeight:700,color:B.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Destaque do Protocolo (Rodapé)</div>
          <div style={{display:'flex',gap:14,alignItems:'flex-start', marginBottom: 14}}>
            {f.featuredImage && <img src={f.featuredImage} alt="destaque" style={{width: 120, height: 'auto', objectFit:'contain',borderRadius:10,border:`1px solid ${B.border}`,background:B.cream,flexShrink:0}} />}
            <div style={{flex:1}}>
              <label style={{display:'inline-block',padding:'9px 18px',background:B.purpleLight,color:B.purple,borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',border:`1.5px dashed ${B.purple}`}}>
                📷 {f.featuredImage?'Trocar Imagem':'Enviar Imagem Destaque'}
                <input type="file" accept="image/*" style={{display:'none'}} onChange={async (e)=>{
                  const file = e.target.files[0];
                  if (!file) return;
                  const url = await uploadImageSafe(file);
                  setF(x => ({...x, featuredImage: url}));
                }} />
              </label>
              {f.featuredImage&&<button onClick={(e)=>{e.preventDefault(); setF(x=>({...x,featuredImage:''}));}} style={{marginLeft:10,background:'none',border:'none',color:B.red,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>✕ Remover</button>}
              <div style={{fontSize:11,color:B.muted,marginTop:6}}>Imagem retangular ou quadrada para o final do protocolo.</div>
            </div>
          </div>
          <Field label="Link do Botão Comprar (Imagem Destaque)" value={f.featuredLink} onChange={v=>setF({...f,featuredLink:v})} placeholder="https://..." />
        </div>

        <div>
          <div style={{fontSize:12,fontWeight:700,color:B.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Preocupações / Indicações</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[...indications].sort((a,b)=>a.label.localeCompare(b.label)).map(c=>(
              <button key={c.id} onClick={(e)=>{e.preventDefault(); togConcern(c.id);}} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${f.concerns.includes(c.id)?B.purple:B.border}`,background:f.concerns.includes(c.id)?B.purple:B.white,color:f.concerns.includes(c.id)?B.white:B.text,fontSize:13,cursor:'pointer',fontWeight:700,fontFamily:'inherit'}}>{c.label}</button>
            ))}
            {!showNewIndication ? (
              <button onClick={(e) => {e.preventDefault(); setShowNewIndication(true);}} style={{padding:'6px 14px',borderRadius:20,border:`1.5px dashed ${B.purple}`,background:'transparent',color:B.purple,fontSize:13,cursor:'pointer',fontWeight:700}}>+ Nova Indicação</button>
            ) : (
              <div style={{display:'flex', gap: 5}}>
                 <input 
                    value={newIndication} 
                    onChange={e=>setNewIndication(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddIndication(); } }}
                    placeholder="Nome..." 
                    style={{padding:'6px 10px', borderRadius:20, border:`1px solid ${B.border}`, fontSize:13, outline:'none'}} 
                    autoFocus 
                 />
                 <button onClick={(e)=>{e.preventDefault(); handleAddIndication();}} style={{padding:'6px 10px', borderRadius:20, border:'none', background:B.green, color:B.white, cursor:'pointer', fontWeight:700}}>✓</button>
                 <button onClick={(e)=>{e.preventDefault(); setShowNewIndication(false);}} style={{padding:'6px 10px', borderRadius:20, border:'none', background:B.redLight, color:B.red, cursor:'pointer', fontWeight:700}}>✕</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>Passos em Cabine (Pode arrastar para reordenar)</SectionTitle>
          <Btn size="sm" onClick={(e)=>{e.preventDefault(); addStep();}}>+ Adicionar Etapa</Btn>
        </div>
        {f.steps.map((step,i)=>(
          <div 
            key={step.id} 
            draggable 
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            style={{background: draggedIdx === i ? B.purpleLight : B.cream, borderRadius:10, padding:16, marginBottom:10, border:`1px solid ${draggedIdx === i ? B.purple : B.border}`, cursor: 'grab', opacity: draggedIdx === i ? 0.5 : 1}}
          >
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10, alignItems: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <span style={{cursor: 'grab', fontSize: 18, color: B.muted}}>☰</span>
                <span style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.08em'}}>Etapa {i+1}</span>
              </div>
              <button onClick={(e)=>{e.preventDefault(); rmStep(step.id);}} style={{background:'none',border:'none',color:B.red,cursor:'pointer',fontSize:16,lineHeight:1}}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:10,marginBottom:10}}>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:B.muted,marginBottom:4}}>FASE</div>
                {addingPhaseFor === step.id ? (
                    <div style={{display:'flex', gap: 4}}>
                        <input 
                            autoFocus 
                            value={newPhaseLabel} 
                            onChange={e=>setNewPhaseLabel(e.target.value)} 
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddPhase(step.id); } }}
                            placeholder="Nova fase..." 
                            style={{...inpSt, flex:1}} 
                        />
                        <button onClick={(e) => { e.preventDefault(); handleAddPhase(step.id); }} style={{background:B.green, color:B.white, border:'none', borderRadius:7, padding:'0 10px', cursor:'pointer', fontWeight:'bold'}}>✓</button>
                        <button onClick={(e) => { e.preventDefault(); setAddingPhaseFor(null); setNewPhaseLabel(''); }} style={{background:B.redLight, color:B.red, border:'none', borderRadius:7, padding:'0 10px', cursor:'pointer', fontWeight:'bold'}}>✕</button>
                    </div>
                ) : (
                    <div style={{display:'flex', gap: 4}}>
                        <select value={step.phase} onChange={e=>updStep(step.id,'phase',e.target.value)} style={{...inpSt, flex:1}}>
                            <option value="">— Selecione uma fase —</option>
                            {phaseOptions.map(p=><option key={p.id} value={p.label}>{p.label}</option>)}
                        </select>
                        <button onClick={(e) => { e.preventDefault(); setAddingPhaseFor(step.id); setNewPhaseLabel(''); }} style={{background:B.purpleLight, color:B.purple, border:'none', borderRadius:7, padding:'0 10px', cursor:'pointer', fontWeight:'bold', fontSize:16}}>+</button>
                    </div>
                )}
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:B.muted,marginBottom:4}}>PRODUTO VINCULADO</div>
                <select value={step.productId||''} onChange={e=>updStep(step.id,'productId',e.target.value||null)} style={inpSt}>
                  {getProductOptions(step.productId).map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                {step.productId&&costPerApp(products.find(x=>x.id===step.productId))!=null&&(
                  <div style={{fontSize:11,color:B.green,fontWeight:700,marginTop:3}}>💰 {fmtCurrency(costPerApp(products.find(x=>x.id===step.productId)))}/aplicação</div>
                )}
              </div>
            </div>
            <div>
              <Field multi label="Instrução" value={step.instruction} onChange={v=>updStep(step.id,'instruction',v)} rows={2} />
            </div>
          </div>
        ))}

        {uniqueProducts.length > 0 && totalInvestment > 0 && (
          <div style={{background:B.purpleLight,borderRadius:8,padding:'16px', marginTop:14, border:`1px solid ${B.purple}`}}>
            <div style={{fontSize:14,fontWeight:700,color:B.purpleDark,marginBottom:10}}>📊 Resumo de Rentabilidade do Kit</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
               <div style={{background:B.white, padding:10, borderRadius:8, border:`1px solid ${B.border}`}}>
                 <div style={{fontSize:11, color:B.muted, fontWeight:600, textTransform:'uppercase'}}>Investimento Total</div>
                 <div style={{fontSize:15, fontWeight:'bold', color:B.text, marginTop:4}}>{fmtCurrency(totalInvestment)}</div>
               </div>
               <div style={{background:B.white, padding:10, borderRadius:8, border:`1px solid ${B.border}`}}>
                 <div style={{fontSize:11, color:B.muted, fontWeight:600, textTransform:'uppercase'}}>Rendimento Médio</div>
                 <div style={{fontSize:15, fontWeight:'bold', color:B.purple, marginTop:4}}>{protocolYield} apl.</div>
                 {bottleneckProduct && <div style={{fontSize:10, color:B.muted, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>Gargalo: {bottleneckProduct.name}</div>}
               </div>
               <div style={{background:B.white, padding:10, borderRadius:8, border:`1px solid ${B.border}`}}>
                 <div style={{fontSize:11, color:B.muted, fontWeight:600, textTransform:'uppercase'}}>Custo por Sessão</div>
                 <div style={{fontSize:15, fontWeight:'bold', color:B.green, marginTop:4}}>{fmtCurrency(avgCostPerSession)}</div>
               </div>
            </div>
          </div>
        )}
        
        {f.steps.length===0&&<div style={{textAlign:'center',padding:'16px 0',color:B.muted,fontSize:13}}>Nenhuma etapa adicionada</div>}
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <SectionTitle>Uso em Casa</SectionTitle>
        </div>
        <div style={{fontSize:13,color:B.muted,marginBottom:16}}>Orientações de rotina domiciliar para potencializar os resultados</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
          {[{sl:'morning',icon:'☀️',lbl:'Manhã'},{sl:'night',icon:'🌙',lbl:'Noite'}].map(({sl,icon,lbl})=>(
            <div key={sl}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:B.text}}>{icon} {lbl}</div>
                <Btn size="sm" variant="secondary" onClick={(e)=>{e.preventDefault(); addHome(sl);}}>+ Adicionar</Btn>
              </div>
              {f.homeUse[sl].map((item,i)=>(
                <div key={i} style={{background:B.cream,borderRadius:8,padding:'10px 12px',marginBottom:8,position:'relative'}}>
                  <button onClick={(e)=>{e.preventDefault(); rmHome(sl,i);}} style={{position:'absolute',top:7,right:8,background:'none',border:'none',color:B.red,cursor:'pointer',fontSize:14}}>✕</button>
                  <select value={item.productId||''} onChange={e=>updHome(sl,i,'productId',e.target.value||null)} style={{...inpSt,marginBottom:6,paddingRight:24}}>
                    {getProductOptions(item.productId).map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  <Field multi value={item.instruction} onChange={v=>updHome(sl,i,'instruction',v)} placeholder="Instrução de uso" />
                </div>
              ))}
              {f.homeUse[sl].length===0&&<div style={{fontSize:12,color:B.muted,fontStyle:'italic'}}>Nenhum produto adicionado</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{display:'flex',gap:10}}>
        {hasPerm(loggedUser,'protocols','publish')&&<Btn onClick={(e)=>{e.preventDefault(); doSave(true);}} sx={{flex:1,padding:'12px 0'}}>✅ Salvar e Publicar</Btn>}
        <Btn variant="secondary" onClick={(e)=>{e.preventDefault(); doSave(false);}}>💾 Salvar Rascunho</Btn>
        <Btn variant="ghost" onClick={(e)=>{e.preventDefault(); setEditProt(null);}}>Cancelar</Btn>
      </div>
    </div>
  );
};

// ── Admin Alerts ─────────────────────────────────────
const AdminAlerts = ({ products, protocols, saveProducts, setEditProt, setAView }) => {
  const inactive = products.filter(p => !isActive(p));
  const allIssues = inactive.map(prod => ({
    prod,
    protocols: getAffectedProtocols(prod, protocols),
  })).filter(x => x.protocols.length > 0);

  const orphanProtocols = protocols.filter(prot =>
    prot.steps.some(s => s.productId && !isActive(products.find(x => x.id === s.productId)))
  );

  return (
    <div>
      <h2 style={{margin:'0 0 6px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Alertas de Integridade</h2>
      <p style={{color:B.muted,fontSize:14,margin:'0 0 28px'}}>Protocolos afetados por produtos inativos</p>

      {allIssues.length === 0 && (
        <div style={{background:B.greenLight,borderRadius:14,padding:'36px 28px',textAlign:'center',border:`1px solid ${B.green}`}}>
          <div style={{fontSize:40,marginBottom:12}}>✅</div>
          <div style={{fontSize:16,fontWeight:700,color:B.green}}>Tudo certo!</div>
          <div style={{fontSize:14,color:B.muted,marginTop:4}}>Nenhum protocolo publicado possui produtos inativos vinculados.</div>
        </div>
      )}

      {allIssues.length > 0 && (
        <div style={{background:B.redLight,borderRadius:12,padding:'16px 20px',marginBottom:24,border:`1px solid ${B.red}`,display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:28}}>⚠️</span>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:B.red}}>{allIssues.length} produto{allIssues.length>1?'s inativos afetam':' inativo afeta'} {orphanProtocols.length} protocolo{orphanProtocols.length>1?'s':''}</div>
            <div style={{fontSize:13,color:B.muted,marginTop:2}}>Revise os protocolos abaixo ou reative os produtos.</div>
          </div>
        </div>
      )}

      {allIssues.map(({prod, protocols: affectedProts}) => (
        <div key={prod.id} style={{background:B.white,borderRadius:14,border:`1.5px solid ${B.red}`,padding:'20px 24px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                <span style={{background:B.redLight,color:B.red,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>🚫 INATIVO</span>
              </div>
              <div style={{fontWeight:700,fontSize:16,color:B.text}}>{prod.name}</div>
              {prod.actives && <div style={{fontSize:13,color:B.muted,marginTop:2}}>Ativos: {prod.actives}</div>}
            </div>
            <button
              onClick={() => saveProducts(products.map(x => x.id === prod.id ? {...x, active: true} : x))}
              style={{background:B.green,color:B.white,border:'none',padding:'8px 18px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}
            >
              ✅ Reativar produto
            </button>
          </div>

          <div style={{fontSize:12,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>
            Aparece em {affectedProts.length} protocolo{affectedProts.length>1?'s':''}:
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {affectedProts.map(prot => {
              const inCabine = prot.steps.some(s => s.productId === prod.id);
              const inMorning = prot.homeUse?.morning?.some(h => h.productId === prod.id);
              const inNight = prot.homeUse?.night?.some(h => h.productId === prod.id);
              const where = [inCabine&&'Cabine', inMorning&&'Home Care Manhã', inNight&&'Home Care Noite'].filter(Boolean).join(', ');
              return (
                <div key={prot.id} style={{background:B.cream,borderRadius:10,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:B.text}}>{prot.name}</div>
                    <div style={{fontSize:12,color:B.muted,marginTop:2}}>Utilizado em: {where}</div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    <span style={{padding:'3px 10px',borderRadius:20,background:prot.published?B.greenLight:B.goldLight,color:prot.published?B.green:'#7A5C1E',fontSize:11,fontWeight:700,flexShrink:0}}>
                      {prot.published?'✅ Publicado':'📝 Rascunho'}
                    </span>
                    <Btn size="sm" variant="secondary" onClick={()=>{setEditProt(prot); setAView('protocols');}}>Editar Protocolo</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Root ──────────────────────────────────────────────
export default function App() {
  const [loading,setLoading]=useState(true);
  const [products,setProducts]=useState([]);
  const [protocols,setProtocols]=useState([]);
  const [indications,setIndications]=useState([]);
  const [categories,setCategories]=useState([]);
  const [phases,setPhases]=useState([]);
  const [brand,setBrand]=useState(INIT_BRAND);
  const [users,setUsers]=useState(INIT_USERS);
  const [marketing,setMarketing]=useState(INIT_MARKETING);
  const [views,setViews]=useState({});
  const [favorites,setFavorites]=useState([]);
  const [loggedUser,setLoggedUser]=useState(null);
  const [path, navigate] = useRoute();

  useEffect(()=>{
    (async()=>{
      setProducts(await load(PRODUCTS_KEY,INIT_PRODUCTS));
      setProtocols(await load(PROTOCOLS_KEY,INIT_PROTOCOLS));
      setIndications(await load(INDICATIONS_KEY,INIT_INDICATIONS));
      setCategories(await load(CATEGORIES_KEY,INIT_CATEGORIES));
      setPhases(await load(PHASES_KEY,INIT_PHASES));
      const loadedUsers = await load(USERS_KEY,INIT_USERS);
      const securedUsers = await secureUsersForStorage(loadedUsers);
      setUsers(securedUsers);
      if (JSON.stringify(loadedUsers) !== JSON.stringify(securedUsers)) await save(USERS_KEY, securedUsers);
      setMarketing(await load(MARKETING_KEY,INIT_MARKETING));
      setViews(await load(VIEWS_KEY,{}));
      const b = await load(BRAND_KEY,INIT_BRAND);
      setBrand(b);
      if (b.colorMain) B.purple = b.colorMain;
      if (b.colorAccent) B.gold = b.colorAccent;
      const sessionUserId = getStoredAdminSessionId();
      if (sessionUserId) {
        const restoredUser = securedUsers.find(u => u.id === sessionUserId);
        if (restoredUser) setLoggedUser(restoredUser);
        else setStoredAdminSessionId('');
      }
      setLoading(false);
    })();
  },[]);

  const saveProd=async d=>{setProducts(d);await save(PRODUCTS_KEY,d);};
  const saveProt=async d=>{setProtocols(d);await save(PROTOCOLS_KEY,d);};
  const saveInd=async d=>{setIndications(d);await save(INDICATIONS_KEY,d);};
  const saveCat=async d=>{setCategories(d);await save(CATEGORIES_KEY,d);};
  const savePha=async d=>{setPhases(d);await save(PHASES_KEY,d);};
  const saveUsersDb=async d=>{
    const securedUsers = await secureUsersForStorage(d);
    setUsers(securedUsers);
    setLoggedUser(prev => {
      if (!prev) return prev;
      const refreshedUser = securedUsers.find(u => u.id === prev.id);
      return refreshedUser || null;
    });
    await save(USERS_KEY,securedUsers);
  };
  const saveMarketing=async d=>{setMarketing(d);await save(MARKETING_KEY,d);};
  const handleView=async(type,id)=>{
    const key=`${type}_${id}`;
    const updated={...views,[key]:(views[key]||0)+1};
    setViews(updated);
    await save(VIEWS_KEY,updated);
  };
  const saveBr=async d=>{
    setBrand(d);
    if (d.colorMain) B.purple = d.colorMain;
    if (d.colorAccent) B.gold = d.colorAccent;
    await save(BRAND_KEY,d);
  };

  useEffect(() => {
    setStoredAdminSessionId(loggedUser?.id || '');
  }, [loggedUser]);

  useEffect(() => {
    if (!loggedUser) return;
    const refreshedUser = users.find(u => u.id === loggedUser.id);
    if (!refreshedUser) {
      setLoggedUser(null);
      setStoredAdminSessionId('');
      return;
    }
    if (refreshedUser !== loggedUser) setLoggedUser(refreshedUser);
  }, [users, loggedUser]);

  if(loading) return <div style={{background:B.cream,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:B.purple,fontFamily:'Georgia, serif',fontSize:16}}>Carregando...</div>;

  let view = 'home';
  let activeProt = null;
  let activeProd = null;

  if (path === '/busca') {
    view = 'search';
  } else if (path === '/login') {
    view = 'admin_login';
  } else if (path === '/admin') {
    view = loggedUser ? 'admin' : 'admin_login';
  } else if (path.startsWith('/protocolo/')) {
    view = 'protocol';
    const id = path.replace('/protocolo/', '');
    activeProt = protocols.find(p => p.id === id);
  } else if (path.startsWith('/produto/')) {
    view = 'product';
    const id = path.replace('/produto/', '');
    activeProd = products.find(p => p.id === id);
  }

  if ((view === 'protocol' && !activeProt) || (view === 'product' && !activeProd)) {
    if (!loading) view = 'home'; 
  }

  return (
    <div style={{fontFamily:"'Segoe UI', system-ui, sans-serif",color:B.text,background:B.cream, display: 'flex', flexDirection: 'column', minHeight: '100vh'}}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } button, input, select, textarea { font-family: inherit; }` + RESPONSIVE_CSS}</style>
      <Header navigate={navigate} adminAuth={!!loggedUser} setAdminAuth={v=>{ if(!v) setLoggedUser(null); }} brand={brand} />
      <NoticeBanner notice={marketing?.notice} />
      {view==='home'       &&<PublicHome protocols={protocols} products={products} indications={indications} categories={categories} favorites={favorites} setFavorites={setFavorites} navigate={navigate} brand={brand} marketing={marketing} />}
      {view==='product'    &&activeProd&&<PublicProductPage product={activeProd} protocols={protocols} categories={categories} navigate={navigate} brand={brand} onView={handleView} />}
      {view==='protocol'   &&activeProt&&<ProtocolDetail protocol={activeProt} products={products} indications={indications} categories={categories} navigate={navigate} brand={brand} onView={handleView} />}
      {view==='search'     &&<ProductSearch products={products} protocols={protocols} indications={indications} categories={categories} navigate={navigate} />}
      {view==='admin_login'&&<AdminLogin setLoggedUser={setLoggedUser} navigate={navigate} brand={brand} users={users} />}
      {view==='admin'      &&loggedUser&&<AdminPanel products={products} protocols={protocols} indications={indications} categories={categories} phases={phases} brand={brand} saveProducts={saveProd} saveProtocols={saveProt} saveIndications={saveInd} saveCategories={saveCat} savePhases={savePha} saveBrand={saveBr} navigate={navigate} setLoggedUser={setLoggedUser} loggedUser={loggedUser} users={users} saveUsers={saveUsersDb} marketing={marketing} saveMarketing={saveMarketing} views={views} />}
      {view!=='admin'      &&<AppFooter brand={brand} />}
    </div>
  );
}
