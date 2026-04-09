# Redesign — Tela de Detalhe do Protocolo
**Data:** 2026-04-09  
**Status:** Implementado

---

## Objetivo

Redesenho visual da `ProtocolDetail` sem adicionar funcionalidades novas. As motivações são múltiplas: visual desatualizado, problemas no mobile, e inconsistência com o design da landing page.

---

## Mudanças

### 1. Layout geral
- `maxWidth` da área de conteúdo: `740px` → `860px`
- Padding lateral mais generoso no desktop

### 2. Top bar eliminada
- Remove o `div.rp-bkbar` separado no topo
- "← Voltar ao catálogo" vira link discreto acima do card de header
- Botões de ação (Copiar link, Compartilhar, PDF) migram para dentro do header card, alinhados à direita no mesmo nível do título

### 3. Header do protocolo
- Linha de ações (Copiar link / Compartilhar / PDF) no canto superior direito do card
- Em mobile: ações ficam numa linha abaixo do botão Voltar, antes do card
- Tags, título, descrição e meta permanecem

### 4. Steps — fase (phase) com mais hierarquia
- Quando a fase muda entre steps, insere um separador visual:
  - Linha horizontal + label da fase centralizado
  - Estilo: texto uppercase roxo com linhas laterais (decoração simétrica)
- O label individual de fase dentro de cada step é removido (redundante após o separador)
- Numeração dos steps mantida globalmente (1, 2, 3... independente de fase)

### 5. Imagem destaque
- Mantida no final (sem mudanças)

---

## Arquivos modificados

| Arquivo | Operação |
|---|---|
| `src/App.jsx` | Modificar — `ProtocolDetail` (linhas ~864–1211) |
