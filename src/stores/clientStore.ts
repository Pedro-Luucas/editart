import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { Client, CreateClientDto, UpdateClientDto } from '../types/client';

// ===== TIPOS DO STORE =====
export interface ClientData {
  clients: Client[];
  loading: boolean;
  error: string;
}

export interface ClientUI {
  searchTerm: string;
  isSubmitting: boolean;
}

export interface ClientStore extends ClientData, ClientUI {
  // ===== ACTIONS DE DADOS =====
  loadClients: () => Promise<void>;
  createClient: (clientData: CreateClientDto) => Promise<Client | null>;
  updateClient: (id: string, updates: UpdateClientDto) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  updateClientDebt: (clientId: string) => Promise<boolean>;
  
  // ===== ACTIONS DE UI =====
  setSearchTerm: (term: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  
  // ===== COMPUTED/SELECTORS =====
  getFilteredClients: () => Client[];
  getClientById: (id: string) => Client | undefined;
}

// ===== ESTADO INICIAL =====
const initialFormData: CreateClientDto = {
  name: '',
  nuit: '',
  contact: '',
  category: '',
  observations: '',
};

// ===== CRIAÇÃO DO STORE =====
// ✅ BEST PRACTICE: Não exportar o store diretamente para evitar uso acidental
export const useClientStore = create<ClientStore>()(
  subscribeWithSelector(
    (set, get) => ({
      // ===== ESTADO INICIAL =====
      // Data
      clients: [],
      loading: false,
      error: '',
      
      // UI
      searchTerm: '',
      isSubmitting: false,

      // ===== ACTIONS DE DADOS =====
      loadClients: async () => {
        console.log("🟢 Store.loadClients iniciado");
        set({ loading: true, error: '' });
        try {
          const clients = await invoke<Client[]>('list_clients');
          console.log("🟢 Clients carregados via Tauri:", clients.length, "clients");
          set({ clients, loading: false });
          console.log("🟢 Store.loadClients finalizado com sucesso");
        } catch (error) {
          console.error('🟢 Erro ao carregar clients:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao carregar clients',
            loading: false 
          });
        }
      },

      createClient: async (clientData: CreateClientDto) => {
        set({ isSubmitting: true, error: '' });
        try {
          const newClient = await invoke<Client>('create_client', { dto: clientData });
          set(state => ({
            clients: [...state.clients, newClient],
            isSubmitting: false
          }));
          return newClient;
        } catch (error) {
          console.error('🟢 Erro ao criar client:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao criar client',
            isSubmitting: false 
          });
          return null;
        }
      },

      updateClient: async (id: string, updates: UpdateClientDto) => {
        set({ isSubmitting: true, error: '' });
        try {
          const updatedClient = await invoke<Client>('update_client', { id, dto: updates });
          set(state => ({
            clients: state.clients.map(client => 
              client.id === id ? updatedClient : client
            ),
            isSubmitting: false
          }));
          return true;
        } catch (error) {
          console.error('🟢 Erro ao atualizar client:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar client',
            isSubmitting: false 
          });
          return false;
        }
      },

      deleteClient: async (id: string) => {
        set({ error: '' });
        try {
          await invoke('delete_client', { id });
          set(state => ({
            clients: state.clients.filter(client => client.id !== id)
          }));
          return true;
        } catch (error) {
          console.error('🟢 Erro ao deletar client:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao deletar client'
          });
          return false;
        }
      },

      updateClientDebt: async (clientId: string) => {
        set({ error: '' });
        try {
          await invoke('update_client_debt', { clientId });
          // Reload clients to get updated debt values
          await get().loadClients();
          return true;
        } catch (error) {
          console.error('🟢 Erro ao atualizar débito do cliente:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar débito do cliente'
          });
          return false;
        }
      },

      // ===== ACTIONS DE UI =====
      setSearchTerm: (term: string) => set({ searchTerm: term }),
      
      setIsSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),

      // ===== COMPUTED/SELECTORS =====
      getFilteredClients: () => {
        console.log("🟢 Store.getFilteredClients executado");
        const { clients, searchTerm } = get();
        
        return clients.filter(client => {
          const matchesSearch = searchTerm === '' || 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.nuit.includes(searchTerm) ||
            client.contact.includes(searchTerm);
          
          return matchesSearch;
        });
      },

      getClientById: (id: string) => {
        return get().clients.find(client => client.id === id);
      },
    })
  )
);

// ===== MELHORES PRÁTICAS ZUSTAND =====

// ✅ BEST PRACTICE: Atomic, Stable Selectors - Um hook por valor
// Evita object selectors que criam novos objetos a cada render

// === STATE HOOKS (Atomic) ===
export const useClients = () => useClientStore(state => state.clients);
export const useClientsLoading = () => useClientStore(state => state.loading);
export const useClientsError = () => useClientStore(state => state.error);

export const useSearchTerm = () => useClientStore(state => state.searchTerm);
export const useIsSubmitting = () => useClientStore(state => state.isSubmitting);

// === ACTION HOOKS (Atomic) ===
export const useLoadClients = () => useClientStore(state => state.loadClients);
export const useCreateClient = () => useClientStore(state => state.createClient);
export const useUpdateClient = () => useClientStore(state => state.updateClient);
export const useDeleteClient = () => useClientStore(state => state.deleteClient);
export const useUpdateClientDebt = () => useClientStore(state => state.updateClientDebt);
export const useSetSearchTerm = () => useClientStore(state => state.setSearchTerm);
export const useSetIsSubmitting = () => useClientStore(state => state.setIsSubmitting);

// === COMPUTED HOOKS (Atomic) ===
export const useGetFilteredClients = () => useClientStore(state => state.getFilteredClients);
export const useGetClientById = () => useClientStore(state => state.getClientById);

// ===== HOOKS DE CONVENIÊNCIA (Para casos específicos) =====
// ✅ Para casos onde você realmente precisa de múltiplos valores relacionados

export const useClientData = () => useClientStore(state => ({
  clients: state.clients,
  loading: state.loading,
  error: state.error,
}));

export const useClientUI = () => useClientStore(state => ({
  searchTerm: state.searchTerm,
  isSubmitting: state.isSubmitting,
}));
