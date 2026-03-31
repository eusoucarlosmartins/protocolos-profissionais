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
    filters.indication !== "all";

  const toggle = (id) =>
    saveProtocols(protocols.map((protocol) => (protocol.id === id ? { ...protocol, published: !protocol.published } : protocol)));

  const del = (id) => {
    if (window.confirm("Excluir protocolo?")) {
      saveProtocols(protocols.filter((protocol) => protocol.id !== id));
    }
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
    return matchSearch && matchStatus && matchCategory && matchIndication;
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
              <option key={indication.id} value={indication.id}>
                {indication.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: B.muted, fontWeight: 600 }}>
          Mostrando {filtered.length} de {protocols.length} protocolos
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Publicados", value: publishedCount, tone: B.green, helper: "visiveis no site" },
          { label: "Rascunhos", value: draftCount, tone: "#7A5C1E", helper: "em preparacao" },
          { label: "Com rotina em casa", value: homeRoutineCount, tone: B.purple, helper: "cliente acompanhada" },
          { label: "Com kits", value: kitLinkedCount, tone: B.purpleDark, helper: "fechamento estruturado" },
        ].map((card) => (
          <div key={card.label} style={{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 14, padding: "14px 16px", boxShadow: "0 10px 24px rgba(44,31,64,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.tone }}>{card.value}</div>
            <div style={{ fontSize: 12, color: B.muted, marginTop: 4 }}>{card.helper}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((protocol) => (
          <div key={protocol.id} style={{ background: B.white, borderRadius: 16, border: `1px solid ${B.border}`, borderLeft: `4px solid ${protocol.published ? B.green : B.gold}`, padding: isMobile ? "16px" : "18px 20px", display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 14 : 18, boxShadow: "0 12px 28px rgba(44,31,64,0.05)" }}>
            <div style={{ width: isMobile ? "100%" : "auto", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8, flexDirection: isMobile ? "column" : "row" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {protocol.code && <div style={{ fontSize: 11, fontWeight: 800, color: B.purple, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{protocol.code}</div>}
                  <div style={{ fontWeight: 700, fontSize: 17, color: B.text, marginBottom: 6, lineHeight: 1.3 }}>{protocol.name}</div>
                  {protocol.description && <div style={{ fontSize: 13, color: B.muted, lineHeight: 1.55, marginBottom: 10 }} dangerouslySetInnerHTML={{ __html: clean((protocol.description || "").slice(0, 140) + ((protocol.description || "").length > 140 ? "..." : "")) }} />}
                </div>
                {hasPerm(loggedUser, "protocols", "publish") ? (
                  <button onClick={() => toggle(protocol.id)} style={{ padding: "6px 12px", borderRadius: 999, border: "none", background: protocol.published ? B.greenLight : B.goldLight, color: protocol.published ? B.green : "#7A5C1E", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                    {protocol.published ? "Publicado" : "Rascunho"}
                  </button>
                ) : (
                  <span style={{ padding: "6px 12px", borderRadius: 999, background: protocol.published ? B.greenLight : B.goldLight, color: protocol.published ? B.green : "#7A5C1E", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                    {protocol.published ? "Publicado" : "Rascunho"}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
                {(protocol.concerns || []).map((concern) => <Tag key={concern} label={indications.find((item) => item.id === concern)?.label || concern} />)}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <Tag label={categories.find((category) => category.id === protocol.category)?.label || protocol.category} color={B.goldLight} text={"#7A5C1E"} />
                </div>
                {protocol.professionalKitId && <Tag label="Kit Profissional" color={B.purpleLight} text={B.purpleDark} />}
                {protocol.homeKitId && <Tag label="Kit Home Care" color={B.greenLight} text={B.green} />}
                {protocol.youtubeUrl && <span style={{ fontSize: 12, background: "#FF0000", color: B.white, padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>YT</span>}
                {(() => {
                  const inactiveCount = protocol.steps.filter((step) => step.productId && !isActive(products.find((item) => item.id === step.productId))).length;
                  return inactiveCount > 0 && <span style={{ fontSize: 12, background: B.redLight, color: B.red, padding: "2px 8px", borderRadius: 10, fontWeight: 700, border: `1px solid ${B.red}` }}>{inactiveCount} inativo{inactiveCount > 1 ? "s" : ""}</span>;
                })()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                {[
                  { label: "Cabine", value: protocol.steps.length, helper: "etapas cadastradas" },
                  { label: "Casa", value: (protocol.homeUse?.morning?.length || 0) + (protocol.homeUse?.night?.length || 0), helper: "passos de rotina" },
                  { label: "Kits", value: (protocol.professionalKitId ? 1 : 0) + (protocol.homeKitId ? 1 : 0), helper: "vinculados" },
                  { label: "Material", value: (protocol.youtubeUrl ? 1 : 0) + (protocol.featuredImage ? 1 : 0), helper: "extras ativos" },
                ].map((item) => (
                  <div key={item.label} style={{ background: B.cream, border: `1px solid ${B.border}`, borderRadius: 12, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: B.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: B.purpleDark }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: B.muted, marginTop: 2 }}>{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch", justifyContent: isMobile ? "stretch" : "flex-start", flexDirection: isMobile ? "column" : "row", flexShrink: 0, flexWrap: "wrap", width: isMobile ? "100%" : "auto", minWidth: isMobile ? "100%" : 220 }}>
              <div style={{ display: "flex", gap: 8, width: isMobile ? "100%" : "auto" }}>
                {hasPerm(loggedUser, "protocols", "edit") && <button onClick={() => moveProtocol(protocol.id, -1)} title="Mover para cima" style={{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 10, padding: "8px 11px", cursor: "pointer", fontSize: 13, flex: isMobile ? 1 : "0 0 auto" }}>↑</button>}
                {hasPerm(loggedUser, "protocols", "edit") && <button onClick={() => moveProtocol(protocol.id, 1)} title="Mover para baixo" style={{ background: B.white, border: `1px solid ${B.border}`, borderRadius: 10, padding: "8px 11px", cursor: "pointer", fontSize: 13, flex: isMobile ? 1 : "0 0 auto" }}>↓</button>}
              </div>
              {hasPerm(loggedUser, "protocols", "edit") && <Btn size="sm" variant="secondary" onClick={() => setEditProt(protocol)} sx={isMobile ? { width: "100%" } : { minWidth: 88 }}>Editar</Btn>}
              {hasPerm(loggedUser, "protocols", "edit") && <Btn size="sm" variant="ghost" onClick={() => duplicate(protocol)} sx={isMobile ? { width: "100%" } : { minWidth: 88 }}>Duplicar</Btn>}
              {hasPerm(loggedUser, "protocols", "delete") && <Btn size="sm" variant="danger" onClick={() => del(protocol.id)} sx={isMobile ? { width: "100%" } : { minWidth: 88 }}>Excluir</Btn>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 40, textAlign: "center", color: B.muted }}>Nenhum protocolo encontrado</div>}
      </div>
    </div>
  );
};
