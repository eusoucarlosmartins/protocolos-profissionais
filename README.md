# Protocolos Profissionais

Plataforma web da Extratos da Terra para consulta, busca, compartilhamento e administracao de protocolos profissionais, produtos, kits e rotinas de uso em casa.

O projeto foi construido para uso operacional da equipe interna e para apoio comercial no atendimento de esteticistas, com foco em:

- consulta rapida de protocolos
- busca de produtos vinculados
- montagem e manutencao de protocolos no admin
- compartilhamento de protocolos, produtos e rotina de uso em casa via WhatsApp
- publicacao segura com Vercel + Supabase

## Visao Geral

O sistema possui duas frentes principais:

- area publica:
  - lista de protocolos
  - busca por produto
  - pagina individual de protocolo
  - pagina individual de produto
  - compartilhamento por WhatsApp
- area administrativa:
  - login protegido por API server-side
  - gestao de produtos
  - gestao de protocolos
  - categorias, indicacoes e fases
  - marketing e configuracoes da marca
  - usuarios e permissoes
  - alertas de integridade

## Stack

- React 18
- Vite 5
- Supabase
- Vercel
- API serverless em `api/`

## Estrutura do Projeto

```text
protocolos-profissionais/
├─ api/
│  ├─ admin/
│  │  └─ session.js
│  ├─ _lib/
│  │  └─ admin.js
│  └─ data.js
├─ public/
├─ src/
│  ├─ components/
│  │  └─ admin/
│  │     ├─ AdminAuth.jsx
│  │     ├─ AdminCatalog.jsx
│  │     ├─ AdminPanels.jsx
│  │     └─ AdminUsers.jsx
│  ├─ hooks/
│  │  └─ useAppShell.js
│  ├─ lib/
│  │  ├─ app-constants.js
│  │  └─ app-services.js
│  ├─ App.jsx
│  └─ main.jsx
├─ .env.example
├─ package.json
├─ vercel.json
└─ vite.config.js
```

## Como Rodar Localmente

### 1. Instalar dependencias

```bash
npm install
```

### 2. Criar o arquivo de ambiente

Use o `.env.example` como base:

```bash
cp .env.example .env.local
```

No Windows, voce pode simplesmente criar o arquivo manualmente.

### 3. Preencher as variaveis

Variaveis esperadas:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON`
- `SUPABASE_URL`
- `SUPABASE_ANON`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_SESSION_SECRET`
- `TEMP_ADMIN_PASSWORD`
- `TEMP_ADMIN_USER_ID`

Observacoes:

- `VITE_*` sao usadas no frontend
- `SUPABASE_SERVICE_ROLE_KEY` e usada apenas no backend
- `ADMIN_SESSION_SECRET` e obrigatoria para a sessao admin funcionar
- `TEMP_ADMIN_PASSWORD` e opcional, usada somente para reset temporario de acesso

### 4. Rodar o projeto

```bash
npm run dev
```

### 5. Validar build

```bash
npm run build
```

## Deploy

O deploy de producao e feito na Vercel.

Fluxo atual:

```bash
vercel deploy --prod
```

Ou via GitHub, se o repositorio estiver conectado ao projeto na Vercel.

### Arquivo de configuracao

O arquivo [`vercel.json`](./vercel.json) ja contem:

- `rewrites` para SPA
- cabecalhos de seguranca
- `Content-Security-Policy`
- `X-Frame-Options`
- `Permissions-Policy`
- `Referrer-Policy`

## Seguranca

As principais camadas atuais sao:

- sessao admin via API server-side em `api/admin/session.js`
- cookie de sessao `httpOnly`
- leitura e escrita de dados administrativos por `api/data.js`
- chave `service_role` usada apenas no backend
- protecoes de cabecalho configuradas na Vercel
- sanitizacao de HTML no frontend
- protecao de reset admin por variavel de ambiente temporaria

Importante:

