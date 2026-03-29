import { useState, useEffect, useRef, useCallback } from "react";

// ── DOMPurify (Segurança contra scripts maliciosos) ──
let purifyInstance = null;
const getPurify = () => {
  if (purifyInstance) return Promise.resolve(purifyInstance);
  if (window.DOMPurify) { purifyInstance = window.DOMPurify; return Promise.resolve(purifyInstance); }
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.1.6/purify.min.js';
    s.onload = () => { purifyInstance = window.DOMPurify; resolve(purifyInstance); };
    document.head.appendChild(s);
  });
};
const clean = (html) => (window.DOMPurify ? window.DOMPurify.sanitize(html) : html);
getPurify();

// ── Supabase Config ──────────────────────────────────
const SUPABASE_URL  = "https://jwpsptwqcjhmnicuhgyw.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cHNwdHdxY2pobW5pY3VoZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTI5NDUsImV4cCI6MjA5MDE4ODk0NX0.RjWrKGjziNAKDZH-OjE-SlIwihhmzUW_42n01V0atE4";

let supabaseInstance = null;
const getSupabase = async () => {
  if (supabaseInstance) return supabaseInstance;
  const script = document.createElement('script');
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/dist/umd/supabase.min.js";
  return new Promise((resolve) => {
    script.onload = () => {
      supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
      resolve(supabaseInstance);
    };
    document.head.appendChild(script);
  });
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

// ── Hook de Roteamento via Hash ───────────────────────
const useRoute = () => {
  const getPath = () => window.location.hash.replace(/^#/, '') || '/';
  const [path, setPath] = useState(getPath);
  useEffect(() => {
    const h = () => setPath(getPath());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const navigate = useCallback((p) => {
    window.location.hash = p;
    window.scrollTo(0, 0);
  }, []);
  return [path, navigate];
};

const useIsMobile = (bp = 768) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.innerWidth < bp);
  useEffect(() => {
    const h = () => setM(window.innerWidth < bp);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [bp]);
  return m;
};

// ── Estilos Globais e Layout do Admin Otimizado ────────
const RESPONSIVE_CSS = `
  * { box-sizing: border-box; }
  .rp-grid-proto { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)) !important; }
  .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; display: block; }
  .no-scrollbar::-webkit-scrollbar { display: none; }
  
  .admin-layout { display: flex; flex-direction: row; min-height: calc(100vh - 60px); }
  .admin-sidebar { width: 240px; border-right: 1px solid #E2D9F3; display: flex; flex-direction: column; padding: 20px; background: white; flex-shrink: 0; }
  .admin-content { flex: 1; padding: 30px; overflow-y: auto; }
  .admin-menu { display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .admin-menu-btn { padding: 12px 16px; border: none; background: transparent; text-align: left; cursor: pointer; font-weight: 700; border-radius: 8px; color: #6B7280; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
  .admin-menu-btn:hover { background: #F7F4F0; color: #1A1A2E; }
  .admin-menu-btn.active { background: #EDE5F5; color: #5E3D8F; }
  
  .admin-item { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #E2D9F3; }
  .admin-item:last-child { border-bottom: none; }
  .admin-item-actions { display: flex; gap: 8px; align-items: center; }

  @media (max-width: 768px) { 
    .rp-grid-proto { grid-template-columns: 1fr !important; } 
    
    /* Layout Admin Mobile - Estilo App */
    .admin-layout { flex-direction: column; }
    .admin-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #E2D9F3; padding: 12px 16px; background: #fff; position: sticky; top: 60px; z-index: 50; }
    .admin-menu { flex-direction: row; overflow-x: auto; padding-bottom: 4px; gap: 8px; scroll-snap-type: x mandatory; }
    .admin-menu-btn { white-space: nowrap; padding: 8px 14px; font-size: 13px; border-radius: 20px; border: 1px solid #E2D9F3; background: #fff; color: #6B7280; scroll-snap-align: start; }
    .admin-menu-btn:hover { background: #fff; }
    .admin-menu-btn.active { background: #5E3D8F; color: #fff; border-color: #5E3D8F; }
    .admin-content { padding: 16px; }
    
    /* Cartões de Lista no Mobile */
    .admin-item { flex-direction: column; align-items: flex-start; gap: 14px; padding: 16px; border: 1px solid #E2D9F3; border-radius: 12px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .admin-item-actions { flex-wrap: wrap; width: 100%; justify-content: stretch; }
    .admin-item-actions button { flex: 1; text-align: center; justify-content: center; padding: 10px 0; }
  }
  @media print { 
    .no-print { display: none !important; } 
    .print-only { display: block !important; } 
    .avoid-break { page-break-inside: avoid !important; } 
    body { background: white !important; } 
  }
`;

const B = {
  purple: '#5E3D8F', purpleDark: '#2C1F40', purpleLight: '#EDE5F5', purpleMid: '#8B6AB0',
  gold: '#C8A96E', goldLight: '#FBF5E8', cream: '#F7F4F0', white: '#FFFFFF',
  text: '#1A1A2E', muted: '#6B7280', border: '#E2D9F3', green: '#1E7E46',
  greenLight: '#E8F5E9', red: '#C0392B', redLight: '#FDECEA', blue: '#1A56DB', blueLight: '#EBF5FF',
};

// ── RBAC Config ───────────────────────────────────────
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

const FULL_PERMS = Object.fromEntries(Object.entries(PERM_KEYS).map(([k,a]) => [k, Object.fromEntries(a.map(x=>[x,true]))]));
const EMPTY_PERMS = Object.fromEntries(Object.entries(PERM_KEYS).map(([k,a]) => [k, Object.fromEntries(a.map(x=>[x,false]))]));

const INIT_BRAND = { companyName: 'Extratos da Terra', logoUrl: '', colorMain: '#5E3D8F', colorAccent: '#C8A96E', showCalculator: false };

const INIT_USERS = [{ id: 'u_admin', name: 'Administrador Principal', email: 'contato@141criacoes.com', password: 'extratos2024', perms: FULL_PERMS }];

const INIT_MARKETING = { banners: [], notice: { active: false, text: '' }, campaign: { active: false, protocolId: '', title: '' } };

const EMPTY_PRODUCT = {
  id:'', name:'', categories:['facial'], uso:['profissional'], active:true, image:'', mainFunction:'', benefits:'', description:'',
  actives:'', differentials:'', howToUse:'', indications:'', contra:'', size:'',
  yieldApplications:'', yieldGramsPerUse:'', cost:'', anvisa:'', faq:'', composition:'',
  homeUseNote:'', siteUrl:'', metaDescription:'', keywords:'', badge:'',
};

// ── Supabase & Utils ──────────────────────────────────
const load = async (key, fallback) => {
  try {
    const sb = await getSupabase();
    const { data, error } = await sb.from('app_data').select('value').eq('key', key).single();
    if (!error && data) return data.value;
  } catch (e) { console.warn('Load error:', e); }
  return fallback;
};

const save = async (key, val) => {
  try {
    const sb = await getSupabase();
    await sb.from('app_data').upsert({ key, value: val }, { onConflict: 'key' });
  } catch (e) { console.warn('Save error:', e); }
};

const uploadImageSafe = async (file) => new Promise(async (resolve) => {
  try {
    const sb = await getSupabase();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uid()}.${fileExt}`;
    const { error } = await sb.storage.from('images').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = sb.storage.from('images').getPublicUrl(fileName);
    resolve(publicUrl);
  } catch (e) {
    const reader = new FileReader();
    reader.onload = (ev) => resolve(ev.target.result);
    reader.readAsDataURL(file);
  }
});

const uid = () => Math.random().toString(36).slice(2, 9);
const hasPerm = (u, s, a) => !!u?.perms?.[s]?.[a];
const fmtCurrency = v => v != null ? `R$ ${parseFloat(v).toFixed(2).replace('.', ',')}` : '—';
const costPerApp = p => {
  const c = parseFloat(p?.cost), y = parseFloat(p?.yieldApplications);
  return (c && y) ? c / y : null;
};
const isActive = p => p?.active !== false;

// ── Atoms ─────────────────────────────────────────────
const Tag = ({ label, color = B.purpleLight, text = B.purple, size = 'sm' }) => <span style={{ background:color, color:text, padding:size==='sm'?'2px 10px':'4px 14px', borderRadius:20, fontSize:size==='sm'?11:13, fontWeight:700, whiteSpace:'nowrap', display:'inline-block' }}>{label}</span>;
const Btn = ({ children, onClick, variant='primary', size='md', sx={}, disabled=false }) => {
  const v = { primary:{background:B.purple,color:B.white}, secondary:{background:'transparent',color:B.purple,border:`1.5px solid ${B.purple}`}, ghost:{background:'transparent',color:B.muted,border:`1px solid ${B.border}`}, danger:{background:B.redLight,color:B.red, border:`1px solid ${B.red}`} };
  const s = { sm:'5px 12px', md:'9px 20px', lg:'12px 28px' };
  return <button onClick={onClick} disabled={disabled} style={{...v[variant], padding:s[size], borderRadius:8, fontWeight:700, fontSize:size==='sm'?12:14, cursor:disabled?'not-allowed':'pointer', border:v[variant].border||'none', fontFamily:'inherit', opacity:disabled?0.6:1, ...sx}}>{children}</button>;
};
const Field = ({ label, value, onChange, placeholder, type='text', multi=false, rows=3, note }) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:5,textTransform:'uppercase'}}>{label}</label>}
    {multi ? 
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:'inherit',outline:'none',resize:'vertical',lineHeight:1.5}} /> :
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:'inherit',outline:'none'}} />
    }
    {note && <div style={{fontSize:11,color:B.muted,marginTop:4}}>{note}</div>}
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div style={{marginBottom:14}}>
    {label && <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:5,textTransform:'uppercase'}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:`1px solid ${B.border}`,fontSize:14,fontFamily:'inherit',outline:'none',background:B.white}}>
      {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>
);

const SectionTitle = ({ children }) => <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.1em',borderBottom:`2px solid ${B.purpleLight}`,paddingBottom:8,marginBottom:16,marginTop:8}}>{children}</div>;
const InfoText = ({ text }) => text ? <div style={{fontSize:14,color:B.text,lineHeight:1.75,margin:0, whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={{ __html: clean(text) }} /> : null;
const Logo = ({ brand, size = 34 }) => brand?.logoUrl ? <img src={brand.logoUrl} alt="Logo" style={{ height: size, objectFit: 'contain' }} /> : <div style={{width:size,height:size,background:`linear-gradient(135deg, ${B.gold}, #e8b96a)`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size/2,color:B.white}}>🌿</div>;
const BuyLink = ({ href, children, isMobile, sx = {} }) => href ? <a href={href} target="_blank" rel="noreferrer" className="no-print" style={{ background: B.purpleDark, color: B.white, padding: isMobile ? '8px 14px' : '9px 22px', borderRadius: 8, fontWeight: 700, fontSize: isMobile ? 12 : 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, ...sx }}>🛒 {children || 'Comprar'}</a> : null;

// ── Marketing & UI Components ─────────────────────────
const NoticeBanner = ({ notice }) => {
  const [closed, setClosed] = useState(false);
  if (!notice?.active || !notice?.text || closed) return null;
  return (
    <div style={{background: notice.bgColor||B.purple, color: notice.textColor||'#fff', padding:'10px 30px 10px 20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600, position:'relative', zIndex:100}}>
      <span dangerouslySetInnerHTML={{__html: clean(notice.text)}} style={{textAlign: 'center'}} />
      <button onClick={()=>setClosed(true)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:18,lineHeight:1,padding:0,opacity:0.7,position:'absolute',right:12}}>×</button>
    </div>
  );
};

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
      <img src={cur.imageUrl} alt={cur.label||'Banner'} style={{width:'100%', height:380, objectFit:'cover', display:'block'}} loading="lazy" />
      {active.length>1&&(
        <div style={{position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6}}>
          {active.map((_,i)=>(
            <button key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:i===idx?24:8,height:8,borderRadius:4,background:i===idx?'#fff':'rgba(255,255,255,0.5)',border:'none',cursor:'pointer',padding:0,transition:'width 0.3s'}} />
          ))}
        </div>
      )}
    </div>
  );
};

const CampaignSection = ({ campaign, protocols, navigate }) => {
  if(!campaign?.active || !campaign?.protocolId) return null;
  const prot = (protocols||[]).find(p=>p.id===campaign.protocolId);
  if(!prot) return null;
  return (
    <div style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, #3d2060 100%)`, padding:'32px 24px', marginBottom:0}}>
      <div style={{maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:16}}>
        <div style={{display:'flex', alignItems:'center'}}>
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

// ── Tooltip Inteligente (Modal Segura no Mobile) ──────
const ProductTooltip = ({ product: p, children, navigate }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({top:0,left:0});
  const triggerRef = useRef(null), popoverRef = useRef(null);
  const cpa = costPerApp(p);
  const isMobile = useIsMobile(768); 

  const calcPos = () => {
    if (!triggerRef.current || isMobile) return; 
    const r = triggerRef.current.getBoundingClientRect();
    const popW = 320;
    const popH = 280; 
    const spaceRight = window.innerWidth - r.left;
    const left = spaceRight < popW + 16 ? Math.max(8, r.right - popW) : r.left;
    let top = r.bottom + 8;
    if (top + popH > window.innerHeight && r.top > popH) { top = r.top - popH - 8; }
    setPos({ top, left });
  };

  const handleOpen = () => { calcPos(); setOpen(true); };

  useEffect(() => {
    const close = e => { 
      if (triggerRef.current && !triggerRef.current.contains(e.target) && popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false); 
    };
    if(open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (isMobile && open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; }
  }, [isMobile, open]);

  return (
    <span style={{display:'inline-block'}}>
      <span ref={triggerRef} style={{display:'inline-flex', alignItems:'center', gap:4}}>
        {children}
        <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); open ? setOpen(false) : handleOpen(); }} style={{cursor:'pointer', width:18,height:18,borderRadius:'50%',background:B.purple,color:B.white,fontSize:11,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',marginLeft:4}}>i</span>
      </span>
      {open && (
        isMobile ? (
          <div style={{position:'fixed', zIndex:9999, inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div ref={popoverRef} style={{background:B.white, borderRadius:16, padding:24, width:'100%', maxWidth:360, position:'relative', boxShadow:'0 10px 40px rgba(0,0,0,0.2)', maxHeight:'85vh', display:'flex', flexDirection:'column'}}>
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} style={{position:'absolute', top:16, right:16, background:'none', border:'none', fontSize:22, color:B.muted, cursor:'pointer'}}>✕</button>
              
              <div style={{overflowY:'auto', paddingRight:8, marginTop: 10}}>
                <div style={{fontWeight:700,fontSize:18,color:B.purpleDark,marginBottom:16,lineHeight:1.3, paddingRight:16}}>{p.name}</div>
                {p.actives && <div style={{fontSize:13, color: B.text, marginBottom: 16, lineHeight: 1.5, background:B.cream, padding:12, borderRadius:8}} dangerouslySetInnerHTML={{__html: clean(`<strong>Ativos:</strong> ${p.actives}`)}} />}
                {p.indications && <div style={{fontSize:13, color: B.text, marginBottom: 16, lineHeight: 1.5}} dangerouslySetInnerHTML={{__html: clean(`<strong>Indicações:</strong> ${p.indications}`)}} />}
                {cpa != null && <div style={{background: B.greenLight, padding: 12, borderRadius: 8, display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 13, marginBottom: 16}}><span style={{fontWeight:600}}>Custo por aplicação</span><span style={{fontWeight:800, color: B.green, fontSize:15}}>{fmtCurrency(cpa)}</span></div>}
              </div>

              <div style={{display:'flex', gap: 10, flexDirection:'column', marginTop: 10}}>
                 <Btn size="md" variant="secondary" sx={{width:'100%'}} onClick={()=>{setOpen(false); navigate(`/produto/${p.id}`);}}>Ficha Completa</Btn>
                 {p.siteUrl && <BuyLink href={p.siteUrl} isMobile sx={{width:'100%', padding:'12px 0'}} />}
              </div>
            </div>
          </div>
        ) : (
          <div ref={popoverRef} style={{position:'fixed',zIndex:9999,top:pos.top,left:pos.left,width:320,background:B.white,border:`1.5px solid ${B.purple}`,borderRadius:12,boxShadow:'0 12px 40px rgba(0,0,0,0.22)',padding:'18px', maxHeight:'70vh', overflowY:'auto'}}>
            <div style={{fontWeight:700,fontSize:14,color:B.purpleDark,marginBottom:10}}>{p.name}</div>
            {p.actives && <div style={{fontSize:12, color: B.text, marginBottom: 12, lineHeight: 1.4}} dangerouslySetInnerHTML={{__html: clean(`<strong>Ativos:</strong> ${p.actives}`)}} />}
            {cpa != null && <div style={{background: B.greenLight, padding: 8, borderRadius: 8, display:'flex', justifyContent:'space-between', fontSize: 13, marginBottom: 12}}><span style={{fontWeight:600}}>Custo/aplicação</span><span style={{fontWeight:700, color: B.green}}>{fmtCurrency(cpa)}</span></div>}
            <div style={{display:'flex', gap: 6}}>
               <Btn size="sm" variant="secondary" sx={{flex:1}} onClick={()=>{setOpen(false); navigate(`/produto/${p.id}`);}}>Ver mais</Btn>
               {p.siteUrl && <BuyLink href={p.siteUrl} isMobile sx={{flex:1}} />}
            </div>
          </div>
        )
      )}
    </span>
  );
};

// ── Admin Sub-Views ───────────────────────────────────
const AdminDash = ({ products, protocols, indications, views }) => {
  const withCost = (products||[]).filter(p=>p.cost&&p.yieldApplications);
  const topProtocols = [...(protocols||[])].map(p=>({...p, views: views[`protocol_${p.id}`]||0})).sort((a,b)=>b.views-a.views).slice(0,5);
  const topProducts = [...(products||[])].map(p=>({...p, views: views[`product_${p.id}`]||0})).filter(p=>p.views>0).sort((a,b)=>b.views-a.views).slice(0,5);

  return (
    <div>
      <h2 style={{margin:'0 0 24px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Dashboard</h2>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:16,marginBottom:32}}>
        {[
          {l:'Produtos',v:(products||[]).length,i:'🧴',bg:B.purpleLight},
          {l:'Publicados',v:(protocols||[]).filter(p=>p.published).length,i:'✅',bg:B.greenLight},
          {l:'Rascunhos',v:(protocols||[]).filter(p=>!p.published).length,i:'📝',bg:B.goldLight},
          {l:'Com custo',v:withCost.length,i:'💰',bg:B.blueLight},
          {l:'Indicações',v:(indications||[]).length,i:'🏷️',bg:B.purpleLight},
        ].map(c=>(
          <div key={c.l} style={{background:c.bg,borderRadius:14,padding:'18px 20px',border:`1px solid ${B.border}`}}>
            <div style={{fontSize:24,marginBottom:6}}>{c.i}</div>
            <div style={{fontSize:30,fontWeight:700,color:B.purpleDark,lineHeight:1}}>{c.v}</div>
            <div style={{fontSize:12,color:B.muted,marginTop:3}}>{c.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:20,marginBottom:20}}>
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:'20px 24px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,color:B.purpleDark,fontWeight:700}}>👁️ Protocolos mais vistos</h3>
          {topProtocols.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhuma visualização registrada.</p>}
          {topProtocols.map((p,i)=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<topProtocols.length-1?`1px solid ${B.border}`:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,fontWeight:700,color:B.muted,width:18}}>{i+1}.</span><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.name}</span></div>
              <span style={{background:B.purpleLight,color:B.purple,fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:20}}>{p.views} views</span>
            </div>
          ))}
        </div>
        <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:'20px 24px'}}>
          <h3 style={{margin:'0 0 16px',fontSize:15,color:B.purpleDark,fontWeight:700}}>👁️ Produtos mais vistos</h3>
          {topProducts.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhuma visualização registrada.</p>}
          {topProducts.map((p,i)=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<topProducts.length-1?`1px solid ${B.border}`:'none'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,fontWeight:700,color:B.muted,width:18}}>{i+1}.</span><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.name}</span></div>
              <span style={{background:B.goldLight,color:'#7A5C1E',fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:20}}>{p.views} views</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminMarketing = ({ marketing, saveMarketing, protocols }) => {
  const [m, setM] = useState(marketing);
  const saveAll = () => { saveMarketing(m); alert('Marketing atualizado!'); };
  
  const addBanner = () => setM(prev=>({...prev, banners:[...(prev.banners||[]),{id:uid(),imageUrl:'',link:'',label:'',active:true}]}));
  const updateBanner = (id,field,val) => setM(prev=>({...prev,banners:(prev.banners||[]).map(b=>b.id===id?{...b,[field]:val}:b)}));
  const removeBanner = (id) => { if(window.confirm('Remover banner?')) setM(prev=>({...prev,banners:(prev.banners||[]).filter(b=>b.id!==id)})); };
  const moveBanner = (id, dir) => {
    const arr = [...(m.banners||[])];
    const i = arr.findIndex(b=>b.id===id);
    if(i+dir<0||i+dir>=arr.length) return;
    [arr[i],arr[i+dir]]=[arr[i+dir],arr[i]];
    setM(prev=>({...prev,banners:arr}));
  };

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Marketing</h2>
        <Btn onClick={saveAll} sx={{padding:'10px 24px'}}>💾 Salvar tudo</Btn>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>🔔 Barra de Aviso</SectionTitle>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <div style={{width:40,height:22,borderRadius:11,background:m.notice?.active?B.purple:'#ccc',position:'relative',transition:'background 0.2s'}} onClick={()=>setM(prev=>({...prev,notice:{...prev.notice,active:!prev.notice?.active}}))}>
              <div style={{position:'absolute',top:3,left:m.notice?.active?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}} />
            </div>
            <span style={{fontSize:13,fontWeight:700,color:m.notice?.active?B.purple:B.muted}}>{m.notice?.active?'Ativa':'Inativa'}</span>
          </label>
        </div>
        <Field label="Texto do aviso (aceita HTML básico)" value={m.notice?.text||''} onChange={v=>setM(prev=>({...prev,notice:{...prev.notice,text:v}}))} placeholder="Ex: 🌸 Promoção de Abril: frete grátis..." multi rows={2} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:8}}>
          <div><label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6}}>Cor de fundo</label><input type="color" value={m.notice?.bgColor||'#5E3D8F'} onChange={e=>setM(prev=>({...prev,notice:{...prev.notice,bgColor:e.target.value}}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${B.border}`,cursor:'pointer',padding:2}} /></div>
          <div><label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6}}>Cor do texto</label><input type="color" value={m.notice?.textColor||'#ffffff'} onChange={e=>setM(prev=>({...prev,notice:{...prev.notice,textColor:e.target.value}}))} style={{width:'100%',height:40,borderRadius:8,border:`1px solid ${B.border}`,cursor:'pointer',padding:2}} /></div>
        </div>
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>⭐ Destaque do Mês</SectionTitle>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <div style={{width:40,height:22,borderRadius:11,background:m.campaign?.active?B.purple:'#ccc',position:'relative',transition:'background 0.2s'}} onClick={()=>setM(prev=>({...prev,campaign:{...prev.campaign,active:!prev.campaign?.active}}))}>
              <div style={{position:'absolute',top:3,left:m.campaign?.active?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}} />
            </div>
            <span style={{fontSize:13,fontWeight:700,color:m.campaign?.active?B.purple:B.muted}}>{m.campaign?.active?'Ativo':'Inativo'}</span>
          </label>
        </div>
        <div style={{marginBottom:12}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase'}}>Protocolo em destaque</label>
          <select value={m.campaign?.protocolId||''} onChange={e=>setM(prev=>({...prev,campaign:{...prev.campaign,protocolId:e.target.value}}))} style={{width:'100%',padding:'9px 12px',border:`1px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',background:B.white}}>
            <option value="">— Selecione um protocolo —</option>
            {[...(protocols||[])].sort((a,b)=>a.name.localeCompare(b.name)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Field label="Título da campanha" value={m.campaign?.title||''} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,title:v}}))} placeholder="Ex: Abril da Limpeza de Pele" />
        <Field label="Subtítulo / descrição" value={m.campaign?.subtitle||''} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,subtitle:v}}))} placeholder="Breve descrição da campanha" multi rows={2} />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>🖼️ Banners (Hero)</SectionTitle>
          <Btn size="sm" onClick={addBanner}>+ Adicionar banner</Btn>
        </div>
        {(m.banners||[]).length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhum banner cadastrado.</p>}
        {(m.banners||[]).map((b,i)=>(
          <div key={b.id} style={{border:`1px solid ${B.border}`,borderRadius:10,padding:16,marginBottom:12,background:B.cream}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:13,color:B.purpleDark}}>Banner {i+1}</span>
              <div style={{display:'flex',gap:6}}>
                <button onClick={()=>moveBanner(b.id,-1)} disabled={i===0} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===0?0.3:1}}>↑</button>
                <button onClick={()=>moveBanner(b.id,1)} disabled={i===(m.banners||[]).length-1} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===(m.banners||[]).length-1?0.3:1}}>↓</button>
                <label style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',padding:'3px 8px',borderRadius:6,border:`1px solid ${b.active?B.purple:B.border}`,background:b.active?B.purpleLight:'none',fontSize:12,fontWeight:700,color:b.active?B.purple:B.muted}}>
                  <input type="checkbox" checked={b.active} onChange={e=>updateBanner(b.id,'active',e.target.checked)} style={{display:'none'}} />
                  {b.active?'Ativo':'Inativo'}
                </label>
                <button onClick={()=>removeBanner(b.id)} style={{background:'none',border:`1px solid ${B.red}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',color:B.red,fontSize:12,fontWeight:700}}>Remover</button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase'}}>Imagem do banner</label>
                <input value={b.imageUrl} onChange={e=>updateBanner(b.id,'imageUrl',e.target.value)} placeholder="URL da Imagem" style={{width:'100%',padding:'8px',border:`1px solid ${B.border}`,borderRadius:6}} />
              </div>
              <div>
                <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase'}}>Link (Destino)</label>
                <input value={b.link} onChange={e=>updateBanner(b.id,'link',e.target.value)} placeholder="Ex: /protocolo/prot1" style={{width:'100%',padding:'8px',border:`1px solid ${B.border}`,borderRadius:6}} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminUsers = ({ users, saveUsers, loggedUser }) => {
  const EMPTY_USER = { id:'', name:'', email:'', password:'', perms: EMPTY_PERMS };
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(null);

  const startEdit = (u) => { setF(JSON.parse(JSON.stringify(u))); setEditing(u.id||'new'); };
  const startNew = () => { startEdit({...EMPTY_USER, id: uid()}); };
  const cancel = () => { setEditing(null); setF(null); };

  const doSave = () => {
    if(!f.name.trim() || !f.password.trim()) return alert('Nome e senha são obrigatórios');
    if(users.find(u=>u.id!==f.id&&u.password===f.password)) return alert('Esta senha já está em uso por outro utilizador.');
    const isNew = !users.find(u=>u.id===f.id);
    saveUsers(isNew ? [...users,f] : users.map(u=>u.id===f.id?f:u));
    cancel();
  };

  const doDelete = (id) => {
    if(id===loggedUser.id) return alert('Não pode excluir a sua própria conta.');
    if(window.confirm('Excluir este utilizador?')) saveUsers(users.filter(u=>u.id!==id));
  };

  const togglePerm = (s, a) => setF({ ...f, perms: { ...f.perms, [s]: { ...f.perms[s], [a]: !f.perms[s][a] } } });

  if (editing !== null && f) return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:24}}>
        <button onClick={cancel} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:20,fontFamily:'Georgia, serif'}}>{editing==='new'?'Novo Acesso':'Editar Acesso'}</h2>
      </div>
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Identificação</SectionTitle>
        <Field label="Nome *" value={f.name} onChange={v=>setF({...f,name:v})} placeholder="Ex: Ana Lima" />
        <Field label="E-mail *" value={f.email} onChange={v=>setF({...f,email:v})} type="email" placeholder="Ex: contato@..." note="Pode ser usado no login (opcional)." />
        <Field label="Senha de Acesso *" value={f.password} onChange={v=>setF({...f,password:v})} type="password" note="Senha para login no painel." />
      </div>
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <SectionTitle>Permissões</SectionTitle>
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {Object.entries(PERM_KEYS).map(([section, actions]) => (
              <div key={section} style={{display:'flex',alignItems:'center',gap:0,padding:'10px 14px',borderRadius:9,background:B.cream,border:`1px solid ${B.border}`}}>
                <div style={{width:150}}><span style={{fontSize:13,fontWeight:700,color:B.text,textTransform:'capitalize'}}>{section}</span></div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {actions.map(action=>(
                    <label key={action} style={{display:'flex',alignItems:'center',gap:5,cursor:'pointer',padding:'4px 10px',borderRadius:6,background:f.perms[section]?.[action]?B.purple:'#fff',border:`1px solid ${f.perms[section]?.[action]?B.purple:B.border}`,userSelect:'none'}}>
                      <input type="checkbox" checked={!!f.perms[section]?.[action]} onChange={()=>togglePerm(section,action)} style={{display:'none'}} />
                      <span style={{fontSize:12,fontWeight:700,color:f.perms[section]?.[action]?'#fff':B.muted}}>{action}</span>
                    </label>
                  ))}
                </div>
              </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',gap:10}}><Btn onClick={doSave}>💾 Salvar Permissões</Btn></div>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Equipa e Acessos</h2>
        <Btn onClick={startNew}>+ Novo Acesso</Btn>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {users.map(u=>(
          <div key={u.id} className="admin-item" style={{background:B.white,borderRadius:12}}>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:B.text,marginBottom:4}}>{u.name} {u.id===loggedUser.id&&<Tag label="VOCÊ" color={B.gold} text="#fff" />}</div>
              <div style={{fontSize:13, color:B.muted}}>E-mail: {u.email || 'Não definido'}</div>
              <div style={{fontSize:13, color:B.muted, marginTop:4}}>Senha: {u.password}</div>
            </div>
            <div className="admin-item-actions">
              <Btn size="sm" variant="secondary" onClick={()=>startEdit(u)}>Editar</Btn>
              {u.id!==loggedUser.id && <Btn size="sm" variant="danger" onClick={()=>doDelete(u.id)}>Remover</Btn>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminProductList = ({ products, categories, saveProducts, loggedUser }) => {
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState('');
  const filtered = (products||[]).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  if(edit) return <AdminProdForm prod={edit} products={products} categories={categories} saveProducts={saveProducts} setEditProd={setEdit} />;
  
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}><h2>Produtos ({(products||[]).length})</h2>{hasPerm(loggedUser,'products','edit') && <Btn onClick={()=>setEdit({...EMPTY_PRODUCT,id:uid(),_new:true})}>+ Novo</Btn>}</div>
      <div style={{marginBottom: 20}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar produto..." style={{width:'100%', padding:12, borderRadius:8, border:`1px solid ${B.border}`, outline:'none'}} /></div>
      <div style={{background:'#fff', borderRadius:12, border:`1px solid ${B.border}`}}>
        {filtered.map(p=>(
          <div key={p.id} className="admin-item">
            <div>
              <div style={{fontWeight:700,marginBottom:4}}>{p.name} {!isActive(p)&&<span style={{color:B.red,fontSize:11}}> (Inativo)</span>}</div>
              <div style={{fontSize:12,color:B.muted}} dangerouslySetInnerHTML={{__html: clean((p.actives||'').slice(0,60))}} />
            </div>
            <div className="admin-item-actions">
              {hasPerm(loggedUser,'products','edit') && <Btn size="sm" variant="secondary" onClick={()=>setEdit(p)}>Editar</Btn>}
              {hasPerm(loggedUser,'products','edit') && <Btn size="sm" variant="ghost" onClick={()=>setEdit({...p, id:uid(), name:`${p.name} (Cópia)`, _new:true})}>Duplicar</Btn>}
              {hasPerm(loggedUser,'products','edit') && <Btn size="sm" variant={isActive(p)?'ghost':'secondary'} onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,active:!isActive(x)}:x))}>{isActive(p)?'Inativar':'Reativar'}</Btn>}
              {hasPerm(loggedUser,'products','delete') && <Btn size="sm" variant="danger" onClick={()=>{ if(window.confirm('Excluir?')) saveProducts(products.filter(x=>x.id!==p.id)); }}>✕</Btn>}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{padding:20, textAlign:'center'}}>Nenhum produto encontrado.</div>}
      </div>
    </div>
  );
};

const AdminProdForm = ({ prod, products, categories, saveProducts, setEditProd }) => {
  const [f, setF] = useState({...prod});
  const set = k => v => setF(x=>({...x,[k]:v}));
  const cpa = costPerApp(f);
  
  const doSave = () => {
    if(!f.name.trim()) return alert('Nome obrigatório');
    const {_new,...clean}=f;
    if(prod._new) saveProducts([...(products||[]),clean]);
    else saveProducts((products||[]).map(p=>p.id===clean.id?clean:p));
    setEditProd(null);
  };

  return (
    <div style={{maxWidth:680}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
        <Btn variant="ghost" size="sm" onClick={()=>setEditProd(null)}>← Voltar</Btn>
      </div>

      <div style={{background:B.white, padding:24, borderRadius:12, border:`1px solid ${B.border}`}}>
        <SectionTitle>Identificação</SectionTitle>
        <Field label="Nome do produto *" value={f.name} onChange={set('name')} />
        <Field label="Badge de Destaque" value={f.badge||''} onChange={set('badge')} placeholder="Ex: Lançamento" />
        <Field label="Função Principal" value={f.mainFunction} onChange={set('mainFunction')} />
        <Field label="URL do Site Oficial" value={f.siteUrl} onChange={set('siteUrl')} />
        
        <SectionTitle>Ficha Técnica</SectionTitle>
        <Field label="Descrição" value={f.description} onChange={set('description')} multi rows={4} />
        <Field label="Ativos" value={f.actives} onChange={set('actives')} multi />
        <Field label="Composição (INCI)" value={f.composition} onChange={set('composition')} multi />
        <Field label="Modo de Uso" value={f.howToUse} onChange={set('howToUse')} multi />
        
        <SectionTitle>Custo e Rendimento</SectionTitle>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:10}}>
          <Field label="Custo (R$)" type="number" value={f.cost} onChange={set('cost')} />
          <Field label="Rendimento (aplic.)" type="number" value={f.yieldApplications} onChange={set('yieldApplications')} />
          <Field label="Tamanho (g/ml)" value={f.size} onChange={set('size')} />
        </div>
        {cpa != null && <div style={{background:B.greenLight, padding:15, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}><span style={{fontWeight:700}}>Custo Calculado:</span><span style={{fontSize:20, fontWeight:700, color:B.green}}>{fmtCurrency(cpa)}</span></div>}
        <div style={{marginTop: 30}}><Btn onClick={doSave} sx={{width:'100%', padding:'14px 0'}}>Salvar Produto</Btn></div>
      </div>
    </div>
  );
};

const AdminProtocolList = ({ protocols, saveProtocols, products, categories, indications, phases, loggedUser }) => {
  const [edit, setEdit] = useState(null);
  const [search, setSearch] = useState('');
  const filtered = (protocols||[]).filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  if(edit) return <AdminProtForm prot={edit} products={products} protocols={protocols} categories={categories} indications={indications} phases={phases} saveProtocols={saveProtocols} setEditProt={setEdit} loggedUser={loggedUser} />;
  
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}><h2>Protocolos ({(protocols||[]).length})</h2>{hasPerm(loggedUser,'protocols','edit') && <Btn onClick={()=>setEdit({id:uid(), name:'', published:true, steps:[], concerns:[], homeUse:{morning:[],night:[]}, _new:true})}>+ Novo</Btn>}</div>
      <div style={{marginBottom: 20}}><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar protocolo..." style={{width:'100%', padding:12, borderRadius:8, border:`1px solid ${B.border}`, outline:'none'}} /></div>
      <div style={{background:'#fff', borderRadius:12, border:`1px solid ${B.border}`}}>
        {filtered.map(p=>(
          <div key={p.id} className="admin-item">
            <div><div style={{fontWeight:700}}>{p.name}</div><div style={{fontSize:12, color:B.muted}}>{p.published?'✅ Publicado':'📝 Rascunho'}</div></div>
            <div className="admin-item-actions">
              {hasPerm(loggedUser,'protocols','edit') && <Btn size="sm" variant="secondary" onClick={()=>setEdit(p)}>Editar</Btn>}
              {hasPerm(loggedUser,'protocols','delete') && <Btn size="sm" variant="danger" onClick={()=>{ if(window.confirm('Excluir?')) saveProtocols(protocols.filter(x=>x.id!==p.id)); }}>Excluir</Btn>}
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{padding:20, textAlign:'center'}}>Nenhum protocolo encontrado.</div>}
      </div>
    </div>
  );
};

const AdminProtForm = ({ prot, products, protocols, categories, phases, saveProtocols, setEditProt, loggedUser }) => {
  const [f, setF] = useState({...prot, steps:[...(prot.steps||[])]});
  const doSave = () => { 
    if(!f.name.trim()) return alert('Nome obrigatório'); 
    const {_new,...clean}=f;
    saveProtocols(prot._new ? [...(protocols||[]), clean] : (protocols||[]).map(x=>x.id===clean.id?clean:x)); 
    setEditProt(null); 
  };
  const addStep = () => setF({...f, steps:[...(f.steps||[]), {id:uid(), phase:'', productId:'', instruction:''}]});
  const rmStep = (id) => setF({...f, steps: (f.steps||[]).filter(s=>s.id!==id)});
  const updStep = (id, k, v) => setF({...f, steps: (f.steps||[]).map(s=>s.id===id?{...s,[k]:v}:s)});

  return (
    <div style={{maxWidth:700}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
        <Btn variant="ghost" size="sm" onClick={()=>setEditProt(null)}>← Voltar</Btn>
      </div>
      <div style={{background:B.white, padding:24, borderRadius:12, border:`1px solid ${B.border}`}}>
        <SectionTitle>Dados do Protocolo</SectionTitle>
        <Field label="Nome" value={f.name} onChange={v=>setF({...f, name:v})} />
        <Field label="Descrição" value={f.description} onChange={v=>setF({...f, description:v})} multi rows={3} />
        <Sel label="Categoria" value={f.category} onChange={v=>setF({...f, category:v})} options={[{v:'',l:'-'},...(categories||[]).map(c=>({v:c.id,l:c.label}))]} />
        {hasPerm(loggedUser,'protocols','publish') && <label style={{display:'flex',gap:8,margin:'10px 0'}}><input type="checkbox" checked={f.published} onChange={e=>setF({...f, published:e.target.checked})} /> Publicado (Visível no site)</label>}
        
        <SectionTitle>Etapas em Cabine</SectionTitle>
        {(f.steps||[]).map((s,i)=>(
          <div key={s.id} style={{background:B.cream, padding:15, borderRadius:8, marginBottom:10, border:`1px solid ${B.border}`}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}><strong>Etapa {i+1}</strong> <button onClick={()=>rmStep(s.id)} style={{color:B.red, border:'none', background:'none', cursor:'pointer'}}>✕</button></div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:10}}>
              <Sel label="Fase" value={s.phase} onChange={v=>updStep(s.id,'phase',v)} options={[{v:'',l:'-'},...(phases||[]).map(p=>({v:p.label,l:p.label}))]} />
              <Sel label="Produto" value={s.productId} onChange={v=>updStep(s.id,'productId',v)} options={[{v:'',l:'Equipamento/Manual'},...(products||[]).map(p=>({v:p.id,l:p.name}))]} />
            </div>
            <Field label="Instrução" value={s.instruction} onChange={v=>updStep(s.id,'instruction',v)} multi rows={2} />
          </div>
        ))}
        <Btn size="sm" variant="secondary" onClick={addStep}>+ Adicionar Etapa</Btn>

        <Btn onClick={doSave} sx={{width:'100%', marginTop:30, padding:'15px 0'}}>Salvar Protocolo</Btn>
      </div>
    </div>
  );
};

const AdminAlerts = ({ products, protocols }) => {
  const allIssues = (products||[]).filter(p => !isActive(p)).map(prod => ({
    prod, protocols: getAffectedProtocols(prod, protocols||[]),
  })).filter(x => x.protocols.length > 0);

  return (
    <div>
      <h2 style={{marginBottom:20}}>Alertas</h2>
      {allIssues.length === 0 ? <p>Nenhum alerta. Tudo certo!</p> : allIssues.map(({prod, protocols}) => (
        <div key={prod.id} style={{background:B.redLight, padding:20, borderRadius:12, marginBottom:15}}>
          <h4 style={{color:B.red}}>{prod.name} (Inativo) está em uso!</h4>
          <ul>{protocols.map(pt=><li key={pt.id}>{pt.name}</li>)}</ul>
        </div>
      ))}
    </div>
  );
};

const AdminDictionary = ({ title, items, saveItems, readOnly }) => {
  const [val, setVal] = useState('');
  return (
    <div style={{maxWidth:600}}>
      <h3 style={{marginBottom:10}}>{title}</h3>
      <div style={{background:B.white, padding:20, borderRadius:12, border:`1px solid ${B.border}`, marginTop:10}}>
        {!readOnly && (
          <div style={{display:'flex', gap:10, marginBottom:20}}>
            <input value={val} onChange={e=>setVal(e.target.value)} placeholder="Novo item..." style={{flex:1, padding:10, borderRadius:8, border:`1px solid ${B.border}`}} />
            <Btn onClick={()=>{ if(val.trim()){ saveItems([...(items||[]), {id:uid(), label:val.trim()}]); setVal(''); } }}>Adicionar</Btn>
          </div>
        )}
        {(items||[]).map(i=>(
          <div key={i.id} style={{padding:10, borderBottom:`1px solid ${B.border}`, display:'flex', justifyContent:'space-between'}}>
            <span>{i.label}</span>
            {!readOnly && <button onClick={()=>{ if(window.confirm('Remover?')) saveItems((items||[]).filter(x=>x.id!==i.id)); }} style={{color:B.red, border:'none', background:'none', cursor:'pointer'}}>✕</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminBrand = ({ brand, saveBrand }) => {
  const [f, setF] = useState(brand);
  return (
    <div style={{maxWidth:500}}>
      <h2>Configurações da Marca</h2>
      <div style={{background:B.white, padding:24, borderRadius:12, border:`1px solid ${B.border}`, marginTop:20}}>
        <Field label="Nome da Empresa" value={f.companyName} onChange={v=>setF({...f, companyName:v})} />
        <Field label="URL da Logo" value={f.logoUrl} onChange={v=>setF({...f, logoUrl:v})} />
        <label style={{display:'flex',gap:8,margin:'20px 0'}}><input type="checkbox" checked={f.showCalculator} onChange={e=>setF({...f, showCalculator:e.target.checked})} /> Ativar Calculadora de Lucro</label>
        <Btn onClick={()=>{saveBrand(f); alert('Salvo!');}}>Salvar Marca</Btn>
      </div>
    </div>
  );
};

// ── Admin Login ───────────────────────────────────────
const AdminLogin = ({ setLoggedUser, navigate, brand, users }) => {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState(false);
  
  const tryLogin = () => {
    // Permite login por email OR senha se o email no banco estiver vazio
    const found = users.find(u => (!u.email || u.email.toLowerCase() === email.trim().toLowerCase()) && u.password === pwd);
    if(found){ setLoggedUser(found); navigate('/admin'); }
    else { setErr(true); setPwd(''); setTimeout(()=>setErr(false),2500); }
  };
  
  return (
    <div style={{background:B.cream, flex: 1, display:'flex',alignItems:'center',justifyContent:'center', padding: 20}}>
      <div style={{background:B.white,borderRadius:18,padding:'44px 40px',width:'100%',maxWidth:380,boxShadow:'0 8px 50px rgba(44,31,64,0.12)',border:`1px solid ${B.border}`}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 16}}><Logo brand={brand} size={56}/></div>
          <h2 style={{margin:'0 0 6px',color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Área Administrativa</h2>
          <p style={{color:B.muted,fontSize:14,margin:0}}>Acesso restrito à equipe interna</p>
        </div>
        <Field label="E-mail de Acesso" value={email} onChange={setEmail} type="email" placeholder="seu@email.com" />
        <Field label="Senha" value={pwd} onChange={setPwd} type="password" placeholder="Digite sua senha" />
        {err&&<div style={{background:B.redLight,color:B.red,padding:'9px 14px',borderRadius:8,fontSize:13,fontWeight:600,marginBottom:14}}>❌ E-mail ou senha incorretos</div>}
        <Btn onClick={tryLogin} sx={{width:'100%',padding:'12px 0',borderRadius:10,fontSize:15}}>Entrar no Painel</Btn>
        <button onClick={()=>navigate('/')} style={{width:'100%',marginTop:12,background:'none',border:'none',color:B.muted,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>← Voltar ao site</button>
      </div>
    </div>
  );
};

// ── Public Pages ──────────────────────────────────────
const PublicHome = ({ protocols, products, categories, indications, navigate, marketing, brand }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  
  const pub = (protocols||[]).filter(p=>p.published);
  const filtered = pub.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description||'').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || p.category === catFilter || (p.categories||[]).includes(catFilter);
    return matchSearch && matchCat;
  });

  return (
    <div style={{flex:1}}>
      <NoticeBanner notice={marketing?.notice} />
      <HeroBanner banners={marketing?.banners} navigate={navigate} />
      <CampaignSection campaign={marketing?.campaign} protocols={protocols} navigate={navigate} />
      
      <div style={{maxWidth:1100, margin:'0 auto', padding:'40px 24px'}}>
         <h2 style={{color:B.purpleDark, marginBottom:16}}>Buscar Tratamento</h2>
         <div style={{display:'flex', gap: 12, flexWrap:'wrap', marginBottom: 24}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar por nome ou descrição..." style={{flex:1, minWidth:250, padding:14, borderRadius:10, border:`1px solid ${B.border}`, outline:'none', fontFamily:'inherit'}} />
            <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{padding:14, borderRadius:10, border:`1px solid ${B.border}`, outline:'none', fontFamily:'inherit', background:'#fff', minWidth:180}}>
               <option value="all">Todas as Categorias</option>
               {(categories||[]).map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
         </div>

         {filtered.length === 0 && <p style={{color:B.muted, textAlign:'center', marginTop:40}}>Nenhum protocolo encontrado com estes filtros.</p>}
         
         <div className="rp-grid-proto" style={{display:'grid', gap:20}}>
            {filtered.map(p => {
              const catLabel = (categories||[]).find(c=>c.id===p.category)?.label;
              return (
              <div key={p.id} onClick={()=>navigate(`/protocolo/${p.id}`)} style={{background:'#fff', padding:24, borderRadius:16, border:`1px solid ${B.border}`, cursor:'pointer', position:'relative', boxShadow:'0 4px 20px rgba(0,0,0,0.03)'}}>
                 {p.badge && <span style={{position:'absolute', top:-10, right:15}}><Tag label={p.badge} color={B.gold} text="#fff" /></span>}
                 {catLabel && <div style={{marginBottom:8}}><Tag label={catLabel} color={B.goldLight} text={'#7A5C1E'} /></div>}
                 <h3 style={{color:B.purpleDark, marginBottom:8, fontSize:16}}>{p.name}</h3>
                 <p style={{fontSize:13, color:B.muted, lineHeight:1.5}}>{clean(p.description)?.replace(/<[^>]*>?/gm, '').slice(0,120)}...</p>
                 <div style={{marginTop:15, fontSize:13, fontWeight:700, color:B.purple}}>Ver passo a passo →</div>
              </div>
            )})}
         </div>
      </div>
    </div>
  );
};

const ProtocolDetail = ({ protocol:p, products, navigate, onView }) => {
  useEffect(()=>{ if(onView) onView('protocol', p.id); },[p.id]);
  const get = id => (products||[]).find(x=>x.id===id);
  const protocolProducts = (p.steps||[]).filter(s=>s.productId).map(s=>get(s.productId)).filter(Boolean);
  const uniqueProducts = [...new Map(protocolProducts.map(pr=>[pr.id,pr])).values()];
  const totalInvestment = uniqueProducts.reduce((acc, pr) => acc + (parseFloat(pr.cost) || 0), 0);
  const yields = uniqueProducts.map(pr => parseFloat(pr.yieldApplications)).filter(y => y > 0);
  const protocolYield = yields.length > 0 ? Math.min(...yields) : 0;
  const avgCostPerSession = protocolYield > 0 ? totalInvestment / protocolYield : 0;

  return (
    <div style={{padding:'24px 16px 40px', maxWidth:800, margin:'0 auto'}}>
      <button onClick={()=>navigate('/')} style={{marginBottom:20, cursor:'pointer', border:'none', background:'none', color:B.purple, fontWeight:700}}>← Voltar</button>
      <div style={{background:'#fff', padding:'24px 20px', borderRadius:16, border:`1px solid ${B.border}`, marginBottom:20}}>
        <h1 style={{fontFamily:'Georgia,serif', color:B.purpleDark, marginBottom:15, fontSize:22}}>{p.name}</h1>
        <InfoText text={p.description} />
      </div>
      <div style={{background:'#fff', padding:'24px 20px', borderRadius:16, border:`1px solid ${B.border}`, marginBottom:20}}>
        <h2 style={{fontSize:18, marginBottom:20}}>💆 Protocolo em Cabine</h2>
        {(p.steps||[]).map((s,i)=>(
          <div key={i} style={{display:'flex', gap:12, marginBottom:15, paddingBottom:15, borderBottom:`1px solid ${B.cream}`}}>
            <div style={{width:28, height:28, borderRadius:'50%', background:B.purple, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0, fontSize:13}}>{i+1}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11, fontWeight:700, color:B.muted, textTransform:'uppercase', letterSpacing:'0.05em'}}>{s.phase}</div>
              {s.productId && (
                <div style={{background:B.purpleLight, padding:'8px 12px', borderRadius:8, marginTop:6, marginBottom:8, display:'inline-flex'}}>
                  <ProductTooltip product={get(s.productId)} navigate={navigate}>
                    <strong style={{color:B.purpleDark, fontSize:14}}>{get(s.productId)?.name}</strong>
                  </ProductTooltip>
                </div>
              )}
              <div style={{marginTop:4}}><InfoText text={s.instruction} /></div>
            </div>
          </div>
        ))}
      </div>
      {uniqueProducts.length > 0 && (
        <div style={{background:`linear-gradient(135deg, ${B.purpleDark}, #3d2060)`, color:'#fff', padding:'24px 20px', borderRadius:16}}>
           <h2 style={{color:B.gold, marginBottom:20, fontSize:18}}>📊 Análise de Rentabilidade do Kit</h2>
           <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(130px, 1fr))', gap:16}}>
             <div style={{background:'rgba(255,255,255,0.1)', padding:12, borderRadius:10}}>
               <div style={{fontSize:10, opacity:0.8, fontWeight:700, marginBottom:4}}>INVESTIMENTO</div>
               <div style={{fontSize:18, fontWeight:700}}>{fmtCurrency(totalInvestment)}</div>
             </div>
             <div style={{background:'rgba(255,255,255,0.1)', padding:12, borderRadius:10}}>
               <div style={{fontSize:10, opacity:0.8, fontWeight:700, marginBottom:4}}>RENDIMENTO MÉDIO</div>
               <div style={{fontSize:18, fontWeight:700}}>{protocolYield} apl.</div>
             </div>
             <div style={{background:'rgba(255,255,255,0.1)', padding:12, borderRadius:10, border:`1px solid ${B.green}`}}>
               <div style={{fontSize:10, opacity:0.8, fontWeight:700, marginBottom:4}}>CUSTO POR SESSÃO</div>
               <div style={{fontSize:20, fontWeight:800, color:B.greenLight}}>{fmtCurrency(avgCostPerSession)}</div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

const PublicProductPage = ({ product:p, navigate, onView }) => {
  useEffect(()=>{ if(onView) onView('product', p.id); },[p.id]);
  return (
    <div style={{padding:'24px 16px 40px', maxWidth:800, margin:'0 auto'}}>
      <button onClick={()=>navigate('/')} style={{marginBottom:20, cursor:'pointer', border:'none', background:'none', color:B.purple, fontWeight:700}}>← Voltar</button>
      <div style={{background:'#fff', padding:'24px 20px', borderRadius:16, border:`1px solid ${B.border}`}}>
        {p.image && <img src={p.image} alt={p.name} style={{width:'100%', maxWidth:200, height:'auto', objectFit:'contain', marginBottom:20, borderRadius:10}} />}
        <h1 style={{fontFamily:'Georgia,serif', color:B.purpleDark, marginBottom:10, fontSize:22}}>{p.name}</h1>
        <InfoText text={p.description} />
        {p.actives && <div style={{marginTop:20, padding:15, background:B.cream, borderRadius:10}}><strong style={{color:B.purpleDark}}>Ativos:</strong> <InfoText text={p.actives} /></div>}
        <BuyLink href={p.siteUrl} isMobile sx={{marginTop:20, width:'100%', padding:'12px 0'}} />
      </div>
    </div>
  );
};

// ── App Principal (Central de Renderização) ────────────
export default function App() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [users, setUsers] = useState([]);
  const [marketing, setMarketing] = useState(INIT_MARKETING);
  const [brand, setBrand] = useState(INIT_BRAND);
  const [categories, setCategories] = useState([]);
  const [indications, setIndications] = useState([]);
  const [phases, setPhases] = useState([]);
  const [views, setViews] = useState({});
  
  const [loggedUser, setLoggedUser] = useState(null);
  const [path, navigate] = useRoute();
  const [aView, setAView] = useState('');
  
  const isMobile = useIsMobile(768);

  useEffect(() => {
    (async () => {
      setProducts(await load('edt_products_v17', []));
      setProtocols(await load('edt_protocols_v17', []));
      setUsers(await load('edt_users_v17', INIT_USERS));
      
      const mk = await load('edt_marketing_v17', INIT_MARKETING);
      setMarketing({ ...INIT_MARKETING, ...mk, banners: mk?.banners || [], notice: { ...INIT_MARKETING.notice, ...mk?.notice }, campaign: { ...INIT_MARKETING.campaign, ...mk?.campaign } });
      
      setBrand(await load('edt_brand_v17', INIT_BRAND));
      setCategories(await load('edt_categories_v17', []));
      setIndications(await load('edt_indications_v17', []));
      setPhases(await load('edt_phases_v17', []));
      setViews(await load('edt_views_v17', {}));
      setLoading(false);
    })();
  }, []);

  const savePr = d => { setProducts(d); save('edt_products_v17', d); };
  const savePt = d => { setProtocols(d); save('edt_protocols_v17', d); };
  const saveUs = d => { setUsers(d); save('edt_users_v17', d); };
  const saveMk = d => { setMarketing(d); save('edt_marketing_v17', d); };
  const saveCat = d => { setCategories(d); save('edt_categories_v17', d); };
  const saveInd = d => { setIndications(d); save('edt_indications_v17', d); };
  const savePha = d => { setPhases(d); save('edt_phases_v17', d); };
  const saveBr  = d => { setBrand(d); save('edt_brand_v17', d); };

  const handleView = async (type, id) => {
    const key = `${type}_${id}`;
    const updated = { ...views, [key]: (views[key] || 0) + 1 };
    setViews(updated);
    await save('edt_views_v17', updated);
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Carregando sistema...</div>;

  let content;
  if (path === '/') {
    content = <PublicHome protocols={protocols} products={products} categories={categories} indications={indications} navigate={navigate} marketing={marketing} brand={brand} />;
  }
  else if (path === '/login') {
    content = <AdminLogin setLoggedUser={setLoggedUser} navigate={navigate} brand={brand} users={users} />;
  }
  else if (path === '/admin') {
    if (!loggedUser) { navigate('/login'); return null; }
    
    content = (
      <div className="admin-layout" style={{background:B.cream}}>
        <div className="admin-sidebar">
          <div style={{marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <Tag label={loggedUser.name} color={B.purpleLight} />
            {isMobile && <button onClick={()=>{setLoggedUser(null); navigate('/');}} style={{color:B.red, background:'none', border:'none', cursor:'pointer', fontWeight:700}}>Sair</button>}
          </div>
          
          <div className="admin-menu no-scrollbar">
            {hasPerm(loggedUser,'dashboard','view') && <button onClick={()=>setAView('dash')} className={`admin-menu-btn ${aView==='dash'?'active':''}`}>📊 Dashboard</button>}
            {hasPerm(loggedUser,'marketing','view') && <button onClick={()=>setAView('marketing')} className={`admin-menu-btn ${aView==='marketing'?'active':''}`}>📣 Marketing</button>}
            {hasPerm(loggedUser,'products','view') && <button onClick={()=>setAView('prod')} className={`admin-menu-btn ${aView==='prod'?'active':''}`}>🧴 Produtos</button>}
            {hasPerm(loggedUser,'protocols','view') && <button onClick={()=>setAView('proto')} className={`admin-menu-btn ${aView==='proto'?'active':''}`}>📋 Protocolos</button>}
            {hasPerm(loggedUser,'categories','view') && <button onClick={()=>setAView('cats')} className={`admin-menu-btn ${aView==='cats'?'active':''}`}>🗂️ Dicionários</button>}
            {hasPerm(loggedUser,'alerts','view') && <button onClick={()=>setAView('alerts')} className={`admin-menu-btn ${aView==='alerts'?'active':''}`}>⚠️ Alertas</button>}
            {hasPerm(loggedUser,'users','view') && <button onClick={()=>setAView('users')} className={`admin-menu-btn ${aView==='users'?'active':''}`}>👥 Equipa</button>}
            {hasPerm(loggedUser,'settings','view') && <button onClick={()=>setAView('brand')} className={`admin-menu-btn ${aView==='brand'?'active':''}`}>⚙️ Config. Marca</button>}
          </div>
          
          {!isMobile && <button onClick={()=>{setLoggedUser(null); navigate('/');}} style={{padding:12, color:B.red, background:'none', border:'none', cursor:'pointer', textAlign:'left', fontWeight:700, marginTop: 'auto'}}>🚪 Sair</button>}
        </div>
        
        <div className="admin-content">
          {aView === 'dash' && <AdminDash products={products} protocols={protocols} indications={indications} views={views} />}
          {aView === 'marketing' && <AdminMarketing marketing={marketing} saveMarketing={saveMk} protocols={protocols} />}
          {aView === 'users' && <AdminUsers users={users} saveUsers={saveUs} loggedUser={loggedUser} />}
          {aView === 'prod' && <AdminProductList products={products} categories={categories} saveProducts={savePr} loggedUser={loggedUser} />}
          {aView === 'proto' && <AdminProtocolList protocols={protocols} saveProtocols={savePt} products={products} categories={categories} indications={indications} phases={phases} loggedUser={loggedUser} />}
          {aView === 'alerts' && <AdminAlerts products={products} protocols={protocols} />}
          {aView === 'brand' && <AdminBrand brand={brand} saveBrand={saveBr} />}
          {aView === 'cats' && (
             <div style={{display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20}}>
               <AdminDictionary title="Categorias" items={categories} saveItems={saveCat} readOnly={!hasPerm(loggedUser,'categories','edit')} />
               <AdminDictionary title="Indicações" items={indications} saveItems={saveInd} readOnly={!hasPerm(loggedUser,'indications','edit')} />
               <AdminDictionary title="Fases" items={phases} saveItems={savePha} readOnly={!hasPerm(loggedUser,'phases','edit')} />
             </div>
          )}
        </div>
      </div>
    );
  }
  else if (path.startsWith('/protocolo/')) {
    const p = (protocols||[]).find(x => x.id === path.replace('/protocolo/',''));
    content = p ? <ProtocolDetail protocol={p} products={products} navigate={navigate} brand={brand} onView={handleView} /> : navigate('/');
  }
  else if (path.startsWith('/produto/')) {
    const p = (products||[]).find(x => x.id === path.replace('/produto/',''));
    content = p ? <PublicProductPage product={p} navigate={navigate} onView={handleView} /> : navigate('/');
  }

  return (
    <div style={{fontFamily:"'Segoe UI', system-ui, sans-serif", color:B.text, background:B.cream, minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      <style>{RESPONSIVE_CSS}</style>
      <header className="no-print" style={{height:60, background:B.purpleDark, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', position:'sticky', top:0, zIndex:100}}>
        <div onClick={()=>navigate('/')} style={{cursor:'pointer', display:'flex', alignItems:'center', gap:10}}><Logo brand={brand}/><span style={{color:'#fff', fontWeight:700, fontSize:isMobile?14:16}}>{brand.companyName}</span></div>
        <Btn size="sm" onClick={() => { setAView('dash'); navigate('/admin'); }}>{loggedUser ? 'Painel Admin' : 'Acesso Restrito'}</Btn>
      </header>
      {content}
    </div>
  );
}