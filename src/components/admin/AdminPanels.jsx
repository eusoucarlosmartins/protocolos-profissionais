import { useEffect, useState } from "react";
import { B } from "../../lib/app-constants";
import { clean, uploadImageSafe } from "../../lib/app-services";
import { useIsMobile } from "../../hooks/useAppShell";

export const AdminDictionary = ({ title, items, saveItems, placeholder, readOnly, Btn, uid }) => {
  const [newLabel, setNewLabel] = useState("");
  const isMobile = useIsMobile();

  const add = () => {
    if (readOnly || !saveItems || !newLabel.trim()) return;
    const label = newLabel.trim();
    if (!items.find((item) => item.label.toLowerCase() === label.toLowerCase())) {
      saveItems([...items, { id: uid(), label }]);
    }
    setNewLabel("");
  };

  const remove = (id) => {
    if (readOnly || !saveItems) return;
    if (
      window.confirm(
        "Excluir este item? Isso nao removera as marcacoes existentes nos protocolos, mas elas ficarao sem o selo visual correspondente.",
      )
    ) {
      saveItems(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ margin: "0 0 24px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>{title}</h2>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexDirection: isMobile ? "column" : "row" }}>
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          disabled={readOnly}
          style={{
            flex: 1,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: `1px solid ${B.border}`,
            fontFamily: "inherit",
            outline: "none",
            background: readOnly ? B.cream : B.white,
            opacity: readOnly ? 0.75 : 1,
          }}
        />
        {!readOnly && <Btn onClick={add} sx={isMobile ? { width: "100%" } : {}}>Adicionar</Btn>}
      </div>
      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}` }}>
        {[...items].sort((a, b) => a.label.localeCompare(b.label)).map((item, index) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderBottom: index < items.length - 1 ? `1px solid ${B.border}` : "none",
            }}
          >
            <span style={{ fontWeight: 600, color: B.text }}>{item.label}</span>
            {!readOnly && (
              <button
                onClick={() => remove(item.id)}
                style={{ color: B.red, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}
              >
                Excluir
              </button>
            )}
          </div>
        ))}
        {items.length === 0 && <div style={{ padding: 30, textAlign: "center", color: B.muted }}>Nenhum item cadastrado</div>}
      </div>
    </div>
  );
};

export const AdminMarketing = ({ marketing, saveMarketing, protocols, Btn, Field, SectionTitle, uid }) => {
  const [formState, setFormState] = useState(() => JSON.parse(JSON.stringify(marketing)));
  const isMobile = useIsMobile();

  useEffect(() => {
    setFormState(JSON.parse(JSON.stringify(marketing)));
  }, [marketing]);

  const saveAll = () => {
    saveMarketing(formState);
    alert("Marketing salvo!");
  };

  const addBanner = () =>
    setFormState((prev) => ({
      ...prev,
      banners: [...prev.banners, { id: uid(), imageUrl: "", link: "", label: "", active: true }],
    }));

  const updateBanner = (id, field, value) =>
    setFormState((prev) => ({
      ...prev,
      banners: prev.banners.map((banner) => (banner.id === id ? { ...banner, [field]: value } : banner)),
    }));

  const removeBanner = (id) => {
    if (!window.confirm("Remover banner?")) return;
    setFormState((prev) => ({ ...prev, banners: prev.banners.filter((banner) => banner.id !== id) }));
  };

  const moveBanner = (id, direction) => {
    const banners = [...formState.banners];
    const index = banners.findIndex((banner) => banner.id === id);
    if (index < 0 || index + direction < 0 || index + direction >= banners.length) return;
    [banners[index], banners[index + direction]] = [banners[index + direction], banners[index]];
    setFormState((prev) => ({ ...prev, banners }));
  };

  const handleBannerFile = async (id, file) => {
    if (!file) return;
    const url = await uploadImageSafe(file);
    if (url) updateBanner(id, "imageUrl", url);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>Marketing</h2>
        <Btn onClick={saveAll} sx={isMobile ? { width: "100%" } : { padding: "10px 24px" }}>Salvar tudo</Btn>
      </div>

      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <SectionTitle>Barra de Aviso</SectionTitle>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div
              style={{ width: 40, height: 22, borderRadius: 11, background: formState.notice.active ? B.purple : "#ccc", position: "relative", transition: "background 0.2s" }}
              onClick={() => setFormState((prev) => ({ ...prev, notice: { ...prev.notice, active: !prev.notice.active } }))}
            >
              <div style={{ position: "absolute", top: 3, left: formState.notice.active ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: formState.notice.active ? B.purple : B.muted }}>{formState.notice.active ? "Ativa" : "Inativa"}</span>
          </label>
        </div>
        <Field
          label="Texto do aviso (aceita HTML basico)"
          value={formState.notice.text}
          onChange={(value) => setFormState((prev) => ({ ...prev, notice: { ...prev.notice, text: value } }))}
          placeholder="Ex: Promocao de Abril: frete gratis acima de R$ 300"
          multi
          rows={2}
        />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 8 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cor de fundo</label>
            <input
              type="color"
              value={formState.notice.bgColor || "#5E3D8F"}
              onChange={(event) => setFormState((prev) => ({ ...prev, notice: { ...prev.notice, bgColor: event.target.value } }))}
              style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${B.border}`, cursor: "pointer", padding: 2 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cor do texto</label>
            <input
              type="color"
              value={formState.notice.textColor || "#ffffff"}
              onChange={(event) => setFormState((prev) => ({ ...prev, notice: { ...prev.notice, textColor: event.target.value } }))}
              style={{ width: "100%", height: 40, borderRadius: 8, border: `1px solid ${B.border}`, cursor: "pointer", padding: 2 }}
            />
          </div>
        </div>
        {formState.notice.active && formState.notice.text && (
          <div style={{ marginTop: 14, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.muted, marginBottom: 6, textTransform: "uppercase" }}>Previa</div>
            <div
              style={{ background: formState.notice.bgColor || B.purple, color: formState.notice.textColor || "#fff", padding: "10px 20px", fontSize: 13, fontWeight: 600, textAlign: "center" }}
              dangerouslySetInnerHTML={{ __html: clean(formState.notice.text) }}
            />
          </div>
        )}
      </div>

      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <SectionTitle>Destaque do Mes</SectionTitle>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div
              style={{ width: 40, height: 22, borderRadius: 11, background: formState.campaign.active ? B.purple : "#ccc", position: "relative", transition: "background 0.2s" }}
              onClick={() => setFormState((prev) => ({ ...prev, campaign: { ...prev.campaign, active: !prev.campaign.active } }))}
            >
              <div style={{ position: "absolute", top: 3, left: formState.campaign.active ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: formState.campaign.active ? B.purple : B.muted }}>{formState.campaign.active ? "Ativo" : "Inativo"}</span>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Protocolo em destaque</label>
          <select
            value={formState.campaign.protocolId}
            onChange={(event) => setFormState((prev) => ({ ...prev, campaign: { ...prev.campaign, protocolId: event.target.value } }))}
            style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", background: B.white }}
          >
            <option value="">Selecione um protocolo</option>
            {[...protocols].sort((a, b) => a.name.localeCompare(b.name)).map((protocol) => (
              <option key={protocol.id} value={protocol.id}>{protocol.name}</option>
            ))}
          </select>
        </div>
        <Field label="Titulo da campanha" value={formState.campaign.title} onChange={(value) => setFormState((prev) => ({ ...prev, campaign: { ...prev.campaign, title: value } }))} placeholder="Ex: Abril da Limpeza de Pele" />
        <Field label="Subtitulo / descricao" value={formState.campaign.subtitle} onChange={(value) => setFormState((prev) => ({ ...prev, campaign: { ...prev.campaign, subtitle: value } }))} placeholder="Breve descricao da campanha" multi rows={2} />
      </div>

      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "stretch" : "center", flexDirection: isMobile ? "column" : "row", gap: 12, marginBottom: 16 }}>
          <SectionTitle>Banners (Hero)</SectionTitle>
          <Btn size="sm" onClick={addBanner} sx={isMobile ? { width: "100%" } : {}}>+ Adicionar banner</Btn>
        </div>
        {formState.banners.length === 0 && <p style={{ color: B.muted, fontSize: 13 }}>Nenhum banner cadastrado. Adicione um para exibir o carrossel na home.</p>}
        {formState.banners.map((banner, index) => (
          <div key={banner.id} style={{ border: `1px solid ${B.border}`, borderRadius: 10, padding: 16, marginBottom: 12, background: B.cream }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: B.purpleDark }}>Banner {index + 1}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button onClick={() => moveBanner(banner.id, -1)} disabled={index === 0} style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", opacity: index === 0 ? 0.3 : 1 }}>↑</button>
                <button onClick={() => moveBanner(banner.id, 1)} disabled={index === formState.banners.length - 1} style={{ background: "none", border: `1px solid ${B.border}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", opacity: index === formState.banners.length - 1 ? 0.3 : 1 }}>↓</button>
                <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: "3px 8px", borderRadius: 6, border: `1px solid ${banner.active ? B.purple : B.border}`, background: banner.active ? B.purpleLight : "none", fontSize: 12, fontWeight: 700, color: banner.active ? B.purple : B.muted }}>
                  <input type="checkbox" checked={banner.active} onChange={(event) => updateBanner(banner.id, "active", event.target.checked)} style={{ display: "none" }} />
                  {banner.active ? "Ativo" : "Inativo"}
                </label>
                <button onClick={() => removeBanner(banner.id)} style={{ background: "none", border: `1px solid ${B.red}`, borderRadius: 6, padding: "3px 8px", cursor: "pointer", color: B.red, fontSize: 12, fontWeight: 700 }}>Remover</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: B.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Imagem do banner</label>
                {banner.imageUrl && <img src={banner.imageUrl} alt="banner" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 8, border: `1px solid ${B.border}` }} />}
                <label style={{ display: "inline-block", padding: "7px 14px", background: B.purpleLight, color: B.purple, borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", border: `1.5px dashed ${B.purple}` }}>
                  {banner.imageUrl ? "Trocar imagem" : "Enviar imagem"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => handleBannerFile(banner.id, event.target.files?.[0])} />
                </label>
              </div>
              <div>
                <Field label="Link (interno ou externo)" value={banner.link} onChange={(value) => updateBanner(banner.id, "link", value)} placeholder="Ex: /protocolo/p_001 ou https://..." />
                <Field label="Legenda (opcional)" value={banner.label} onChange={(value) => updateBanner(banner.id, "label", value)} placeholder="Texto alternativo" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Btn onClick={saveAll} sx={isMobile ? { width: "100%" } : { padding: "12px 28px" }}>Salvar Marketing</Btn>
    </div>
  );
};

export const AdminSettings = ({ brand, saveBrand, Btn, Field }) => {
  const [formState, setFormState] = useState(brand);
  const isMobile = useIsMobile();

  useEffect(() => {
    setFormState(brand);
  }, [brand]);

  const handleSave = () => {
    saveBrand(formState);
    alert("Configuracoes salvas!");
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 style={{ margin: "0 0 24px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>Configuracoes da Marca</h2>
      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, padding: 24 }}>
        <Field label="Nome da Empresa" value={formState.companyName} onChange={(value) => setFormState({ ...formState, companyName: value })} />
        <Field label="URL da Logo (Imagem)" value={formState.logoUrl} onChange={(value) => setFormState({ ...formState, logoUrl: value })} placeholder="https://..." note="Cole o link da imagem (JPG/PNG). Se vazio, usa o icone padrao." />
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Field label="Cor Principal (HEX)" value={formState.colorMain} onChange={(value) => setFormState({ ...formState, colorMain: value })} type="color" />
          <Field label="Cor Secundaria (HEX)" value={formState.colorAccent} onChange={(value) => setFormState({ ...formState, colorAccent: value })} type="color" />
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            <input type="checkbox" checked={formState.showCalculator} onChange={(event) => setFormState({ ...formState, showCalculator: event.target.checked })} style={{ width: 18, height: 18 }} />
            Ativar Calculadora de Lucratividade nos Protocolos
          </label>
          <div style={{ fontSize: 11, color: B.muted, marginTop: 4, marginLeft: 26 }}>Se ativado, os visitantes poderao calcular o lucro por sessao nas paginas dos protocolos.</div>
        </div>
        <Btn onClick={handleSave} sx={{ marginTop: 20, ...(isMobile ? { width: "100%" } : {}) }}>Salvar Configuracoes</Btn>
      </div>
    </div>
  );
};

export const AdminDash = ({ products, protocols, indications, views }) => {
  const isMobile = useIsMobile();
  const withCost = products.filter((product) => product.cost && product.yieldApplications);

  const topProtocols = [...protocols]
    .map((protocol) => ({ ...protocol, views: views[`protocol_${protocol.id}`] || 0 }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const topProducts = [...products]
    .map((product) => ({ ...product, views: views[`product_${product.id}`] || 0 }))
    .filter((product) => product.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", color: B.purpleDark, fontSize: 22, fontFamily: "Georgia, serif" }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,minmax(0,1fr))" : "repeat(4,1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Produtos", value: products.length, icon: "📦", bg: B.purpleLight },
          { label: "Publicados", value: protocols.filter((protocol) => protocol.published).length, icon: "✓", bg: B.greenLight },
          { label: "Rascunhos", value: protocols.filter((protocol) => !protocol.published).length, icon: "✎", bg: B.goldLight },
          { label: "Com custo", value: withCost.length, icon: "$", bg: B.blueLight },
          { label: "Indicacoes", value: indications.length, icon: "🏷", bg: B.purpleLight },
        ].map((card) => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 14, padding: "18px 20px", border: `1px solid ${B.border}` }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ fontSize: 30, fontWeight: 700, color: B.purpleDark, lineHeight: 1 }}>{card.value}</div>
            <div style={{ fontSize: 12, color: B.muted, marginTop: 3 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={{ background: B.white, borderRadius: 14, border: `1px solid ${B.border}`, padding: isMobile ? "18px 16px" : "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: B.purpleDark, fontWeight: 700 }}>Protocolos mais vistos</h3>
          {topProtocols.length === 0 && <p style={{ color: B.muted, fontSize: 13 }}>Nenhuma visualizacao registrada ainda.</p>}
          {topProtocols.map((protocol, index) => (
            <div key={protocol.id} style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 12, padding: "8px 0", borderBottom: index < topProtocols.length - 1 ? `1px solid ${B.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: B.muted, width: 18 }}>{index + 1}.</span>
                <span style={{ fontSize: 13, color: B.text, fontWeight: 600, lineHeight: 1.3 }}>{protocol.name}</span>
              </div>
              <span style={{ background: B.purpleLight, color: B.purple, fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, flexShrink: 0 }}>{protocol.views} views</span>
            </div>
          ))}
        </div>

        <div style={{ background: B.white, borderRadius: 14, border: `1px solid ${B.border}`, padding: isMobile ? "18px 16px" : "20px 24px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, color: B.purpleDark, fontWeight: 700 }}>Produtos mais vistos</h3>
          {topProducts.length === 0 && <p style={{ color: B.muted, fontSize: 13 }}>Nenhuma visualizacao registrada ainda.</p>}
          {topProducts.map((product, index) => (
            <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 12, padding: "8px 0", borderBottom: index < topProducts.length - 1 ? `1px solid ${B.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: B.muted, width: 18 }}>{index + 1}.</span>
                <span style={{ fontSize: 13, color: B.text, fontWeight: 600, lineHeight: 1.3 }}>{product.name}</span>
              </div>
              <span style={{ background: B.goldLight, color: "#7A5C1E", fontSize: 12, fontWeight: 700, padding: "2px 10px", borderRadius: 20, flexShrink: 0 }}>{product.views} views</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: B.white, borderRadius: 14, border: `1px solid ${B.border}`, padding: isMobile ? "18px 16px" : "20px 24px" }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, color: B.text }}>Todos os Protocolos</h3>
        {protocols.map((protocol) => (
          <div key={protocol.id} style={{ display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 12, padding: "10px 0", borderBottom: `1px solid ${B.border}` }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: B.text }}>{protocol.name}</div>
              <div style={{ fontSize: 12, color: B.muted }}>
                {protocol.steps.length} etapas · {(protocol.concerns || []).map((concern) => indications.find((item) => item.id === concern)?.label).join(", ")}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {(views[`protocol_${protocol.id}`] || 0) > 0 && <span style={{ fontSize: 11, color: B.muted }}>Views: {views[`protocol_${protocol.id}`]}</span>}
              <span style={{ padding: "3px 10px", borderRadius: 20, background: protocol.published ? B.greenLight : B.goldLight, color: protocol.published ? B.green : "#7A5C1E", fontSize: 12, fontWeight: 700 }}>
                {protocol.published ? "Publicado" : "Rascunho"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
