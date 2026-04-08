import { useState, useEffect, useRef } from "react";
import { useIsMobile, useRoute } from "./hooks/useAppShell";
import { lazy, Suspense } from "react";
import AdminProtForm from "./components/admin/AdminProtForm";
import { LandingPage } from "./components/LandingPage";
import {
  B,
  BRAND_KEY,
  CATEGORIES_KEY,
  EMPTY_PRODUCT,
  INIT_BRAND,
  INIT_CATEGORIES,
  INIT_INDICATIONS,
  INIT_LANDING,
  INIT_MARKETING,
  INIT_PHASES,
  INIT_PRODUCTS,
  INIT_PROTOCOLS,
  INIT_USERS,
  INDICATIONS_KEY,
  LANDING_KEY,
  MARKETING_KEY,
  PHASES_KEY,
  PRODUCT_TYPE_OPTIONS,
  PRODUCTS_KEY,
  PROTOCOLS_KEY,
  RESPONSIVE_CSS,
  USERS_KEY,
  VIEWS_KEY,
  hasPerm,
} from "./lib/app-constants";
import {
  clean,
  costPerApp,
  fmtCurrency,
  getAdminSession,
  getAffectedProtocols,
  getProductTypeLabel,
  getProductTypes,
  isActive,
  load,
  loadHtml2Pdf,
  normalizeProductForStorage,
  logoutAdmin,
  productHasType,
  primePurify,
  save,
  savePublic,
  secureUsersForStorage,
  sortByName,
  uid,
  updateAdminPassword,
  uploadImageSafe,
} from "./lib/app-services";

const AdminLogin = lazy(() =>
  import("./components/admin/AdminAuth").then((module) => ({
    default: module.AdminLogin,
  })),
);
const AdminPasswordReset = lazy(() =>
  import("./components/admin/AdminAuth").then((module) => ({
    default: module.AdminPasswordReset,
  })),
);
const AdminUsers = lazy(() =>
  import("./components/admin/AdminUsers").then((module) => ({
    default: module.AdminUsers,
  })),
);
const AdminDictionaryModule = lazy(() =>
  import("./components/admin/AdminPanels").then((module) => ({
    default: module.AdminDictionary,
  })),
);
const AdminMarketingModule = lazy(() =>
  import("./components/admin/AdminPanels").then((module) => ({
    default: module.AdminMarketing,
  })),
);
const AdminSettingsModule = lazy(() =>
  import("./components/admin/AdminPanels").then((module) => ({
    default: module.AdminSettings,
  })),
);
const AdminDashModule = lazy(() =>
  import("./components/admin/AdminPanels").then((module) => ({
    default: module.AdminDash,
  })),
);
const AdminLandingModule = lazy(() =>
  import("./components/admin/AdminLanding").then((module) => ({
    default: module.AdminLanding,
  })),
);
const AdminProductsModule = lazy(() =>
  import("./components/admin/AdminCatalog").then((module) => ({
    default: module.AdminProducts,
  })),
);
const AdminAlertsModule = lazy(() =>
  import("./components/admin/AdminCatalog").then((module) => ({
    default: module.AdminAlerts,
  })),
);
const AdminProtocolsModule = lazy(() =>
  import("./components/admin/AdminProtocols").then((module) => ({
    default: module.AdminProtocols,
  })),
);

primePurify();

const AdminModuleFallback = () => (
  <div style={{padding:'14px 16px', textAlign:'center', color:B.muted, fontSize:12, fontWeight:600}}>
    Abrindo painel...
  </div>
);

const NoticeBanner = ({ notice }) => {
  const [closed, setClosed] = useState(false);
  if (!notice?.active || !notice?.text || closed) return null;
  return (
    <div style={{background: notice.bgColor||B.purple, color: notice.textColor||'#fff', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'center', gap:12, fontSize:13, fontWeight:600, position:'relative', zIndex:100}}>
      <span dangerouslySetInnerHTML={{__html: clean(notice.text)}} />
      <button onClick={()=>setClosed(true)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',fontSize:18,lineHeight:1,padding:0,opacity:0.7,position:'absolute',right:16}}>x</button>
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
      <img src={cur.imageUrl} alt={cur.label||'Banner'} style={{width:'100%', maxHeight:420, objectFit:'cover', display:'block'}} loading="lazy" />
      {active.length>1&&(
        <div style={{position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6}}>
          {active.map((_,i)=>(
            <button key={i} onClick={e=>{e.stopPropagation();setIdx(i);}} style={{width:i===idx?24:8,height:8,borderRadius:4,background:i===idx?'#fff':'rgba(255,255,255,0.5)',border:'none',cursor:'pointer',padding:0,transition:'width 0.3s'}} />
          ))}
        </div>
      )}
      {active.length>1&&<>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i-1+active.length)%active.length);}} aria-label="Banner anterior" style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:'none',borderRadius:'50%',width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{'<'}</button>
        <button onClick={e=>{e.stopPropagation();setIdx(i=>(i+1)%active.length);}} aria-label="Proximo banner" style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:'none',borderRadius:'50%',width:36,height:36,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>{'>'}</button>
      </>}
    </div>
  );
};

