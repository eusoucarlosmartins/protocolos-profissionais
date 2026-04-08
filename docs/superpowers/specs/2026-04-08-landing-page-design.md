# Landing Page — Extratos da Terra
**Data:** 2026-04-08  
**Status:** Aprovado

---

## Objetivo

Criar uma landing page de entrada para o sistema de protocolos profissionais da Extratos da Terra. A página serve como apresentação da marca para esteticistas e profissionais de estética, com o objetivo único de levá-los a acessar o catálogo de protocolos.

---

## Audiência e CTA

- **Quem acessa:** Profissionais de estética (esteticistas, clínicas)
- **Ação principal:** Acessar o catálogo de protocolos
- **A landing NÃO é o catálogo** — é uma página de entrada separada. Busca e filtros avançados ficam no catálogo.

---

## Estética

- **Tema:** Editorial Claro — fundo creme (`#F7F4F0`), roxo escuro como cor principal, dourado como acento
- **Tom:** Alta tecnologia, profissional, científico. A marca não é botânica — o nome "Extratos da Terra" não define o visual.
- **Cores:** tokens existentes do objeto `B` em `app-constants.js` (sem duplicar valores)
- **Tipografia:** Sans-serif do sistema — consistente com o restante do app

---

## Arquitetura

### Novo arquivo
`src/components/LandingPage.jsx`

### Integração em App.jsx
- Nova rota `/` renderiza `LandingPage` (view `'landing'`)
- O catálogo (`PublicHome`) migra para `/protocolos` (view `'home'`)
- `navItems` no `Header` atualizado: `{l:'Protocolos', v:'/protocolos'}` e `{l:'Buscar por Produto', v:'/busca'}`
- Recebe as props: `protocols`, `indications`, `categories`, `brand`, `landingConfig`, `setHomeFilters`, `navigate`
- O botão "Acessar Catálogo" chama `navigate('/protocolos')`

### Storage da landing editável
- Nova chave: `edt_landing_v10` (constante `LANDING_KEY` em `app-constants.js`)
- Valor padrão (`INIT_LANDING`) definido em `app-constants.js`
- Lido com `load(LANDING_KEY)` no `App.jsx` e passado como prop `landingConfig`

---

## Estrutura da Página (5 seções)

### 1. Nav
- Fundo `B.purpleDark` (`#2C1F40`)
- Esquerda: logo (`<Logo>`) + nome da empresa (`brand.companyName`)
- Direita: botão dourado "Acessar Catálogo" → `navigate('/')`

### 2. Hero
- Fundo `B.cream` (`#F7F4F0`) com gradiente roxo sutil no canto direito
- **Eyebrow** (editável): `"Para Profissionais de Estética"`
- **H1** (editável): `"Protocolos que elevam o resultado das suas sessões"`
- **Subtítulo** (editável): texto técnico sobre alta performance
- **Botão CTA** (texto editável): roxo `B.purple`, texto branco → `navigate('/')`
- **Stats row** (dinâmico, não editável):
  - Número de protocolos publicados (contado do localStorage)
  - 3 categorias
  - Número de indicações ativas

### 3. Categorias
- Fundo branco
- Grid 3 colunas: **Facial / Corporal / Capilar**
- Cada card: ícone decorativo + nome + descrição (editável) + borda inferior gradiente roxo→dourado
- Clicar em um card → `navigate('/')` + `setHomeFilters(f => ({ ...f, filterCat: catId, page: 1 }))`

### 4. Indicações
- Fundo `B.cream`
- Grid de chips com todas as indicações ativas (`indications` do localStorage)
- Cada chip: bolinha roxa + label da indicação
- Clicar em um chip → `navigate('/')` + `setHomeFilters(f => ({ ...f, filterInds: [indId], page: 1 }))`

### 5. CTA Final
- Fundo `B.purpleDark`
- **Headline** (editável): `"Pronto para elevar seus resultados?"`
- **Subtítulo** (editável): `"Acesse o catálogo completo e encontre o protocolo ideal para cada cliente."`
- **Botão** (texto editável): dourado `B.gold`, texto `B.purpleDark` → `navigate('/')`

---

## Conteúdo Editável (Admin)

### Novo componente
`src/components/admin/AdminLanding.jsx`

### Nova aba no admin
- Label: **"Landing Page"**
- Posição: após a aba "Marketing"
- Permissão: `hasPerm(user, 'marketing', 'edit')` — reutiliza permissão de marketing

### Campos editáveis

| Campo | Seção | Tipo |
|---|---|---|
| Eyebrow do hero | Hero | Texto curto |
| Headline (H1) | Hero | Texto curto |
| Subtítulo do hero | Hero | Texto médio |
| Texto do botão CTA principal | Hero | Texto curto |
| Descrição — Facial | Categorias | Texto médio |
| Descrição — Corporal | Categorias | Texto médio |
| Descrição — Capilar | Categorias | Texto médio |
| Headline do CTA final | CTA Final | Texto curto |
| Subtítulo do CTA final | CTA Final | Texto médio |
| Texto do botão CTA final | CTA Final | Texto curto |

### Estrutura do INIT_LANDING (valor padrão)
```js
export const INIT_LANDING = {
  hero: {
    eyebrow: "Para Profissionais de Estética",
    headline: "Protocolos que elevam o resultado das suas sessões",
    subtitle: "Acesse o catálogo técnico completo com protocolos formulados para alta performance — Facial, Corporal e Capilar.",
    ctaText: "Acessar o Catálogo",
  },
  categories: {
    facial:   { desc: "Protocolos para pele do rosto: clareamento, antienvelhecimento, acne e mais." },
    corporal: { desc: "Tratamentos para corpo: modelagem, celulite, estrias, hidratação profunda." },
    capilar:  { desc: "Protocolos para couro cabeludo e cabelos com tecnologia avançada." },
  },
  cta: {
    headline: "Pronto para elevar seus resultados?",
    subtitle: "Acesse o catálogo completo e encontre o protocolo ideal para cada cliente.",
    ctaText: "Acessar o Catálogo Agora",
  },
};
```

---

## Conexão Landing → Catálogo

| Ação do usuário | Efeito |
|---|---|
| Clica em "Acessar Catálogo" (nav ou hero) | `navigate('/protocolos')` sem filtros |
| Clica em card de categoria | `navigate('/protocolos')` + `filterCat = catId` |
| Clica em chip de indicação | `navigate('/protocolos')` + `filterInds = [indId]` |
| Clica no botão CTA final | `navigate('/protocolos')` sem filtros |

O `homeFilters` e `setHomeFilters` já existem no estado do `App.jsx` e são passados como prop para `LandingPage`.

---

## O que NÃO entra nesta tela

- Campo de busca (fica no catálogo)
- Listagem de protocolos
- Login/autenticação
- Nomes/ícones das categorias não são editáveis (gerenciados em Dicionário)

---

## Responsividade

- Usa classes `rp-*` já definidas no `RESPONSIVE_CSS` de `app-constants.js`
- Grid de categorias: 3 colunas em desktop → 1 coluna em mobile (`rp-grid-home`)
- Stats row: flex wrap em mobile
- Nav: botão CTA oculto em mobile → substituído pelo menu hamburguer existente

---

## Arquivos a criar/modificar

| Arquivo | Operação |
|---|---|
| `src/components/LandingPage.jsx` | Criar |
| `src/components/admin/AdminLanding.jsx` | Criar |
| `src/lib/app-constants.js` | Modificar — adicionar `LANDING_KEY`, `INIT_LANDING` |
| `src/App.jsx` | Modificar — integrar LandingPage, carregar LANDING_KEY, adicionar aba admin |
