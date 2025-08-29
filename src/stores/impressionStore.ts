import { create } from 'zustand';
import { Impression, CreateImpression, UpdateImpression } from '../types/impression';
import { invoke } from '@tauri-apps/api/core';

interface ImpressionState {
  impressions: Impression[];
  loading: boolean;
  error: string | null;

  loadImpressions: (orderId: string) => Promise<void>;
  addImpression: (impression: CreateImpression) => Promise<Impression | null>;
  updateImpression: (id: string, data: UpdateImpression) => Promise<boolean>;
  deleteImpression: (id: string) => Promise<boolean>;
  getOrderImpressions: (orderId: string) => Impression[];

  isModalOpen: boolean;
  selectedOrderId: string | null;
  openModal: (orderId: string) => void;
  closeModal: () => void;
}

export const useImpressionStore = create<ImpressionState>((set, get) => ({
  impressions: [],
  loading: false,
  error: null,
  isModalOpen: false,
  selectedOrderId: null,

  loadImpressions: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const impressions = await invoke<Impression[]>('get_impressions_by_order_id', { orderId });
      set({ impressions, loading: false });
    } catch (error) {
      console.error('Erro ao carregar impressões:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar impressões', 
        loading: false 
      });
    }
  },

  addImpression: async (impression: CreateImpression) => {
    set({ loading: true, error: null });
    try {
      // Converter para o formato esperado pelo backend
      const backendData = {
        order_id: impression.order_id,
        name: impression.name,
        size: impression.size,
        material: impression.material,
        description: impression.description,
        price: impression.price
      };

      const newImpression = await invoke<Impression>('create_impression', { dto: backendData });
      
      // Adicionar à lista local
      const currentImpressions = get().impressions;
      set({ 
        impressions: [...currentImpressions, newImpression], 
        loading: false 
      });
      
      return newImpression;
    } catch (error) {
      console.error('Erro ao criar impressão:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar impressão', 
        loading: false 
      });
      return null;
    }
  },

  updateImpression: async (id: string, data: UpdateImpression) => {
    set({ loading: true, error: null });
    try {
      // Converter para o formato esperado pelo backend
      const backendData = {
        name: data.name || '',
        size: data.size || '',
        material: data.material || 'vinyl_white',
        description: data.description || '',
        price: data.price || 0
      };

      const updatedImpression = await invoke<Impression | null>('update_impression', { 
        id, 
        dto: backendData 
      });
      
      if (updatedImpression) {
        // Atualizar na lista local
        const currentImpressions = get().impressions;
        const updatedImpressions = currentImpressions.map(imp => 
          imp.id === id ? updatedImpression : imp
        );
        set({ impressions: updatedImpressions, loading: false });
        return true;
      }
      
      set({ loading: false });
      return false;
    } catch (error) {
      console.error('Erro ao atualizar impressão:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar impressão', 
        loading: false 
      });
      return false;
    }
  },

  deleteImpression: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const success = await invoke<boolean>('delete_impression', { id });
      
      if (success) {
        // Remover da lista local
        const currentImpressions = get().impressions;
        const filteredImpressions = currentImpressions.filter(imp => imp.id !== id);
        set({ impressions: filteredImpressions, loading: false });
        return true;
      }
      
      set({ loading: false });
      return false;
    } catch (error) {
      console.error('Erro ao deletar impressão:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao deletar impressão', 
        loading: false 
      });
      return false;
    }
  },

  getOrderImpressions: (orderId: string) => {
    return get().impressions.filter(imp => imp.order_id === orderId);
  },

  openModal: (orderId: string) => {
    set({ isModalOpen: true, selectedOrderId: orderId });
  },

  closeModal: () => {
    set({ isModalOpen: false, selectedOrderId: null });
  }
}));

// Hooks para facilitar o uso
export const useImpressions = () => useImpressionStore(state => state.impressions);
export const useImpressionsLoading = () => useImpressionStore(state => state.loading);
export const useImpressionsError = () => useImpressionStore(state => state.error);
export const useIsImpressionModalOpen = () => useImpressionStore(state => state.isModalOpen);
export const useSelectedOrderForImpression = () => useImpressionStore(state => state.selectedOrderId);
