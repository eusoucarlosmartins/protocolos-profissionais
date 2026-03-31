import { useState } from 'react';
import { uid } from '../lib/app-services';

/**
 * Hook para importar protocolos do Notion
 * Extrai título, descrição e etapas numeradas da URL
 */
export const useNotionImporter = () => {
  const [notionUrl, setNotionUrl] = useState('');
  const [notionLoading, setNotionLoading] = useState(false);
  const [notionError, setNotionError] = useState('');
  const [showNotionImport, setShowNotionImport] = useState(false);

  // Extrai ID de página da URL do Notion
  const extractPageIdFromNotionUrl = (url) => {
    const cleanUrl = url.split('?')[0]; // Remove parâmetros
    const match = cleanUrl.match(/([a-f0-9]{32})/i);
    if (match) {
      let pageId = match[1];
      // Formata com hífens: 09bfa8de-63a6-4b27-bd37-9d6b2a8b813f
      pageId = `${pageId.slice(0, 8)}-${pageId.slice(8, 12)}-${pageId.slice(12, 16)}-${pageId.slice(16, 20)}-${pageId.slice(20)}`;
      return pageId;
    }
    return null;
  };

  // Extrai título da URL
  const extractTitleFromUrl = (cleanUrl) => {
    const urlParts = cleanUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const pageId = extractPageIdFromNotionUrl(cleanUrl);
    
    if (pageId) {
      return lastPart
        .split('-' + pageId)[0]
        .replace(/-/g, ' ')
        .trim();
    }
    return '';
  };

  // Tenta buscar HTML da página e extrair etapas
  const fetchFromHtml = async (cleanUrl) => {
    try {
      const htmlResponse = await fetch(`https://www.notion.so/${cleanUrl.match(/([a-f0-9]{32})/i)[1].replace(/-/g, '')}`);
      if (!htmlResponse.ok) return null;
      
      const html = await htmlResponse.text();
      const steps = [];
      const stepMatches = html.matchAll(/<h[23][^>]*>(?:<[^>]*>)*(\d+)\.?\s*([^<]+)/gi);
      
      for (const match of stepMatches) {
        const stepNum = match[1];
        const stepTitle = match[2].trim();
        
        if (stepTitle && !steps.find(s => s.step === stepNum)) {
          const headingIndex = html.indexOf(match[0]);
          const nextContent = html.substring(headingIndex, headingIndex + 500);
          const descMatch = nextContent.match(/<p[^>]*>([^<]+)<\/p>/);
          
          steps.push({
            id: uid(),
            step: stepNum.toString(),
            name: stepTitle,
            instruction: descMatch ? descMatch[1].trim() : '',
            productId: null,
            time: '',
            repetition: '',
            phase: '',
            observation: ''
          });
        }
      }
      
      return steps.length > 0 ? steps : null;
    } catch (err) {
      return null; // Falha silenciosa
    }
  };

  // Tenta via API Splitbee (fallback)
  const fetchFromApi = async (pageId) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://notion-api.splitbee.io/v1/page/${pageId.replace(/-/g, '')}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) return null;
      
      const data = await response.json();
      const blocks = Object.values(data);
      const steps = [];
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        if (block.type === 'heading_2' || block.type === 'heading_3') {
          const headingText = block[block.type]?.rich_text?.[0]?.plain_text || '';
          const stepMatch = headingText.match(/^(\d+)\.\s*(.+)/);
          
          if (stepMatch) {
            const stepNum = parseInt(stepMatch[1]);
            const stepTitle = stepMatch[2].trim();
            
            let stepDescription = '';
            for (let j = i + 1; j < blocks.length; j++) {
              const nextBlock = blocks[j];
              if (nextBlock.type && nextBlock.type.startsWith('heading')) break;
              if (nextBlock.type === 'paragraph') {
                const para = nextBlock.paragraph?.rich_text?.[0]?.plain_text || '';
                if (para) stepDescription += (stepDescription ? ' ' : '') + para;
              }
            }
            
            steps.push({
              id: uid(),
              step: stepNum.toString(),
              name: stepTitle,
              instruction: stepDescription,
              productId: null,
              time: '',
              repetition: '',
              phase: '',
              observation: ''
            });
          }
        }
      }
      
      return steps.length > 0 ? steps : null;
    } catch (err) {
      return null;
    }
  };

  // Função principal que orquestra o fetch
  const fetchNotionProtocol = async (onSuccess) => {
    if (!notionUrl.trim()) {
      setNotionError('Cole uma URL do Notion válida');
      return;
    }
    
    setNotionLoading(true);
    setNotionError('');
    
    try {
      const cleanUrl = notionUrl.trim().split('?')[0];
      const pageId = extractPageIdFromNotionUrl(cleanUrl);
      
      if (!pageId) {
        setNotionError('URL inválida. Certifique-se de copiar o link completo do Notion.');
        setNotionLoading(false);
        return;
      }

      const pageTitle = extractTitleFromUrl(cleanUrl);
      let extractedSteps = null;

      // Estratégia 1: Tenta buscar HTML
      extractedSteps = await fetchFromHtml(cleanUrl);

      // Estratégia 2: Fallback para API
      if (!extractedSteps) {
        extractedSteps = await fetchFromApi(pageId);
      }

      // Callback com dados extraídos
      onSuccess({
        pageId,
        pageTitle,
        steps: extractedSteps || []
      });

      setNotionUrl('');
      setShowNotionImport(false);

    } catch (err) {
      setNotionError(`Erro: ${err?.message || 'desconhecido'}`);
      console.error('Notion import error:', err);
    }
    
    setNotionLoading(false);
  };

  return {
    // Estado
    notionUrl,
    notionLoading,
    notionError,
    showNotionImport,
    
    // Setters
    setNotionUrl,
    setNotionLoading,
    setNotionError,
    setShowNotionImport,
    
    // Métodos
    fetchNotionProtocol,
    extractPageIdFromNotionUrl
  };
};
