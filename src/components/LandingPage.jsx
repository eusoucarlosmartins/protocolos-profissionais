import { B } from "../lib/app-constants";

const CAT_ICONS = {
  facial:   "✦",
  corporal: "◆",
  capilar:  "❋",
};

const CAT_LABELS = {
  facial:   "Facial",
  corporal: "Corporal",
  capilar:  "Capilar",
};

const CAT_ORDER = ["facial", "corporal", "capilar"];

export const LandingPage = ({ protocols, indications, categories, brand, landingConfig, setHomeFilters, navigate }) => {
  const cfg = landingConfig || {};
  const hero = cfg.hero || {};
  const cfgCats = cfg.categories || {};
  const cta = cfg.cta || {};

  const publishedCount = (protocols || []).filter(p => p.published).length;
  const indCount = (indications || []).length;

  const goToCatalog = (filters) => {
    if (filters) {
      setHomeFilters(f => ({ ...f, ...filters, page: 1 }));
    }
    navigate("/protocolos");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: B.text, background: B.cream, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

      {/* NAV */}
      <nav className="no-print" style={{ background: B.purpleDark, padding: "14px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {brand?.logoUrl
            ? <img src={brand.logoUrl} alt={brand.companyName || "Logo"} style={{ height: 32, objectFit: "contain" }} />
            : <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${B.gold}, #e8b96a)`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: B.white, fontWeight: 800 }}>ET</div>
          }
          <span style={{ color: B.white, fontWeight: 700, fontSize: 14, letterSpacing: "0.03em" }}>
            {brand?.companyName || "Extratos da Terra"}
          </span>
        </div>
        <button
          onClick={() => goToCatalog(null)}
          style={{ background: B.gold, color: B.purpleDark, border: "none", padding: "9px 22px", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}
        >
          {hero.ctaText || "Acessar o Catálogo"}
        </button>
      </nav>

      {/* HERO */}
      <section className="rp-pad" style={{ background: B.cream, padding: "72px 40px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 420, height: 420, background: `radial-gradient(circle at top right, rgba(94,61,143,0.07) 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.purple, marginBottom: 14 }}>
            {hero.eyebrow || "Para Profissionais de Estética"}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: B.purpleDark, lineHeight: 1.15, maxWidth: 560, margin: "0 0 18px", letterSpacing: "-0.01em" }}>
            {hero.headline || "Protocolos que elevam o resultado das suas sessões"}
          </h1>
          <p style={{ color: B.muted, fontSize: 16, lineHeight: 1.65, maxWidth: 480, margin: "0 0 36px" }}>
            {hero.subtitle || "Acesse o catálogo técnico completo com protocolos formulados para alta performance."}
          </p>
          <button
            onClick={() => goToCatalog(null)}
            style={{ background: B.purple, color: B.white, border: "none", padding: "14px 36px", borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}
          >
            {hero.ctaText || "Acessar o Catálogo"}
          </button>

          {/* Stats */}
          <div style={{ display: "flex", gap: 40, marginTop: 52, paddingTop: 36, borderTop: `1px solid ${B.border}`, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: B.purpleDark, lineHeight: 1 }}>
                {publishedCount}<span style={{ color: B.gold }}>+</span>
              </div>
              <div style={{ fontSize: 12, color: B.muted, marginTop: 5, letterSpacing: "0.03em" }}>Protocolos ativos</div>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: B.purpleDark, lineHeight: 1 }}>3</div>
              <div style={{ fontSize: 12, color: B.muted, marginTop: 5, letterSpacing: "0.03em" }}>Categorias</div>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, color: B.purpleDark, lineHeight: 1 }}>{indCount}</div>
              <div style={{ fontSize: 12, color: B.muted, marginTop: 5, letterSpacing: "0.03em" }}>Indicações cobertas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="rp-pad" style={{ background: B.white, padding: "56px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.purple, marginBottom: 8 }}>Especialidades</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: B.purpleDark, marginBottom: 32 }}>Escolha sua área de atuação</div>
          <div className="rp-grid-home" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {CAT_ORDER.map(catId => {
              const desc = cfgCats[catId]?.desc || "";
              return (
                <button
                  key={catId}
                  onClick={() => goToCatalog({ filterCat: catId })}
                  style={{ background: B.cream, border: `1px solid ${B.border}`, borderRadius: 12, padding: "28px 24px", textAlign: "left", cursor: "pointer", position: "relative", overflow: "hidden", fontFamily: "inherit", transition: "box-shadow 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = `0 4px 20px rgba(94,61,143,0.12)`}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                >
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, ${B.purple}, ${B.gold})` }} />
                  <div style={{ width: 44, height: 44, background: B.purpleLight, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 16 }}>
                    {CAT_ICONS[catId]}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: B.purpleDark, marginBottom: 8 }}>{CAT_LABELS[catId]}</div>
                  <div style={{ fontSize: 13, color: B.muted, lineHeight: 1.55 }}>{desc}</div>
                  <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: B.purple }}>Ver protocolos →</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* INDICAÇÕES */}
      <section className="rp-pad" style={{ background: B.cream, padding: "56px 40px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: B.purple, marginBottom: 8 }}>Indicações</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: B.purpleDark, marginBottom: 32 }}>Qual é a necessidade do seu cliente?</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {(indications || []).map(ind => (
              <button
                key={ind.id}
                onClick={() => goToCatalog({ filterInds: [ind.id] })}
                style={{ background: B.white, border: `1.5px solid ${B.border}`, color: B.purpleDark, fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 100, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = B.purple; e.currentTarget.style.background = B.purpleLight; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = B.border; e.currentTarget.style.background = B.white; }}
              >
                <span style={{ width: 7, height: 7, background: B.purple, borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
                {ind.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: B.purpleDark, padding: "64px 40px", textAlign: "center", marginTop: "auto" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: B.white, marginBottom: 14, lineHeight: 1.25 }}>
            {cta.headline || "Pronto para elevar seus resultados?"}
          </h2>
          <p style={{ color: "rgba(247,244,240,0.65)", fontSize: 15, lineHeight: 1.65, marginBottom: 32 }}>
            {cta.subtitle || "Acesse o catálogo completo e encontre o protocolo ideal para cada cliente."}
          </p>
          <button
            onClick={() => goToCatalog(null)}
            style={{ background: B.gold, color: B.purpleDark, border: "none", padding: "15px 40px", borderRadius: 8, fontWeight: 800, fontSize: 14, cursor: "pointer", letterSpacing: "0.05em", fontFamily: "inherit" }}
          >
            {cta.ctaText || "Acessar o Catálogo Agora"}
          </button>
        </div>
      </section>

    </div>
  );
};
