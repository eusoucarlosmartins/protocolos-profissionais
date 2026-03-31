import { useState } from 'react';
import { uid, isActive } from '../lib/app-services';

// ─── Normalização ────────────────────────────────────────────────────────────

const normalizeStr = (s) =>
  String(s || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Limpa Markdown e links de um segmento → texto puro
// [text](url) → text  |  [](url) → ''  |  **bold** → bold  |  ![img](url) → ''
const cleanSeg = (s) =>
  String(s || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1')
    .replace(/\*([^*]*)\*/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

// Extrai nomes de produtos de links Notion com texto: [Nome Produto](url) → 'Nome Produto'
// Links sem texto [](url) são ignorados
const extractProductNames = (rawSeg) => {
  const re = /\[([^\]]+)\]\([^)]*\)/g;
  const names = [];
  let m;
  while ((m = re.exec(rawSeg)) !== null) {
    const name = m[1].trim();
    if (name) names.push(name);
  }
  return names;
};

// ─── Correspondência fuzzy de produto ───────────────────────────────────────

const tryMatchProduct = (text, products) => {
  if (!text || !products?.length) return '';
  const tokens = new Set(normalizeStr(text).split(' ').filter(t => t.length > 2));
  if (!tokens.size) return '';

  let bestId    = '';
  let bestScore = 0;

  for (const p of products) {
    if (!isActive(p)) continue;
    const pTokens = [...new Set(normalizeStr(p.name.split('-')[0]).split(' ').filter(t => t.length > 2))];
    if (!pTokens.length) continue;
    const score = pTokens.filter(t => tokens.has(t)).length / pTokens.length;
    if (score >= 0.4 && score > bestScore) { bestScore = score; bestId = p.id; }
  }
  return bestId;
};

// ─── Divisão inteligente do texto bruto em segmentos ─────────────────────────
//
// Notion copiado pode vir como:
//   a) Múltiplas linhas (quebras \n)       → usar as linhas diretamente
//   b) Uma linha única com espaços duplos  → dividir por "  " e depois por "N. " interno
//
const splitIntoSegments = (rawText) => {
  // Remove imagens e normaliza quebras de linha
  const pre = rawText.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\r\n/g, '\n');

  // Tenta dividir por \n
  const byNewline = pre.split('\n').map(s => s.trim()).filter(Boolean);
  if (byNewline.length >= 4) return byNewline;

  // Formato linha única: divide por 2+ espaços
  const bySpace = pre.split(/[ \t]{2,}/).map(s => s.trim()).filter(Boolean);

  // Dentro de cada segmento, quebra se houver outra etapa embutida: "texto. 2. Próxima etapa"
  const result = [];
  for (const seg of bySpace) {
    // Separa no padrão: não-espaço → espaços → dígito + ponto + espaço
    const parts = seg.split(/(?<=\S)\s+(?=\d+\.\s)/);
    result.push(...parts.map(s => s.trim()).filter(Boolean));
  }

  return result;
};

// ─── Parser principal ────────────────────────────────────────────────────────

