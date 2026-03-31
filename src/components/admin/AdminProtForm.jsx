import { useState } from 'react';
import { useIsMobile } from '../../hooks/useAppShell';
import { useNotionImporter } from '../../hooks/useNotionImporter';
import { B, hasPerm } from '../../lib/app-constants';
import {
  costPerApp,
  fmtCurrency,
  getProductTypeLabel,
  getProductTypes,
  isActive,
  productHasType,
  uid,
  uploadImageSafe
} from '../../lib/app-services';
import { Btn, Tag } from '../ui/Controls';
import { Field, Sel, SectionTitle } from '../ui/FormFields';

// Modal customizado substituindo alert/confirm nativos
const Modal = ({ modal }) => {
  if (!modal) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px 22px', maxWidth: 440, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ fontSize: 15, color: B.text, lineHeight: 1.65, marginBottom: 22, whiteSpace: 'pre-line' }}>{modal.message}</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {modal.type === 'confirm' && (
            <button onClick={modal.onCancel} style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${B.border}`, background: 'transparent', color: B.muted, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
              Cancelar
            </button>
          )}
          <button onClick={modal.onConfirm} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: B.purple, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            {modal.type === 'confirm' ? 'Confirmar' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PHASE_DATALIST_ID = 'prot-phase-options';

const AdminProtForm = ({ prot, products, protocols, indications, categories, phases, saveProtocols, saveIndications, savePhases, setEditProt, loggedUser, onClose }) => {
  const isMobile = useIsMobile();
  const [f, setF] = useState({
    ...prot,
    professionalKitId: prot.professionalKitId || '',
    homeKitId: prot.homeKitId || '',
    steps: [...(prot.steps || [])],
    homeUse: { morning: [...(prot.homeUse?.morning || [])], night: [...(prot.homeUse?.night || [])] },
    concerns: [...(prot.concerns || [])],
    youtubeUrl: prot.youtubeUrl || '',
    featuredImage: prot.featuredImage || '',
  });

  const [modal, setModal] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const showAlert = (message) => new Promise(resolve => {
    setModal({ type: 'alert', message, onConfirm: () => { setModal(null); resolve(); } });
  });

  const showConfirm = (message) => new Promise(resolve => {
    setModal({
      type: 'confirm',
      message,
      onConfirm: () => { setModal(null); resolve(true); },
      onCancel: () => { setModal(null); resolve(false); },
    });
  });

  const {
    notionUrl, setNotionUrl, notionLoading, notionError,
    showNotionImport, setShowNotionImport, fetchNotionProtocol
  } = useNotionImporter();

  const [newIndication, setNewIndication] = useState('');
  const [showNewIndication, setShowNewIndication] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  // ── Produtos ──────────────────────────────────────────────────────────────
  const buildProductOptions = ({ selectedId, type, emptyLabel = 'Sem produto' }) => {
    const active = [...products]
      .filter(p => isActive(p) && productHasType(p, type))
      .sort((a, b) => a.name.localeCompare(b.name));
    const opts = [{ v: '', l: emptyLabel }];
    active.forEach(p => opts.push({ v: p.id, l: p.name }));
    if (selectedId) {
      const cur = products.find(p => p.id === selectedId);
      if (cur && !opts.some(o => o.v === cur.id))
        opts.push({ v: cur.id, l: `${isActive(cur) ? '' : '[INATIVO] '}${cur.name}` });
    }
    return opts;
  };

  const getProtocolProductOptions = (id) => buildProductOptions({ selectedId: id, type: 'protocol', emptyLabel: 'Sem produto (equipamento/técnica)' });
  const getSkincareProductOptions  = (id) => buildProductOptions({ selectedId: id, type: 'skincare', emptyLabel: 'Sem produto indicado' });
  const getProfessionalKitOptions  = (id) => buildProductOptions({ selectedId: id, type: 'kit_professional', emptyLabel: 'Sem kit' });
  const getHomeKitOptions          = (id) => buildProductOptions({ selectedId: id, type: 'kit_homecare', emptyLabel: 'Sem kit' });

  // ── Etapas ────────────────────────────────────────────────────────────────
  const addStep  = () => setF(x => ({ ...x, steps: [...x.steps, { id: uid(), phase: '', productId: '', instruction: '', name: '', duration: '' }] }));
  const rmStep   = id => setF(x => ({ ...x, steps: x.steps.filter(s => s.id !== id) }));
  const updStep  = (id, k, v) => setF(x => ({ ...x, steps: x.steps.map(s => s.id === id ? { ...s, [k]: v } : s) }));

  // ── Home Use ──────────────────────────────────────────────────────────────
  const addHome  = sl => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: [...x.homeUse[sl], { productId: '', instruction: '' }] } }));
  const rmHome   = (sl, i) => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: x.homeUse[sl].filter((_, idx) => idx !== i) } }));
  const updHome  = (sl, i, k, v) => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: x.homeUse[sl].map((h, idx) => idx === i ? { ...h, [k]: v } : h) } }));

  // ── Indicações ────────────────────────────────────────────────────────────
  const togConcern = id => setF(x => ({ ...x, concerns: x.concerns.includes(id) ? x.concerns.filter(c => c !== id) : [...x.concerns, id] }));

  const handleAddIndication = () => {
    if (!newIndication.trim()) return;
    const lbl = newIndication.trim();
    const existing = indications.find(i => i.label.toLowerCase() === lbl.toLowerCase());
    const id = existing ? existing.id : uid();
    if (!existing) saveIndications([...indications, { id, label: lbl }]);
    setF(x => ({ ...x, concerns: x.concerns.includes(id) ? x.concerns : [...x.concerns, id] }));
    setNewIndication('');
    setShowNewIndication(false);
  };

  // ── Notion ────────────────────────────────────────────────────────────────
  const handleNotionImportSuccess = (data) => {
    setF(x => ({
      ...x,
      externalSourceId: data.pageId,
      name: data.pageTitle || x.name,
      description: data.description || x.description || '',
      steps: Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : x.steps,
      homeUse: data.homeUse || x.homeUse,
      concerns: data.concerns || x.concerns,
    }));
  };

  const handleFetchNotion = async () => { await fetchNotionProtocol(handleNotionImportSuccess); };

  // ── Drag & Drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => { setDraggedIdx(idx); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', ''); };
  const handleDragOver  = (e, idx) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move';
    if (draggedIdx === null || draggedIdx === idx) return;
    const steps = [...f.steps];
    const item = steps[draggedIdx];
    steps.splice(draggedIdx, 1);
    steps.splice(idx, 0, item);
    setDraggedIdx(idx);
    setF(x => ({ ...x, steps }));
  };
  const handleDragEnd = () => setDraggedIdx(null);

  // ── Upload imagem ─────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageSafe(file);
      if (url) setF(x => ({ ...x, featuredImage: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Fuzzy de nomes ────────────────────────────────────────────────────────
  const normalizePlainName = (v) =>
    String(v || '').toLowerCase().normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

  const getFuzzyScore = (a, b) => {
    const ta = a.split(' ').filter(Boolean);
    const tb = new Set(b.split(' ').filter(Boolean));
    if (!ta.length || !tb.size) return 0;
    return ta.filter(t => tb.has(t)).length / ta.length;
  };

  // ── Salvar ────────────────────────────────────────────────────────────────
  const doSave = async (pub = null) => {
    if (!f.name.trim()) { await showAlert('Nome é obrigatório.'); return; }
    if (!String(f.code || '').trim()) { await showAlert('Código é obrigatório.'); return; }

    const normCode = String(f.code).trim().toLowerCase();
    if (protocols.some(p => p.id !== f.id && String(p.code || '').trim().toLowerCase() === normCode)) {
      await showAlert('Já existe um protocolo com este código.'); return;
    }

    // Validações de qualidade (não bloqueantes — usuário decide)
    const semNome  = f.steps.filter(s => !s.name?.trim());
    const semFase  = f.steps.filter(s => !s.phase?.trim());

    if (semNome.length > 0) {
      const ok = await showConfirm(`${semNome.length} etapa(s) sem nome.\nDeseja continuar mesmo assim?`);
      if (!ok) return;
    }
    if (semFase.length > 0) {
      const ok = await showConfirm(`${semFase.length} etapa(s) sem fase definida.\nDeseja continuar mesmo assim?`);
      if (!ok) return;
    }

    // Similaridade de nomes
    const normName = normalizePlainName(f.name);
    const exact = protocols.find(p => p.id !== f.id && normalizePlainName(p.name) === normName);
    if (exact) {
      const ok = await showConfirm(`Já existe um protocolo com nome idêntico:\n"${exact.name}"\nDeseja continuar?`);
      if (!ok) return;
    } else {
      const similar = protocols
        .map(p => ({ p, score: getFuzzyScore(normName, normalizePlainName(p.name)) }))
        .filter(x => x.score >= 0.6)
        .sort((a, b) => b.score - a.score);
      if (similar.length > 0) {
        const ok = await showConfirm(`Protocolo similar encontrado:\n"${similar[0].p.name}" (${Math.round(similar[0].score * 100)}% similar)\nDeseja continuar?`);
        if (!ok) return;
      }
    }

    const { _new, ...data } = f;
    data.code = String(data.code || '').trim();
    data.reviewStatus = data.reviewStatus || 'needs_review';
    if (pub !== null) data.published = pub;
    if (prot._new) saveProtocols([...protocols, data]);
    else saveProtocols(protocols.map(p => p.id === data.id ? data : p));
    onClose?.();
  };

  // ── Custo por sessão (calculado dos produtos das etapas) ──────────────────
  const stepProducts = f.steps
    .filter(s => s.productId)
    .map(s => products.find(p => p.id === s.productId))
    .filter(Boolean);
  const uniqueStepProducts = [...new Map(stepProducts.map(p => [p.id, p])).values()];
  const totalCostPerSession = uniqueStepProducts.reduce((acc, p) => acc + (costPerApp(p) || 0), 0);
  const bottleneck = uniqueStepProducts
    .filter(p => costPerApp(p) != null)
    .sort((a, b) => (costPerApp(b) || 0) - (costPerApp(a) || 0))[0];

  // ── Fases: lista única para datalist ──────────────────────────────────────
  const allPhases = [...phases];
  f.steps.forEach(s => {
    if (s.phase && !allPhases.find(p => p.label === s.phase))
      allPhases.push({ id: uid(), label: s.phase });
  });
  allPhases.sort((a, b) => a.label.localeCompare(b.label));

  // ── Estilos ────────────────────────────────────────────────────────────────
  const inpSt = { width: '100%', padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: B.white, color: B.text };
  const sectionBoxStyle = { background: B.white, borderRadius: 16, border: `1px solid ${B.border}`, padding: isMobile ? 18 : 24, marginBottom: 16, boxShadow: '0 10px 26px rgba(44,31,64,0.04)' };
  const flowCards = [
    { n: '1', title: 'Base', desc: 'Nome, código, categoria e indicações.' },
    { n: '2', title: 'Cabine', desc: 'Monte as etapas do atendimento.' },
    { n: '3', title: 'Casa', desc: 'Rotina de skincare do cliente.' },
    { n: '4', title: 'Kits e mídia', desc: 'Kits, imagem e vídeo.' },
    { n: '5', title: 'Revisão', desc: 'Confira e publique.' },
  ];

  return (
    <div style={{ maxWidth: 960 }}>
      <Modal modal={modal} />

      {/* Datalist de fases — usado nos campos de fase das etapas */}
      <datalist id={PHASE_DATALIST_ID}>
        {allPhases.map(p => <option key={p.id} value={p.label} />)}
      </datalist>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => onClose?.()} style={{ background: 'none', border: 'none', color: B.purple, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>← Voltar</button>
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 20, fontFamily: 'Georgia, serif' }}>{prot._new ? 'Novo Protocolo' : 'Editar Protocolo'}</h2>
      </div>

      {/* Fluxo de montagem */}
      <div style={{ background: `linear-gradient(135deg, ${B.purpleDark}, ${B.purple})`, borderRadius: 18, padding: isMobile ? '18px 16px' : '22px 22px 20px', marginBottom: 18, color: B.white, boxShadow: '0 18px 38px rgba(44,31,64,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Fluxo de montagem</div>
        <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 8 }}>Preencha em sequência</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
          {flowCards.map(card => (
            <div key={card.n} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 12px 10px' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: B.gold, color: B.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, marginBottom: 8 }}>{card.n}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 11, lineHeight: 1.45, color: 'rgba(255,255,255,0.72)' }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notion import */}
      {!showNotionImport && (
        <>
          {f.externalSourceId && (
            <div style={{ background: '#E8F5E9', border: `1.5px solid ${B.green}`, borderRadius: 14, padding: '12px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>Protocolo carregado do Notion</div>
              </div>
              <button onClick={() => setShowNotionImport(true)} style={{ background: 'none', border: 'none', color: B.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700, textDecoration: 'underline' }}>Carregar outro</button>
            </div>
          )}
          {!f.externalSourceId && (
            <div style={{ background: 'rgba(113,93,168,0.06)', border: `1.5px dashed ${B.purple}`, borderRadius: 14, padding: '14px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <div style={{ fontSize: 13, color: B.purple, fontWeight: 600 }}>Importar do Notion</div>
              </div>
              <button onClick={() => setShowNotionImport(true)} style={{ background: B.purple, border: 'none', color: B.white, cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '6px 12px', fontFamily: 'inherit' }}>Abrir</button>
            </div>
          )}
        </>
      )}

      {showNotionImport && (
        <div style={{ background: B.white, border: `1.5px solid ${B.purple}`, borderRadius: 14, padding: '16px 18px', marginBottom: 18, boxShadow: '0 6px 20px rgba(113,93,168,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.purpleDark }}>🔗 Importar do Notion</h3>
            <button onClick={() => setShowNotionImport(false)} style={{ background: 'none', border: 'none', color: B.muted, cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>×</button>
          </div>
          <div style={{ fontSize: 12, color: B.muted, marginBottom: 12, lineHeight: 1.5 }}>Cole a URL ou o texto do Notion com etapas numeradas.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={notionUrl}
              onChange={e => setNotionUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && notionUrl.trim() && handleFetchNotion()}
              placeholder="URL do Notion ou texto com '1.…', '2.…'"
              disabled={notionLoading}
              style={{ ...inpSt, flex: 1 }}
            />
            <button
              onClick={handleFetchNotion}
              disabled={notionLoading || !notionUrl.trim()}
              style={{ padding: '9px 16px', background: notionLoading ? B.border : B.purple, color: B.white, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: notionLoading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: notionLoading || !notionUrl.trim() ? 0.6 : 1 }}
            >
              {notionLoading ? 'Carregando...' : 'Carregar'}
            </button>
          </div>
          {notionError && (
            <div style={{ background: '#FFEBEE', border: '1px solid #EF5350', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#C62828', display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚠️ {notionError}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Seção 1: Base ─────────────────────────────────────────────── */}
        <div style={sectionBoxStyle}>
          <SectionTitle>1. Base do protocolo</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Código" value={f.code || ''} onChange={v => setF(x => ({ ...x, code: v }))} placeholder="Ex: PROT-001" />
            <Field label="Nome" value={f.name || ''} onChange={v => setF(x => ({ ...x, name: v }))} placeholder="Ex: Limpeza de Pele Negra" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Sel
              label="Categoria"
              value={f.category || ''}
              onChange={v => setF(x => ({ ...x, category: v }))}
              options={[{ v: '', l: 'Sem categoria' }, ...[...categories].sort((a, b) => a.label.localeCompare(b.label)).map(c => ({ v: c.id, l: c.label }))]}
            />
            <Field label="Frequência" value={f.frequency || ''} onChange={v => setF(x => ({ ...x, frequency: v }))} placeholder="Ex: 1x por semana" />
          </div>
          <Field label="Associações / Equipamentos" value={f.associations || ''} onChange={v => setF(x => ({ ...x, associations: v }))} placeholder="Ex: Peeling de diamante" />
          <Field label="Descrição" value={f.description || ''} onChange={v => setF(x => ({ ...x, description: v }))} placeholder="Resumo do protocolo" multi rows={3} />

          {/* Indicações */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 12, color: B.muted, marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Indicações</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {indications.map(ind => {
                const sel = f.concerns.includes(ind.id);
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => togConcern(ind.id)}
                    style={{ border: `1px solid ${sel ? B.purple : B.border}`, background: sel ? B.purple : '#fff', color: sel ? '#fff' : B.text, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s' }}
                  >
                    {ind.label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {showNewIndication ? (
                <>
                  <input
                    value={newIndication}
                    onChange={e => setNewIndication(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddIndication()}
                    placeholder="Nova indicação"
                    autoFocus
                    style={{ ...inpSt, maxWidth: 220 }}
                  />
                  <Btn onClick={handleAddIndication} size="sm">Adicionar</Btn>
                  <Btn onClick={() => { setShowNewIndication(false); setNewIndication(''); }} size="sm" variant="ghost">Cancelar</Btn>
                </>
              ) : (
                <button onClick={() => setShowNewIndication(true)} type="button" style={{ background: 'none', border: `1px dashed ${B.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: B.muted }}>
                  + Nova indicação
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Seção 2: Cabine ───────────────────────────────────────────── */}
        <div style={sectionBoxStyle}>
          <SectionTitle>2. Cabine (Etapas)</SectionTitle>
          {f.steps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: B.muted, fontSize: 13, fontStyle: 'italic' }}>
              Nenhuma etapa adicionada. Clique em "+ Adicionar etapa" para começar.
            </div>
          )}
          {f.steps.map((step, idx) => (
            <div
              key={step.id || idx}
              draggable
              onDragStart={e => handleDragStart(e, idx)}
              onDragOver={e => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              style={{
                marginBottom: 10,
                border: `2px solid ${draggedIdx === idx ? B.purple : B.border}`,
                borderRadius: 10,
                padding: 12,
                background: draggedIdx === idx ? '#F0EEFF' : '#FAFAFC',
                cursor: draggedIdx === idx ? 'grabbing' : 'grab',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                boxShadow: draggedIdx === idx ? '0 4px 12px rgba(113,93,168,0.15)' : 'none',
                transform: draggedIdx === idx ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              {/* Linha do número + nome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 14, color: B.muted, userSelect: 'none' }}>⋮⋮</span>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: B.purple, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{idx + 1}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label="Nome da etapa" value={step.name || ''} onChange={v => updStep(step.id, 'name', v)} placeholder="Ex: Higienização" />
                </div>
              </div>

              {/* Produto + Fase */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 8 }}>
                <Sel
                  label="Produto (opcional)"
                  value={step.productId || ''}
                  onChange={v => updStep(step.id, 'productId', v)}
                  options={getProtocolProductOptions(step.productId)}
                />
                {/* Fase com datalist — digita livremente ou escolhe da lista */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fase</label>
                  <input
                    type="text"
                    list={PHASE_DATALIST_ID}
                    value={step.phase || ''}
                    onChange={e => updStep(step.id, 'phase', e.target.value)}
                    placeholder="Selecione ou digite uma fase"
                    style={inpSt}
                  />
                </div>
              </div>

              {/* Instrução + Duração */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 8 }}>
                <Field label="Instrução" value={step.instruction || ''} onChange={v => updStep(step.id, 'instruction', v)} placeholder="Detalhar a execução" multi rows={3} />
                <Field label="Duração" value={step.duration || ''} onChange={v => updStep(step.id, 'duration', v)} placeholder="Ex: 10 min" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <button type="button" onClick={() => rmStep(step.id)} style={{ background: B.redLight, color: B.red, border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>
                  Remover
                </button>
                <span style={{ fontSize: 11, color: B.muted, fontStyle: 'italic' }}>Arraste para reordenar</span>
              </div>
            </div>
          ))}
          <button type="button" onClick={addStep} style={{ background: B.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
            + Adicionar etapa
          </button>

          {/* Card de custo por sessão — calculado automaticamente */}
          {uniqueStepProducts.length > 0 && (
            <div style={{ marginTop: 16, background: B.purpleLight, border: `1.5px solid ${B.border}`, borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: B.purple, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Custo estimado por sessão</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                {uniqueStepProducts.map(p => {
                  const cpa = costPerApp(p);
                  return (
                    <div key={p.id} style={{ background: B.white, borderRadius: 8, padding: '8px 12px', fontSize: 12, border: `1px solid ${B.border}`, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 140 }}>
                      <span style={{ fontWeight: 700, color: B.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{p.name}</span>
                      <span style={{ color: B.muted }}>Custo/aplic.: <strong style={{ color: B.purpleDark }}>{cpa != null ? fmtCurrency(cpa) : '—'}</strong></span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ fontSize: 13, color: B.muted }}>
                  {bottleneck && <span>Maior custo: <strong style={{ color: B.purpleDark }}>{bottleneck.name}</strong></span>}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: B.purpleDark }}>
                  Total: {fmtCurrency(totalCostPerSession)}
                  <span style={{ fontSize: 12, fontWeight: 400, color: B.muted, marginLeft: 6 }}>/ sessão</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Seção 3: Uso em casa ──────────────────────────────────────── */}
        <div style={sectionBoxStyle}>
          <SectionTitle>3. Uso em casa</SectionTitle>
          {['morning', 'night'].map(period => (
            <div key={period} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: B.purpleDark, marginBottom: 10 }}>
                {period === 'morning' ? '☀️ Manhã' : '🌙 Noite'}
              </div>
              {(f.homeUse?.[period] || []).length === 0 && (
                <div style={{ fontSize: 12, color: B.muted, marginBottom: 8, fontStyle: 'italic' }}>Nenhum item adicionado.</div>
              )}
              {(f.homeUse?.[period] || []).map((item, i) => (
                <div key={`${period}-${i}`} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 8, border: `1px solid ${B.border}`, borderRadius: 8, padding: 10, background: '#FBFBFF' }}>
                  <Sel
                    label="Produto"
                    value={item.productId || ''}
                    onChange={v => updHome(period, i, 'productId', v)}
                    options={getSkincareProductOptions(item.productId)}
                  />
                  <Field label="Instrução" value={item.instruction || ''} onChange={v => updHome(period, i, 'instruction', v)} placeholder="Ex: Aplicar 2x ao dia" />
                  <button type="button" onClick={() => rmHome(period, i)} style={{ gridColumn: '1 / -1', background: B.redLight, color: B.red, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>
                    Remover
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => addHome(period)} style={{ background: '#EEEFFB', color: B.purpleDark, border: `1px solid ${B.purple}`, borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                + Adicionar {period === 'morning' ? 'Manhã' : 'Noite'}
              </button>
            </div>
          ))}
        </div>

        {/* ── Seção 4: Kits e Mídia ─────────────────────────────────────── */}
        <div style={sectionBoxStyle}>
          <SectionTitle>4. Kits e Mídia</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Sel label="Kit Profissional" value={f.professionalKitId || ''} onChange={v => setF(x => ({ ...x, professionalKitId: v }))} options={getProfessionalKitOptions(f.professionalKitId)} />
            <Sel label="Kit Home Care" value={f.homeKitId || ''} onChange={v => setF(x => ({ ...x, homeKitId: v }))} options={getHomeKitOptions(f.homeKitId)} />
          </div>

          <Field
            label="URL do Vídeo (YouTube)"
            value={f.youtubeUrl || ''}
            onChange={v => setF(x => ({ ...x, youtubeUrl: v }))}
            placeholder="https://youtube.com/watch?v=..."
          />

          {/* Imagem de destaque */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Imagem de Destaque
            </label>
            {f.featuredImage && (
              <div style={{ marginBottom: 10, position: 'relative', display: 'inline-block' }}>
                <img src={f.featuredImage} alt="Imagem de destaque" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 10, border: `1px solid ${B.border}`, display: 'block' }} />
                <button
                  type="button"
                  onClick={() => setF(x => ({ ...x, featuredImage: '' }))}
                  style={{ position: 'absolute', top: 6, right: 6, background: B.red, color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={f.featuredImage || ''}
                onChange={e => setF(x => ({ ...x, featuredImage: e.target.value }))}
                placeholder="Cole a URL da imagem..."
                style={{ ...inpSt, flex: 1, minWidth: 180 }}
              />
              <label style={{ background: B.purpleLight, color: B.purpleDark, border: `1px solid ${B.purple}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: uploadingImage ? 'wait' : 'pointer', whiteSpace: 'nowrap', display: 'inline-block' }}>
                {uploadingImage ? 'Enviando...' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* ── Seção 5: Revisão e Publicação ────────────────────────────── */}
        <div style={sectionBoxStyle}>
          <SectionTitle>5. Revisão e Publicação</SectionTitle>
          <Sel
            label="Status de Revisão"
            value={f.reviewStatus || 'needs_review'}
            onChange={v => setF(x => ({ ...x, reviewStatus: v }))}
            options={[{ v: 'needs_review', l: 'A Revisar' }, { v: 'reviewed', l: 'Revisado' }, { v: 'approved', l: 'Aprovado' }]}
          />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Btn onClick={() => doSave(false)} variant="secondary">Salvar rascunho</Btn>
            <Btn onClick={() => doSave(true)}>Publicar</Btn>
            <Btn variant="ghost" onClick={() => onClose?.()}>Cancelar</Btn>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminProtForm;
