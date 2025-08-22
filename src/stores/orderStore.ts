import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import { Order, CreateOrderDto, UpdateOrderDto, OrderStatus } from '../types/order';
import { Client } from '../types/client';
import { Clothes } from '../types/clothes';

// ===== TIPOS DO STORE =====
export interface OrderData {
  orders: Order[];
  loading: boolean;
  error: string;
}

export interface OrderUI {
  searchTerm: string;
  statusFilter: OrderStatus | 'all';
  isPanelOpen: boolean;
  isSubmitting: boolean;
  editingOrder: Order | null;
  isClientModalOpen: boolean;
  selectedClient: Client | null;
  isClothesModalOpen: boolean;
  selectedOrderForClothes: string | null;
  activeTab: 'details' | 'clothes';
}

export interface OrderClothes {
  orderClothes: Record<string, Clothes[]>; // key: orderId, value: clothes array
  loadingClothes: Record<string, boolean>;
  clothesError: string;
}

export interface OrderTemporary {
  temporaryOrderId: string | null;
  temporaryClientId: string | null;
  formData: CreateOrderDto;
}

export interface OrderStore extends OrderData, OrderUI, OrderClothes, OrderTemporary {
  // ===== ACTIONS DE DADOS =====
  loadOrders: () => Promise<void>;
  createOrder: (orderData: CreateOrderDto) => Promise<Order | null>;
  updateOrder: (id: string, updates: UpdateOrderDto) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // ===== ACTIONS DE UI =====
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: OrderStatus | 'all') => void;
  openPanel: (order?: Order) => void;
  closePanel: () => void;
  setIsSubmitting: (submitting: boolean) => void;
  openClientModal: () => void;
  closeClientModal: () => void;
  setSelectedClient: (client: Client | null) => void;
  openClothesModal: (orderId: string) => void;
  closeClothesModal: () => void;
  setActiveTab: (tab: 'details' | 'clothes') => void;
  
  // ===== ACTIONS DE CLOTHES =====
  loadOrderClothes: (orderId: string) => Promise<void>;
  addClothesToOrder: (orderId: string, clothesData: any) => Promise<boolean>;
  updateOrderClothes: (orderId: string, clothesId: string, updates: any) => Promise<boolean>;
  deleteOrderClothes: (orderId: string, clothesId: string) => Promise<boolean>;
  
  // ===== ACTIONS TEMPORÁRIAS =====
  setTemporaryOrderId: (id: string | null) => void;
  setTemporaryClientId: (id: string | null) => void;
  setFormData: (data: Partial<CreateOrderDto>) => void;
  resetFormData: () => void;
  cleanupTemporaryData: () => Promise<void>;
  
  // ===== COMPUTED/SELECTORS =====
  getFilteredOrders: () => Order[];
  getOrderById: (id: string) => Order | undefined;
  getOrderClothes: (orderId: string) => Clothes[];
}

// ===== ESTADO INICIAL =====
const initialFormData: CreateOrderDto = {
  name: '',
  client_id: '',
  due_date: '',
  iva: 16,
  discount: 0,
  status: 'order_received' as OrderStatus,
};

