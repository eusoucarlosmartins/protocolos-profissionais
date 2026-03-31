import { useState } from 'react';
import { useIsMobile } from '../../hooks/useAppShell';
import { useNotionImporter } from '../../hooks/useNotionImporter';
import { B, hasPerm } from '../../lib/app-constants';
import {
  clean,
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

const AdminProtForm = ({ prot, products, protocols, indications, categories, phases, saveProtocols, saveIndications, savePhases, setEditProt, loggedUser, onClose }) => {
  const isMobile = useIsMobile();
  const [f, setF] = useState({ ...prot, professionalKitId: prot.professionalKitId || '', homeKitId: prot.homeKitId || '', steps: [...(prot.steps || [])], homeUse: { morning: [...(prot.homeUse?.morning || [])], night: [...(prot.homeUse?.night || [])] }, concerns: [...(prot.concerns || [])] });

  const {
    notionUrl,
    setNotionUrl,
    notionLoading,
    notionError,
    showNotionImport,
    setShowNotionImport,
    fetchNotionProtocol
  } = useNotionImporter();

  const [newIndication, setNewIndication] = useState('');
  const [showNewIndication, setShowNewIndication] = useState(false);
  const [addingPhaseFor, setAddingPhaseFor] = useState(null);
  const [newPhaseLabel, setNewPhaseLabel] = useState('');
  const [draggedIdx, setDraggedIdx] = useState(null);

  const buildProductOptions = ({ selectedId, type, includeEmpty = false, emptyLabel = 'Sem produto' }) => {
    const activeProducts = [...products]
      .filter(product => isActive(product) && productHasType(product, type))
      .sort((a, b) => a.name.localeCompare(b.name));
    const opts = includeEmpty ? [{ v: '', l: emptyLabel }] : [];

    activeProducts.forEach(product => opts.push({ v: product.id, l: product.name }));

    if (selectedId) {
      const currentProd = products.find(product => product.id === selectedId);
      if (currentProd && !opts.some(option => option.v === currentProd.id)) {
        opts.push({ v: currentProd.id, l: `${isActive(currentProd) ? '' : '[INATIVO] '}${currentProd.name}` });
      }
    }
    return opts;
  };

  const getProtocolProductOptions = (selectedId) => buildProductOptions({ selectedId, type: 'protocol', includeEmpty: true, emptyLabel: 'Sem produto (equipamento/tecnica)' });
  const getSkincareProductOptions = (selectedId) => buildProductOptions({ selectedId, type: 'skincare', includeEmpty: true, emptyLabel: 'Sem produto indicado' });
  const getProfessionalKitOptions = (selectedId) => buildProductOptions({ selectedId, type: 'kit_professional' });
  const getHomeKitOptions = (selectedId) => buildProductOptions({ selectedId, type: 'kit_homecare' });

  const addStep = () => setF(x => ({ ...x, steps: [...x.steps, { id: uid(), phase: '', productId: null, instruction: '' }] }));
  const rmStep = id => setF(x => ({ ...x, steps: x.steps.filter(s => s.id !== id) }));
  const updStep = (id, k, v) => setF(x => ({ ...x, steps: x.steps.map(s => s.id === id ? { ...s, [k]: v } : s) }));

  const addHome = sl => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: [...x.homeUse[sl], { productId: null, instruction: '' }] } }));
  const rmHome = (sl, i) => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: x.homeUse[sl].filter((_, idx) => idx !== i) } }));
  const updHome = (sl, i, k, v) => setF(x => ({ ...x, homeUse: { ...x.homeUse, [sl]: x.homeUse[sl].map((h, idx) => idx === i ? { ...h, [k]: v } : h) } }));

  const togConcern = id => setF(x => ({ ...x, concerns: x.concerns.includes(id) ? x.concerns.filter(c => c !== id) : [...x.concerns, id] }));

  const handleNotionImportSuccess = (data) => {
    setF(x => ({
      ...x,
      externalSourceId: data.pageId,
      name: data.pageTitle || x.name,
      description: data.description || x.description || '',
      steps: Array.isArray(data.steps) && data.steps.length > 0 ? data.steps : x.steps,
      homeUse: data.homeUse || x.homeUse,
      concerns: data.concerns || x.concerns
    }));
  };

  const handleFetchNotion = async () => {
    await fetchNotionProtocol(handleNotionImportSuccess);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && notionUrl.trim()) {
      handleFetchNotion();
    }
  };

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
    setF(x => ({ ...x, concerns: x.concerns.includes(id) ? x.concerns : [...x.concerns, id] }));
    setNewIndication('');
    setShowNewIndication(false);
  };

  const handleAddPhase = (stepId) => {
    if (!newPhaseLabel.trim()) return;
    const lbl = newPhaseLabel.trim();
    const existing = phases.find(p => p.label.toLowerCase() === lbl.toLowerCase());
    if (!existing) {
      const id = uid();
      savePhases([...phases, { id, label: lbl }]);
      updStep(stepId, 'phase', lbl);
    } else {
      updStep(stepId, 'phase', existing.label);
    }
    setAddingPhaseFor(null);
    setNewPhaseLabel('');
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
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

  const doSave = (pub = null) => {
    if (!f.name.trim()) return alert('Nome obrigatorio');
    if (!String(f.code || '').trim()) return alert('Codigo obrigatorio');
    const normalizedCode = String(f.code || '').trim().toLowerCase();
    const codeInUse = protocols.some(p => p.id !== f.id && String(p.code || '').trim().toLowerCase() === normalizedCode);
    if (codeInUse) return alert('Ja existe um protocolo com este codigo.');

    const normalizedName = normalizePlainName(f.name);
    const exactMatch = protocols.find(p => p.id !== f.id && normalizePlainName(p.name) === normalizedName);
    if (exactMatch) {
      if (!window.confirm(`Ja existe protocolo similar: "${exactMatch.name}". Deseja continuar?`)) return;
    } else {
      const possible = protocols
        .map((p) => ({ protocol: p, score: getFuzzyScore(normalizedName, normalizePlainName(p.name)) }))
        .filter(item => item.score >= 0.6)
        .sort((a, b) => b.score - a.score);
      if (possible.length > 0 && !window.confirm(`Protocolo similar encontrado: "${possible[0].protocol.name}" (${Math.round(possible[0].score * 100)}% similar). Deseja continuar?`)) return;
    }

    const { _new, ...clean } = f;
    clean.code = String(clean.code || '').trim();
    clean.reviewStatus = clean.reviewStatus || 'needs_review';
    if (pub !== null) clean.published = pub;
    if (prot._new) saveProtocols([...protocols, clean]);
    else saveProtocols(protocols.map(p => p.id === clean.id ? clean : p));
    onClose?.();
  };

  const inpSt = { width: '100%', padding: '7px 10px', border: `1.5px solid ${B.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: B.white };
  const flowCards = [
    { n: '1', title: 'Base do protocolo', desc: 'Nome, descricao, categoria e indicacoes.' },
    { n: '2', title: 'Cabine', desc: 'Monte as etapas e a ordem do atendimento.' },
    { n: '3', title: 'Uso em casa', desc: 'Defina a rotina que o cliente vai seguir.' },
    { n: '4', title: 'Kits e destaque', desc: 'Kits vinculados, imagem final e CTA.' },
    { n: '5', title: 'Revisao', desc: 'Confira e publique quando estiver pronto.' }
  ];

  const sectionBoxStyle = { background: B.white, borderRadius: 16, border: `1px solid ${B.border}`, padding: isMobile ? 18 : 24, marginBottom: 16, boxShadow: '0 10px 26px rgba(44,31,64,0.04)' };
  const sectionHeadingStyle = { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, flexDirection: isMobile ? 'column' : 'row' };
  const sectionStepStyle = { width: 34, height: 34, borderRadius: '50%', background: B.purple, color: B.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0 };

  const protocolProducts = f.steps.filter(s => s.productId).map(s => products.find(x => x.id === s.productId)).filter(Boolean);
  const uniqueProducts = [...new Map(protocolProducts.map(pr => [pr.id, pr])).values()];
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
  phaseOptions.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => onClose?.()} style={{ background: 'none', border: 'none', color: B.purple, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>← Voltar</button>
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 20, fontFamily: 'Georgia, serif' }}>{prot._new ? 'Novo Protocolo' : 'Editar Protocolo'}</h2>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${B.purpleDark}, ${B.purple})`, borderRadius: 18, padding: isMobile ? '18px 16px' : '22px 22px 20px', marginBottom: 18, color: B.white, boxShadow: '0 18px 38px rgba(44,31,64,0.18)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Fluxo de montagem</div>
        <div style={{ fontSize: isMobile ? 20 : 22, fontWeight: 700, fontFamily: 'Georgia, serif', marginBottom: 8 }}>Preencha o protocolo em sequencia</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.78)', marginBottom: 16 }}>Organizei o cadastro para voce montar o protocolo de forma mais natural: contexto, kits, cabine, rotina de casa e publicacao.</div>
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

      {!showNotionImport && (
        <>
          {f.externalSourceId && (
            <div style={{ background: '#E8F5E9', border: `1.5px solid ${B.green}`, borderRadius: 14, padding: '12px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✓</span>
                <div style={{ fontSize: 13, color: '#2E7D32', fontWeight: 600 }}>Protocolo carregado do Notion</div>
              </div>
              <button onClick={() => setShowNotionImport(true)} style={{ background: 'none', border: 'none', color: B.purple, cursor: 'pointer', fontSize: 12, fontWeight: 700, textDecoration: 'underline' }}>Carregar outro Notion</button>
            </div>
          )}
          {!f.externalSourceId && (
            <div style={{ background: `linear-gradient(135deg, rgba(113, 93, 168, 0.05), rgba(113, 93, 168, 0.08))`, border: `1.5px dashed ${B.purple}`, borderRadius: 14, padding: '14px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>🔗</span>
                <div style={{ fontSize: 13, color: B.purple, fontWeight: 600 }}>Importar protocolo do Notion</div>
              </div>
              <button onClick={() => setShowNotionImport(true)} style={{ background: B.purple, border: 'none', color: B.white, cursor: 'pointer', fontSize: 12, fontWeight: 700, borderRadius: 6, padding: '6px 12px', fontFamily: 'inherit' }}>Abrir</button>
            </div>
          )}
        </>
      )}

      {showNotionImport && (
        <div style={{ background: B.white, border: `1.5px solid ${B.purple}`, borderRadius: 14, padding: '16px 18px', marginBottom: 18, boxShadow: `0 6px 20px rgba(113, 93, 168, 0.12)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: B.purpleDark, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>🔗</span> Importar do Notion
            </h3>
            <button onClick={() => setShowNotionImport(false)} style={{ background: 'none', border: 'none', color: B.muted, cursor: 'pointer', fontSize: 18, fontFamily: 'inherit' }}>×</button>
          </div>
          <div style={{ fontSize: 12, color: B.muted, marginBottom: 12, lineHeight: 1.5 }}>Cole a URL ou o texto do Notion com etapas numeradas. O parser suporta protocolos do Notion e texto colado simples.</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              value={notionUrl}
              onChange={e => setNotionUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="URL do Notion ou texto com ‘1.…’, ‘2.…’"
              disabled={notionLoading}
              style={{ ...inpSt, flex: 1 }}
            />
            <button
              onClick={handleFetchNotion}
              disabled={notionLoading || !notionUrl.trim()}
              style={{ padding: '7px 16px', background: notionLoading ? B.border : B.purple, color: B.white, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: notionLoading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: notionLoading || !notionUrl.trim() ? 0.6 : 1 }}
            >
              {notionLoading ? 'Carregando...' : 'Carregar'}
            </button>
          </div>
          {notionError && (
            <div style={{ background: '#FFEBEE', border: `1px solid #EF5350`, borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#C62828', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span>
              {notionError}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={sectionBoxStyle}>
          <SectionTitle>Base do protocolo</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Codigo" value={f.code || ''} onChange={(v) => setF((x) => ({ ...x, code: v }))} placeholder="Ex: PROT-001" />
            <Field label="Nome" value={f.name || ''} onChange={(v) => setF((x) => ({ ...x, name: v }))} placeholder="Ex: Limpeza de Pele Negra" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Sel
              label="Categoria"
              value={f.category || ''}
              onChange={(v) => setF((x) => ({ ...x, category: v }))}
              options={[{ v: '', l: 'Sem categoria' }, ...[...categories].sort((a, b) => a.label.localeCompare(b.label)).map((c) => ({ v: c.id, l: c.label }))]}
            />
            <Field label="Frequencia" value={f.frequency || ''} onChange={(v) => setF((x) => ({ ...x, frequency: v }))} placeholder="Ex: 1x por semana" />
          </div>
          <Field label="Descricao" value={f.description || ''} onChange={(v) => setF((x) => ({ ...x, description: v }))} placeholder="Resumo do protocolo" multi rows={3} />
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 12, color: B.muted, marginBottom: 8, fontWeight: 700 }}>Indicacoes</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {indications.map((ind) => {
                const selected = (f.concerns || []).includes(ind.id);
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => {
                      setF((x) => ({
                        ...x,
                        concerns: selected ? (x.concerns || []).filter((c) => c !== ind.id) : [...(x.concerns || []), ind.id]
                      }));
                    }}
                    style={{
                      border: `1px solid ${selected ? B.purple : B.border}`,
                      background: selected ? B.purple : '#fff',
                      color: selected ? '#fff' : B.text,
                      borderRadius: 8,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {ind.label}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {showNewIndication ? (
                <>
                  <input value={newIndication} onChange={(e) => setNewIndication(e.target.value)} placeholder="Nova indicacao" style={inpSt} />
                  <button onClick={handleAddIndication} type="button" style={{ background: B.purple, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>Adicionar</button>
                </>
              ) : (
                <button onClick={() => setShowNewIndication(true)} type="button" style={{ background: 'none', border: `1px dashed ${B.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>+ Nova indicacao</button>
              )}
            </div>
          </div>
        </div>

        <div style={sectionBoxStyle}>
          <SectionTitle>Cabine (Etapas)</SectionTitle>
          {f.steps.map((step, idx) => (
            <div key={step.id || idx} style={{ marginBottom: 10, border: `1px solid ${B.border}`, borderRadius: 10, padding: 10, background: '#FAFAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: B.purple, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{step.step || idx + 1}</span>
                <Field label="Nome da etapa" value={step.name || ''} onChange={(v) => updStep(step.id, 'name', v)} placeholder="Ex: Higienizacao" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
                <Sel
                  label="Produto (opcional)"
                  value={step.productId || ''}
                  onChange={(v) => updStep(step.id, 'productId', v)}
                  options={[{ v: '', l: 'Sem produto' }, ...getProtocolProductOptions(step.productId)]}
                />
                <Sel
                  label="Fase"
                  value={step.phase || ''}
                  onChange={(v) => updStep(step.id, 'phase', v)}
                  options={[{ v: '', l: 'Sem fase' }, ...phaseOptions.map((p) => ({ v: p.label, l: p.label }))]}
                />
              </div>
              <Field label="Instrucao" value={step.instruction || ''} onChange={(v) => updStep(step.id, 'instruction', v)} placeholder="Detalhar a execucao" multi rows={2} />
              <button type="button" onClick={() => rmStep(step.id)} style={{ background: B.redLight, color: B.red, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Remover etapa</button>
            </div>
          ))}
          <button type="button" onClick={addStep} style={{ background: B.purple, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>+ Adicionar etapa</button>
        </div>

        <div style={sectionBoxStyle}>
          <SectionTitle>Uso em casa</SectionTitle>
          {['morning', 'night'].map((period) => (
            <div key={period} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, textTransform: 'capitalize' }}>{period === 'morning' ? 'Manhã' : 'Noite'}</div>
              {(f.homeUse?.[period] || []).map((item, i) => (
                <div key={`${period}-${i}`} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 8, border: `1px solid ${B.border}`, borderRadius: 8, padding: 8, background: '#FBFBFF' }}>
                  <Sel
                    label="Produto"
                    value={item.productId || ''}
                    onChange={(v) => updHome(period, i, 'productId', v)}
                    options={[{ v: '', l: 'Sem produto' }, ...getSkincareProductOptions(item.productId)]}
                  />
                  <Field label="Instrucao" value={item.instruction || ''} onChange={(v) => updHome(period, i, 'instruction', v)} placeholder="Ex: Aplicar 2x dia" />
                  <button type="button" onClick={() => rmHome(period, i)} style={{ gridColumn: '1 / -1', background: B.redLight, color: B.red, border: 'none', borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>Remover</button>
                </div>
              ))}
              <button type="button" onClick={() => addHome(period)} style={{ background: '#EEEFFB', color: B.purpleDark, border: `1px solid ${B.purple}`, borderRadius: 8, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>+ Adicionar item ({period === 'morning' ? 'Manhã' : 'Noite'})</button>
            </div>
          ))}
        </div>

        <div style={sectionBoxStyle}>
          <SectionTitle>Kits e revisao</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Sel label="Kit Profissional" value={f.professionalKitId || ''} onChange={(v) => setF((x) => ({ ...x, professionalKitId: v }))} options={[{ v: '', l: 'Sem kit' }, ...getProfessionalKitOptions(f.professionalKitId)]} />
            <Sel label="Kit Home Care" value={f.homeKitId || ''} onChange={(v) => setF((x) => ({ ...x, homeKitId: v }))} options={[{ v: '', l: 'Sem kit' }, ...getHomeKitOptions(f.homeKitId)]} />
          </div>
          <Sel label="Revisao" value={f.reviewStatus || 'needs_review'} onChange={(v) => setF((x) => ({ ...x, reviewStatus: v }))} options={[{ v: 'needs_review', l: 'A Revisar' }, { v: 'reviewed', l: 'Revisado' }, { v: 'approved', l: 'Aprovado' }]} />
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
