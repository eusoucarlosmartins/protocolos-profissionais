import { useState } from 'react';
import { uid, isActive } from '../lib/app-services';

// ─── Utilitários de normalização ────────────────────────────────────────────

const normalizeStr = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Remove formatação Markdown do Notion: **bold**, *italic*, `code`
const stripMarkdown = (line) =>
  String(line || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .trim();

// Extrai nomes dentro de colchetes: [Nome do Produto] ou links [Nome](url)
const extractBracketedNames = (line) => {
  const re = /\[([^\]]+)\](?:\([^)]*\))?/g;
  const names = [];
  let m;
  while ((m = re.exec(line)) !== null) names.push(m[1].trim());
  return names;
};

// ─── Correspondência fuzzy de produto ───────────────────────────────────────

const tryMatchProduct = (text, products) => {
  if (!text || !products?.length) return '';
  const tokens = new Set(normalizeStr(text).split(' ').filter(t => t.length > 2));
  if (!tokens.size) return '';

  let best = null;
  let bestScore = 0;

  for (const p of products) {
    if (!isActive(p)) continue;
    // Usa só a parte antes do primeiro hífen para evitar ruído de variações
    const pNorm = normalizeStr(p.name.split('-')[0]);
    const pTokens = [...new Set(pNorm.split(' ').filter(t => t.length > 2))];
    if (!pTokens.length) continue;

    const hits = pTokens.filter(t => tokens.has(t)).length;
    const score = hits / pTokens.length;
    if (score >= 0.4 && score > bestScore) {
      bestScore = score;
      best = p.id;
    }
  }
  return best || '';
};

// ─── Parser principal ────────────────────────────────────────────────────────

export const parseProtocolText = (rawText, products = []) => {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

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

  const flushStep = () => {
    if (!currentStep) return;
    // 1ª tentativa: produtos em colchetes da etapa
    if (!currentStep.productId && currentStep._bracketedNames?.length) {
      for (const name of currentStep._bracketedNames) {
        const id = tryMatchProduct(name, products);
        if (id) { currentStep.productId = id; break; }
      }
    }
    // 2ª tentativa: busca fuzzy na instrução completa
    if (!currentStep.productId && currentStep.instruction) {
      currentStep.productId = tryMatchProduct(currentStep.instruction, products);
    }
    delete currentStep._bracketedNames;
    steps.push(currentStep);
    currentStep = null;
  };

  for (const raw of lines) {
    const line  = stripMarkdown(raw);
    const lower = normalizeStr(line);

    // Ignora marcadores de página e cabeçalhos genéricos
    if (
      raw.includes('--- PAGE') ||
      ['protocolo', 'extratos', 'da terra', 'cosmetologia', 'beleza'].includes(lower)
    ) continue;

    // ── Início da seção Home Care ──────────────────────────────────────────
    if (
      lower.includes('para continuar o tratamento') ||
      lower.includes('uso em casa') ||
      lower === 'home care' ||
      lower === 'homecare'
    ) {
      flushStep();
      parsingHomeUse = true;
      continue;
    }

    // ── Dentro do Home Care ────────────────────────────────────────────────
    if (parsingHomeUse) {
      if (/\bmanha\b/.test(lower))  { homeSlot = 'morning'; continue; }
      if (/\bnoite\b/.test(lower))  { homeSlot = 'night';   continue; }

      const stepM = raw.match(/^\d+[\.\)]\s*(.+)$/);
      if (stepM && homeSlot) {
        const itemText     = stripMarkdown(stepM[1]);
        const bracketNames = extractBracketedNames(raw);
        const searchText   = bracketNames.length ? bracketNames[0] : itemText;
        homeUse[homeSlot].push({
          id: uid(),
          productId:   tryMatchProduct(searchText, products),
          instruction: itemText,
        });
        continue;
      }
      // Continuação de item anterior
      if (homeSlot && line.length > 3) {
        const arr = homeUse[homeSlot];
        if (arr.length) arr[arr.length - 1].instruction += ' ' + line;
        else homeUse[homeSlot].push({ id: uid(), productId: '', instruction: line });
      }
      continue;
    }

    // ── Frequência ─────────────────────────────────────────────────────────
    if (lower.includes('frequen') && lower.includes(':')) {
      const m = line.match(/frequen[cç][ei]a\s*[:\-]\s*(.+?)(?:\s*(?:associa[cç][oõ]es|$))/i);
      if (m) frequency = m[1].trim();
      const a = line.match(/associa[cç][oõ]es\s*[:\-]\s*(.+)/i);
      if (a) associations = a[1].trim();
      continue;
    }

    // ── Associações ─────────────────────────────────────────────────────────
    if (lower.includes('associa') && lower.includes(':')) {
      const m = line.match(/associa[cç][oõ]es\s*[:\-]\s*(.+)/i);
      if (m) associations = m[1].trim();
      continue;
    }

    // ── Categoria ──────────────────────────────────────────────────────────
    if (!category && CATEGORIES.has(lower)) {
      category = lower;
      continue;
    }

    // ── Etapa numerada: "1. Higienização" ─────────────────────────────────
    const stepM = raw.match(/^(\d+)[\.\)]\s*(.+)$/);
    if (stepM) {
      flushStep();
      const stepName     = stripMarkdown(stepM[2]);
      const bracketNames = extractBracketedNames(raw);
      currentStep = {
        id:             uid(),
        name:           stepName,
        phase:          stepName,
        instruction:    '',
        productId:      '',
        duration:       '',
        _bracketedNames: bracketNames,
      };
      continue;
    }

    // ── Título (primeira linha significativa, antes das etapas) ────────────
    if (!pageTitle && !currentStep && line.length > 3) {
      pageTitle = line;
      continue;
    }

    // ── Descrição (linhas soltas entre título e etapas) ─────────────────────
    if (!currentStep && pageTitle && line.length > 10) {
      description += (description ? ' ' : '') + line;
      continue;
    }

    // ── Instrução de uma etapa em andamento ─────────────────────────────────
    if (currentStep) {
      const bracketNames = extractBracketedNames(raw);
      currentStep._bracketedNames.push(...bracketNames);
      currentStep.instruction += (currentStep.instruction ? '\n' : '') + line;
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
          'Não foi possível extrair dados. Verifique se o texto contém etapas numeradas (1. Higienização, 2. Esfoliação…).'
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