// ===== CRIAÇÃO DO STORE =====
// ✅ BEST PRACTICE: Não exportar o store diretamente para evitar uso acidental
export const useOrderStore = create<OrderStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ===== ESTADO INICIAL =====
        // Data
        orders: [],
        loading: false,
        error: '',
        
        // UI
        searchTerm: '',
        statusFilter: 'all',
        isPanelOpen: false,
        isSubmitting: false,
        editingOrder: null,
        isClientModalOpen: false,
        selectedClient: null,
        isClothesModalOpen: false,
        selectedOrderForClothes: null,
        activeTab: 'details',
        
        // Clothes
        orderClothes: {},
        loadingClothes: {},
        clothesError: '',
        
        // Temporary
        temporaryOrderId: null,
        temporaryClientId: null,
        formData: { ...initialFormData },

        // ===== ACTIONS DE DADOS =====
        loadOrders: async () => {
          set({ loading: true, error: '' });
          try {
            const orders = await invoke<Order[]>('list_orders');
            set({ orders, loading: false });
          } catch (error) {
            console.error('Erro ao carregar orders:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Erro ao carregar orders',
              loading: false 
            });
          }
        },

        createOrder: async (orderData: CreateOrderDto) => {
          set({ isSubmitting: true, error: '' });
          try {
            const newOrder = await invoke<Order>('create_order', { dto: orderData });
            set(state => ({
              orders: [...state.orders, newOrder],
              isSubmitting: false
            }));
            return newOrder;
          } catch (error) {
            console.error('Erro ao criar order:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Erro ao criar order',
              isSubmitting: false 
            });
            return null;
          }
        },

        updateOrder: async (id: string, updates: UpdateOrderDto) => {
          set({ isSubmitting: true, error: '' });
          try {
            const updatedOrder = await invoke<Order>('update_order', { id, dto: updates });
            set(state => ({
              orders: state.orders.map(order => 
                order.id === id ? updatedOrder : order
              ),
              isSubmitting: false
            }));
            return true;
          } catch (error) {
            console.error('Erro ao atualizar order:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Erro ao atualizar order',
              isSubmitting: false 
            });
            return false;
          }
        },

        deleteOrder: async (id: string) => {
          set({ error: '' });
          try {
            await invoke('delete_order', { id });
            set(state => ({
              orders: state.orders.filter(order => order.id !== id),
              // Remove clothes da order deletada
              orderClothes: Object.fromEntries(
                Object.entries(state.orderClothes).filter(([orderId]) => orderId !== id)
              ),
              loadingClothes: Object.fromEntries(
                Object.entries(state.loadingClothes).filter(([orderId]) => orderId !== id)
              )
            }));
            return true;
          } catch (error) {
            console.error('Erro ao deletar order:', error);
            set({ 
              error: error instanceof Error ? error.message : 'Erro ao deletar order'
            });
            return false;
          }
        },

        // ===== ACTIONS DE UI =====
        setSearchTerm: (term: string) => set({ searchTerm: term }),
        
        setStatusFilter: (status: OrderStatus | 'all') => set({ statusFilter: status }),
        
        openPanel: (order?: Order) => set({ 
          isPanelOpen: true, 
          editingOrder: order || null,
          activeTab: 'details'
        }),
        
        closePanel: () => set({ 
          isPanelOpen: false, 
          editingOrder: null,
          selectedClient: null,
          activeTab: 'details'
        }),
        
        setIsSubmitting: (submitting: boolean) => set({ isSubmitting: submitting }),
        
        openClientModal: () => set({ isClientModalOpen: true }),
        
        closeClientModal: () => set({ isClientModalOpen: false }),
        
        setSelectedClient: (client: Client | null) => set({ 
          selectedClient: client,
          formData: client ? { ...get().formData, client_id: client.id } : get().formData
        }),
        
        openClothesModal: (orderId: string) => set({ 
          isClothesModalOpen: true,
          selectedOrderForClothes: orderId
        }),
        
        closeClothesModal: () => set({ 
          isClothesModalOpen: false,
          selectedOrderForClothes: null
        }),
        
        setActiveTab: (tab: 'details' | 'clothes') => set({ activeTab: tab }),

        // ===== ACTIONS DE CLOTHES =====
        loadOrderClothes: async (orderId: string) => {
          set(state => ({
            loadingClothes: { ...state.loadingClothes, [orderId]: true },
            clothesError: ''
          }));
          
          try {
            const clothes = await invoke<Clothes[]>('get_order_clothes', { orderId });
            set(state => ({
              orderClothes: { ...state.orderClothes, [orderId]: clothes },
              loadingClothes: { ...state.loadingClothes, [orderId]: false }
            }));
          } catch (error) {
            console.error('Erro ao carregar clothes da order:', error);
            set(state => ({
              clothesError: error instanceof Error ? error.message : 'Erro ao carregar clothes',
              loadingClothes: { ...state.loadingClothes, [orderId]: false }
            }));
          }
        },

        addClothesToOrder: async (orderId: string, clothesData: any) => {
          try {
            const newClothes = await invoke<Clothes>('add_clothes_to_order', { orderId, clothesData });
            set(state => ({
              orderClothes: {
                ...state.orderClothes,
                [orderId]: [...(state.orderClothes[orderId] || []), newClothes]
              }
            }));
            return true;
          } catch (error) {
            console.error('Erro ao adicionar clothes à order:', error);
            set({ 
              clothesError: error instanceof Error ? error.message : 'Erro ao adicionar clothes'
            });
            return false;
          }
        },

        updateOrderClothes: async (orderId: string, clothesId: string, updates: any) => {
          try {
            const updatedClothes = await invoke<Clothes>('update_order_clothes', { 
              clothesId, 
              clothesData: updates 
            });
            set(state => ({
              orderClothes: {
                ...state.orderClothes,
                [orderId]: (state.orderClothes[orderId] || []).map(clothes =>
                  clothes.id === clothesId ? updatedClothes : clothes
                )
              }
            }));
            return true;
          } catch (error) {
            console.error('Erro ao atualizar clothes da order:', error);
            set({ 
              clothesError: error instanceof Error ? error.message : 'Erro ao atualizar clothes'
            });
            return false;
          }
        },

        deleteOrderClothes: async (orderId: string, clothesId: string) => {
          try {
            await invoke('delete_order_clothes', { clothesId });
            set(state => ({
              orderClothes: {
                ...state.orderClothes,
                [orderId]: (state.orderClothes[orderId] || []).filter(clothes => 
                  clothes.id !== clothesId
                )
              }
            }));
            return true;
          } catch (error) {
            console.error('Erro ao deletar clothes da order:', error);
            set({ 
              clothesError: error instanceof Error ? error.message : 'Erro ao deletar clothes'
            });
            return false;
          }
        },

        // ===== ACTIONS TEMPORÁRIAS =====
        setTemporaryOrderId: (id: string | null) => set({ temporaryOrderId: id }),
        
        setTemporaryClientId: (id: string | null) => set({ temporaryClientId: id }),
        
        setFormData: (data: Partial<CreateOrderDto>) => set(state => ({
          formData: { ...state.formData, ...data }
        })),
        
        resetFormData: () => set({ 
          formData: { ...initialFormData },
          selectedClient: null
        }),

        cleanupTemporaryData: async () => {
          const { temporaryOrderId, temporaryClientId } = get();
          
          try {
            if (temporaryOrderId) {
              await invoke('delete_order', { id: temporaryOrderId });
              set({ temporaryOrderId: null });
            }
            
            if (temporaryClientId) {
              await invoke('delete_client', { id: temporaryClientId });
              set({ temporaryClientId: null });
            }
          } catch (error) {
            console.error('Erro na limpeza de dados temporários:', error);
          }
        },

        // ===== COMPUTED/SELECTORS =====
        getFilteredOrders: () => {
          const { orders, searchTerm, statusFilter } = get();
          
          return orders.filter(order => {
            const matchesSearch = searchTerm === '' || 
              order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              order.client_name.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
            
            return matchesSearch && matchesStatus;
          });
        },

        getOrderById: (id: string) => {
          return get().orders.find(order => order.id === id);
        },

        getOrderClothes: (orderId: string) => {
          return get().orderClothes[orderId] || [];
        },
      }),
      {
        name: 'order-store',
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Persistir apenas estados relevantes
          searchTerm: state.searchTerm,
          statusFilter: state.statusFilter,
          activeTab: state.activeTab,
          formData: state.formData,
          // Não persistir: orders (sempre carregar fresh), loading states, errors, modais abertos
        }),
      }
    )
  )
);

