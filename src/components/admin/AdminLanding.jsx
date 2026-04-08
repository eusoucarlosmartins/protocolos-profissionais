import { useState } from "react";
import { B, INIT_LANDING } from "../../lib/app-constants";

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: B.purple, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `2px solid ${B.purpleLight}`, paddingBottom: 8, marginBottom: 16, marginTop: 24 }}>
    {children}
  </div>
);

const Field = ({ label, value, onChange, placeholder, multi = false, rows = 2 }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>}
    {multi
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, color: B.text, background: B.white, boxSizing: "border-box", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5 }} />
      : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, color: B.text, background: B.white, boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
    }
  </div>
);

export const AdminLanding = ({ landingConfig, saveLanding, Btn }) => {
  const readOnly = !saveLanding;
  const init = { ...INIT_LANDING, ...landingConfig };
  const [hero, setHero] = useState({ ...INIT_LANDING.hero, ...init.hero });
  const [cats, setCats] = useState({ ...INIT_LANDING.categories, ...init.categories });
  const [cta, setCta] = useState({ ...INIT_LANDING.cta, ...init.cta });
  const [saved, setSaved] = useState(false);

  const setHeroField = (field, val) => setHero(h => ({ ...h, [field]: val }));
  const setCatField = (catId, val) => setCats(c => ({ ...c, [catId]: { ...c[catId], desc: val } }));
  const setCtaField = (field, val) => setCta(c => ({ ...c, [field]: val }));

  const handleSave = () => {
    if (!saveLanding) return;
    saveLanding({ hero, categories: cats, cta });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 4px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>Landing Page</h2>
      <p style={{ fontSize: 13, color: B.muted, marginBottom: 24 }}>Edite os textos exibidos na página de entrada do sistema.</p>

      <SectionTitle>Hero</SectionTitle>
      <Field label="Eyebrow (texto acima do título)" value={hero.eyebrow} onChange={v => setHeroField("eyebrow", v)} placeholder="Para Profissionais de Estética" />
      <Field label="Título principal (H1)" value={hero.headline} onChange={v => setHeroField("headline", v)} placeholder="Protocolos que elevam o resultado..." />
      <Field label="Subtítulo" value={hero.subtitle} onChange={v => setHeroField("subtitle", v)} placeholder="Texto descritivo..." multi rows={2} />
      <Field label="Texto do botão CTA" value={hero.ctaText} onChange={v => setHeroField("ctaText", v)} placeholder="Acessar o Catálogo" />

      <SectionTitle>Categorias</SectionTitle>
      <Field label="Descrição — Facial" value={cats.facial?.desc || ""} onChange={v => setCatField("facial", v)} placeholder="Protocolos para pele do rosto..." multi rows={2} />
      <Field label="Descrição — Corporal" value={cats.corporal?.desc || ""} onChange={v => setCatField("corporal", v)} placeholder="Tratamentos para corpo..." multi rows={2} />
      <Field label="Descrição — Capilar" value={cats.capilar?.desc || ""} onChange={v => setCatField("capilar", v)} placeholder="Protocolos para couro cabeludo..." multi rows={2} />

      <SectionTitle>CTA Final</SectionTitle>
      <Field label="Título" value={cta.headline} onChange={v => setCtaField("headline", v)} placeholder="Pronto para elevar seus resultados?" />
      <Field label="Subtítulo" value={cta.subtitle} onChange={v => setCtaField("subtitle", v)} placeholder="Acesse o catálogo completo..." multi rows={2} />
      <Field label="Texto do botão" value={cta.ctaText} onChange={v => setCtaField("ctaText", v)} placeholder="Acessar o Catálogo Agora" />

      {!readOnly && (
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <Btn onClick={handleSave} variant="primary">Salvar alterações</Btn>
          {saved && <span style={{ fontSize: 13, color: B.green, fontWeight: 600 }}>✓ Salvo com sucesso</span>}
        </div>
      )}
    </div>
  );
};
