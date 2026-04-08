# Plano de Implementação — Landing Page Extratos da Terra
**Data:** 2026-04-08  
**Spec:** `2026-04-08-landing-page-design.md`

---

## Ordem de execução

### Passo 1 — `app-constants.js`: adicionar LANDING_KEY e INIT_LANDING
- Adicionar `export const LANDING_KEY = "edt_landing_v10";`
- Adicionar `export const INIT_LANDING = { hero: {...}, categories: {...}, cta: {...} }` com os valores padrão definidos no spec

### Passo 2 — `src/components/LandingPage.jsx`: criar componente
- Nav: fundo `B.purpleDark`, logo + companyName à esquerda, botão dourado à direita → `navigate('/protocolos')`
- Hero: eyebrow, H1, subtítulo, botão CTA, stats row dinâmico (conta protocolos publicados / 3 categorias / indications.length)
- Categorias: grid 3 colunas, cards com borda gradiente, clique → `setHomeFilters + navigate('/protocolos')`
- Indicações: chips clicáveis → `setHomeFilters + navigate('/protocolos')`
- CTA Final: fundo `B.purpleDark`, headline, subtítulo, botão dourado
- Responsivo com classes `rp-grid-home`, `rp-hero`, `rp-pad`

### Passo 3 — `src/components/admin/AdminLanding.jsx`: criar painel admin
- Formulário com todos os campos editáveis do spec (hero, categorias, cta)
- Lê do localStorage via `load(LANDING_KEY)`, salva com `save(LANDING_KEY, ...)`
- Usa componentes `Field`, `SectionTitle`, `Btn` já existentes no `App.jsx` (passados como props)

### Passo 4 — `src/App.jsx`: integrar tudo
1. Importar `LANDING_KEY`, `INIT_LANDING`
2. Adicionar estado: `const [landingConfig, setLandingConfig] = useState(() => load(LANDING_KEY) || INIT_LANDING)`
3. Adicionar `saveLanding` handler (persiste e atualiza estado)
4. Modificar roteamento:
   - `path === '/'` → `view = 'landing'`
   - `path === '/protocolos'` → `view = 'home'` (mover de `/`)
5. Atualizar `navItems`: `[{l:'Protocolos', v:'/protocolos'}, {l:'Buscar por Produto', v:'/busca'}]`
6. Renderizar `<LandingPage>` quando `view === 'landing'`
7. Lazy load de `AdminLanding` e adicionar aba "Landing Page" no `AdminPanel`
8. Passar `saveLanding` e `landingConfig` para `AdminPanel`

### Passo 5 — `AdminPanel` (em `App.jsx`): adicionar aba
- Adicionar tab "Landing Page" após "Marketing"
- Permissão: `hasPerm(loggedUser, 'marketing', 'edit')`
- Renderizar `<AdminLandingModule>` na aba correspondente

---

## Arquivos modificados

| Arquivo | Tipo |
|---|---|
| `src/lib/app-constants.js` | Modificar |
| `src/components/LandingPage.jsx` | Criar |
| `src/components/admin/AdminLanding.jsx` | Criar |
| `src/App.jsx` | Modificar |