// ===== MELHORES PRÁTICAS ZUSTAND =====

// ✅ BEST PRACTICE: Atomic, Stable Selectors - Um hook por valor
// Evita object selectors que criam novos objetos a cada render

// === STATE HOOKS (Atomic) ===
export const useOrders = () => useOrderStore(state => state.orders);
export const useOrdersLoading = () => useOrderStore(state => state.loading);
export const useOrdersError = () => useOrderStore(state => state.error);

export const useSearchTerm = () => useOrderStore(state => state.searchTerm);
export const useStatusFilter = () => useOrderStore(state => state.statusFilter);
export const useIsPanelOpen = () => useOrderStore(state => state.isPanelOpen);
export const useIsSubmitting = () => useOrderStore(state => state.isSubmitting);
export const useEditingOrder = () => useOrderStore(state => state.editingOrder);

export const useIsClientModalOpen = () => useOrderStore(state => state.isClientModalOpen);
export const useSelectedClient = () => useOrderStore(state => state.selectedClient);

export const useIsClothesModalOpen = () => useOrderStore(state => state.isClothesModalOpen);
export const useSelectedOrderForClothes = () => useOrderStore(state => state.selectedOrderForClothes);

export const useActiveTab = () => useOrderStore(state => state.activeTab);

export const useOrderClothes = () => useOrderStore(state => state.orderClothes);
export const useLoadingClothes = () => useOrderStore(state => state.loadingClothes);
export const useClothesError = () => useOrderStore(state => state.clothesError);

