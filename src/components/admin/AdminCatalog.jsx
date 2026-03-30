import { useIsMobile } from '../../hooks/useAppShell';

export const AdminProducts = ({
  products,
  categories,
  saveProducts,
  setEditProd,
  filters,
  setFilters,
  search,
  setSearch,
  onClearFilters,
  loggedUser,
  Btn,
  Tag,
  B,
  EMPTY_PRODUCT,
  uid,
  sortByName,
  costPerApp,
  fmtCurrency,
  clean,
  hasPerm,
  isActive,
  XMLImporter,
}) => {
  const isMobile = useIsMobile();
  const hasActiveFilters = search || filters.status !== 'all' || filters.category !== 'all' || filters.uso !== 'all';

  const del = (id) => {
    if (window.confirm('Excluir produto?')) saveProducts(products.filter((p) => p.id !== id));
  };

  const duplicate = (product) => {
    setEditProd({ ...product, id: uid(), name: `${product.name} (Copia)`, _new: true });
  };

  const filtered = products.filter((product) => {
    const matchSearch = !search || product.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filters.status === 'all' || (filters.status === 'active' ? isActive(product) : !isActive(product));
    const matchCategory = filters.category === 'all' || (product.categories || [product.category]).includes(filters.category);
    const matchUso = filters.uso === 'all' || (product.uso || []).includes(filters.uso);
    return matchSearch && matchStatus && matchCategory && matchUso;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: B.purpleDark, fontSize: 22, fontFamily: 'Georgia, serif' }}>Produtos ({products.length})</h2>
        <Btn onClick={() => setEditProd({ ...EMPTY_PRODUCT, id: uid(), _new: true })} sx={isMobile ? { width: '100%' } : undefined}>+ Novo Produto</Btn>
      </div>

      <XMLImporter products={products} saveProducts={saveProducts} />

      <div style={{ background: B.white, padding: isMobile ? '16px' : '16px 20px', borderRadius: 12, border: `1px solid ${B.border}`, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: B.purpleDark, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros de Pesquisa</div>
          {hasActiveFilters && <button onClick={onClearFilters} style={{ background: 'none', border: `1px solid ${B.border}`, borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: B.muted, cursor: 'pointer', fontFamily: 'inherit' }}>Limpar filtros</button>}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto por nome..." style={{ flex: 1, minWidth: isMobile ? '100%' : 200, width: isMobile ? '100%' : 'auto', padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: B.white, width: isMobile ? '100%' : 'auto' }}>
            <option value="all">Status: Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} style={{ padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: B.white, width: isMobile ? '100%' : 'auto' }}>
            <option value="all">Area: Todas</option>
            {[...categories].sort((a, b) => a.label.localeCompare(b.label)).map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
          <select value={filters.uso} onChange={(e) => setFilters({ ...filters, uso: e.target.value })} style={{ padding: '9px 12px', border: `1.5px solid ${B.border}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', background: B.white, width: isMobile ? '100%' : 'auto' }}>
            <option value="all">Uso: Todos</option>
            <option value="profissional">Profissional</option>
            <option value="homecare">Home Care</option>
          </select>
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: B.muted, fontWeight: 600 }}>
          Mostrando {filtered.length} de {products.length} produtos
        </div>
      </div>

      <div style={{ background: B.white, borderRadius: 12, border: `1px solid ${B.border}`, overflow: 'hidden' }}>
        {sortByName(filtered).map((product, index) => {
          const cpa = costPerApp(product);
          return (
            <div key={product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 16, padding: isMobile ? '14px 16px' : '14px 20px', borderBottom: index < filtered.length - 1 ? `1px solid ${B.border}` : 'none' }}>
              <div style={{ width: isMobile ? '100%' : 'auto' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: B.text, marginBottom: 3 }}>{product.name}</div>
                <div style={{ fontSize: 12, color: B.muted, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span dangerouslySetInnerHTML={{ __html: clean((product.actives || '').slice(0, 60) + ((product.actives || '').length > 60 ? '...' : '')) }} />
                  {cpa != null && <span style={{ color: B.green, fontWeight: 700 }}>Custo {fmtCurrency(cpa)}/apl.</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
                  {(product.categories || [product.category]).map((categoryId) => <Tag key={categoryId} label={categories.find((category) => category.id === categoryId)?.label || categoryId} color={B.goldLight} text="#7A5C1E" />)}
                  {(product.uso || []).includes('homecare') && <Tag label="Home Care" color="#E8F5E9" text="#1E7E46" />}
                  {(product.uso || []).includes('profissional') && <Tag label="Profissional" color="#EBF5FF" text="#1A56DB" />}
                  {!isActive(product) && <Tag label="Inativo" color={B.redLight} text={B.red} />}
                </div>
                {hasPerm(loggedUser, 'products', 'edit') && <Btn size="sm" variant="secondary" onClick={() => setEditProd(product)}>Editar</Btn>}
                {hasPerm(loggedUser, 'products', 'edit') && <Btn size="sm" variant="ghost" onClick={() => duplicate(product)}>Duplicar</Btn>}
                {hasPerm(loggedUser, 'products', 'edit') && (
                  <button
                    onClick={() => saveProducts(products.map((item) => item.id === product.id ? { ...item, active: !isActive(item) } : item))}
                    style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${isActive(product) ? B.border : B.red}`, background: isActive(product) ? B.white : B.redLight, color: isActive(product) ? B.muted : B.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {isActive(product) ? 'Inativar' : 'Reativar'}
                  </button>
                )}
                {hasPerm(loggedUser, 'products', 'delete') && <Btn size="sm" variant="danger" onClick={() => del(product.id)}>Excluir</Btn>}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: B.muted }}>Nenhum produto cadastrado nesta aba</div>}
      </div>
    </div>
  );
};

