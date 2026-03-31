/**
 * useFormState.js - Hook para gerenciar estado de formulários de forma eficiente
 * 
 * Reduz boilerplate de gerenciar múltiplos campos e validações
 */

import { useState, useCallback } from 'react';

/**
 * Cria um gerenciador de formulário com update eficiente
 * @param {Object} initialState - Estado inicial do formulário
 * @returns {Object} { form, updateField, updateFields, reset, isValid }
 */
export const useFormState = (initialState) => {
  const [form, setForm] = useState(initialState);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateFields = useCallback((updates) => {
    setForm(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const reset = useCallback(() => {
    setForm(initialState);
  }, [initialState]);

  return {
    form,
    setForm,
    updateField,
    updateFields,
    reset
  };
};

/**
 * Hook para gerenciar modal/drawer state
 * @param {string} initialView - View inicial (ex: 'dashboard', 'products')
 * @returns {Object} { view, setView, open, close }
 */
export const useModalState = (initialView = null) => {
  const [view, setView] = useState(initialView);

  const open = useCallback((newView) => {
    setView(newView);
  }, []);

  const close = useCallback(() => {
    setView(null);
  }, []);

  return {
    view,
    setView,
    isOpen: view !== null,
    open,
    close
  };
};
