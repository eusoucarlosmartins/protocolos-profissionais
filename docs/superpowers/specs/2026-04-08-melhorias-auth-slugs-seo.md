# Spec — Auth Pública, Slugs e Melhorias SEO/Mobile
**Data:** 2026-04-08  
**Projeto:** protocolos-profissionais (Extratos da Terra)

---

## 1. Login Público com Supabase Auth (Favoritos Persistidos)

### Objetivo
Permitir que profissionais criem conta (email + senha) para persistir favoritos entre dispositivos e sessões.

### Fluxo do usuário
- Header: botão "Entrar" visível para visitantes não autenticados
- Modal único com abas **Entrar** / **Criar conta** (email + senha)
- Após login: header mostra email do usuário + botão "Sair"
- Favoritos: quando logado → lidos/escritos no Supabase. Quando não logado → localStorage (mantém durante a sessão, não sincroniza entre dispositivos)

### Infraestrutura Supabase
- Nova tabela: `user_favorites (id uuid PK, user_id uuid FK auth.users, protocol_id text, created_at timestamptz)`
- RLS habilitado: `SELECT/INSERT/DELETE` apenas onde `auth.uid() = user_id`
- Usar `supabase.auth.signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange`
- Supabase client já existe em `app-services.js` — apenas adicionar funções de auth

### Componentes novos
- `src/components/PublicAuthModal.jsx` — modal de login/cadastro público
  - Props: `open`, `onClose`, `onLogin(user)`
  - Tabs: Entrar / Criar conta
  - Validação básica: email válido, senha ≥ 6 chars
  - Exibe erro do Supabase (email já existe, senha errada, etc.)

### Mudanças no App.jsx
- Estado: `const [publicUser, setPublicUser] = useState(null)` (usuário Supabase Auth)
- `useEffect` com `supabase.auth.onAuthStateChange` para detectar sessão persistida
- `favorites`: ao mudar `publicUser`, carrega favoritos da tabela `user_favorites`
- `toggleFav`: quando logado → insert/delete na tabela; quando não logado → localStorage
- Header: renderiza botão "Entrar" ou `[email] | Sair` dependendo de `publicUser`

### Separação do sistema admin
- Admin usa sessão HMAC própria (`edt_admin_session` cookie) — não muda
- Público usa Supabase Auth — sistemas completamente separados

---

## 2. Slugs em Protocolos e Produtos

### Regra de negócio
- **Criação:** slug gerado automaticamente do nome via `generateSlug(name)`
- **Após criação:** mudar o nome **não muda** o slug automaticamente
- **Edição manual:** campo slug somente leitura por padrão; botão "✏️ Editar slug" desbloqueia edição
- **Unicidade:** validar slug único ao salvar (alerta se duplicado)

### Função `generateSlug`
```js
// src/lib/app-constants.js ou src/lib/data-transformers.js
export const generateSlug = (name) =>
  name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // remove acentos
    .replace(/[^a-z0-9\s-]/g, "")     // remove especiais
    .trim()
    .replace(/\s+/g, "-");             // espaços → hífens
```

### Schema
- Adicionar campo `slug: ""` em `EMPTY_PRODUCT` e em `INIT_PROTOCOLS[0]`
- Ao carregar dados antigos sem slug: gerar slug do nome em runtime (sem salvar)

### Roteamento (App.jsx)
- URLs novas: `/protocolo/peeling-de-diamante-clareamento`, `/produto/advanced-detox-creme`
- Lookup: `protocols.find(p => p.slug === id || p.id === id)` — backward compat com IDs antigos
- Mesmo para produtos

### Admin (AdminProtForm + formulário de produto)
- Campo "Slug" abaixo do campo "Nome"
- Estado local `slugLocked: true` — campo `disabled` quando locked
- Botão "✏️ Editar slug" → `slugLocked = false`
- Ao preencher nome pela primeira vez (slug vazio) → auto-fill do slug
- Ao salvar: se slug vazio → gerar do nome

---

## 3. Meta Tags Dinâmicas (SEO + WhatsApp/Telegram Preview)

### Objetivo
Melhorar preview ao compartilhar links de protocolos e produtos via WhatsApp, Telegram e outros.

### Implementação
- Função utilitária `setPageMeta({ title, description, url })` em `app-services.js` ou inline
- Atualiza: `document.title`, `<meta name="description">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:url">`
- Chamada em:
  - `ProtocolDetail` ao montar: title = nome do protocolo, description = primeiros 150 chars da descrição
  - `PublicProductPage` ao montar: mesmo padrão
  - Ao voltar ao catálogo/landing: restaura título padrão da marca

### Limitação conhecida
SPA não tem SSR — crawlers de bots não executam JS. Preview funciona para apps de mensagens que executam JS (WhatsApp Web, Telegram), mas não para Google Search. Aceito como trade-off sem SSR.

---

## 4. Melhorias Mobile — Páginas de Detalhe

### Protocolo Detail (mobile)
- Tabela de steps: envolver em `div` com `overflowX: auto` para scroll horizontal
- Ou, em mobile (`useIsMobile()`): renderizar steps como cards empilhados em vez de linhas de tabela

### Produto Page (mobile)
- Imagens: `maxWidth: "100%"`, `height: "auto"` — garantir que não transbordam
- Seções de texto longas: verificar padding adequado em mobile

---

## Arquivos afetados

| Arquivo | Tipo |
|---|---|
| `src/lib/app-constants.js` | Modificar — `generateSlug`, `EMPTY_PRODUCT.slug`, `INIT_PROTOCOLS[0].slug` |
| `src/lib/app-services.js` | Modificar — funções Supabase Auth + favorites + `setPageMeta` |
| `src/components/PublicAuthModal.jsx` | Criar |
| `src/components/admin/AdminProtForm.jsx` | Modificar — campo slug |
| `src/App.jsx` | Modificar — auth state, header, favorites flow, routing, meta tags |

---

## Fora do escopo (melhorias futuras)
- Anotações pessoais por protocolo
- Histórico de sessões com clientes
- SSR / prerendering para SEO real no Google
- Recuperação de senha (Supabase oferece, mas requer configurar email template)