export const AdminAlerts = ({ products, protocols, saveProducts, setEditProt, setAView, Btn, B, isActive, getAffectedProtocols }) => {
  const inactive = products.filter((product) => !isActive(product));
  const allIssues = inactive.map((prod) => ({
    prod,
    protocols: getAffectedProtocols(prod, protocols),
  })).filter((item) => item.protocols.length > 0);

  const orphanProtocols = protocols.filter((protocol) =>
    protocol.steps.some((step) => step.productId && !isActive(products.find((item) => item.id === step.productId)))
  );

  return (
    <div>
      <h2 style={{ margin: '0 0 6px', color: B.purpleDark, fontSize: 22, fontFamily: 'Georgia, serif' }}>Alertas de Integridade</h2>
      <p style={{ color: B.muted, fontSize: 14, margin: '0 0 28px' }}>Protocolos afetados por produtos inativos</p>

      {allIssues.length === 0 && (
        <div style={{ background: B.greenLight, borderRadius: 14, padding: '36px 28px', textAlign: 'center', border: `1px solid ${B.green}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: B.green }}>Tudo certo!</div>
          <div style={{ fontSize: 14, color: B.muted, marginTop: 4 }}>Nenhum protocolo publicado possui produtos inativos vinculados.</div>
        </div>
      )}

      {allIssues.length > 0 && (
        <div style={{ background: B.redLight, borderRadius: 12, padding: '16px 20px', marginBottom: 24, border: `1px solid ${B.red}`, display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 28 }}>!</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: B.red }}>{allIssues.length} produto{allIssues.length > 1 ? 's inativos afetam' : ' inativo afeta'} {orphanProtocols.length} protocolo{orphanProtocols.length > 1 ? 's' : ''}</div>
            <div style={{ fontSize: 13, color: B.muted, marginTop: 2 }}>Revise os protocolos abaixo ou reative os produtos.</div>
          </div>
        </div>
      )}

      {allIssues.map(({ prod, protocols: affectedProtocols }) => (
        <div key={prod.id} style={{ background: B.white, borderRadius: 14, border: `1.5px solid ${B.red}`, padding: '20px 24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ background: B.redLight, color: B.red, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>INATIVO</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: B.text }}>{prod.name}</div>
              {prod.actives && <div style={{ fontSize: 13, color: B.muted, marginTop: 2 }}>Ativos: {prod.actives}</div>}
            </div>
            <button
              onClick={() => saveProducts(products.map((item) => item.id === prod.id ? { ...item, active: true } : item))}
              style={{ background: B.green, color: B.white, border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              Reativar produto
            </button>
          </div>

          <div style={{ fontSize: 12, fontWeight: 700, color: B.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Aparece em {affectedProtocols.length} protocolo{affectedProtocols.length > 1 ? 's' : ''}:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {affectedProtocols.map((protocol) => {
              const inCabine = protocol.steps.some((step) => step.productId === prod.id);
              const inMorning = protocol.homeUse?.morning?.some((item) => item.productId === prod.id);
              const inNight = protocol.homeUse?.night?.some((item) => item.productId === prod.id);
              const where = [inCabine && 'Cabine', inMorning && 'Home Care Manha', inNight && 'Home Care Noite'].filter(Boolean).join(', ');

              return (
                <div key={protocol.id} style={{ background: B.cream, borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: B.text }}>{protocol.name}</div>
                    <div style={{ fontSize: 12, color: B.muted, marginTop: 2 }}>Utilizado em: {where}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: protocol.published ? B.greenLight : B.goldLight, color: protocol.published ? B.green : '#7A5C1E', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {protocol.published ? 'Publicado' : 'Rascunho'}
                    </span>
                    <Btn size="sm" variant="secondary" onClick={() => { setEditProt(protocol); setAView('protocols'); }}>Editar Protocolo</Btn>
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