const CampaignSection = ({ campaign, protocols, navigate }) => {
  if(!campaign?.active || !campaign?.protocolId) return null;
  const prot = protocols.find(p=>p.id===campaign.protocolId);
  if(!prot) return null;
  return (
    <div style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, #3d2060 100%)`, padding:'32px 24px', marginBottom:0}}>
      <div style={{maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:16}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span style={{background:B.gold, color:'#fff', fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, textTransform:'uppercase', letterSpacing:'0.08em'}}>Destaque do Mes</span>
        </div>
        <div style={{color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:600}}>{campaign.title||'Protocolo em Destaque'}</div>
        <div style={{color:'#fff', fontSize:22, fontWeight:700, fontFamily:'Georgia,serif', lineHeight:1.3}}>{prot.name}</div>
        {campaign.subtitle&&<div style={{color:'rgba(255,255,255,0.75)', fontSize:14, lineHeight:1.6}}>{campaign.subtitle}</div>}
        <button onClick={()=>navigate(`/protocolo/${prot.id}`)} style={{alignSelf:'flex-start', background:B.gold, color:'#fff', border:'none', padding:'10px 24px', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit'}}>Ver protocolo completo &rarr;</button>
      </div>
    </div>
  );
};

const Logo = ({ brand, size = 34 }) => {
  if (brand?.logoUrl) {
    return <img src={brand.logoUrl} alt={brand.companyName || 'Logo'} style={{ height: size, objectFit: 'contain', flexShrink: 0 }} />;
  }
  return <div style={{width:size,height:size,background:`linear-gradient(135deg, ${B.gold}, #e8b96a)`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size/2.7,flexShrink:0,color:B.white,fontWeight:800,letterSpacing:'0.04em'}}>ET</div>;
};

const AppFooter = ({ brand }) => (
  <footer className="no-print" style={{ background: B.purpleDark, padding: '30px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
      <Logo brand={brand} size={40} />
    </div>
    <div style={{ fontWeight: 700, color: B.white, marginBottom: 8, fontSize: 16 }}>{brand?.companyName || 'Extratos da Terra'}</div>
    <p style={{margin: '0 0 8px 0', fontSize: 13}}>Protocolos Profissionais e Cuidados com a Pele</p>
    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
      <a href="https://www.extratosdaterrapro.com.br" target="_blank" rel="noreferrer" style={{ color: B.gold, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>www.extratosdaterrapro.com.br</a>
      <a href="https://www.extratosdaterrapro.com.br/pagina/encontre-um-revendedor/" target="_blank" rel="noreferrer" style={{ color: B.white, textDecoration: 'none', fontWeight: 600, fontSize: 13 }}>
        Encontre um revendedor
      </a>
      <div style={{fontSize:12,lineHeight:1.8,color:'rgba(255,255,255,0.82)'}}>
        <div style={{fontWeight:700,color:B.white}}>Atendimento</div>
        <div>
          WhatsApp:{' '}
          <a href="https://wa.me/5548991265853" target="_blank" rel="noreferrer" style={{ color: B.gold, textDecoration: 'none', fontWeight: 700 }}>
            (48) 99126-5853
          </a>
        </div>
        <div>
          Fone:{' '}
          <a href="tel:+554833420087" style={{ color: B.gold, textDecoration: 'none', fontWeight: 700 }}>
            (48) 3342-0087
          </a>
        </div>
      </div>
    </div>
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)' }}>
      Desenvolvido por Carlos Martins{' '}
      <a href="tel:+5548996962910" style={{ color: B.gold, textDecoration: 'none', fontWeight: 700 }}>
        (48) 99696-2910
      </a>
    </div>
  </footer>
);

const Tag = ({ label, color = B.purpleLight, text = B.purple, size = 'sm' }) => (
  <span style={{ background:color, color:text, padding:size==='sm'?'2px 10px':'4px 14px', borderRadius:20, fontSize:size==='sm'?11:13, fontWeight:700, letterSpacing:'0.03em', whiteSpace:'nowrap' }}>{label}</span>
);

const PRODUCT_TYPE_TAG_STYLES = {
  protocol: { color: B.blueLight, text: B.blue },
  skincare: { color: B.greenLight, text: B.green },
  kit_professional: { color: B.purpleLight, text: B.purpleDark },
  kit_homecare: { color: B.goldLight, text: '#7A5C1E' },
};

const ProductTypeTags = ({ product, size = 'sm' }) => (
  <>
    {getProductTypes(product).map((typeId) => {
      const style = PRODUCT_TYPE_TAG_STYLES[typeId] || { color: B.purpleLight, text: B.purpleDark };
      return <Tag key={typeId} label={getProductTypeLabel(typeId)} color={style.color} text={style.text} size={size} />;
    })}
  </>
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
      {children || 'Comprar agora'}
    </a>
  );
};

const buildCopyName = (baseName, existingNames = []) => {
  const cleanBase = String(baseName || '')
    .replace(/\s+\(Copia(?: \d+)?\)$/i, '')
    .trim() || 'Item';
  const usedNames = new Set(existingNames.map((name) => String(name || '').trim().toLowerCase()));
  const firstCopy = `${cleanBase} (Copia)`;
  if (!usedNames.has(firstCopy.toLowerCase())) return firstCopy;
  let index = 2;
  while (usedNames.has(`${cleanBase} (Copia ${index})`.toLowerCase())) index += 1;
  return `${cleanBase} (Copia ${index})`;
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

const ProductTooltip = ({ product: p, children, navigate }) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({top:0,left:0});
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const cpa = costPerApp(p);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const popW = popoverRef.current?.offsetWidth || 320;
    const popH = popoverRef.current?.offsetHeight || 260;
    const gutter = 12;
    const desiredLeft = r.left + (r.width / 2) - (popW / 2);
    const left = Math.min(window.innerWidth - popW - gutter, Math.max(gutter, desiredLeft));
    const fitsBelow = r.bottom + 8 + popH <= window.innerHeight - gutter;
    const top = fitsBelow
      ? r.bottom + 8
      : Math.max(gutter, r.top - popH - 8);
    setPos({ top, left });
  };

  const handleOpen = () => {
    setOpen(true);
  };

  useEffect(() => {
    const close = e => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) && popoverRef.current && !popoverRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!open || !isMobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, isMobile]);

  useEffect(() => {
    if (!open || isMobile) return;
    const update = () => calcPos();
    const raf = window.requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, isMobile]);

  const tooltipCard = (
    <>
      <div style={{fontWeight:700,fontSize:14,color:B.purpleDark,marginBottom:10,lineHeight:1.3}}>{p.name}</div>
      {p.actives && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>Ativos Principais</div>
          <div style={{fontSize:13,color:B.text,lineHeight:1.5}} dangerouslySetInnerHTML={{__html: clean(p.actives)}} />
        </div>
      )}
      {p.indications && (
        <div style={{marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:3}}>Indicacoes</div>
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
          <span style={{fontSize:12,color:B.muted,fontWeight:600}}>Custo/aplicacao</span>
          <span style={{fontSize:14,fontWeight:700,color:B.purple}}>{fmtCurrency(cpa)}</span>
        </div>
      )}
      <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        {p.fichaUrl && <a href={p.fichaUrl} target="_blank" rel="noreferrer" style={{flex:1,background:B.purpleDark,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',textDecoration:'none',display:'block'}}>Ficha Tecnica</a>}
        <button onClick={()=>{setOpen(false);navigate(`/produto/${p.id}`);}} style={{flex:1,background:B.purple,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',border:'none',cursor:'pointer',fontFamily:'inherit'}}>Ver produto</button>
        {p.siteUrl && <a href={p.siteUrl} target="_blank" rel="noreferrer" style={{flex:1,background:B.purpleDark,color:B.white,padding:'7px 0',borderRadius:7,fontWeight:700,fontSize:12,textAlign:'center',textDecoration:'none',display:'block'}}>Comprar</a>}
        <button onClick={() => setOpen(false)} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:7,padding:'7px 14px',fontSize:12,cursor:'pointer',color:B.muted,fontFamily:'inherit'}}>Fechar</button>
      </div>
    </>
  );

  return (
    <span style={{display:'inline-block'}}>
      <span ref={triggerRef} style={{display:'inline-flex', alignItems:'center', gap:4}}>
        {children}
        <span onClick={() => open ? setOpen(false) : handleOpen()} style={{width:16,height:16,borderRadius:'50%',background:B.purple,color:B.white,fontSize:10,fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginLeft:2,cursor:'pointer'}}>i</span>
      </span>
      {open && isMobile && (
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(44,31,64,0.38)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={() => setOpen(false)}>
          <div ref={popoverRef} onClick={(e)=>e.stopPropagation()} style={{width:'100%',maxWidth:360,maxHeight:'80vh',overflowY:'auto',background:B.white,border:`1.5px solid ${B.purple}`,borderRadius:16,boxShadow:'0 18px 48px rgba(44,31,64,0.28)',padding:'18px 16px'}}>
            {tooltipCard}
          </div>
        </div>
      )}
      {open && !isMobile && (
        <div ref={popoverRef} style={{position:'fixed',zIndex:9999,top:pos.top,left:pos.left,width:320,background:B.white,border:`1.5px solid ${B.purple}`,borderRadius:12,boxShadow:'0 12px 40px rgba(44,31,64,0.22)',padding:'16px 18px'}}>
          {tooltipCard}
        </div>
      )}
    </span>
  );
};

const Header = ({ navigate, adminAuth, setAdminAuth, brand }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navItems = [{l:'Protocolos',v:'/protocolos'},{l:'Buscar por Produto',v:'/busca'}];

  return (
    <header className="no-print" style={{background:B.purpleDark,padding:`0 ${isMobile?12:24}px`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:isMobile?8:16,height:isMobile?64:58,position:'sticky',top:0,zIndex:200,width:'100%',overflow:'clip',boxShadow:isMobile?'0 10px 24px rgba(19, 10, 35, 0.18)':'none'}}>
      <div style={{display:'flex',alignItems:'center',gap:isMobile?8:10,cursor:'pointer',minWidth:0,flex:isMobile?1:'0 1 auto'}} onClick={()=>{ navigate('/'); setMenuOpen(false); }}>
        <Logo brand={brand} size={isMobile?28:34} />
        <div style={{minWidth:0}}>
          <div style={{color:B.white,fontWeight:700,fontSize:isMobile?12:14,lineHeight:1.1,fontFamily:'Georgia, serif',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{brand?.companyName || 'Extratos da Terra'}</div>
          <div style={{color:B.gold,fontSize:isMobile?8:9,letterSpacing:'0.12em',fontWeight:700}}>PROTOCOLOS PRO</div>
        </div>
      </div>

      {!isMobile && (
        <nav style={{display:'flex',gap:4}}>
          {navItems.map(n=>(
            <button key={n.v} onClick={()=>navigate(n.v)} style={{background:'transparent',color:'rgba(255,255,255,0.65)',border:'none',padding:'7px 14px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{n.l}</button>
          ))}
          <button onClick={()=>adminAuth?navigate('/admin'):navigate('/login')} style={{background:B.gold,color:B.white,border:'none',padding:'7px 16px',borderRadius:6,fontSize:13,fontWeight:700,cursor:'pointer',marginLeft:8,fontFamily:'inherit'}}>
            {adminAuth ? 'Painel Admin' : 'Entrar Admin'}
          </button>
        </nav>
      )}

      {isMobile && (
        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <button onClick={()=>adminAuth?navigate('/admin'):navigate('/login')} style={{background:B.gold,color:B.white,border:'none',padding:'7px 12px',borderRadius:12,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',minHeight:40,boxShadow:'0 8px 18px rgba(217, 177, 94, 0.24)'}}>{adminAuth ? 'Painel' : 'Entrar'}</button>
          <button onClick={()=>setMenuOpen(o=>!o)} style={{background:menuOpen?'rgba(255,255,255,0.22)':'rgba(255,255,255,0.12)',color:B.white,border:'1px solid rgba(255,255,255,0.08)',minWidth:54,height:40,padding:'0 12px',borderRadius:12,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontFamily:'inherit',whiteSpace:'nowrap',backdropFilter:'blur(8px)'}}>{menuOpen ? 'Fechar' : 'Menu'}</button>
        </div>
      )}

      {isMobile && menuOpen && (
        <>
          <div onClick={()=>setMenuOpen(false)} style={{position:'fixed',inset:0,top:64,background:'rgba(23, 12, 42, 0.36)',backdropFilter:'blur(2px)',zIndex:250}} />
          <div style={{position:'fixed',top:72,right:12,left:12,background:'linear-gradient(180deg, rgba(53,35,86,0.98) 0%, rgba(41,27,67,0.98) 100%)',padding:'12px',zIndex:300,borderRadius:18,boxShadow:'0 18px 40px rgba(0,0,0,0.34)',display:'flex',flexDirection:'column',gap:8,border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{padding:'4px 6px 8px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.64)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Navegacao</div>
            </div>
            {navItems.map((n, idx)=>(
              <button key={n.v} onClick={()=>{navigate(n.v);setMenuOpen(false);}} style={{background:idx===0?'rgba(255,255,255,0.08)':'transparent',color:B.white,border:'1px solid rgba(255,255,255,0.06)',padding:'12px 14px',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>{n.l}</button>
            ))}
          </div>
        </>
      )}
    </header>
  );
};

const PublicHome = ({ protocols, products, indications, categories, favorites, setFavorites, navigate, brand, marketing, homeFilters, setHomeFilters, views = {} }) => {
  const { search, filterCat, filterProds, filterInds, showFavorites, page } = homeFilters;
  const setSearch      = v => setHomeFilters(f => ({ ...f, search: v, page: 1 }));
  const setFilterCat   = v => setHomeFilters(f => ({ ...f, filterCat: v, page: 1 }));
  const setFilterProds = v => setHomeFilters(f => ({ ...f, filterProds: typeof v === 'function' ? v(f.filterProds) : v, page: 1 }));
  const setFilterInds  = v => setHomeFilters(f => ({ ...f, filterInds: typeof v === 'function' ? v(f.filterInds) : v, page: 1 }));
  const setShowFavorites = v => setHomeFilters(f => ({ ...f, showFavorites: typeof v === 'function' ? v(f.showFavorites) : v, page: 1 }));
  const setPage        = v => setHomeFilters(f => ({ ...f, page: typeof v === 'function' ? v(f.page) : v }));

  const [prodSearch, setProdSearch] = useState('');
  const [prodDropOpen, setProdDropOpen] = useState(false);
  const PAGE_SIZE = 12;

  const isMobile = useIsMobile();
  const pub = protocols.filter(p => p.published);

  const protocolHasProd = (p, prodId) =>
    p.steps?.some(s => s.productId === prodId) ||
    p.homeUse?.morning?.some(h => h.productId === prodId) ||
    p.homeUse?.night?.some(h => h.productId === prodId) ||
    p.professionalKitId === prodId ||
    p.homeKitId === prodId;

  const filtered = pub.filter(p => {
    if (showFavorites && !favorites.includes(p.id)) return false;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchInd = filterInds.length === 0 || filterInds.some(ind => p.concerns?.includes(ind));
    const matchCat = filterCat === 'all' || p.category === filterCat || p.categories?.includes(filterCat);
    const matchProd = filterProds.length === 0 || filterProds.every(id => protocolHasProd(p, id));
    return matchSearch && matchInd && matchCat && matchProd;
  }).sort((a, b) => {
    const va = views[`protocol_${a.id}`] || 0;
    const vb = views[`protocol_${b.id}`] || 0;
    if (vb !== va) return vb - va;
    const ia = Math.max(0, ...(a.concerns || []).map(id => views[`indication_${id}`] || 0));
    const ib = Math.max(0, ...(b.concerns || []).map(id => views[`indication_${id}`] || 0));
    return ib - ia;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Contagem por categoria (ignorando o filtro de categoria para mostrar counts reais)
  const catCounts = {};
  pub.filter(p => {
    if (showFavorites && !favorites.includes(p.id)) return false;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchInd = filterInds.length === 0 || filterInds.some(ind => p.concerns?.includes(ind));
    const matchProd = filterProds.length === 0 || filterProds.every(id => protocolHasProd(p, id));
    return matchSearch && matchInd && matchProd;
  }).forEach(p => {
    const cats = p.categories || (p.category ? [p.category] : []);
    cats.forEach(c => { catCounts[c] = (catCounts[c] || 0) + 1; });
  });

  const hasActiveFilters = search || filterCat !== 'all' || filterProds.length > 0 || filterInds.length > 0 || showFavorites;
  const clearAll = () => { setProdSearch(''); setHomeFilters({ search:'', filterCat:'all', filterProds:[], filterInds:[], showFavorites:false, page:1 }); };

  const toggleInd = (id) => setFilterInds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const addProd = (id) => {
    if (!filterProds.includes(id)) setFilterProds(prev => [...prev, id]);
    setProdSearch('');
    setProdDropOpen(false);
  };
  const removeProd = (id) => setFilterProds(prev => prev.filter(x => x !== id));

  const prodOptions = sortByName(products).filter(p =>
    isActive(p) &&
    !filterProds.includes(p.id) &&
    (!prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase()))
  );

  const activeChips = [
    filterCat !== 'all' && { key: 'cat', label: categories.find(c => c.id === filterCat)?.label || filterCat, onRemove: () => setFilterCat('all') },
    showFavorites && { key: 'fav', label: 'Meus Favoritos', onRemove: () => setShowFavorites(false) },
    ...filterProds.map(id => ({ key: `prod-${id}`, label: products.find(p => p.id === id)?.name || id, onRemove: () => removeProd(id) })),
    ...filterInds.map(id => ({ key: id, label: indications.find(i => i.id === id)?.label || id, onRemove: () => toggleInd(id) })),
  ].filter(Boolean);

  const renderPageButtons = () => {
    if (totalPages <= 7) return Array.from({length:totalPages},(_,i)=>i+1).map(n=>pageBtn(n));
    const pages = new Set([1, totalPages, safePage, safePage-1, safePage+1].filter(n=>n>=1&&n<=totalPages));
    const sorted = [...pages].sort((a,b)=>a-b);
    const result = [];
    let prev = null;
    for (const n of sorted) {
      if (prev !== null && n - prev > 1) result.push(<span key={`el-${n}`} style={{color:B.muted,fontSize:13,padding:'0 2px'}}>…</span>);
      result.push(pageBtn(n));
      prev = n;
    }
    return result;
  };
  const pageBtn = (n) => (
    <button key={n} onClick={()=>setPage(n)} style={{width:36,height:36,borderRadius:10,border:`1px solid ${n===safePage?B.purple:B.border}`,background:n===safePage?B.purple:B.white,color:n===safePage?'#fff':B.text,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
      {n}
    </button>
  );

  return (
    <div style={{background:B.cream, flex: 1}}>
      <HeroBanner banners={marketing?.banners} navigate={navigate} />
      <CampaignSection campaign={marketing?.campaign} protocols={protocols} navigate={navigate} />
      <div className="rp-hero" style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, ${B.purple} 45%, #2f1a5a 100%)`,color:'#fff',textAlign:'center'}}>
        <div style={{fontSize:10,color:'#fadbff',fontWeight:700,letterSpacing:'0.16em',marginBottom:8,textTransform:'uppercase'}}>Cosmetologia Avancada</div>
        <h1 className="rp-hero" style={{color:B.white,fontWeight:700,fontFamily:'Georgia, serif',margin:'0 0 10px',letterSpacing:'-0.01em'}}>Protocolos Profissionais</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:isMobile?13:15,margin:`0 0 ${isMobile?18:28}px`,lineHeight:1.5}}>Passo a passo completo para esteticistas, com os produtos {brand?.companyName || 'Extratos da Terra'}</p>

        <div style={{maxWidth:900, margin:'0 auto', padding:`0 ${isMobile?4:0}px`}}>
          <div style={{background:'rgba(255,255,255,0.14)',backdropFilter:'blur(6px)', padding: '18px', borderRadius: 18, border: '1px solid rgba(255,255,255,0.28)', boxShadow:'0 16px 42px rgba(27, 9, 71, 0.26)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',gap:12,flexDirection:isMobile?'column':'row',textAlign:'left'}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.78)',textTransform:'uppercase',letterSpacing:'0.115em',marginBottom:5}}>Encontre o protocolo ideal</div>
                <div style={{fontSize:14,color:'rgba(255,255,255,0.92)',lineHeight:1.35}}>Filtre por nome, categoria, produto vinculado e indicacao.</div>
              </div>
              {hasActiveFilters && (
                <button onClick={clearAll} style={{padding:'10px 16px',borderRadius:999,border:'1px solid rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.12)',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                  Limpar tudo
                </button>
              )}
            </div>

            <div style={{marginTop:14, display:'grid', gridTemplateColumns:isMobile?'1fr':'3fr 2fr', gap:10}}>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                placeholder="Pesquisar protocolo por nome ou descricao..."
                style={{width:'100%',padding:'12px 16px',borderRadius:12,border:'none',fontSize:14,outline:'none',boxSizing:'border-box',background:'#fff',color:B.text,fontFamily:'inherit',fontWeight:600}}
              />
              <div style={{display:'flex',gap:10,flexDirection:'column'}}>
                <select
                  value={filterCat}
                  onChange={e=>setFilterCat(e.target.value)}
                  style={{width:'100%',padding:'12px 12px',borderRadius:12,border:'1px solid rgba(153,153,153,0.3)',fontSize:14,outline:'none',background:'#fff',color:B.text,fontFamily:'inherit',fontWeight:600}}
                >
                  <option value="all">Todas as Categorias</option>
                  {[...categories].sort((a,b)=>a.label.localeCompare(b.label)).map(c=><option key={c.id} value={c.id}>{c.label}{catCounts[c.id]!=null ? ` (${catCounts[c.id]})` : ''}</option>)}
                </select>
                <div style={{position:'relative'}}>
                  <input
                    value={prodSearch}
                    onChange={e=>{setProdSearch(e.target.value);setProdDropOpen(true);}}
                    onFocus={()=>setProdDropOpen(true)}
                    onBlur={()=>setTimeout(()=>setProdDropOpen(false),150)}
                    placeholder={filterProds.length>0?`+${filterProds.length} produto(s) selecionado(s)`:'Filtrar por produto...'}
                    style={{width:'100%',padding:'12px 12px',borderRadius:12,border:'1px solid rgba(153,153,153,0.3)',fontSize:14,outline:'none',background:'#fff',color:B.text,fontFamily:'inherit',fontWeight:600,boxSizing:'border-box'}}
                  />
                  {prodDropOpen && prodOptions.length > 0 && (
                    <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'#fff',borderRadius:10,border:`1px solid ${B.border}`,boxShadow:'0 8px 24px rgba(0,0,0,0.12)',zIndex:200,maxHeight:200,overflowY:'auto'}}>
                      {prodOptions.map(p=>(
                        <div key={p.id} onMouseDown={()=>addProd(p.id)} style={{padding:'10px 14px',fontSize:13,color:B.text,fontWeight:600,cursor:'pointer',borderBottom:`1px solid ${B.cream}`}}
                          onMouseEnter={e=>e.currentTarget.style.background=B.purpleLight}
                          onMouseLeave={e=>e.currentTarget.style.background='#fff'}
                        >
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {filterProds.length > 0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
                      {filterProds.map(id=>{
                        const prod = products.find(p=>p.id===id);
                        return (
                          <span key={id} onClick={()=>removeProd(id)} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:999,background:'rgba(255,255,255,0.22)',border:'1px solid rgba(255,255,255,0.4)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'}}>
                            {prod?.name} &times;
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{marginTop:12,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:12,padding:'12px 12px 10px'}}>
              <div style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.75)',textTransform:'uppercase',letterSpacing:'0.09em',marginBottom:8}}>Indicacao</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                <button onClick={()=>{ setShowFavorites(false); setFilterInds([]); }} style={{padding:'8px 14px',borderRadius:999,border:'1px solid rgba(255,255,255,0.28)',background:!showFavorites&&filterInds.length===0?'#fff':'rgba(255,255,255,0.16)',color:!showFavorites&&filterInds.length===0?B.purpleDark:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  Todos
                </button>
                <button onClick={()=>setShowFavorites(v=>!v)} style={{padding:'8px 14px',borderRadius:999,border:'1px solid rgba(255,255,255,0.28)',background:showFavorites?B.redLight:'rgba(255,255,255,0.16)',color:showFavorites?B.red:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  Meus Favoritos
                </button>
                {[...indications].sort((a,b)=>a.label.localeCompare(b.label)).map(ind=>{
                  const active = filterInds.includes(ind.id);
                  return (
                    <button key={ind.id} onClick={()=>toggleInd(ind.id)} style={{padding:'8px 14px',borderRadius:999,border:`1px solid ${active?B.gold:'rgba(255,255,255,0.28)'}`,background:active?B.gold:'rgba(255,255,255,0.16)',color:active?'#fff':'rgba(255,255,255,0.9)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      {ind.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeChips.length > 0 && (
              <div style={{marginTop:10,display:'flex',flexWrap:'wrap',gap:6,alignItems:'center'}}>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.6)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginRight:2}}>Ativos:</span>
                {activeChips.map(chip=>(
                  <button key={chip.key} onClick={chip.onRemove} style={{padding:'4px 10px',borderRadius:999,border:'1px solid rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.22)',color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'inline-flex',alignItems:'center',gap:5}}>
                    {chip.label} &times;
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{marginTop:16,color:'rgba(255,255,255,0.85)',fontSize:12,fontWeight:600}}>
          {filtered.length === 0
            ? 'Nenhum protocolo encontrado'
            : totalPages > 1
              ? `Mostrando ${(safePage-1)*PAGE_SIZE+1}–${Math.min(safePage*PAGE_SIZE, filtered.length)} de ${filtered.length} protocolo${filtered.length!==1?'s':''}`
              : `${filtered.length} protocolo${filtered.length!==1?'s':''} encontrado${filtered.length!==1?'s':''}`
          }
        </div>
      </div>

      <div style={{maxWidth:1100,margin:'0 auto',padding:`${isMobile?20:32}px ${isMobile?12:24}px`}}>
        {filtered.length===0
          ? <div style={{textAlign:'center',padding:'70px 0',color:B.muted}}><div style={{fontSize:52,marginBottom:14}}>...</div><div style={{fontSize:16,fontWeight:600,color:B.text,marginBottom:6}}>Nenhum protocolo encontrado com estes filtros</div></div>
          : <>
              <div className="rp-grid-proto" style={{display:'grid',gap:16}}>
                {paginated.map(p=><ProtocolCard key={p.id} protocol={p} products={products} indications={indications} categories={categories} onClick={()=>navigate(`/protocolo/${p.id}`)} isFav={favorites.includes(p.id)} toggleFav={(e)=>{e.stopPropagation(); setFavorites(prev => prev.includes(p.id)? prev.filter(x=>x!==p.id) : [...prev, p.id])}} />)}
              </div>
              {totalPages > 1 && (
                <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:6,marginTop:32,flexWrap:'wrap'}}>
                  <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={safePage===1} style={{padding:'8px 16px',borderRadius:10,border:`1px solid ${B.border}`,background:safePage===1?B.cream:B.white,color:safePage===1?B.muted:B.purple,fontWeight:700,fontSize:13,cursor:safePage===1?'default':'pointer',fontFamily:'inherit'}}>
                    Anterior
                  </button>
                  {renderPageButtons()}
                  <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={safePage===totalPages} style={{padding:'8px 16px',borderRadius:10,border:`1px solid ${B.border}`,background:safePage===totalPages?B.cream:B.white,color:safePage===totalPages?B.muted:B.purple,fontWeight:700,fontSize:13,cursor:safePage===totalPages?'default':'pointer',fontFamily:'inherit'}}>
                    Proximo
                  </button>
                </div>
              )}
            </>
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
      style={{position:'relative', background:B.white,borderRadius:16,border:`1px solid ${hov?B.purpleMid:B.border}`,padding:22,cursor:'pointer',transition:'all 0.18s',transform:hov?'translateY(-3px)':'none',boxShadow:hov?'0 14px 36px rgba(94,61,143,0.14)':'0 8px 22px rgba(44,31,64,0.05)'}}>
      {p.badge&&<span style={{position:'absolute',top:-8,left:14,background:B.gold,color:'#fff',fontSize:10,fontWeight:700,padding:'3px 10px',borderRadius:20,textTransform:'uppercase',letterSpacing:'0.07em',zIndex:3}}>{p.badge}</span>}
      <button onClick={toggleFav} style={{position:'absolute', top: 18, right: 18, background:'none', border:'none', fontSize: 22, cursor:'pointer', color: isFav ? B.red : B.border, zIndex: 2}}>
        {isFav ? '❤' : '♡'}
      </button>
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap', paddingRight: 30}}>
        {(p.concerns || []).map(c=><Tag key={c} label={indications.find(x=>x.id===c)?.label||c} />)}
        {categoryLabel && <Tag label={categoryLabel} color={B.goldLight} text={'#7A5C1E'} />}
      </div>
      <h3 style={{margin:'0 0 8px',color:B.purpleDark,fontSize:15,fontWeight:700,lineHeight:1.35}}>{p.name}</h3>
      <p style={{margin:'0 0 16px',color:B.muted,fontSize:13,lineHeight:1.6}} dangerouslySetInnerHTML={{__html: clean((p.description||'').slice(0,100) + ((p.description||'').length>100?'...':''))}} />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderTop:`1px solid ${B.border}`,paddingTop:12}}>
        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          <span style={{fontSize:12,color:B.muted}}>{p.steps.length} etapas - {prodCount} produtos</span>
          {totalCost > 0 && <span style={{fontSize:12,color:B.green,fontWeight:700}}>Custo estimado: {fmtCurrency(totalCost)}</span>}
        </div>
        <span style={{fontSize:13,color:B.purple,fontWeight:700}}>Ver protocolo -&gt;</span>
      </div>
    </div>
  );
};

const ProtocolDetail = ({ protocol:p, products, indications, categories, navigate, brand, onView }) => {
  const isMobile = useIsMobile();
  const get = id => products.find(x=>x.id===id);
  const professionalKit = p.professionalKitId ? get(p.professionalKitId) : null;
  const homeKit = p.homeKitId ? get(p.homeKitId) : null;

  useEffect(()=>{ if(onView) onView('protocol', p.id); },[p.id]);

  const [sessions, setSessions] = useState(1);
  const [charge, setCharge] = useState('');

  const protocolProducts = p.steps.filter(s=>s.productId).map(s=>get(s.productId)).filter(Boolean);
  const uniqueProducts = [...new Map(protocolProducts.map(pr=>[pr.id,pr])).values()];
  const summaryProducts = uniqueProducts.map(pr => ({ ...pr, _summaryRole: 'product' }));
  
  const totalInvestment = uniqueProducts.reduce((acc, pr) => acc + (parseFloat(pr.cost) || 0), 0);
  const yields = uniqueProducts.map(pr => parseFloat(pr.yieldApplications)).filter(y => y > 0 && !isNaN(y));
  const protocolYield = yields.length > 0 ? Math.min(...yields) : 0;
  const bottleneckProduct = uniqueProducts.find(pr => parseFloat(pr.yieldApplications) === protocolYield);
  const avgCostPerSession = protocolYield > 0 ? totalInvestment / protocolYield : 0;
  const hasCostData = totalInvestment > 0 && protocolYield > 0;

  const pad = isMobile ? '16px 14px' : '28px 28px 24px';
  const secPad = isMobile ? '16px 14px' : '24px 28px';
  const categoryLabel = categories.find(c => c.id === p.category)?.label || p.category;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/protocolo/${p.id}`
    : `/protocolo/${p.id}`;

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

  const shareText = encodeURIComponent(`Confira este protocolo: ${p.name} ${shareUrl}`);
  const homeRoutineSections = [{ slot:'morning', label:'Manha' }, { slot:'night', label:'Noite' }]
    .map(({ slot, label }) => {
      const entries = (p.homeUse?.[slot] || [])
        .map((item, index) => {
          const prod = item.productId ? get(item.productId) : null;
          const title = prod?.name || `Passo ${index + 1}`;
          const instruction = (item.instruction || '').trim();
          return `- ${title}${instruction ? `: ${instruction}` : ''}`;
        })
        .filter(Boolean);
      return entries.length ? `${label}\n${entries.join('\n')}` : '';
    })
    .filter(Boolean);
  const homeRoutineText = encodeURIComponent(
    [
      `Olá! Segue a rotina de uso em casa do protocolo ${p.name}.`,
      homeKit ? `Kit de uso em casa recomendado: ${homeKit.name}` : '',
      '',
      ...homeRoutineSections,
      '',
    ].filter(Boolean).join('\n')
  );

  return (
    <div style={{background:B.cream, flex: 1}}>
      <div className="no-print rp-bkbar" style={{background:B.white,borderBottom:`1px solid ${B.border}`,padding:isMobile?'12px':'10px 24px',display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'center',gap:10,flexDirection:isMobile?'column':'row',overflowX:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,width:isMobile?'100%':'auto'}}>
          <button onClick={()=>navigate('/')} style={{background:isMobile?B.purpleLight:'none',border:isMobile?`1px solid ${B.border}`:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit',borderRadius:isMobile?10:0,padding:isMobile?'10px 12px':0}}>Voltar</button>
          {isMobile && <span style={{fontSize:11,fontWeight:700,color:B.muted,letterSpacing:'0.08em',textTransform:'uppercase'}}>Acoes do protocolo</span>}
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', width:isMobile?'100%':'auto'}}>
          <button onClick={()=>{navigator.clipboard.writeText(window.location.href); alert('Link copiado!');}} style={{background:B.purpleLight,color:B.purple,border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,cursor:'pointer',fontFamily:'inherit',flex:isMobile?'1 1 120px':'0 0 auto'}}>Copiar link</button>
          <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noreferrer" style={{background:'#25D366',color:B.white,textDecoration:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,display:'inline-flex',alignItems:'center',justifyContent:'center',flex:isMobile?'1 1 120px':'0 0 auto'}}>Compartilhar</a>
          <button onClick={handlePrint} style={{background:B.purple,color:B.white,border:'none',padding:'8px 16px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:13,cursor:'pointer',fontFamily:'inherit',flex:isMobile?'1 1 120px':'0 0 auto'}}>{isMobile ? 'PDF' : 'Salvar PDF'}</button>
        </div>
      </div>

      <div id="protocol-content" style={{maxWidth:740,margin:'0 auto',padding:isMobile?'18px 12px 26px':'36px 24px', background: B.cream}}>
        
          {/* Header para impressao */}
        <div className="print-only" style={{ textAlign: 'center', marginBottom: '30px', borderBottom: `2px solid ${B.purple}`, paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo brand={brand} size={60} />
          </div>
          <h1 style={{ color: B.purpleDark, margin: '0 0 6px', fontFamily: 'Georgia, serif', fontSize: 24 }}>{brand?.companyName || 'Extratos da Terra'}</h1>
          <p style={{ margin: 0, color: B.muted, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>Protocolo Profissional</p>
        </div>

        {/* Header */}
        <div style={{background:B.white,borderRadius:isMobile?16:14,border:`1px solid ${B.border}`,padding:pad,marginBottom:16,boxShadow:isMobile?'0 10px 28px rgba(44,31,64,0.05)':'0 8px 22px rgba(44,31,64,0.04)'}}>
          <div className="no-print" style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
            {(p.concerns || []).map(c=><Tag key={c} label={indications.find(x=>x.id===c)?.label||c} size="md" />)}
            {categoryLabel && <Tag label={categoryLabel} color={B.goldLight} text={'#7A5C1E'} size="md" />}
          </div>
          <h1 style={{margin:'0 0 10px',color:B.purpleDark,fontSize:isMobile?20:24,fontWeight:700,fontFamily:'Georgia, serif',lineHeight:1.3}}>{p.name}</h1>
          <InfoText text={p.description} isMobile={isMobile} />
          <div className="rp-proto-meta" style={{display:'flex',gap:isMobile?10:28,flexWrap:'wrap',paddingTop:12,borderTop:`1px solid ${B.border}`, marginTop: 14}}>
            {p.frequency&&<div><span style={{fontSize:11,color:B.muted,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.06em'}}>Frequencia</span><br/><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.frequency}</span></div>}
            {p.associations&&<div><span style={{fontSize:11,color:B.muted,textTransform:'uppercase',fontWeight:700,letterSpacing:'0.06em'}}>Associacoes</span><br/><span style={{fontSize:13,color:B.text,fontWeight:600}}>{p.associations}</span></div>}
            {p.youtubeUrl&&(
              <a href={p.youtubeUrl} target="_blank" rel="noreferrer" className="no-print" style={{display:'inline-flex',alignItems:'center',gap:7,background:'#FF0000',color:B.white,padding:'7px 14px',borderRadius:8,fontWeight:700,fontSize:12,textDecoration:'none'}}>Video no YouTube</a>
            )}
            {p.version && (
              <div style={{marginLeft:'auto',textAlign:'right'}}>
                <span style={{fontSize:10,color:B.muted,fontWeight:600,letterSpacing:'0.04em'}}>
                  v{p.version}{p.updatedAt ? ` · ${new Date(p.updatedAt).toLocaleDateString('pt-BR')}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Steps */}
        <div style={{background:B.white,borderRadius:16,border:`1px solid ${B.border}`,padding:secPad,marginBottom:16,boxShadow:'0 8px 22px rgba(44,31,64,0.04)'}}>
          <h2 style={{margin:'0 0 20px',fontSize:15,fontWeight:700,color:B.text}}>Protocolo em Cabine</h2>
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
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,flexWrap:'wrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0,flex:'1 1 260px'}}>
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} style={{width:isMobile?38:44,height:isMobile?38:44,objectFit:'contain',borderRadius:8,background:B.white,border:`1px solid ${B.border}`,flexShrink:0}} />
                            ) : (
                              <div style={{width:isMobile?38:44,height:isMobile?38:44,borderRadius:8,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',fontSize:isMobile?15:18,flexShrink:0}}>P</div>
                            )}
                            <ProductTooltip product={prod} navigate={navigate}>
                              <span style={{fontWeight:700,fontSize:isMobile?13:14,color:isActive(prod)?B.purpleDark:B.red,lineHeight:1.35}}>{prod.name}{!isActive(prod)&&' (inativo)'}</span>
                            </ProductTooltip>
                          </div>
                          {cpa!=null&&<span className="no-print" style={{fontSize:11,fontWeight:700,color:B.green,whiteSpace:'nowrap'}}>{fmtCurrency(cpa)}/apl.</span>}
                        </div>
                        {!isActive(prod)&&<div className="no-print" style={{fontSize:11,color:B.red,fontWeight:700,marginTop:3}}>Produto inativo</div>}
                        {prod.actives&&isActive(prod)&&<div style={{fontSize:11,color:B.muted,marginTop:3,lineHeight:1.4}} dangerouslySetInnerHTML={{__html: clean('Ativos: ' + prod.actives.slice(0,isMobile?80:999) + (isMobile&&prod.actives.length>80?'...':''))}} /> }
                      </div>
                    : <div style={{background:'#F3F4F6',borderRadius:10,padding:'8px 12px',marginBottom:8,fontSize:13,color:B.muted,fontStyle:'italic'}}>Equipamento / tecnica manual</div>
                  }
                  <InfoText text={step.instruction} isMobile={isMobile} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Home Use */}
        {((p.homeUse&&(p.homeUse.morning?.length>0||p.homeUse.night?.length>0)) || homeKit) && (
          <div className="avoid-break" style={{background:B.white,borderRadius:16,border:`1px solid ${B.border}`,padding:secPad,marginBottom:16,boxShadow:'0 8px 22px rgba(44,31,64,0.04)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'flex-start',gap:12,flexDirection:isMobile?'column':'row',marginBottom:12}}>
              <div>
                <h2 style={{margin:'0 0 4px',fontSize:15,fontWeight:700,color:B.text}}>Uso em Casa</h2>
                <p style={{margin:0,fontSize:12,color:B.muted}}>Orientacoes de rotina domiciliar para potencializar os resultados entre as sessoes</p>
              </div>
              {(p.homeUse?.morning?.length>0 || p.homeUse?.night?.length>0) && (
                <a href={`https://api.whatsapp.com/send?text=${homeRoutineText}`} target="_blank" rel="noreferrer" className="no-print" style={{background:'#25D366',color:B.white,textDecoration:'none',padding:'10px 14px',borderRadius:10,fontWeight:700,fontSize:12,display:'inline-flex',alignItems:'center',justifyContent:'center',textAlign:'center',minHeight:42}}>
                  Enviar rotina para o cliente (WhatsApp)
                </a>
              )}
            </div>
            {homeKit && (
              <div style={{background:`linear-gradient(135deg, ${B.purpleLight}, rgba(245,236,216,0.82))`,border:`1px solid ${B.border}`,borderRadius:12,padding:isMobile?'12px':'14px 16px',marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Kit de Uso em Casa</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:'1 1 240px'}}>
                    {homeKit.image ? (
                      <img src={homeKit.image} alt={homeKit.name} style={{width:52,height:52,objectFit:'contain',borderRadius:10,background:B.white,border:`1px solid ${B.border}`,flexShrink:0}} />
                    ) : (
                      <div style={{width:52,height:52,borderRadius:10,background:B.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>P</div>
                    )}
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,color:B.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Recomendado ao final</div>
                      <ProductTooltip product={homeKit} navigate={navigate}>
                        <span style={{fontWeight:700,fontSize:14,color:B.purpleDark,lineHeight:1.35}}>{homeKit.name}</span>
                      </ProductTooltip>
                    </div>
                  </div>
                  <BuyLink href={homeKit.siteUrl} isMobile={isMobile} sx={{padding:'8px 14px',fontSize:11}} />
                </div>
              </div>
            )}
            <div className="rp-grid-home" style={{display:'grid',gap:12}}>
              {[{slot:'morning',label:'Manha'},{slot:'night',label:'Noite'}].map(({slot,label})=>
                p.homeUse[slot]?.length>0&&(
                  <div key={slot} style={{background:B.cream,borderRadius:12,padding:isMobile?'14px 12px':'14px 16px',border:isMobile?`1px solid ${B.border}`:'none'}}>
                    <div style={{fontWeight:700,fontSize:13,color:B.text,marginBottom:12}}>{label}</div>
                    {p.homeUse[slot].map((item,i)=>{
                      const prod = item.productId ? get(item.productId) : null;
                      return (
                        <div key={i} className="avoid-break" style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-start'}}>
                          <span className="no-print" style={{width:20,height:20,background:B.purple,color:B.white,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0,marginTop:2}}>{i+1}</span>
                          <div style={{flex:1,minWidth:0}}>
                            {prod ? (
                              <div style={{display:'flex', alignItems:'flex-start', gap: 8, marginBottom: 4}}>
                                {prod.image ? (
                                  <img src={prod.image} alt={prod.name} style={{width:36,height:36,objectFit:'contain',borderRadius:8,background:B.white,border:`1px solid ${B.border}`,flexShrink:0}} />
                                ) : (
                                  <div style={{width:36,height:36,borderRadius:8,background:B.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0}}>P</div>
                                )}
                                <div style={{display:'flex', flexDirection:'column', gap: 4, minWidth: 0}}>
                                  <ProductTooltip product={prod} navigate={navigate}>
                                    <span style={{fontWeight:700,fontSize:12,color:B.purpleDark,lineHeight:1.3}}>{prod.name}</span>
                                  </ProductTooltip>
                                  <div>
                                    <BuyLink href={prod.siteUrl} isMobile={isMobile} sx={{padding: '2px 8px', fontSize: 10}} />
                                  </div>
                                </div>
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
        {(summaryProducts.length > 0 || professionalKit) && (
          <div className="rp-cost-summary avoid-break" style={{background:`linear-gradient(135deg, ${B.purpleLight}, ${B.goldLight})`,borderRadius:16,border:`1px solid ${B.border}`,padding:'22px 28px', pageBreakInside: 'avoid', boxShadow:'0 10px 28px rgba(44,31,64,0.06)'}}>
            <h2 style={{margin:'0 0 14px',fontSize:16,fontWeight:700,color:B.purpleDark}}>Uso em Cabine</h2>
            {professionalKit && (
              <div style={{background:`linear-gradient(135deg, ${B.purpleLight}, rgba(245,236,216,0.82))`,border:`1px solid ${B.border}`,borderRadius:12,padding:isMobile?'12px':'14px 16px',marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:8}}>Kit Profissional Recomendado</div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0,flex:'1 1 240px'}}>
                    {professionalKit.image ? (
                      <img src={professionalKit.image} alt={professionalKit.name} style={{width:52,height:52,objectFit:'contain',borderRadius:10,background:B.white,border:`1px solid ${B.border}`,flexShrink:0}} />
                    ) : (
                      <div style={{width:52,height:52,borderRadius:10,background:B.white,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>P</div>
                    )}
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:11,color:B.muted,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Recomendado para o profissional</div>
                      <ProductTooltip product={professionalKit} navigate={navigate}>
                        <span style={{fontWeight:700,fontSize:14,color:B.purpleDark,lineHeight:1.35}}>{professionalKit.name}</span>
                      </ProductTooltip>
                    </div>
                  </div>
                  <BuyLink href={professionalKit.siteUrl} isMobile={isMobile} sx={{padding:'8px 14px',fontSize:11}} />
                </div>
              </div>
            )}
            {summaryProducts.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {summaryProducts.map(pr=>{
                const c=costPerApp(pr);
                return (
                  <div key={pr.id} className="avoid-break" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',background:'rgba(255,255,255,0.8)',borderRadius:10,padding:'12px 14px', border:`1px solid rgba(255,255,255,0.4)`}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      {pr.image ? (
                        <img src={pr.image} alt={pr.name} style={{width:40,height:40,objectFit:'contain',borderRadius:6,background:B.white, border:`1px solid ${B.border}`}}/>
                      ) : (
                          <div style={{width:40,height:40,borderRadius:6,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>P</div>
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
            )}
            
            {hasCostData && (
              <div className="avoid-break" style={{background:B.white, borderRadius:10, padding:'16px', marginTop:16, border:`1px solid ${B.border}`}}>
                 <h3 style={{margin:'0 0 12px',fontSize:15,color:B.purpleDark}}>Analise de Rentabilidade dos Produtos</h3>
                 <ul style={{listStyle:'none', padding:0, margin:0, fontSize:13, color:B.text, lineHeight:1.8}}>
                   <li style={{display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${B.cream}`, paddingBottom:6, marginBottom:6}}>
                     <span><strong>Investimento Total:</strong> <span style={{color:B.muted, fontSize:11}}>(soma dos produtos)</span></span>
                     <span style={{fontWeight:'bold'}}>{fmtCurrency(totalInvestment)}</span>
                   </li>
                   <li style={{display:'flex', justifyContent:'space-between', borderBottom:`1px solid ${B.cream}`, paddingBottom:6, marginBottom:6}}>
                      <span><strong>Rendimento medio:</strong> {bottleneckProduct && <span className="no-print" style={{color:B.muted, fontSize:11}}>(limitado por: {bottleneckProduct.name})</span>}</span>
                      <span style={{fontWeight:'bold', color:B.purple}}>{protocolYield} aplicacoes</span>
                   </li>
                   <li style={{display:'flex', justifyContent:'space-between', paddingTop:2}}>
                      <span style={{fontWeight:700, color:B.purpleDark}}>Custo medio por Sessao:</span>
                     <span style={{color:B.green, fontWeight:'bold', fontSize:16}}>{fmtCurrency(avgCostPerSession)}</span>
                   </li>
                 </ul>
              </div>
            )}

            {brand?.showCalculator && (
              <div className="no-print avoid-break" style={{marginTop: 20, paddingTop: 20, borderTop: `1px solid rgba(0,0,0,0.1)`}}>
                 <h3 style={{margin:'0 0 12px',fontSize:15,color:B.purpleDark}}>Calculadora de Lucratividade</h3>
                 
                 {!hasCostData && (
                   <div style={{fontSize:12, color:B.red, marginBottom: 14, background: B.redLight, padding: '10px 14px', borderRadius: 8, fontWeight: 600}}>
                     Configure o "Rendimento" (no de aplicacoes) no cadastro de cada produto para calcular o custo exato.
                   </div>
                 )}

                 <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14}}>
                     <Field label="Qtd. de Sessoes" value={sessions} onChange={v=>setSessions(v)} type="number" />
                     <Field label="Valor Cobrado por Sessao (R$)" value={charge} onChange={v=>setCharge(v)} type="number" />
                 </div>
                 
                 <div className="rp-cost-total" style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:B.purple,borderRadius:10,padding:'14px 18px',gap:10}}>
                  <div>
                    <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em'}}>Lucro Estimado</div>
                    <div style={{color:'rgba(255,255,255,0.6)',fontSize:10,marginTop:2}}>Receita Bruta - Custo dos Produtos ({fmtCurrency(avgCostPerSession)}/sessao)</div>
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

const CompositionSection = ({ composition, isMobile }) => {
  const [expanded, setExpanded] = useState(false);
  const preview = composition.slice(0, 120);
  const hasMore = composition.length > 120;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:B.muted,textTransform:'uppercase',letterSpacing:'0.07em'}}>Composicao (INCI)</span>
        {hasMore && (
          <button onClick={()=>setExpanded(e=>!e)} style={{background:'none',border:'none',color:B.purple,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:0}}>
            {expanded ? 'Recolher' : 'Ver completa'}
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
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/produto/${p.id}`
    : `/produto/${p.id}`;

  const Section = ({ title, children }) => (
    <div style={{marginBottom:20}}>
      <div style={{fontSize:11,fontWeight:700,color:B.purple,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8,paddingBottom:6,borderBottom:`2px solid ${B.purpleLight}`}}>{title}</div>
      {children}
    </div>
  );

  const shareText = encodeURIComponent(`Confira este produto: ${p.name} ${shareUrl}`);

  return (
    <div style={{background:B.cream, flex: 1}}>
      <div className="no-print" style={{background:B.white,borderBottom:`1px solid ${B.border}`,padding:`${isMobile?12:10}px ${isMobile?12:24}px`,display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'center',flexDirection:isMobile?'column':'row',gap:10,overflowX:'hidden'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,width:isMobile?'100%':'auto'}}>
          <button onClick={()=>navigate('/')} style={{background:isMobile?B.purpleLight:'none',border:isMobile?`1px solid ${B.border}`:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit',borderRadius:isMobile?10:0,padding:isMobile?'10px 12px':0}}>Voltar</button>
          {isMobile && <span style={{fontSize:11,fontWeight:700,color:B.muted,letterSpacing:'0.08em',textTransform:'uppercase'}}>Acoes do produto</span>}
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap', width:isMobile?'100%':'auto'}}>
          <a href={`https://api.whatsapp.com/send?text=${shareText}`} target="_blank" rel="noreferrer" style={{background:'#25D366',color:B.white,textDecoration:'none',padding:isMobile?'8px 14px':'9px 22px',borderRadius:8,fontWeight:700,fontSize:isMobile?12:14,display:'inline-flex',alignItems:'center',justifyContent:'center',flex:isMobile?'1 1 120px':'0 0 auto'}}>Compartilhar</a>
          <BuyLink href={p.siteUrl} isMobile={isMobile} sx={{flex:isMobile?'1 1 140px':'0 0 auto'}}>Ver produto</BuyLink>
        </div>
      </div>

      <div style={{maxWidth:860,margin:'0 auto',padding:isMobile?'18px 12px 26px':'36px 24px'}}>
        <div style={{background:B.white,borderRadius:isMobile?16:14,border:`1px solid ${B.border}`,padding:isMobile?'18px 14px':'32px',marginBottom:16,display:'flex',flexDirection:isMobile?'column':'row',gap:isMobile?14:32,alignItems:'flex-start',boxShadow:isMobile?'0 10px 28px rgba(44,31,64,0.05)':'0 8px 22px rgba(44,31,64,0.04)'}}>
          {p.image && (
            <div style={{width:isMobile?80:180,height:isMobile?80:180,flexShrink:0,borderRadius:12,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:`1px solid ${B.border}`}}>
              <img src={p.image} alt={p.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
            </div>
          )}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
              {cats.map(c=><Tag key={c} label={categories.find(x=>x.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} size="md" />)}
              <ProductTypeTags product={p} size="md" />
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
                <BuyLink href={p.siteUrl} isMobile={false} sx={{padding: '11px 24px', fontSize: 15}}>Ver produto</BuyLink>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:0}}>
          <div>
            {p.description && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Descricao"><InfoText text={p.description} isMobile={isMobile} /></Section>
              </div>
            )}
            {p.benefits && (
              <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Beneficios">
                  {p.benefits.split(';').map((b,i)=>b.trim()&&(
                    <div key={i} style={{display:'flex',gap:8,marginBottom:7,alignItems:'flex-start'}}>
                      <span style={{color:B.purple,fontWeight:700,flexShrink:0,marginTop:3}}>•</span>
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
                {p.indications&&<Section title="Indicacoes"><InfoText text={p.indications} isMobile={isMobile} /></Section>}
                {p.contra&&<Section title="Contraindicacoes"><InfoText text={p.contra} isMobile={isMobile} /></Section>}
              </div>
            )}
            {(p.yieldApplications||p.cost) && (
              <div style={{background:B.purpleLight,borderRadius:14,border:`1px solid ${B.border}`,padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Rendimento & Custo">
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {p.yieldApplications&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Rendimento</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{p.yieldApplications} aplicacoes</span></div>}
                    {p.yieldGramsPerUse&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Por aplicacao</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{p.yieldGramsPerUse} g/ml</span></div>}
                    {p.cost&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'rgba(255,255,255,0.6)',borderRadius:8,padding:'8px 12px'}}><span style={{fontSize:13,color:B.muted}}>Custo produto</span><span style={{fontSize:14,fontWeight:700,color:B.purple}}>{fmtCurrency(parseFloat(p.cost))}</span></div>}
                    {costPerApp(p)!=null&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:B.purple,borderRadius:8,padding:'10px 14px'}}><span style={{fontSize:13,color:'rgba(255,255,255,0.8)',fontWeight:600}}>Custo/aplicacao</span><span style={{fontSize:16,fontWeight:700,color:B.gold}}>{fmtCurrency(costPerApp(p))}</span></div>}
                  </div>
                </Section>
              </div>
            )}
            {p.homeUseNote && (
              <div style={{background:B.greenLight,borderRadius:14,border:'1px solid #A5D6A7',padding:isMobile?14:24,marginBottom:14}}>
                <Section title="Rotina Home Care">
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
                        <span style={{fontSize:12,color:B.purple,fontWeight:700,flexShrink:0,marginLeft:8}}>Ver protocolo</span>
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

const ProductSearch = ({ products, protocols, indications, categories, navigate }) => {
  const [q, setQ] = useState('');
  const isMobile = useIsMobile();
  const matched = q.length>1 ? products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())) : [];
  const getProtos = id => protocols.filter(p=>p.published&&(p.steps.some(s=>s.productId===id)||p.homeUse?.morning?.some(h=>h.productId===id)||p.homeUse?.night?.some(h=>h.productId===id)||p.professionalKitId===id||p.homeKitId===id));
  return (
    <div style={{background:B.cream, flex: 1}}>
      <div style={{background:`linear-gradient(135deg, ${B.purpleDark} 0%, ${B.purple} 100%)`,padding:isMobile?'28px 14px 24px':'44px 24px 36px',textAlign:'center',overflowX:'hidden'}}>
        <div style={{fontSize:10,color:B.gold,fontWeight:700,letterSpacing:'0.16em',marginBottom:8,textTransform:'uppercase'}}>Localize por produto</div>
        <h1 style={{color:B.white,fontSize:26,fontWeight:700,fontFamily:'Georgia, serif',margin:'0 0 8px'}}>Buscar por Produto</h1>
        <p style={{color:'rgba(255,255,255,0.7)',fontSize:14,margin:'0 0 24px'}}>Descubra em quais protocolos um produto e utilizado</p>
        <div style={{maxWidth:760,margin:'0 auto',padding:`0 ${isMobile?4:0}px`}}>
          <div style={{background:'rgba(255,255,255,0.12)',padding:'16px',borderRadius:16,border:'1px solid rgba(255,255,255,0.2)',boxShadow:'0 18px 40px rgba(24, 12, 44, 0.16)',display:'flex',flexDirection:'column',gap:12,textAlign:'left'}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.72)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:4}}>Encontre um produto</div>
              <div style={{fontSize:13,color:'rgba(255,255,255,0.82)',lineHeight:1.45}}>Pesquise pelo nome para ver em quais protocolos ele aparece e acessar sua pagina rapidamente.</div>
            </div>
            <div style={{display:'flex',gap:10,flexDirection:isMobile?'column':'row'}}>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex: Serum Melan T-Block..." autoFocus
                style={{width:'100%',padding:'13px 20px',borderRadius:12,border:'none',fontSize:15,outline:'none',boxSizing:'border-box',fontFamily:'inherit',background:B.white,color:B.text,flex:1}} />
              {q && (
                <button
                  onClick={()=>setQ('')}
                  style={{padding:isMobile?'11px 14px':'0 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.22)',background:'rgba(255,255,255,0.08)',color:B.white,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',minHeight:48}}
                >
                  Limpar busca
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div style={{maxWidth:720,margin:'0 auto',padding:isMobile?'22px 12px':'32px 24px',overflowX:'hidden'}}>
        {q.length>1&&matched.length===0&&<div style={{textAlign:'center',color:B.muted,padding:40,fontSize:15}}>Nenhum produto encontrado</div>}
        {matched.map(prod=>{
          const protos=getProtos(prod.id);
          const cpa=costPerApp(prod);
          return (
            <div key={prod.id} style={{background:B.white,borderRadius:16,border:`1px solid ${B.border}`,padding:isMobile?'18px 16px':'20px 22px',marginBottom:16,overflow:'hidden',boxShadow:'0 10px 28px rgba(44,31,64,0.06)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,gap:isMobile?14:18,flexDirection:isMobile?'column':'row'}}>
                <div style={{display:'flex',gap:isMobile?12:16,alignItems:'flex-start',minWidth:0,flex:1,width:'100%'}}>
                  <div style={{width:isMobile?72:84,height:isMobile?72:84,borderRadius:12,background:B.cream,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',border:`1px solid ${B.border}`,flexShrink:0}}>
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} style={{width:'100%',height:'100%',objectFit:'contain'}} />
                    ) : (
                      <div style={{fontSize:isMobile?24:28,color:B.purple}}>P</div>
                    )}
                  </div>
                  <div style={{minWidth:0,flex:1}}>
                  <h3 style={{margin:'0 0 4px',color:B.purpleDark,fontSize:16,fontWeight:700}}>{prod.name}</h3>
                    {prod.actives&&<div style={{fontSize:13,color:B.muted,marginBottom:4,lineHeight:1.5}} dangerouslySetInnerHTML={{__html: clean('Ativos: ' + prod.actives.slice(0, 100))}} /> }
                    {cpa!=null&&<div style={{fontSize:13,color:B.green,fontWeight:700}}>Custo/aplicacao: {fmtCurrency(cpa)}</div>}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10,alignItems:isMobile?'stretch':'flex-end',width:isMobile?'100%':'auto'}}>
                  <div style={{display:'flex',gap:4,flexWrap:'wrap',justifyContent:isMobile?'flex-start':'flex-end'}}>
                    {(prod.categories||[prod.category]).map(c=><Tag key={c} label={categories.find(cat=>cat.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} />)}
                    <ProductTypeTags product={prod} />
                  </div>
                  <div style={{display:'flex', gap:8, alignItems:'stretch', flexDirection:isMobile?'row':'row', width:isMobile?'100%':'auto'}}>
                    <button onClick={()=>navigate(`/produto/${prod.id}`)} style={{background:B.purpleLight,border:`1px solid ${B.border}`,color:B.purple,fontWeight:700,fontSize:12,cursor:'pointer',fontFamily:'inherit',padding:'10px 12px',borderRadius:10,minHeight:42,textAlign:'center',flex:isMobile?1:'0 0 auto'}}>Ver produto</button>
                    <BuyLink href={prod.siteUrl} isMobile={isMobile} sx={{padding: '10px 14px', fontSize: 12, minHeight:42}} />
                  </div>
                </div>
              </div>
              {protos.length>0
                ? <><div style={{fontSize:13,fontWeight:700,color:B.text,marginBottom:10}}>Utilizado em {protos.length} protocolo(s):</div>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {protos.map(pr=><button key={pr.id} onClick={()=>navigate(`/protocolo/${pr.id}`)} style={{background:B.purpleLight,border:`1px solid ${B.border}`,borderRadius:10,padding:'11px 14px',textAlign:'left',cursor:'pointer',fontSize:14,color:B.purple,fontWeight:700,fontFamily:'inherit'}}>{pr.name} ?</button>)}
                    </div></>
                : <div style={{fontSize:13,color:B.muted,fontStyle:'italic'}}>Nao vinculado a nenhum protocolo publicado</div>
              }
            </div>
          );
        })}
        {q.length<=1&&<div style={{textAlign:'center',padding:'70px 0'}}><div style={{fontSize:52,marginBottom:16}}>??</div><p style={{color:B.muted,fontSize:15,maxWidth:340,margin:'0 auto'}}>Digite o nome de um produto para descobrir em quais protocolos ele e utilizado</p></div>}
      </div>
    </div>
  );
};

const TextProtocolImporter = ({ onImport, products }) => {
  const [text, setText] = useState('');
  const [showImport, setShowImport] = useState(false);

  const processText = () => {
    if (!text.trim()) {
      alert("Cole o texto do PDF antes de processar.");
      return;
    }

    const normalizeText = (input) => {
      let s = String(input || '').toLowerCase();
      s = s.replace(/[\u2022\u2023\u25E6\u2043\u2219\u2010-\u2015\u2017\-]/g, ' '); // remove bullets/hyphens/dashes
      s = s.replace(/\s+([gml]b?|kg|mg|ml|cm|mm)\b/g, '$1'); // normaliza unidades como 700 g -> 700g
      s = s.replace(/[^a-z0-9\s]/g, ' '); // tira pontuaÃ§Ã£o
      s = s.replace(/\s+/g, ' ').trim();
      return s;
    };

    const getTokens = (input) => normalizeText(input).split(/\s+/).filter(Boolean);

    const tryMatchProduct = (textInstruction) => {
      const productTokens = getTokens(textInstruction);
      if (productTokens.length === 0) return null;

      const candidates = [];
      for (const p of products) {
        if (!isActive(p)) continue;
        const pTokens = getTokens(p.name.split('-')[0]);
        if (pTokens.length === 0) continue;

        const uniqueTokens = Array.from(new Set(pTokens));
        const tokenSet = new Set(getTokens(textInstruction));

        let matches = 0;
        for (const t of uniqueTokens) {
          if (tokenSet.has(t)) matches += 1;
        }

        const score = matches / uniqueTokens.length;
        if (score >= 0.4) {
          candidates.push({ product: p, score, matches, length: uniqueTokens.length });
        }
      }

      if (candidates.length === 0) return null;

      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matches !== a.matches) return b.matches - a.matches;
        return b.length - a.length;
      });

      return candidates[0].product.id;
    };

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
        
        if (lower === 'protocolo' || lower.includes('versao') || lower === 'extratos' || lower === 'da terra' || lower.includes('cosmetologia') || lower === 'beleza' || lower === 'que faz' || lower === 'bem' || lower.includes('protocolo clareamento')) continue;

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
            if (lower.includes('manha:')) { homeUseTime = 'morning'; continue; }
            if (lower.includes('noite:')) { homeUseTime = 'night'; continue; }
            if (homeUseTime && line.match(/^\d+\.\s*/)) {
                const itemText = line.replace(/^\d+\.\s*/, '').trim();
                const matchedProductId = tryMatchProduct(itemText);
                if (matchedProductId) {
                    homeUse[homeUseTime].push({ instruction: 'Aplicar na região conforme recomendação.', productId: matchedProductId });
                } else {
                    homeUse[homeUseTime].push({ instruction: itemText, productId: null });
                }
            } else if (homeUseTime && line.length > 3) {
                let arr = homeUse[homeUseTime];
                if (arr.length > 0) arr[arr.length-1].instruction += ' ' + line;
                else arr.push({ instruction: line, productId: null });
            }
            continue;
        }

        if (lower.includes('frequencia:') || lower.includes('associacoes:')) {
            if (lower.includes('frequencia:') && lower.includes('associacoes:')) {
                const m = line.match(/frequencia:\s*(.*?)\s*associacoes:\s*(.*)$/i);
                if (m) {
                    frequency = m[1].replace(/[]/g, '').trim();
                    associations = m[2].replace(/[]/g, '').trim();
                    continue;
                }
            }

            if (lower.includes('frequencia:')) {
                frequency = line.replace(/.*frequencia:\s*/i, '').replace(/[]/g, '').trim();
                // se a linha continuar com associacoes, extrai tambm
                const assocPart = line.match(/associacoes:\s*(.*)$/i);
                if (assocPart) associations = assocPart[1].replace(/[]/g, '').trim();
                continue;
            }
            if (lower.includes('associacoes:')) {
                associations = line.replace(/.*associacoes:\s*/i, '').replace(/[]/g, '').trim();
                continue;
            }
        }

        const stepMatch = line.match(/^\d+\.\s*(.+)$/);
        if (stepMatch) {
            if (currentStep) steps.push(currentStep);
            currentStep = { id: uid(), phase: stepMatch[1].trim(), instruction: '', productId: null };
            continue;
        }

        if (currentStep && !lower.includes('')) {
            currentStep.instruction += (currentStep.instruction ? '\n' : '') + line;
        }
    }
    if (currentStep) steps.push(currentStep);

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
        reviewStatus: 'needs_review',
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
          <p style={{ margin: 0, fontSize: 13, color: B.purpleDark }}>Cole o texto extraido do PDF para adiantar o preenchimento.</p>
        </div>
        <button 
          onClick={() => setShowImport(!showImport)}
          style={{ background: B.purple, color: B.white, border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
        >
          {showImport ? 'Fechar' : 'Importar de PDF'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginTop: 16, borderTop: `1px solid rgba(94, 61, 143, 0.2)`, paddingTop: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 10, color: B.purpleDark }}>
            Abra o PDF, selecione todo o texto do protocolo (Ctrl+C) e cole na caixa abaixo (Ctrl+V).
            Nos vamos tentar separar o titulo, as fases e as instrucoes. Depois e so revisar e salvar.
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
            Processar e Preencher
          </button>
        </div>
      )}
    </div>
  );
};


const XMLImporter = ({ products, saveProducts }) => {
  const [xmlInput, setXmlInput] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [parsedItems, setParsedItems] = useState([]);

  const normalizeName = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[\u00C0-\u017F]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const findProductMatch = (productName) => {
    const normalized = normalizeName(productName);
    if (!normalized) return null;

    const exactMatch = products.find((p) => normalizeName(p.name) === normalized);
    if (exactMatch) return exactMatch;

    const tokenSet = new Set(normalized.split(' '));
    let best = null;
    let bestScore = 0;

    products.forEach((p) => {
      const pName = normalizeName(p.name);
      const tokens = [...new Set(pName.split(' ').filter(Boolean))];
      if (!tokens.length) return;
      const hits = tokens.filter((t) => tokenSet.has(t)).length;
      const score = hits / tokens.length;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    });

    return bestScore >= 0.4 ? best : null;
  };

  const handleXMLImport = () => {
    if (!xmlInput.trim()) {
      alert('Cole o codigo XML antes de processar.');
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
    const xmlDoc = parser.parseFromString(cleanXmlInput, 'text/xml');
    const items = xmlDoc.getElementsByTagName('item');

    if (!items || items.length === 0) {
      alert('Nenhum <item> encontrado no XML. Verifique se copiou o codigo correto.');
      return;
    }

    const provisional = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const name = item.getElementsByTagName('title')[0]?.textContent || item.getElementsByTagName('g:title')[0]?.textContent || '';
      const priceStr = item.getElementsByTagName('g:price')[0]?.textContent || item.getElementsByTagName('price')[0]?.textContent || '';
      const image = item.getElementsByTagName('g:image_link')[0]?.textContent || item.getElementsByTagName('image_link')[0]?.textContent || '';
      const link = item.getElementsByTagName('link')[0]?.textContent || item.getElementsByTagName('g:link')[0]?.textContent || '';
      const description = item.getElementsByTagName('description')[0]?.textContent || item.getElementsByTagName('g:description')[0]?.textContent || '';

      if (!name.trim()) continue;

      let cleanStr = priceStr.replace(/[^[0-9.,]/g, '');
      let numericPrice = 0;
      if (cleanStr.includes(',') && cleanStr.includes('.')) {
        numericPrice = parseFloat(cleanStr.replace(/\./g, '').replace(',', '.'));
      } else if (cleanStr.includes(',')) {
        numericPrice = parseFloat(cleanStr.replace(',', '.'));
      } else {
        numericPrice = parseFloat(cleanStr);
      }

      const matched = findProductMatch(name);

      provisional.push({
        id: i,
        name: name.trim(),
        price: Number.isNaN(numericPrice) ? 0 : numericPrice,
        image: image.trim(),
        link: link.trim(),
        description: description.trim(),
        matchedProductId: matched?.id || null,
        matchedProductName: matched?.name || null,
        includeNew: true,
      });
    }

    setParsedItems(provisional);
    setShowImport(true);
  };

  const updateIncludeNew = (id, value) => {
    setParsedItems((prev) => prev.map((item) => (item.id === id ? { ...item, includeNew: value } : item)));
  };

  const applyXMLChanges = () => {
    if (!parsedItems.length) {
      alert('Nada para sincronizar. Importe o XML primeiro.');
      return;
    }

    const newProducts = [...products];
    let updatedCount = 0;
    let createdCount = 0;

    parsedItems.forEach((item) => {
      if (item.matchedProductId) {
        const idx = newProducts.findIndex((p) => p.id === item.matchedProductId);
        if (idx !== -1) {
          const current = newProducts[idx];
          const updated = {
            ...current,
            cost: item.price ? String(item.price) : current.cost,
            image: item.image || current.image,
            siteUrl: item.link || current.siteUrl,
            description: item.description || current.description,
          };
          if (JSON.stringify(updated) !== JSON.stringify(current)) {
            newProducts[idx] = updated;
            updatedCount += 1;
          }
        }
      } else if (item.includeNew) {
        newProducts.push({
          ...EMPTY_PRODUCT,
          id: uid(),
          name: item.name,
          cost: item.price ? String(item.price) : '',
          image: item.image,
          siteUrl: item.link,
          description: item.description,
          category: '',
          published: false,
        });
        createdCount += 1;
      }
    });

    saveProducts(newProducts);
    setParsedItems([]);
    setXmlInput('');

    alert(`${updatedCount} produtos existentes atualizados e ${createdCount} novos produtos cadastrados.`);
  };


  return (
    <div style={{ marginBottom: 20, padding: 18, background: B.goldLight, borderRadius: 12, border: `1px solid ${B.gold}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#7A5C1E', fontSize: 16 }}>Sincronizacao via XML</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#7A5C1E' }}>Importe precos e cadastre produtos novos automaticamente.</p>
        </div>
        <button 
          onClick={() => setShowImport(!showImport)}
          style={{ background: B.gold, color: B.white, border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
        >
          {showImport ? 'Fechar Importador' : 'Abrir Importador'}
        </button>
      </div>

      {showImport && (
        <div style={{ marginTop: 16, borderTop: `1px solid rgba(200, 169, 110, 0.3)`, paddingTop: 16 }}>
          <p style={{ fontSize: 13, marginBottom: 10, color: '#7A5C1E' }}>
            Abra <a href="https://extratosdaterrapro.com.br/xml/shopping.xml" target="_blank" rel="noreferrer" style={{color: B.purple, fontWeight: 'bold'}}>extratosdaterrapro.com.br/xml/shopping.xml</a>, copie todo o codigo (Ctrl+A, Ctrl+C) e cole abaixo:
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
            Processar XML
          </button>

          {parsedItems.length > 0 && (
            <div style={{ marginTop: 16, borderTop: `1px solid rgba(150, 150, 150, 0.2)`, paddingTop: 14 }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8}}>
                <strong style={{color:B.purpleDark}}>{parsedItems.length} itens extraidos</strong>
                <button onClick={applyXMLChanges} style={{background:B.green,color:B.white,border:'none',padding:'8px 16px',borderRadius:8,cursor:'pointer',fontWeight:700}}>Aplicar sincronizacao</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12,fontSize:12}}>
                <span>Encontrados: {parsedItems.filter((i) => i.matchedProductId).length}</span>
                <span>Nao encontrados: {parsedItems.filter((i) => !i.matchedProductId).length}</span>
              </div>

              <div style={{marginTop:12,maxHeight:320,overflowY:'auto',border:'1px solid #ddd',borderRadius:8,padding:10,background:'#fff'}}>
                {parsedItems.map((item) => (
                  <div key={item.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'center',borderBottom:'1px solid #eee',padding:'8px 0'}}>
                    <div>
                      <div><strong>{item.name}</strong> <span style={{color:B.muted,fontSize:11}}>{item.price?`R$ ${item.price}`:''}</span></div>
                      {item.matchedProductId ? (
                        <div style={{color:B.green,fontSize:12}}>Casou com: {item.matchedProductName}</div>
                      ) : (
                        <div style={{color:B.orange,fontSize:12}}>Nao encontrado</div>
                      )}
                    </div>
                    {!item.matchedProductId && (
                      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
                        <input type="checkbox" checked={item.includeNew} onChange={(e) => updateIncludeNew(item.id, e.target.checked)} />
                        Importar
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminMarketingLegacy = ({ marketing, saveMarketing, protocols }) => {
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
        <Btn onClick={save} sx={{padding:'10px 24px'}}>Salvar tudo</Btn>
      </div>

      {/* Notice Bar */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>Barra de Aviso</SectionTitle>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <div style={{width:40,height:22,borderRadius:11,background:m.notice.active?B.purple:'#ccc',position:'relative',transition:'background 0.2s',cursor:'pointer'}} onClick={()=>setM(prev=>({...prev,notice:{...prev.notice,active:!prev.notice.active}}))}>
              <div style={{position:'absolute',top:3,left:m.notice.active?20:3,width:16,height:16,borderRadius:'50%',background:'#fff',transition:'left 0.2s'}} />
            </div>
            <span style={{fontSize:13,fontWeight:700,color:m.notice.active?B.purple:B.muted}}>{m.notice.active?'Ativa':'Inativa'}</span>
          </label>
        </div>
        <Field label="Texto do aviso (aceita HTML basico)" value={m.notice.text} onChange={v=>setM(prev=>({...prev,notice:{...prev.notice,text:v}}))} placeholder="Ex: Promocao de Abril: frete gratis acima de R$ 300" multi rows={2} />
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
            <div style={{fontSize:11,fontWeight:700,color:B.muted,marginBottom:6,textTransform:'uppercase'}}>Previa</div>
            <div style={{background:m.notice.bgColor||B.purple,color:m.notice.textColor||'#fff',padding:'10px 20px',fontSize:13,fontWeight:600,textAlign:'center'}} dangerouslySetInnerHTML={{__html:clean(m.notice.text)}} />
          </div>
        )}
      </div>

      {/* Campaign */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>Destaque do Mes</SectionTitle>
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
            <option value="">Selecione um protocolo</option>
            {[...protocols].sort((a,b)=>a.name.localeCompare(b.name)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Field label="Titulo da campanha" value={m.campaign.title} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,title:v}}))} placeholder="Ex: Abril da Limpeza de Pele" />
        <Field label="Subtitulo / descricao" value={m.campaign.subtitle} onChange={v=>setM(prev=>({...prev,campaign:{...prev.campaign,subtitle:v}}))} placeholder="Breve descricao da campanha" multi rows={2} />
      </div>

      {/* Banners */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <SectionTitle>Banners (Hero)</SectionTitle>
          <Btn size="sm" onClick={addBanner}>+ Adicionar banner</Btn>
        </div>
        {m.banners.length===0&&<p style={{color:B.muted,fontSize:13}}>Nenhum banner cadastrado. Adicione um para exibir o carrossel na home.</p>}
        {m.banners.map((b,i)=>(
          <div key={b.id} style={{border:`1px solid ${B.border}`,borderRadius:10,padding:16,marginBottom:12,background:B.cream}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <span style={{fontWeight:700,fontSize:13,color:B.purpleDark}}>Banner {i+1}</span>
              <div style={{display:'flex',gap:6}}>
                  <button onClick={()=>moveBanner(b.id,-1)} disabled={i===0} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===0?0.3:1}}>?</button>
                  <button onClick={()=>moveBanner(b.id,1)} disabled={i===m.banners.length-1} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:6,padding:'3px 8px',cursor:'pointer',opacity:i===m.banners.length-1?0.3:1}}>?</button>
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
                    {b.imageUrl?'Trocar imagem':'Enviar imagem'}
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

      <Btn onClick={save} sx={{padding:'12px 28px'}}>Salvar Marketing</Btn>
    </div>
  );
};

const AdminPanel = ({ products, protocols, indications, categories, phases, brand, saveProducts, saveProtocols, saveIndications, saveCategories, savePhases, saveBrand, navigate, setLoggedUser, loggedUser, users, saveUsers, marketing, saveMarketing, landingConfig, saveLanding, views, resetViews }) => {
  const isMobile = useIsMobile();
  const adminScrollRef = useRef(null);
  const productListScrollRef = useRef(0);
  const protocolListScrollRef = useRef(0);
  const [aView,setAView]=useState('dashboard');
  const [editProd,setEditProd]=useState(null);

  useEffect(() => {
    const first = ['dashboard','products','protocols','categories','indications','phases','alerts','settings','marketing','users'].find(s => hasPerm(loggedUser, s, 'view'));
    setAView(first || 'dashboard');
  }, [loggedUser]);
  const [editProt,setEditProt]=useState(null);
  const EMPTY_PROD_FILTERS = { status: 'all', category: 'all', type: 'all' };
  const EMPTY_PROT_FILTERS = { status: 'all', category: 'all', indication: 'all', reviewStatus: 'all' };
  const [prodFilters, setProdFilters] = useState(EMPTY_PROD_FILTERS);
  const [prodSearch, setProdSearch] = useState('');
  const [protFilters, setProtFilters] = useState(EMPTY_PROT_FILTERS);
  const [protSearch, setProtSearch] = useState('');

  if (!loggedUser) {
    return (
      <div style={{padding:24}}>
        <div style={{fontSize:16,fontWeight:700,color:B.purpleDark,marginBottom:12}}>Carregando painel...</div>
      </div>
    );
  }

  const nav=[
    {id:'dashboard',  label:'Dashboard', icon:'DB'},
    {id:'products',   label:'Produtos', icon:'PR'},
    {id:'protocols',  label:'Protocolos', icon:'PT'},
    {id:'categories', label:'Categorias', icon:'CT'},
    {id:'indications',label:'Indicacoes', icon:'IN'},
    {id:'phases',     label:'Fases', icon:'FA'},
    {id:'settings',   label:'Configuracoes', icon:'CF'},
    {id:'marketing',  label:'Marketing', icon:'MK'},
    {id:'landing',    label:'Landing Page', icon:'LP', permKey:'marketing'},
    {id:'alerts',     label:'Alertas', icon:'AL'},
    {id:'users',      label:'Usuarios', icon:'US'},
  ].filter(n=>hasPerm(loggedUser, n.permKey || n.id, 'view'));

  const accessibleAreas = Object.entries(loggedUser?.perms||{}).filter(([,v])=>Object.values(v).some(Boolean)).length;

  if (accessibleAreas === 0) {
    return (
      <div style={{padding:24}}>
        <div style={{fontSize:16,fontWeight:700,color:B.purpleDark,marginBottom:12}}>Acesso nenhuma area</div>
        <div style={{color:B.muted}}>Usurio sem permisses definidas para este painel. Verifique as configuraes ou entre em contato com o administrador.</div>
      </div>
    );
  }

  const openSection = (sectionId) => {
    setAView(sectionId);
    setEditProd(null);
    setEditProt(null);
  };

  const openProductEditor = (product) => {
    if (adminScrollRef.current) productListScrollRef.current = adminScrollRef.current.scrollTop;
    setEditProd(product);
  };

  const closeProductEditor = () => {
    setEditProd(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (adminScrollRef.current) adminScrollRef.current.scrollTop = productListScrollRef.current || 0;
      });
    });
  };

  const openProtocolEditor = (protocol) => {
    if (adminScrollRef.current) protocolListScrollRef.current = adminScrollRef.current.scrollTop;
    setEditProt(protocol);
  };

  const closeProtocolEditor = () => {
    setEditProt(null);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (adminScrollRef.current) adminScrollRef.current.scrollTop = protocolListScrollRef.current || 0;
      });
    });
  };

  return (
    <div style={{display:'flex',flexDirection:isMobile?'column':'row',minHeight:'calc(100vh - 58px)',background:B.cream}}>
      {!isMobile && (
        <div style={{width:210,background:B.white,borderRight:`1px solid ${B.border}`,padding:'24px 0',flexShrink:0,display:'flex',flexDirection:'column'}}>
          <div style={{padding:'0 18px 18px',borderBottom:`1px solid ${B.border}`,marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:700,color:B.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:6}}>Painel Admin</div>
            <div style={{background:B.purpleLight,borderRadius:8,padding:'8px 10px'}}>
              <div style={{fontSize:12,fontWeight:700,color:B.purpleDark}}>{loggedUser?.name || 'Administrador'}</div>
              <div style={{fontSize:11,color:B.muted,marginTop:1}}>{accessibleAreas} areas com acesso</div>
            </div>
          </div>
          {nav.map(n=>(
            <button key={n.id} onClick={()=>openSection(n.id)}
              style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:'11px 18px',background:aView===n.id&&!editProd&&!editProt?B.purpleLight:'none',border:'none',color:aView===n.id&&!editProd&&!editProt?B.purple:B.text,fontWeight:aView===n.id?700:500,fontSize:14,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>
              <span style={{fontSize:12,fontWeight:700}}>{n.icon}</span> {n.label}
            </button>
          ))}
          <div style={{flex:1}} />
          <div style={{borderTop:`1px solid ${B.border}`,padding:'12px 0'}}>
            <button onClick={()=>navigate('/')} style={{display:'block',width:'100%',padding:'9px 18px',background:'none',border:'none',color:B.muted,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Ver site publico</button>
            <button onClick={async ()=>{await logoutAdmin();setLoggedUser(null);navigate('/');}} style={{display:'block',width:'100%',padding:'9px 18px',background:'none',border:'none',color:B.red,fontSize:13,cursor:'pointer',textAlign:'left',fontFamily:'inherit'}}>Sair</button>
          </div>
        </div>
      )}
      <div ref={adminScrollRef} style={{flex:1,padding:isMobile?14:28,overflowY:'auto',overflowX:'hidden'}}>
        {isMobile && (
          <div style={{position:'relative',zIndex:1,background:'rgba(255,255,255,0.96)',backdropFilter:'blur(10px)',border:`1px solid ${B.border}`,borderRadius:18,padding:'14px 14px 12px',marginBottom:18,boxShadow:'0 14px 30px rgba(44,31,64,0.08)',overflow:'hidden'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:12}}>
              <div>
                <div style={{fontSize:10,fontWeight:700,color:B.muted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:4}}>Painel Admin</div>
                <div style={{fontSize:14,fontWeight:700,color:B.purpleDark}}>{loggedUser.name}</div>
                <div style={{fontSize:12,color:B.muted,marginTop:2}}>{accessibleAreas} areas com acesso</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>navigate('/')} style={{background:B.cream,border:`1px solid ${B.border}`,borderRadius:8,padding:'8px 10px',fontSize:12,fontWeight:700,color:B.text,cursor:'pointer',fontFamily:'inherit'}}>Site</button>
                <button onClick={async ()=>{await logoutAdmin();setLoggedUser(null);navigate('/');}} style={{background:B.redLight,border:`1px solid ${B.red}`,borderRadius:8,padding:'8px 10px',fontSize:12,fontWeight:700,color:B.red,cursor:'pointer',fontFamily:'inherit'}}>Sair</button>
              </div>
            </div>
            <div style={{display:'flex',gap:8,overflowX:'auto',padding:'2px 2px 4px',WebkitOverflowScrolling:'touch',scrollbarWidth:'none'}}>
              {nav.map(n=>(
                <button key={n.id} onClick={()=>openSection(n.id)} style={{display:'inline-flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,minWidth:84,whiteSpace:'normal',padding:'10px 10px',borderRadius:16,border:`1px solid ${aView===n.id?B.purple:'rgba(94,61,143,0.12)'}`,background:aView===n.id?B.purple:'rgba(94,61,143,0.06)',color:aView===n.id?B.white:B.text,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',boxShadow:aView===n.id?'0 10px 20px rgba(94,61,143,0.18)':'none',lineHeight:1.15}}>
                  <span style={{fontSize:11,fontWeight:800}}>{n.icon}</span>
                  <span style={{textAlign:'center'}}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {aView==='dashboard'&&!editProd&&!editProt&&hasPerm(loggedUser,'dashboard','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminDashModule products={products} protocols={protocols} indications={indications} views={views} />
            {hasPerm(loggedUser,'dashboard','edit')&&(
              <div style={{padding:'0 24px 24px'}}>
                <button
                  onClick={async()=>{ if(window.confirm('Zerar todos os contadores de visualização? Esta ação não pode ser desfeita.')) await resetViews(); }}
                  style={{background:'none',border:`1px solid ${B.border}`,borderRadius:8,padding:'8px 16px',fontSize:12,color:B.muted,cursor:'pointer',fontFamily:'inherit',fontWeight:600}}
                >
                  Zerar contadores de visualizacao
                </button>
              </div>
            )}
          </Suspense>
        )}
        {aView==='alerts'&&!editProd&&!editProt&&hasPerm(loggedUser,'alerts','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminAlertsModule products={products} protocols={protocols} saveProducts={saveProducts} setEditProt={openProtocolEditor} setAView={setAView} Btn={Btn} B={B} isActive={isActive} getAffectedProtocols={getAffectedProtocols} />
          </Suspense>
        )}
        {aView==='settings'&&!editProd&&!editProt&&hasPerm(loggedUser,'settings','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminSettingsModule brand={brand} saveBrand={saveBrand} Btn={Btn} Field={Field} />
          </Suspense>
        )}
        {aView==='marketing'&&!editProd&&!editProt&&hasPerm(loggedUser,'marketing','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminMarketingModule marketing={marketing} saveMarketing={saveMarketing} protocols={protocols} Btn={Btn} Field={Field} SectionTitle={SectionTitle} uid={uid} />
          </Suspense>
        )}
        {aView==='landing'&&!editProd&&!editProt&&hasPerm(loggedUser,'marketing','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminLandingModule landingConfig={landingConfig} saveLanding={hasPerm(loggedUser,'marketing','edit')?saveLanding:null} Btn={Btn} />
          </Suspense>
        )}
        {aView==='users'&&!editProd&&!editProt&&hasPerm(loggedUser,'users','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminUsers users={users} saveUsers={saveUsers} loggedUser={loggedUser} Btn={Btn} Field={Field} SectionTitle={SectionTitle} uid={uid} />
          </Suspense>
        )}
        {aView==='categories'&&!editProd&&!editProt&&hasPerm(loggedUser,'categories','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminDictionaryModule title="Gerenciar Categorias (Protocolos)" items={categories} saveItems={hasPerm(loggedUser,'categories','edit')?saveCategories:null} placeholder="Nova categoria (ex: Facial)..." readOnly={!hasPerm(loggedUser,'categories','edit')} Btn={Btn} uid={uid} />
          </Suspense>
        )}
        {aView==='indications'&&!editProd&&!editProt&&hasPerm(loggedUser,'indications','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminDictionaryModule title="Gerenciar Indicacoes" items={indications} saveItems={hasPerm(loggedUser,'indications','edit')?saveIndications:null} placeholder="Nova indicacao (ex: Acne)..." readOnly={!hasPerm(loggedUser,'indications','edit')} Btn={Btn} uid={uid} />
          </Suspense>
        )}
        {aView==='phases'&&!editProd&&!editProt&&hasPerm(loggedUser,'phases','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminDictionaryModule title="Gerenciar Fases (Etapas)" items={phases} saveItems={hasPerm(loggedUser,'phases','edit')?savePhases:null} placeholder="Nova fase (ex: Higienizacao)..." readOnly={!hasPerm(loggedUser,'phases','edit')} Btn={Btn} uid={uid} />
          </Suspense>
        )}
        {aView==='products'&&!editProd&&hasPerm(loggedUser,'products','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminProductsModule products={products} categories={categories} saveProducts={saveProducts} setEditProd={openProductEditor} filters={prodFilters} setFilters={setProdFilters} search={prodSearch} setSearch={setProdSearch} onClearFilters={()=>{setProdFilters(EMPTY_PROD_FILTERS);setProdSearch('');}} loggedUser={loggedUser} Btn={Btn} Tag={Tag} B={B} EMPTY_PRODUCT={EMPTY_PRODUCT} uid={uid} sortByName={sortByName} costPerApp={costPerApp} fmtCurrency={fmtCurrency} clean={clean} hasPerm={hasPerm} isActive={isActive} XMLImporter={XMLImporter} />
          </Suspense>
        )}
        {aView==='products'&&editProd&&hasPerm(loggedUser,'products','edit')&&<AdminProdForm prod={editProd} products={products} categories={categories} saveProducts={saveProducts} setEditProd={openProductEditor} onClose={closeProductEditor} />}
        {aView==='protocols'&&!editProt&&hasPerm(loggedUser,'protocols','view')&&(
          <Suspense fallback={<AdminModuleFallback />}>
            <AdminProtocolsModule products={products} protocols={protocols} indications={indications} categories={categories} saveProtocols={saveProtocols} setEditProt={openProtocolEditor} filters={protFilters} setFilters={setProtFilters} search={protSearch} setSearch={setProtSearch} onClearFilters={()=>{setProtFilters(EMPTY_PROT_FILTERS);setProtSearch('');}} loggedUser={loggedUser} Btn={Btn} Tag={Tag} TextProtocolImporter={TextProtocolImporter} />
          </Suspense>
        )}
        {aView==='protocols'&&editProt&&hasPerm(loggedUser,'protocols','edit')&&<AdminProtForm prot={editProt} products={products} protocols={protocols} indications={indications} categories={categories} phases={phases} saveProtocols={saveProtocols} saveIndications={saveIndications} savePhases={savePhases} setEditProt={openProtocolEditor} onClose={closeProtocolEditor} loggedUser={loggedUser} />}
      </div>
    </div>
  );
};

const AdminProductsLegacy = ({ products, categories, saveProducts, setEditProd, filters, setFilters, search, setSearch, onClearFilters, loggedUser }) => {
  const isMobile = useIsMobile();
  const hasActiveFilters = search || filters.status !== 'all' || filters.category !== 'all' || filters.type !== 'all';

  const del = id => { if(window.confirm('Excluir produto?')) saveProducts(products.filter(p=>p.id!==id)); };
  const duplicate = (p) => {
        setEditProd({ ...p, id: uid(), name: buildCopyName(p.name, products.map(product => product.name)), _new: true });
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filters.status === 'all' || (filters.status === 'active' ? isActive(p) : !isActive(p));
    const matchCategory = filters.category === 'all' || (p.categories || [p.category]).includes(filters.category);
    const matchType = filters.type === 'all' || productHasType(p, filters.type);
    return matchSearch && matchStatus && matchCategory && matchType;
  });

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'stretch':'center',flexDirection:isMobile?'column':'row',gap:isMobile?12:16,marginBottom:24}}>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:22,fontFamily:'Georgia, serif'}}>Produtos ({products.length})</h2>
        <Btn onClick={()=>setEditProd({...EMPTY_PRODUCT,id:uid(),_new:true})} sx={isMobile?{width:'100%'}:undefined}>+ Novo Produto</Btn>
      </div>

      <XMLImporter products={products} saveProducts={saveProducts} />

      <div style={{background:B.white, padding: isMobile ? '16px' : '16px 20px', borderRadius: 12, border:`1px solid ${B.border}`, marginBottom: 20}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',flexDirection:isMobile?'column':'row',gap:isMobile?8:12,marginBottom:12}}>
          <div style={{fontWeight: 700, color: B.purpleDark, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Filtros de Pesquisa</div>
{hasActiveFilters && <button onClick={onClearFilters} style={{background:'none',border:`1px solid ${B.border}`,borderRadius:7,padding:'5px 12px',fontSize:12,fontWeight:700,color:B.muted,cursor:'pointer',fontFamily:'inherit'}}>Limpar filtros</button>}
        </div>
        <div style={{display: 'flex', gap: 10, flexWrap: 'wrap', flexDirection:isMobile?'column':'row'}}>
           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto por nome..." style={{flex: 1, minWidth: isMobile ? '100%' : 200, width:isMobile?'100%':'auto', padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit'}} />
           <select value={filters.status} onChange={e=>setFilters({...filters, status: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white, width:isMobile?'100%':'auto'}}>
             <option value="all">Status: Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
           </select>
           <select value={filters.category} onChange={e=>setFilters({...filters, category: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white, width:isMobile?'100%':'auto'}}>
              <option value="all">Area: Todas</option>
             {[...categories].sort((a,b)=>a.label.localeCompare(b.label)).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
           </select>
           <select value={filters.type} onChange={e=>setFilters({...filters, type: e.target.value})} style={{padding:'9px 12px',border:`1.5px solid ${B.border}`,borderRadius:8,fontSize:14,outline:'none',fontFamily:'inherit', background: B.white, width:isMobile?'100%':'auto'}}>
             <option value="all">Tipo: Todos</option>
              {PRODUCT_TYPE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
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
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:isMobile?'flex-start':'center',flexDirection:isMobile?'column':'row',gap:isMobile?12:16,padding:isMobile?'14px 16px':'14px 20px',borderBottom:i<filtered.length-1?`1px solid ${B.border}`:'none'}}>
              <div style={{width:isMobile?'100%':'auto'}}>
                <div style={{fontWeight:700,fontSize:14,color:B.text,marginBottom:3}}>{p.name}</div>
                <div style={{fontSize:12,color:B.muted,display:'flex',gap:12,flexWrap:'wrap'}}>
                  <span dangerouslySetInnerHTML={{__html: clean((p.actives||'').slice(0,60) + ((p.actives||'').length>60?'...':''))}} />
{cpa!=null&&<span style={{color:B.green,fontWeight:700}}>Custo {fmtCurrency(cpa)}/apl.</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0,flexWrap:'wrap',width:isMobile?'100%':'auto'}}>
                <div style={{display:'flex',gap:4,flexShrink:0,flexWrap:'wrap',width:isMobile?'100%':'auto'}}>
                  {(p.categories||[p.category]).map(c=><Tag key={c} label={categories.find(cat=>cat.id===c)?.label||c} color={B.goldLight} text={'#7A5C1E'} />)}
                  <ProductTypeTags product={p} />
                  {!isActive(p)&&<Tag label='Inativo' color={B.redLight} text={B.red} />}
                </div>
                {hasPerm(loggedUser,'products','edit')&&<Btn size="sm" variant="secondary" onClick={()=>setEditProd(p)}>Editar</Btn>}
                {hasPerm(loggedUser,'products','edit')&&<Btn size="sm" variant="ghost" onClick={()=>duplicate(p)}>Duplicar</Btn>}
                {hasPerm(loggedUser,'products','edit')&&<button onClick={()=>saveProducts(products.map(x=>x.id===p.id?{...x,active:!isActive(x)}:x))} style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${isActive(p)?B.border:B.red}`,background:isActive(p)?B.white:B.redLight,color:isActive(p)?B.muted:B.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{isActive(p)?'Inativar':'Reativar'}</button>}
{hasPerm(loggedUser,'products','delete')&&<Btn size="sm" variant="danger" onClick={()=>del(p.id)}>Excluir</Btn>}
              </div>
            </div>
          );
        })}
        {filtered.length===0&&<div style={{padding:40,textAlign:'center',color:B.muted}}>Nenhum produto cadastrado nesta aba</div>}
      </div>
    </div>
  );
};

const AdminProdForm = ({ prod, products, categories, saveProducts, setEditProd, onClose }) => {
  const isMobile = useIsMobile();
  const [f, setF] = useState({...prod});
  const set = k => v => setF(x=>({...x,[k]:v}));
  const cpa = costPerApp(f);
  const [jsonModal, setJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonErr, setJsonErr] = useState('');
  const [errors, setErrors] = useState({});

  const applyJson = () => {
    setJsonErr('');
    let parsed;
    try { parsed = JSON.parse(jsonText.trim()); }
    catch { setJsonErr('JSON invalido. Verifique a formatacao e tente novamente.'); return; }
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

  const normalizePlainName = (value) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getFuzzyScore = (a, b) => {
    const tokensA = a.split(' ').filter(Boolean);
    const tokensB = b.split(' ').filter(Boolean);
    if (!tokensA.length || !tokensB.length) return 0;
    const setB = new Set(tokensB);
    const matched = tokensA.filter((t) => setB.has(t)).length;
    return matched / tokensA.length;
  };

  const doSave = () => {
    // Validação inline — sem alert(), dados nunca são perdidos
    const errs = {};
    if (!f.name.trim()) errs.name = 'Nome é obrigatório.';
    if (!String(f.code || '').trim()) errs.code = 'Código é obrigatório.';
    else {
      const normalizedCode = String(f.code).trim().toLowerCase();
      const codeInUse = products.some(p => p.id !== f.id && String(p.code || '').trim().toLowerCase() === normalizedCode);
      if (codeInUse) errs.code = 'Já existe um produto com este código.';
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Rola até o primeiro campo com erro
      setTimeout(() => {
        document.querySelector('[data-field-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setErrors({});

    const normalizedName = normalizePlainName(f.name);
    const exactMatch = products.find(p => p.id !== f.id && normalizePlainName(p.name) === normalizedName);
    if (exactMatch) {
      if (!window.confirm(`Já existe produto com nome idêntico: "${exactMatch.name}". Deseja continuar?`)) return;
    } else {
      const possible = products
        .map((p) => ({ product: p, score: getFuzzyScore(normalizedName, normalizePlainName(p.name)) }))
        .filter(item => item.score >= 0.6)
        .sort((a, b) => b.score - a.score);
      if (possible.length > 0) {
        if (!window.confirm(`Produto similar: "${possible[0].product.name}" (${Math.round(possible[0].score * 100)}% similar). Deseja continuar?`)) return;
      }
    }

    const {_new, ...clean} = normalizeProductForStorage(f);
    clean.code = String(clean.code || '').trim();
    clean.importSource = clean.importSource || 'manual';

    if (prod._new) saveProducts([...products, clean]);
    else saveProducts(products.map(p => p.id === clean.id ? clean : p));
    onClose?.();
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
        <button onClick={()=>onClose?.()} style={{background:'none',border:'none',color:B.purple,fontWeight:700,cursor:'pointer',fontSize:14,fontFamily:'inherit'}}>← Voltar</button>
        <h2 style={{margin:0,color:B.purpleDark,fontSize:20,fontFamily:'Georgia, serif',flex:1}}>{prod._new?'Novo Produto':'Editar Produto'}</h2>
        <button onClick={()=>{setJsonModal(true);setJsonErr('');}} style={{background:B.gold,color:B.white,border:'none',padding:'8px 14px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>Preencher com IA (Colar JSON)</button>
      </div>

      {jsonModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
          <div style={{background:B.white,borderRadius:14,padding:28,maxWidth:580,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
            <h3 style={{margin:'0 0 6px',color:B.purpleDark,fontFamily:'Georgia,serif',fontSize:18}}>Preencher com JSON</h3>
            <p style={{margin:'0 0 16px',fontSize:13,color:B.muted,lineHeight:1.5}}>Cole o JSON do produto abaixo. Os campos de texto serao preenchidos automaticamente. Preco, rendimento, foto e links <strong>nao serao alterados</strong>.</p>
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
        <SectionTitle>Identificacao</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'220px 1fr',gap:14}}>
          <div data-field-error={errors.code ? true : undefined}>
            <Field label="Código do produto *" value={f.code||''} onChange={v => { set('code')(v); setErrors(e => ({...e, code: ''})); }} placeholder="Ex: PROD-045" note={errors.code ? undefined : 'Use um código único para facilitar busca, estoque e vinculação.'} />
            {errors.code && <div style={{marginTop:-10,marginBottom:10,fontSize:12,color:B.red,fontWeight:600}}>{errors.code}</div>}
          </div>
          <div data-field-error={errors.name ? true : undefined}>
            <Field label="Nome do produto *" value={f.name} onChange={v => { set('name')(v); setErrors(e => ({...e, name: ''})); }} placeholder="Ex: Omega 7 Creme de Massagem Corporal" />
            {errors.name && <div style={{marginTop:-10,marginBottom:10,fontSize:12,color:B.red,fontWeight:600}}>{errors.name}</div>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:14,marginBottom:16}}>
          <Sel label="Origem" value={f.importSource || 'manual'} onChange={(v) => setF({...f, importSource: v})} options={[{v:'manual', l:'Manual'}, {v:'xml', l:'Importado por XML'}]} />
          <Sel label="Revisao" value={f.reviewStatus || 'needs_review'} onChange={(v) => setF({...f, reviewStatus: v})} options={[{v:'needs_review', l:'A Revisar'}, {v:'reviewed', l:'Revisado'}, {v:'approved', l:'Aprovado'}]} />
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontSize:12,fontWeight:700,color:B.muted,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Foto do Produto</label>
          <div style={{display:'flex',gap:14,alignItems:'flex-start',flexDirection:isMobile?'column':'row'}}>
            {f.image && <img src={f.image} alt="produto" style={{width:90,height:90,objectFit:'contain',borderRadius:10,border:`1px solid ${B.border}`,background:B.cream,flexShrink:0}} />}
            <div style={{flex:1}}>
              <label style={{display:'inline-block',padding:'9px 18px',background:B.purpleLight,color:B.purple,borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',border:`1.5px dashed ${B.purple}`}}>
                {f.image?'Trocar foto':'Enviar foto'}
                <input type="file" accept="image/*" style={{display:'none'}} onChange={handleFileChange} />
              </label>
              {f.image&&<button onClick={()=>setF(x=>({...x,image:''}))} style={{marginLeft:10,background:'none',border:'none',color:B.red,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:700}}>Remover</button>}
              <div style={{fontSize:11,color:B.muted,marginTop:6}}>Recomendado: fundo branco, quadrado. JPG ou PNG ate 2MB.</div>
            </div>
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:16,marginBottom:14}}>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#6B7280',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Area de Aplicacao</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {categories.map(c => {
                const cat = c.id;
                return (
                <label key={cat} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'8px 14px',borderRadius:8,border:`1.5px solid ${(f.categories||[]).includes(cat)?'#5E3D8F':'#E2D9F3'}`,background:(f.categories||[]).includes(cat)?'#EDE5F5':'#fff',fontWeight:700,fontSize:13,userSelect:'none'}}>
                  <input type="checkbox" checked={(f.categories||[]).includes(cat)} onChange={()=>{const cur=f.categories||[];setF({...f,categories:cur.includes(cat)?cur.filter(x=>x!==cat):[...cur,cat]});}} style={{display:'none'}} />
                  {c.label}
                </label>
              )})}
            </div>
          </div>
          <div>
            <label style={{display:'block',fontSize:12,fontWeight:700,color:'#6B7280',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Tipos de Produto</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {PRODUCT_TYPE_OPTIONS.map(option => {
                const selected = getProductTypes(f).includes(option.id);
                const tone = option.id === 'protocol'
                  ? { bg: '#EBF5FF', border: '#BFDBFE', text: '#1A56DB' }
                  : option.id === 'skincare'
                    ? { bg: '#E8F5E9', border: '#B7E4C7', text: '#1E7E46' }
                    : option.id === 'kit_professional'
                      ? { bg: '#EDE5F5', border: '#D6C3EA', text: '#2C1F40' }
                      : { bg: '#FBF5E8', border: '#E9D7AE', text: '#7A5C1E' };
                return (
                  <label key={option.id} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',padding:'10px 14px',borderRadius:10,border:`1.5px solid ${selected ? tone.border : '#E2D9F3'}`,background:selected ? tone.bg : '#fff',color:selected ? tone.text : B.text,fontWeight:700,fontSize:13,userSelect:'none',boxShadow:selected?'0 8px 20px rgba(44,31,64,0.06)':'none'}}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={()=>{
                        const cur = getProductTypes(f);
                        const next = cur.includes(option.id) ? cur.filter(x=>x!==option.id) : [...cur, option.id];
                        setF({...f,productTypes:next});
                      }}
                      style={{display:'none'}}
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <div style={{marginTop:8,fontSize:11,color:B.muted,lineHeight:1.55}}>
              Produtos marcados como kit aparecem apenas nos campos de kit do protocolo. Produtos marcados como protocolo ou skincare continuam disponiveis nas etapas correspondentes.
            </div>
            <div style={{marginTop:10,display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:8}}>
              <div style={{background:'#F8F6FC',border:`1px solid ${B.border}`,borderRadius:10,padding:'10px 12px',fontSize:11,color:B.muted,lineHeight:1.55}}>
                <strong style={{color:B.purpleDark}}>Fluxo de Protocolo</strong><br />
                Aparece nas etapas da cabine e pode ser combinado com kit profissional.
              </div>
              <div style={{background:'#F8FCF8',border:'1px solid #D8EEDB',borderRadius:10,padding:'10px 12px',fontSize:11,color:B.muted,lineHeight:1.55}}>
                <strong style={{color:B.green}}>Fluxo de Skincare</strong><br />
                Aparece no uso em casa e pode ser combinado com kit home care.
              </div>
            </div>
          </div>
        </div>
        <Field label="Funcao Principal" value={f.mainFunction} onChange={set('mainFunction')} placeholder="Funcao principal resumida do produto" />
        <Field label="Badge de Destaque" value={f.badge||''} onChange={set('badge')} placeholder="Ex: Lancamento, Novo, Exclusivo, Black Friday" note="Deixe em branco para nao exibir. Aparece como etiqueta sobre o card." />
        <Field label="Link no Site Oficial" value={f.siteUrl} onChange={set('siteUrl')} placeholder="https://extratosdaterrapro.com.br/produto/..." note="URL da pagina do produto no site" />
        <Field label="Link Ficha Tecnica (Google Drive)" value={f.fichaUrl} onChange={set('fichaUrl')} placeholder="https://drive.google.com/file/d/..." note="Pre-preenchido automaticamente do docx" />
        <Field label="Numero de Registro ANVISA" value={f.anvisa} onChange={set('anvisa')} placeholder="Ex: 25351.953989/2024-82" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Descricao e Beneficios</SectionTitle>
        <Field label="Descricao Completa" value={f.description} onChange={set('description')} placeholder="Descricao detalhada do produto e seu mecanismo de acao" multi rows={4} />
        <Field label="Beneficios" value={f.benefits} onChange={set('benefits')} placeholder="Liste os beneficios separados por ponto e virgula" multi rows={3} note="Ex: Hidrata profundamente; Aumenta a elasticidade; Previne o ressecamento" />
        <Field label="Diferenciais" value={f.differentials} onChange={set('differentials')} placeholder="O que torna este produto unico" multi rows={3} />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Ingredientes e Tecnica</SectionTitle>
        <Field label="Ativos / Ingredientes Principais" value={f.actives} onChange={set('actives')} placeholder="Ex: Blend de oleos vegetais, omegas 3, 6, 7 e 9, oleo de Macadamia" multi rows={2} />
        <Field label="Modo de Uso (Cabine)" value={f.howToUse} onChange={set('howToUse')} placeholder="Instrucoes de aplicacao profissional" multi rows={3} />
        <Field label="Indicacoes e Associacoes" value={f.indications} onChange={set('indications')} placeholder="Para quem e indicado, combinacoes possiveis" multi rows={2} />
        <Field label="Contraindicacoes" value={f.contra} onChange={set('contra')} placeholder="Situacoes em que nao deve ser usado" multi rows={2} />
        <Field label="Indicacao para Uso em Casa" value={f.homeUseNote} onChange={set('homeUseNote')} placeholder="Como o cliente pode usar em casa, ou produto equivalente retail" multi rows={2} />
        <Field label="Composicao (INCI)" value={f.composition} onChange={set('composition')} placeholder="Aqua, Glycerin, Cetearyl Alcohol..." multi rows={4} note="Lista completa de ingredientes na nomenclatura INCI" />
        <Field label="Tamanho / Embalagem" value={f.size} onChange={set('size')} placeholder="Ex: 700g" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>Custo & Rendimento</SectionTitle>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr 1fr',gap:14}}>
          <Field label="Custo do Produto (R$)" value={f.cost} onChange={set('cost')} placeholder="Ex: 89.00" type="number" note="Custo de compra" />
          <Field label="Rendimento (no de aplicacoes)" value={f.yieldApplications} onChange={set('yieldApplications')} placeholder="Ex: 70" type="number" note="Quantidade de aplicacoes" />
          <Field label="Qtd por Aplicacao (g/ml)" value={f.yieldGramsPerUse} onChange={set('yieldGramsPerUse')} placeholder="Ex: 10" type="number" note="Gramas ou ml por sessao" />
        </div>
        {cpa!=null&&(
          <div style={{background:B.greenLight,border:`1px solid ${B.green}`,borderRadius:10,padding:'14px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:B.green}}>Custo por Aplicacao Calculado</div>
              <div style={{fontSize:12,color:B.muted,marginTop:2}}>R$ {f.cost} ÷ {f.yieldApplications} aplicações</div>
            </div>
            <div style={{fontSize:24,fontWeight:700,color:B.green}}>{fmtCurrency(cpa)}</div>
          </div>
        )}
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:16}}>
        <SectionTitle>FAQ & Perguntas Frequentes</SectionTitle>
        <Field label="Principais Duvidas" value={f.faq} onChange={set('faq')} placeholder="Ex: Pode usar em gestantes? Sim, apos o 4o mes com orientacao medica..." multi rows={5} note="Inclua perguntas e respostas separadas por linha" />
      </div>

      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.border}`,padding:24,marginBottom:24}}>
        <SectionTitle>SEO e Indexacao para IA</SectionTitle>
        <Field label="Meta Description" value={f.metaDescription} onChange={set('metaDescription')} placeholder="Descricao de 150-160 caracteres para buscadores e IAs" multi rows={2} note={`${(f.metaDescription||'').length}/160 caracteres`} />
        <Field label="Palavras-chave" value={f.keywords} onChange={set('keywords')} placeholder="hidratacao profissional, omega 7, creme de massagem corporal..." note="Separe por virgula. Usadas para indexacao em buscadores e respostas de IA." />
      </div>

      <div style={{display:'flex',gap:10}}>
        <Btn onClick={doSave} sx={{padding:'12px 28px'}}>Salvar Produto</Btn>
        <Btn variant="ghost" onClick={()=>onClose?.()}>Cancelar</Btn>
      </div>
    </div>
  );
};

// AdminProtForm moved to src/components/admin/AdminProtForm.jsx

const AdminAlertsLegacy = ({ products, protocols, saveProducts, setEditProt, setAView }) => {
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
          <div style={{fontSize:40,marginBottom:12}}>?</div>
          <div style={{fontSize:16,fontWeight:700,color:B.green}}>Tudo certo!</div>
          <div style={{fontSize:14,color:B.muted,marginTop:4}}>Nenhum protocolo publicado possui produtos inativos vinculados.</div>
        </div>
      )}

      {allIssues.length > 0 && (
        <div style={{background:B.redLight,borderRadius:12,padding:'16px 20px',marginBottom:24,border:`1px solid ${B.red}`,display:'flex',alignItems:'center',gap:14}}>
          <span style={{fontSize:28}}>!</span>
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
                <span style={{background:B.redLight,color:B.red,padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:700}}>INATIVO</span>
              </div>
              <div style={{fontWeight:700,fontSize:16,color:B.text}}>{prod.name}</div>
              {prod.actives && <div style={{fontSize:13,color:B.muted,marginTop:2}}>Ativos: {prod.actives}</div>}
            </div>
            <button
              onClick={() => saveProducts(products.map(x => x.id === prod.id ? {...x, active: true} : x))}
              style={{background:B.green,color:B.white,border:'none',padding:'8px 18px',borderRadius:8,fontWeight:700,fontSize:13,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}
            >
              Reativar produto
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
              const where = [inCabine&&'Cabine', inMorning&&'Home Care Manha', inNight&&'Home Care Noite'].filter(Boolean).join(', ');
              return (
                <div key={prot.id} style={{background:B.cream,borderRadius:10,padding:'12px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:B.text}}>{prot.name}</div>
                    <div style={{fontSize:12,color:B.muted,marginTop:2}}>Utilizado em: {where}</div>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap: 8}}>
                    <span style={{padding:'3px 10px',borderRadius:20,background:prot.published?B.greenLight:B.goldLight,color:prot.published?B.green:'#7A5C1E',fontSize:11,fontWeight:700,flexShrink:0}}>
                      {prot.published?'Publicado':'Rascunho'}
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

export default function App() {
  const [loading,setLoading]=useState(false); // Comea false porque carregamos dados locais rapidinho
  const [products,setProducts]=useState(()=>(load(PRODUCTS_KEY,INIT_PRODUCTS).then(p => p.map(normalizeProductForStorage)), INIT_PRODUCTS)); // valores iniciais
  const [protocols,setProtocols]=useState(INIT_PROTOCOLS);
  const [indications,setIndications]=useState(INIT_INDICATIONS);
  const [categories,setCategories]=useState(INIT_CATEGORIES);
  const [phases,setPhases]=useState(INIT_PHASES);
  const [brand,setBrand]=useState(INIT_BRAND);
  const [users,setUsers]=useState([]);
  const [marketing,setMarketing]=useState(INIT_MARKETING);
  const [landingConfig,setLandingConfig]=useState(INIT_LANDING);
  const [views,setViews]=useState({});
  const [favorites,setFavorites]=useState([]);
  const [loggedUser,setLoggedUser]=useState(null);
  const [path, navigate] = useRoute();
  const [homeFilters, setHomeFilters] = useState({ search:'', filterCat:'all', filterProds:[], filterInds:[], showFavorites:false, page:1 });

  useEffect(() => {
    if (path === '/admin' || path === '/login') {
      import('./components/admin/AdminAuth');
      import('./components/admin/AdminUsers');
      import('./components/admin/AdminPanels');
      import('./components/admin/AdminCatalog');
      import('./components/admin/AdminProtocols');
    }
  }, [path]);

  useEffect(()=>{
    (async()=>{
      // Carrega dados do localStorage em paralelo (operaes rpidas)
      const [
        loadedProducts,
        loadedProtocols,
        loadedIndications,
        loadedCategories,
        loadedPhases,
        loadedMarketing,
        loadedViews,
        loadedBrand,
        loadedLanding
      ] = await Promise.all([
        load(PRODUCTS_KEY,INIT_PRODUCTS),
        load(PROTOCOLS_KEY,INIT_PROTOCOLS),
        load(INDICATIONS_KEY,INIT_INDICATIONS),
        load(CATEGORIES_KEY,INIT_CATEGORIES),
        load(PHASES_KEY,INIT_PHASES),
        load(MARKETING_KEY,INIT_MARKETING),
        load(VIEWS_KEY,{}),
        load(BRAND_KEY,INIT_BRAND),
        load(LANDING_KEY,INIT_LANDING)
      ]);

      // Atualiza estados com dados do localStorage
      setProducts(loadedProducts.map(normalizeProductForStorage));
      setProtocols(loadedProtocols);
      setIndications(loadedIndications);
      setCategories(loadedCategories);
      setPhases(loadedPhases);
      setMarketing(loadedMarketing);
      setViews(loadedViews);
      setBrand(loadedBrand);
      setLandingConfig(loadedLanding);
      
      if (loadedBrand.colorMain) B.purple = loadedBrand.colorMain;
      if (loadedBrand.colorAccent) B.gold = loadedBrand.colorAccent;

      // S agora verifica sesso (isso sim pode demorar um pouco)
      const sessionUser = await getAdminSession().catch(() => null);
      if (sessionUser) {
        const loadedUsers = await load(USERS_KEY, INIT_USERS);
        const securedUsers = await secureUsersForStorage(loadedUsers);
        setUsers(securedUsers);
        setLoggedUser(securedUsers.find((user) => user.id === sessionUser.id) || sessionUser);
      }
    })();
  },[]);

  const saveProd=async d=>{const normalized = d.map(normalizeProductForStorage); setProducts(normalized); await save(PRODUCTS_KEY,normalized);};
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
  const saveLanding=async d=>{setLandingConfig(d);await save(LANDING_KEY,d);};
  const handleAdminPasswordReset = async (nextPassword) => {
    const updatedUser = await updateAdminPassword(nextPassword);
    setLoggedUser(updatedUser);
    const loadedUsers = await load(USERS_KEY, INIT_USERS);
    setUsers(await secureUsersForStorage(loadedUsers));
  };
  const resetViews=async()=>{ setViews({}); await savePublic(VIEWS_KEY,{}); };

  const handleView=async(type,id)=>{
    const key=`${type}_${id}`;
    const updated={...views,[key]:(views[key]||0)+1};
    if (type==='protocol') {
      const prot=protocols.find(p=>p.id===id);
      for (const cid of (prot?.concerns||[])) {
        const ik=`indication_${cid}`;
        updated[ik]=(updated[ik]||0)+1;
      }
    }
    setViews(updated);
    await savePublic(VIEWS_KEY,updated);
  };
  const saveBr=async d=>{
    setBrand(d);
    if (d.colorMain) B.purple = d.colorMain;
    if (d.colorAccent) B.gold = d.colorAccent;
    await save(BRAND_KEY,d);
  };

  useEffect(() => {
    if (!loggedUser) return;
    if (!users.length) return;
    const refreshedUser = users.find(u => u.id === loggedUser.id);
    if (!refreshedUser) return;
    if (refreshedUser !== loggedUser) setLoggedUser(refreshedUser);
  }, [users, loggedUser]);

  useEffect(() => {
    if (!loggedUser) return;
    (async () => {
      const loadedUsers = await load(USERS_KEY, INIT_USERS);
      const securedUsers = await secureUsersForStorage(loadedUsers);
      setUsers(securedUsers);
      setLoggedUser((prev) => {
        if (!prev) return prev;
        return securedUsers.find((user) => user.id === prev.id) || prev;
      });
    })();
  }, [loggedUser?.id]);

  if(loading) return <div style={{background:B.cream,height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:B.muted,fontFamily:"'Segoe UI', system-ui, sans-serif",fontSize:14}}>Preparando a plataforma...</div>;

  let view = 'landing';
  let activeProt = null;
  let activeProd = null;

  if (path === '/protocolos') {
    view = 'home';
  } else if (path === '/busca') {
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
    <div style={{fontFamily:"'Segoe UI', system-ui, sans-serif",color:B.text,background:B.cream, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX:'hidden'}}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } button, input, select, textarea { font-family: inherit; }` + RESPONSIVE_CSS}</style>
      <Header navigate={navigate} adminAuth={!!loggedUser} setAdminAuth={v=>{ if(!v) setLoggedUser(null); }} brand={brand} />
      <NoticeBanner notice={marketing?.notice} />
      {view==='landing'    &&<LandingPage protocols={protocols} indications={indications} categories={categories} brand={brand} landingConfig={landingConfig} setHomeFilters={setHomeFilters} navigate={navigate} />}
      {view==='home'       &&<PublicHome protocols={protocols} products={products} indications={indications} categories={categories} favorites={favorites} setFavorites={setFavorites} navigate={navigate} brand={brand} marketing={marketing} homeFilters={homeFilters} setHomeFilters={setHomeFilters} views={views} />}
      {view==='product'    &&activeProd&&<PublicProductPage product={activeProd} protocols={protocols} categories={categories} navigate={navigate} brand={brand} onView={handleView} />}
      {view==='protocol'   &&activeProt&&<ProtocolDetail protocol={activeProt} products={products} indications={indications} categories={categories} navigate={navigate} brand={brand} onView={handleView} />}
      {view==='search'     &&<ProductSearch products={products} protocols={protocols} indications={indications} categories={categories} navigate={navigate} />}
      {view==='admin_login'&&(
        <Suspense fallback={<AdminModuleFallback />}>
          <AdminLogin setLoggedUser={setLoggedUser} navigate={navigate} brand={brand} Logo={Logo} Field={Field} Btn={Btn} />
        </Suspense>
      )}
      {view==='admin'      &&loggedUser?.requirePasswordReset&&(
        <Suspense fallback={<AdminModuleFallback />}>
          <AdminPasswordReset brand={brand} onSubmit={handleAdminPasswordReset} onLogout={async ()=>{await logoutAdmin();setLoggedUser(null);navigate('/login');}} Logo={Logo} Field={Field} Btn={Btn} />
        </Suspense>
      )}
      {view==='admin'      &&loggedUser&&!loggedUser?.requirePasswordReset&&<AdminPanel products={products} protocols={protocols} indications={indications} categories={categories} phases={phases} brand={brand} saveProducts={saveProd} saveProtocols={saveProt} saveIndications={saveInd} saveCategories={saveCat} savePhases={savePha} saveBrand={saveBr} navigate={navigate} setLoggedUser={setLoggedUser} loggedUser={loggedUser} users={users} saveUsers={saveUsersDb} marketing={marketing} saveMarketing={saveMarketing} landingConfig={landingConfig} saveLanding={saveLanding} views={views} resetViews={resetViews} />}
      {view!=='admin'      &&<AppFooter brand={brand} />}
    </div>
  );
}