export const parseProtocolText = (rawText, products = []) => {
  const segments = splitIntoSegments(rawText);

  let pageTitle    = '';
  let category     = '';
  let frequency    = '';
  let associations = '';
  let description  = '';
  const steps      = [];
  const homeUse    = { morning: [], night: [] };
  const concerns   = [];

  let currentStep    = null;
  let parsingHomeUse = false;
  let homeSlot       = ''; // 'morning' | 'night'

  const CATEGORIES = new Set(['facial', 'corporal', 'capilar']);

  // Fecha a etapa em andamento, tentando vincular produto
  const flushStep = () => {
    if (!currentStep) return;
    if (!currentStep.productId && currentStep._productNames?.length) {
      for (const name of currentStep._productNames) {
        const id = tryMatchProduct(name, products);
        if (id) { currentStep.productId = id; break; }
      }
    }
    if (!currentStep.productId && currentStep.instruction) {
      currentStep.productId = tryMatchProduct(currentStep.instruction, products);
    }
    delete currentStep._productNames;
    steps.push(currentStep);
    currentStep = null;
  };

  for (const rawSeg of segments) {
    const cleaned = cleanSeg(rawSeg);
    const lower   = normalizeStr(cleaned);

    if (!cleaned) continue;

    // Ignora cabeçalhos genéricos da empresa
    if (['protocolo', 'extratos', 'da terra', 'cosmetologia', 'beleza'].includes(lower)) continue;

    // ── Início do Home Care ──────────────────────────────────────────────
    if (
      lower.includes('para continuar o tratamento') ||
      lower.includes('uso em casa') ||
      lower === 'home care' || lower === 'homecare'
    ) {
      flushStep();
      parsingHomeUse = true;
      continue;
    }

    // ── Dentro do Home Care ──────────────────────────────────────────────
    if (parsingHomeUse) {
      if (/\bmanha\b/.test(lower) && !cleaned.match(/^\d+[\.\)]/)) { homeSlot = 'morning'; continue; }
      if (/\bnoite\b/.test(lower) && !cleaned.match(/^\d+[\.\)]/)) { homeSlot = 'night';   continue; }

      const stepM = cleaned.match(/^\d+[\.\)]\s*(.+)$/);
      if (stepM && homeSlot) {
        const instruction = stepM[1].trim();
        const names       = extractProductNames(rawSeg);
        const productId   = tryMatchProduct(names[0] || instruction, products);
        homeUse[homeSlot].push({ id: uid(), productId, instruction });
        continue;
      }

      // Segmento de continuação: pode ser o nome do produto em link separado, ou texto
      if (homeSlot && cleaned.length > 2) {
        const arr = homeUse[homeSlot];
        if (arr.length) {
          const last = arr[arr.length - 1];
          // Tenta vincular produto ainda não vinculado
          if (!last.productId) {
            const names = extractProductNames(rawSeg);
            if (names.length) last.productId = tryMatchProduct(names[0], products) || '';
            else last.productId = tryMatchProduct(cleaned, products) || '';
          }
          // Só adiciona ao texto se for instrução real (não só nome de produto)
          if (!extractProductNames(rawSeg).length || cleaned.split(' ').length > 3) {
            last.instruction += ' ' + cleaned;
          }
        } else {
          const names = extractProductNames(rawSeg);
          homeUse[homeSlot].push({ id: uid(), productId: tryMatchProduct(names[0] || cleaned, products), instruction: cleaned });
        }
      }
      continue;
    }

    // ── Frequência ───────────────────────────────────────────────────────
    // Usa cleaned (mantém acentos e dois-pontos) para a regex
    if (cleaned.toLowerCase().includes('frequen') && cleaned.includes(':')) {
      const m = cleaned.match(/frequen[cç][ei]a\s*[:]\s*(.+?)(?:\s*💡|\s*Associa|$)/i);
      if (m) frequency = m[1].replace(/\.\s*$/, '').trim();
      const a = cleaned.match(/Associa[cç][oõ]es\s*[:]\s*(.+)/i);
      if (a) associations = a[1].replace(/\.\s*$/, '').trim();
      continue;
    }

    // ── Associações ──────────────────────────────────────────────────────
    if (cleaned.toLowerCase().includes('associa') && cleaned.includes(':')) {
      const m = cleaned.match(/Associa[cç][oõ]es\s*[:]\s*(.+)/i);
      if (m) associations = m[1].replace(/\.\s*$/, '').trim();
      continue;
    }

    // ── Categoria ────────────────────────────────────────────────────────
    if (!category && CATEGORIES.has(lower)) {
      category = lower;
      continue;
    }

    // ── Etapa numerada: "1. Higienização" ou "1. **Higienização**" ───────
    const stepM = cleaned.match(/^(\d+)[\.\)]\s*(.+)$/);
    if (stepM) {
      flushStep();
      const stepName = stepM[2].trim();
      currentStep = {
        id:            uid(),
        name:          stepName,
        phase:         stepName,
        instruction:   '',
        productId:     '',
        duration:      '',
        _productNames: extractProductNames(rawSeg),
      };
      continue;
    }

    // ── Título ───────────────────────────────────────────────────────────
    if (!pageTitle && !currentStep && cleaned.length > 3) {
      pageTitle = cleaned;
      continue;
    }

    // ── Descrição (antes das etapas) ─────────────────────────────────────
    if (!currentStep && pageTitle && cleaned.length > 10) {
      description += (description ? ' ' : '') + cleaned;
      continue;
    }

    // ── Instrução / continuação da etapa atual ────────────────────────────
    if (currentStep) {
      currentStep._productNames.push(...extractProductNames(rawSeg));
      currentStep.instruction += (currentStep.instruction ? '\n' : '') + cleaned;
    }
  }

  flushStep();

  return { pageTitle, category, description, frequency, associations, steps, homeUse, concerns };
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useNotionImporter = (products = []) => {
  const [notionUrl,        setNotionUrl]        = useState('');
  const [notionLoading,    setNotionLoading]    = useState(false);
  const [notionError,      setNotionError]      = useState('');
  const [showNotionImport, setShowNotionImport] = useState(false);

  const fetchNotionProtocol = async (onSuccess) => {
    const text = notionUrl.trim();
    if (!text) return;

    setNotionLoading(true);
    setNotionError('');

    try {
      const result = parseProtocolText(text, products);

      if (!result.pageTitle && result.steps.length === 0) {
        setNotionError(
          'Não foi possível extrair dados. Verifique se o texto contém título e etapas numeradas (1. Higienização, 2. Esfoliação…).'
        );
        return;
      }

      onSuccess(result);
      setShowNotionImport(false);
      setNotionUrl('');
    } catch {
      setNotionError('Erro inesperado ao processar o texto. Tente novamente.');
    } finally {
      setNotionLoading(false);
    }
  };

  return {
    notionUrl, setNotionUrl,
    notionLoading, notionError,
    showNotionImport, setShowNotionImport,
    fetchNotionProtocol,
  };
};