- nao versionar `.env`, `.env.local`, `.vercel`, `node_modules` ou `dist`
- se alguma credencial ja tiver sido exposta em Git, rotacionar a chave
- remover `TEMP_ADMIN_PASSWORD` depois do primeiro uso de recuperacao

## Modelo de Dados

Hoje o projeto usa persistencia no Supabase por chaves dentro de `app_data`.

Chaves importantes:

- `edt_products_v10`
- `edt_protocols_v10`
- `edt_categories_v10`
- `edt_indications_v10`
- `edt_phases_v10`
- `edt_brand_v10`
- `edt_marketing_v10`
- `edt_users_v10`

### Produtos

Os produtos suportam multiplos tipos:

- `Produto de Protocolo`
- `Produto de Skincare`
- `Kit Profissional`
- `Kit Home Care`

Esses tipos controlam onde o item aparece no admin:

- `Produto de Protocolo`: etapas da cabine
- `Produto de Skincare`: uso em casa e busca de produtos
- `Kit Profissional`: kit final profissional do protocolo
- `Kit Home Care`: kit final de uso em casa

### Protocolos

Os protocolos podem conter:

- informacoes principais
- etapas em cabine
- rotina de uso em casa
- kit profissional
- kit home care
- imagem/link de destaque final

## Fluxos Importantes

### Login Admin

- `GET /api/admin/session`: valida sessao existente
- `POST /api/admin/session`: autentica usuario
- `PUT /api/admin/session`: troca obrigatoria de senha
- `DELETE /api/admin/session`: encerra sessao

### Dados

- `GET /api/data?key=...`: leitura
- `POST /api/data`: escrita
- `PUT /api/data`: atualizacao

Chaves publicas podem ser lidas sem sessao; chaves administrativas exigem login.

## Recuperacao de Acesso Admin

Se for necessario criar uma senha temporaria:

1. defina `TEMP_ADMIN_PASSWORD` na Vercel
2. opcionalmente defina `TEMP_ADMIN_USER_ID`
3. publique novamente
4. entre no admin com a senha temporaria
5. troque a senha no primeiro acesso
6. remova `TEMP_ADMIN_PASSWORD`

## Melhorias Ja Aplicadas

Entre as melhorias mais importantes desta fase:

- endurecimento da autenticacao admin
- API server-side para sessao e dados
- rewrites SPA na Vercel
- headers de seguranca
- limpeza de textos e normalizacao de conteudo
- modularizacao progressiva do `App.jsx`
- admin mais responsivo no mobile
- filtros mais consistentes
- compartilhamento via WhatsApp com link direto
- tipos multiplos de produto
- kits profissionais e home care nos protocolos
- rotina de uso em casa compartilhavel via WhatsApp

## Melhorias Recomendadas para Proximos Ciclos

- extrair mais blocos do `App.jsx`
- reduzir bundle com mais lazy load
- adicionar `ErrorBoundary`
- mover upload de imagens para API
- criar testes minimos para login, produtos e protocolos
- saneamento definitivo de dados antigos com encoding quebrado
- documentar melhor o schema real de `app_data`

## Comandos Uteis

### Desenvolvimento

```bash
npm run dev
```

### Build de producao

```bash
npm run build
```

### Preview local

```bash
npm run preview
```

### Deploy na Vercel

```bash
vercel deploy --prod
```

## Publicacao no GitHub

Antes de publicar, garantir que estes itens estao ignorados:

- `node_modules`
- `dist`
- `.vercel`
- `.env`
- `.env.local`

## Contatos no Projeto

Extratos da Terra:

- Site: [www.extratosdaterrapro.com.br](https://www.extratosdaterrapro.com.br)
- Revendedor: [Encontre um revendedor](https://www.extratosdaterrapro.com.br/pagina/encontre-um-revendedor/)
- WhatsApp: [(48) 99126-5853](https://wa.me/5548991265853)
- Fone: [(48) 3342-0087](tel:+554833420087)

Desenvolvimento:

- Carlos Martins
- Telefone: [(48) 99696-2910](tel:+5548996962910)
