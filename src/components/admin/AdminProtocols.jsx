import { useIsMobile } from "../../hooks/useAppShell";
import { B, hasPerm } from "../../lib/app-constants";
import { clean, isActive, uid } from "../../lib/app-services";

const buildCopyName = (baseName, existingNames = []) => {
  const cleanBase =
    String(baseName || "")
      .replace(/\s+\(Copia(?: \d+)?\)$/i, "")
      .trim() || "Item";
  const usedNames = new Set(
    existingNames.map((name) => String(name || "").trim().toLowerCase()),
  );
  const firstCopy = `${cleanBase} (Copia)`;
  if (!usedNames.has(firstCopy.toLowerCase())) return firstCopy;
  let index = 2;
  while (usedNames.has(`${cleanBase} (Copia ${index})`.toLowerCase())) index += 1;
  return `${cleanBase} (Copia ${index})`;
};

export const AdminProtocols = ({
  products,
  protocols,
  indications,
  categories,
  saveProtocols,
  setEditProt,
  filters,
  setFilters,
  search,
  setSearch,
  onClearFilters,
  loggedUser,
  Btn,
  Tag,
  TextProtocolImporter,
}) => {
  const isMobile = useIsMobile();
  const hasActiveFilters =
    search ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.indication !== "all" ||
    filters.reviewStatus !== "all";

  const toggle = (id) =>
    saveProtocols(protocols.map((protocol) => (protocol.id === id ? { ...protocol, published: !protocol.published } : protocol)));

  const del = (id) => {
    if (window.confirm("Excluir protocolo?")) {
      saveProtocols(protocols.filter((protocol) => protocol.id !== id));
    }
  };

  const setReviewStatus = (id, status) => {
    saveProtocols(protocols.map((protocol) => (protocol.id === id ? { ...protocol, reviewStatus: status } : protocol)));
  };

  const moveProtocol = (id, dir) => {
    const list = [...protocols];
    const index = list.findIndex((protocol) => protocol.id === id);
    if (index + dir < 0 || index + dir >= list.length) return;
    [list[index], list[index + dir]] = [list[index + dir], list[index]];
    saveProtocols(list);
  };

  const duplicate = (protocol) => {
    setEditProt({
      ...protocol,
      id: uid(),
      code: "",
      name: buildCopyName(protocol.name, protocols.map((item) => item.name)),
      _new: true,
    });
  };

  const newProtocol = () =>
    setEditProt({
      id: uid(),
      code: "",
      name: "",
      description: "",
      concerns: [],
      category: "",
      frequency: "",
      associations: "",
      reviewStatus: "needs_review",
      youtubeUrl: "",
      published: false,
      steps: [],
      homeUse: { morning: [], night: [] },
      professionalKitId: "",
      homeKitId: "",
      _new: true,
    });

  const filtered = protocols.filter((protocol) => {
    const matchSearch =
      !search ||
      protocol.name.toLowerCase().includes(search.toLowerCase()) ||
      String(protocol.code || "").toLowerCase().includes(search.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filters.status === "all" ||
      (filters.status === "published" ? protocol.published : !protocol.published);
    const matchCategory = filters.category === "all" || protocol.category === filters.category;
    const matchIndication =
      filters.indication === "all" ||
      (protocol.concerns && protocol.concerns.includes(filters.indication));
    const matchReviewStatus =
      filters.reviewStatus === "all" ||
      (protocol.reviewStatus || 'needs_review') === filters.reviewStatus;
    return matchSearch && matchStatus && matchCategory && matchIndication && matchReviewStatus;
  });

  const publishedCount = protocols.filter((protocol) => protocol.published).length;
  const draftCount = protocols.length - publishedCount;
  const homeRoutineCount = protocols.filter(
    (protocol) =>
      (protocol.homeUse?.morning?.length || 0) + (protocol.homeUse?.night?.length || 0) > 0,
  ).length;
  const kitLinkedCount = protocols.filter(
    (protocol) => protocol.professionalKitId || protocol.homeKitId,
  ).length;
  const needsReviewCount = protocols.filter((protocol) => protocol.reviewStatus === 'needs_review').length;
  const reviewedCount = protocols.filter((protocol) => protocol.reviewStatus === 'reviewed').length;
  const approvedCount = protocols.filter((protocol) => protocol.reviewStatus === 'approved').length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>
          Protocolos ({protocols.length})
        </h2>
        <Btn onClick={newProtocol} sx={isMobile ? { width: "100%" } : undefined}>
          + Novo Protocolo
        </Btn>
      </div>

      <TextProtocolImporter onImport={(protocol) => setEditProt(protocol)} products={products} />

      <div
        style={{
          background: B.white,
          padding: isMobile ? "16px" : "16px 20px",
          borderRadius: 12,
          border: `1px solid ${B.border}`,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 8 : 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 700, color: B.purpleDark, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Filtros de Pesquisa
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: B.muted, cursor: "pointer", fontFamily: "inherit" }}
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar protocolo por nome, codigo ou descricao..." style={{ flex: 1, minWidth: isMobile ? "100%" : 200, width: isMobile ? "100%" : "auto", padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" }} />
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} style={{ padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: B.white, width: isMobile ? "100%" : "auto" }}>
            <option value="all">Status: Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Rascunhos</option>
          </select>
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} style={{ padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: B.white, width: isMobile ? "100%" : "auto" }}>
            <option value="all">Categoria: Todas</option>
            {[...categories].sort((a, b) => a.label.localeCompare(b.label)).map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          <select value={filters.indication} onChange={(event) => setFilters({ ...filters, indication: event.target.value })} style={{ padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: B.white, width: isMobile ? "100%" : "auto" }}>
            <option value="all">Indicacao: Todas</option>
            {[...indications].sort((a, b) => a.label.localeCompare(b.label)).map((indication) => (
              <option key={indication.id} value={indication.id}>{indication.label}</option>
            ))}
          </select>
          <select value={filters.reviewStatus} onChange={(event) => setFilters({ ...filters, reviewStatus: event.target.value })} style={{ padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: B.white, width: isMobile ? "100%" : "auto" }}>
            <option value="all">Revisao: Todos</option>
            <option value="needs_review">A Revisar</option>
            <option value="reviewed">Revisado</option>
            <option value="approved">Aprovado</option>
          </select>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: B.muted, fontWeight: 600 }}>
          Mostrando {filtered.length} de {protocols.length} protocolos
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Publicados", value: publishedCount, color: B.green },
          { label: "Rascunhos", value: draftCount, color: "#7A5C1E" },
          { label: "Rotina Home", value: homeRoutineCount, color: B.purple },
          { label: "Kits", value: kitLinkedCount, color: B.purpleDark },
          { label: "A Revisar", value: needsReviewCount, color: B.gold },
          { label: "Revisados", value: reviewedCount, color: B.blue },
          { label: "Aprovados", value: approvedCount, color: B.green },
        ].map((chip) => (
          <div key={chip.label} style={{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 999, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, minWidth: 132, boxShadow: "0 5px 14px rgba(44,31,64,0.07)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: chip.color }}>{chip.value}</span>
            <span style={{ fontSize: 11, color: B.muted, textTransform: "uppercase", fontWeight: 600 }}>{chip.label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((protocol) => {
          const inactiveCount = protocol.steps.filter((step) => step.productId && !isActive(products.find((item) => item.id === step.productId))).length;
          const homeCount = (protocol.homeUse?.morning?.length || 0) + (protocol.homeUse?.night?.length || 0);
          const kitCount = (protocol.professionalKitId ? 1 : 0) + (protocol.homeKitId ? 1 : 0);
          return (
            <div key={protocol.id} style={{ background: B.white, borderRadius: 14, border: `1px solid ${B.border}`, borderLeft: `4px solid ${protocol.published ? B.green : B.gold}`, padding: isMobile ? "16px" : "18px 20px", boxShadow: "0 8px 18px rgba(44,31,64,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {protocol.code && <div style={{ fontSize: 11, fontWeight: 800, color: B.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{protocol.code}</div>}
                  <div style={{ fontSize: 18, fontWeight: 800, color: B.text, marginBottom: 5, lineHeight: 1.25 }}>{protocol.name}</div>
                  {protocol.description && <div style={{ fontSize: 13, color: B.muted, lineHeight: 1.5, maxWidth: isMobile ? '100%' : 760 }} dangerouslySetInnerHTML={{ __html: clean((protocol.description || '').slice(0, 120) + ((protocol.description || '').length > 120 ? '...' : '')) }} />}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ padding: "6px 12px", borderRadius: 999, background: protocol.published ? B.greenLight : B.goldLight, color: protocol.published ? B.green : '#7A5C1E', fontSize: 12, fontWeight: 700 }}>{protocol.published ? 'Publicado' : 'Rascunho'}</span>
                  <select value={protocol.reviewStatus || 'needs_review'} onChange={(event) => setReviewStatus(protocol.id, event.target.value)} style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${B.border}`, background: B.white, color: B.purpleDark, fontSize: 12, fontWeight: 700, cursor: "pointer", height: 30 }}>
                    <option value="needs_review">A Revisar</option>
                    <option value="reviewed">Revisado</option>
                    <option value="approved">Aprovado</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, marginBottom: 8 }}>
                {(protocol.concerns || []).slice(0, 3).map((concern) => <Tag key={concern} label={indications.find((item) => item.id === concern)?.label || concern} />)}
                <Tag label={categories.find((category) => category.id === protocol.category)?.label || protocol.category || 'Sem cat.'} color={B.goldLight} text="#7A5C1E" />
                {protocol.professionalKitId && <Tag label="Kit Profissional" color={B.purpleLight} text={B.purpleDark} />}
                {protocol.homeKitId && <Tag label="Kit Home Care" color={B.greenLight} text={B.green} />}
                {protocol.youtubeUrl && <Tag label="Vídeo" color="#FFEEEE" text="#C42020" />}
                {inactiveCount > 0 && <Tag label={`${inactiveCount} Inativo${inactiveCount > 1 ? 's' : ''}`} color={B.redLight} text={B.red} />}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {[
                  { label: 'Cabine', value: protocol.steps.length },
                  { label: 'Casa', value: homeCount },
                  { label: 'Kits', value: kitCount },
                  { label: 'Slides', value: (protocol.youtubeUrl ? 1 : 0) + (protocol.featuredImage ? 1 : 0) },
                ].map((item) => (
                  <div key={item.label} style={{ padding: '6px 10px', background: B.cream, border: `1px solid ${B.border}`, borderRadius: 10, fontSize: 12, color: B.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontWeight: 700, color: B.purpleDark }}>{item.value}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
                {hasPerm(loggedUser, 'protocols', 'edit') && <button onClick={() => moveProtocol(protocol.id, -1)} title='Mover para cima' style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${B.border}`, background: B.white, cursor: 'pointer' }}>↑</button>}
                {hasPerm(loggedUser, 'protocols', 'edit') && <button onClick={() => moveProtocol(protocol.id, 1)} title='Mover para baixo' style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${B.border}`, background: B.white, cursor: 'pointer' }}>↓</button>}
                {hasPerm(loggedUser, 'protocols', 'edit') && <Btn size='sm' variant='secondary' onClick={() => setEditProt(protocol)}>{protocol._new ? 'Editar (novo)' : 'Editar'}</Btn>}
                {hasPerm(loggedUser, 'protocols', 'edit') && <Btn size='sm' variant='ghost' onClick={() => duplicate(protocol)}>Duplicar</Btn>}
                {hasPerm(loggedUser, 'protocols', 'delete') && <Btn size='sm' variant='danger' onClick={() => del(protocol.id)}>Excluir</Btn>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 40, textAlign: 'center', color: B.muted }}>Nenhum protocolo encontrado</div>}
      </div>
    </div>
  );
};