export const useTemporaryOrderId = () => useOrderStore(state => state.temporaryOrderId);
export const useTemporaryClientId = () => useOrderStore(state => state.temporaryClientId);
export const useFormData = () => useOrderStore(state => state.formData);

// ✅ BEST PRACTICE: Separate Actions from State
// Ações são estáveis e não mudam, então podem ser agrupadas
export const useOrderActions = () => useOrderStore(state => ({
  // Data actions
  loadOrders: state.loadOrders,
  createOrder: state.createOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  getFilteredOrders: state.getFilteredOrders,
  getOrderById: state.getOrderById,
  
  // UI actions
  setSearchTerm: state.setSearchTerm,
  setStatusFilter: state.setStatusFilter,
  openPanel: state.openPanel,
  closePanel: state.closePanel,
  setIsSubmitting: state.setIsSubmitting,
  openClientModal: state.openClientModal,
  closeClientModal: state.closeClientModal,
  setSelectedClient: state.setSelectedClient,
  openClothesModal: state.openClothesModal,
  closeClothesModal: state.closeClothesModal,
  setActiveTab: state.setActiveTab,
  
  // Clothes actions
  loadOrderClothes: state.loadOrderClothes,
  addClothesToOrder: state.addClothesToOrder,
  updateOrderClothes: state.updateOrderClothes,
  deleteOrderClothes: state.deleteOrderClothes,
  getOrderClothes: state.getOrderClothes,
  
  // Temporary actions
  setTemporaryOrderId: state.setTemporaryOrderId,
  setTemporaryClientId: state.setTemporaryClientId,
  setFormData: state.setFormData,
  resetFormData: state.resetFormData,
  cleanupTemporaryData: state.cleanupTemporaryData,
}));

// ===== HOOKS DE CONVENIÊNCIA (Para casos específicos) =====
// ✅ Para casos onde você realmente precisa de múltiplos valores relacionados

export const useOrderModalState = () => useOrderStore(state => ({
  isClothesModalOpen: state.isClothesModalOpen,
  selectedOrderForClothes: state.selectedOrderForClothes,
}));

export const useClientModalState = () => useOrderStore(state => ({
  isClientModalOpen: state.isClientModalOpen,
  selectedClient: state.selectedClient,
}));

export const usePanelState = () => useOrderStore(state => ({
  isPanelOpen: state.isPanelOpen,
  editingOrder: state.editingOrder,
  activeTab: state.activeTab,
}));

export const useSearchState = () => useOrderStore(state => ({
  searchTerm: state.searchTerm,
  statusFilter: state.statusFilter,
}));
