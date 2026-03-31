/**
 * data-transformers.js - Transformações de dados reutilizáveis
 * 
 * Funções puras para normalizar e transformar dados, facilitando testes e reutilização
 */

/**
 * Valida se um URL do Notion é válido e retorna o ID
 * @param {string} url - URL do Notion
 * @returns {string|null} - ID da página ou null se inválido
 */
export const validateNotionUrl = (url) => {
  if (!url || !url.trim()) return null;
  
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/([a-f0-9]{32})/i);
  
  if (!match) return null;
  
  let pageId = match[1];
  pageId = `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
  return pageId;
};

/**
 * Extrai título legível da URL do Notion
 * @param {string} url - URL do Notion
 * @returns {string} - Título extraído
 */
export const extractTitleFromNotionUrl = (url) => {
  if (!url) return '';
  
  const cleanUrl = url.split('?')[0];
  const urlParts = cleanUrl.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  const pageId = validateNotionUrl(url);
  
  if (!pageId) return '';
  
  return lastPart
    .split('-' + pageId.replace(/-/g, ''))[0]
    .replace(/-/g, ' ')
    .trim();
};

/**
 * Cria um objeto de etapa com valores padrão
 * @param {Object} overrides - Valor sobrescrevendo padrões
 * @returns {Object} - Objeto de etapa
 */
export const createDefaultStep = (overrides = {}) => ({
  id: null,
  step: '',
  name: '',
  instruction: '',
  productId: null,
  time: '',
  repetition: '',
  phase: '',
  observation: '',
  ...overrides
});

/**
 * Cria um objeto de protocolo com estrutura padrão
 * @param {Object} overrides - Valores sobrescrevendo padrões
 * @returns {Object} - Objeto de protocolo
 */
export const createDefaultProtocol = (overrides = {}) => ({
  id: null,
  name: '',
  code: '',
  description: '',
  category: '',
  frequency: '',
  associations: '',
  youtubeUrl: '',
  concerns: [],
  steps: [],
  homeUse: { morning: [], night: [] },
  professionalKitId: '',
  homeKitId: '',
  badge: '',
  reviewStatus: 'needs_review',
  externalSourceId: null,
  published: false,
  _new: true,
  ...overrides
});

/**
 * Valida dados obrigatórios de um protocolo
 * @param {Object} protocol - Objeto de protocolo
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateProtocol = (protocol) => {
  const errors = [];
  
  if (!protocol.name?.trim()) {
    errors.push('Nome do protocolo é obrigatório');
  }
  
  if (!protocol.code?.trim()) {
    errors.push('Código do protocolo é obrigatório');
  }
  
  if (protocol.code && protocol.code.length < 3) {
    errors.push('Código deve ter no mínimo 3 caracteres');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Compara dois arrays/valores com fuzzy matching
 * @param {string} str1 - Primeiro valor
 * @param {string} str2 - Segundo valor
 * @returns {number} - Score de 0 a 1
 */
export const fuzzyMatch = (str1, str2) => {
  const normalize = (s) => 
    String(s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const tokens1 = normalize(str1).split(' ').filter(Boolean);
  const tokens2 = normalize(str2).split(' ').filter(Boolean);
  
  if (!tokens1.length || !tokens2.length) return 0;
  
  const set2 = new Set(tokens2);
  const matched = tokens1.filter(t => set2.has(t)).length;
  
  return matched / tokens1.length;
};

/**
 * Agrupa itens por uma propriedade
 * @param {Array} items - Array de itens
 * @param {string} key - Chave para agrupar
 * @returns {Object} - Objeto com grupos
 */
export const groupBy = (items, key) => {
  return items.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
};

/**
 * Pagina um array
 * @param {Array} items - Items para paginar
 * @param {number} page - Número da página (1-indexed)
 * @param {number} pageSize - Tamanho da página
 * @returns {Object} - { items, total, page, pageSize, totalPages }
 */
export const paginate = (items, page = 1, pageSize = 20) => {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  
  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
