import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
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

export interface OrderStore extends OrderData, OrderUI, OrderClothes {
  // ===== ACTIONS DE DADOS =====
  loadOrders: () => Promise<void>;
  createOrder: (orderData: CreateOrderDto) => Promise<Order | null>;
  updateOrder: (id: string, updates: UpdateOrderDto) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  payOrderDebt: (id: string, paymentAmount: number) => Promise<boolean>;
  updateOrderStatus: (id: string, newStatus: OrderStatus) => Promise<boolean>;
  
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

      // ===== ACTIONS DE DADOS =====
      loadOrders: async () => {
        console.log("🟠 Store.loadOrders iniciado");
        set({ loading: true, error: '' });
        try {
          const orders = await invoke<Order[]>('list_orders');
          console.log("🟠 Orders carregados via Tauri:", orders.length, "orders");
          set({ orders, loading: false });
          console.log("🟠 Store.loadOrders finalizado com sucesso");
        } catch (error) {
          console.error('🟠 Erro ao carregar orders:', error);
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

      payOrderDebt: async (id: string, paymentAmount: number) => {
        set({ error: '' });
        try {
          await invoke('pay_order_debt', { id, paymentAmount });
          // Atualizar o debt da order no estado local
          set(state => ({
            orders: state.orders.map(order => {
              if (order.id === id) {
                const newDebt = Math.max(0, order.debt - paymentAmount);
                return { ...order, debt: newDebt };
              }
              return order;
            })
          }));
          
          return true;
        } catch (error) {
          console.error('Erro ao pagar dívida:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao pagar dívida'
          });
          return false;
        }
      },

      updateOrderStatus: async (id: string, newStatus: OrderStatus) => {
        set({ error: '' });
        try {
          const updatedOrder = await invoke<Order>('update_order', { 
            id, 
            dto: { status: newStatus } 
          });
          set(state => ({
            orders: state.orders.map(order => 
              order.id === id ? updatedOrder : order
            )
          }));
          return true;
        } catch (error) {
          console.error('Erro ao atualizar status da order:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar status da order'
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
        selectedClient: client
      }),
      
      openClothesModal: (orderId: string) => {
        console.log("🟠 Store.openClothesModal chamado com orderId:", orderId);
        console.log("🟠 Estado anterior:", { 
          isClothesModalOpen: get().isClothesModalOpen, 
          selectedOrderForClothes: get().selectedOrderForClothes 
        });
        set({ 
          isClothesModalOpen: true,
          selectedOrderForClothes: orderId
        });
        console.log("🟠 Estado após set:", { 
          isClothesModalOpen: get().isClothesModalOpen, 
          selectedOrderForClothes: get().selectedOrderForClothes 
        });
        console.log("🟠 Store.openClothesModal - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
      },
      
      closeClothesModal: () => {
        console.log("🟠 Store.closeClothesModal chamado");
        console.log("🟠 Estado anterior:", { 
          isClothesModalOpen: get().isClothesModalOpen, 
          selectedOrderForClothes: get().selectedOrderForClothes 
        });
        set({ 
          isClothesModalOpen: false,
          selectedOrderForClothes: null
        });
        console.log("🟠 Estado após set:", { 
          isClothesModalOpen: get().isClothesModalOpen, 
          selectedOrderForClothes: get().selectedOrderForClothes 
        });
      },
      
      setActiveTab: (tab: 'details' | 'clothes') => set({ activeTab: tab }),

      // ===== ACTIONS DE CLOTHES =====
      loadOrderClothes: async (orderId: string) => {
        console.log("🟠 Store.loadOrderClothes iniciado para orderId:", orderId);
        set(state => ({
          loadingClothes: { ...state.loadingClothes, [orderId]: true },
          clothesError: ''
        }));
        
        try {
          const clothes = await invoke<Clothes[]>('get_clothes_by_order_id', { order_id: orderId });
          console.log("🟠 Clothes carregados via Tauri para order", orderId, ":", clothes.length, "clothes");
          
          set(state => {
            console.log("🟠 Estado anterior do store para clothes:", {
              orderClothesKeys: Object.keys(state.orderClothes),
              currentOrderClothes: state.orderClothes[orderId]?.length || 0
            });
            
            const newState = {
              orderClothes: { ...state.orderClothes, [orderId]: clothes },
              loadingClothes: { ...state.loadingClothes, [orderId]: false }
            };
            
            console.log("🟠 Novo estado do store para clothes:", {
              orderClothesKeys: Object.keys(newState.orderClothes),
              newOrderClothes: newState.orderClothes[orderId]?.length || 0
            });
            
            return newState;
          });
          
          console.log("🟠 Store.loadOrderClothes finalizado com sucesso para orderId:", orderId);
        } catch (error) {
          console.error("🟠 Erro ao carregar clothes da order:", error);
          set(state => ({
            clothesError: error instanceof Error ? error.message : 'Erro ao carregar clothes',
            loadingClothes: { ...state.loadingClothes, [orderId]: false }
          }));
        }
      },

      addClothesToOrder: async (orderId: string, clothesData: any) => {
        console.log("🟠 Store.addClothesToOrder iniciado para orderId:", orderId);
        console.log("🟠 Dados do produto:", clothesData);
        try {
          const newClothes = await invoke<Clothes>('create_clothes', { dto: clothesData });
          console.log("🟠 Produto criado via Tauri:", newClothes);
          
          set(state => {
            console.log("🟠 Estado anterior do store:", {
              orderClothesKeys: Object.keys(state.orderClothes),
              currentOrderClothes: state.orderClothes[orderId]?.length || 0
            });
            
            const newState = {
              orderClothes: {
                ...state.orderClothes,
                [orderId]: [...(state.orderClothes[orderId] || []), newClothes]
              }
            };
            
            console.log("🟠 Novo estado do store:", {
              orderClothesKeys: Object.keys(newState.orderClothes),
              newOrderClothes: newState.orderClothes[orderId]?.length || 0
            });
            
            return newState;
          });
          
          console.log("🟠 Store.addClothesToOrder finalizado com sucesso");
          return true;
        } catch (error) {
          console.error("🟠 Erro ao adicionar clothes à order:", error);
          set({ 
            clothesError: error instanceof Error ? error.message : 'Erro ao adicionar clothes'
          });
          return false;
        }
      },

      updateOrderClothes: async (orderId: string, clothesId: string, updates: any) => {
        try {
          const updatedClothes = await invoke<Clothes>('update_clothes', { 
            id: clothesId, 
            dto: updates 
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
          console.error("🟠 Erro ao atualizar clothes da order:", error);
          set({ 
            clothesError: error instanceof Error ? error.message : 'Erro ao atualizar clothes'
          });
          return false;
        }
      },

      deleteOrderClothes: async (orderId: string, clothesId: string) => {
        try {
          await invoke('delete_clothes', { id: clothesId });
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
          console.error("🟠 Erro ao deletar clothes da order:", error);
          set({ 
            clothesError: error instanceof Error ? error.message : 'Erro ao deletar clothes'
          });
          return false;
        }
      },

      // ===== COMPUTED/SELECTORS =====
      getFilteredOrders: () => {
        console.log("🟠 Store.getFilteredOrders executado");
        console.log("🟠 Store.getFilteredOrders - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
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
    })
  )
);

// ===== MELHORES PRÁTICAS ZUSTAND =====

// ✅ BEST PRACTICE: Atomic, Stable Selectors - Um hook por valor
// Evita object selectors que criam novos objetos a cada render

// === STATE HOOKS (Atomic) ===
export const useOrders = () => useOrderStore(state => state.orders);
export const useOrdersLoading = () => useOrderStore(state => state.loading);
export const useOrdersError = () => useOrderStore(state => state.error);
export const useLoadOrders = () => useOrderStore(state => state.loadOrders);

export const useSearchTerm = () => useOrderStore(state => state.searchTerm);
export const useStatusFilter = () => useOrderStore(state => state.statusFilter);
export const useIsPanelOpen = () => useOrderStore(state => state.isPanelOpen);
export const useIsSubmitting = () => useOrderStore(state => state.isSubmitting);
export const useEditingOrder = () => useOrderStore(state => state.editingOrder);

export const useIsClientModalOpen = () => useOrderStore(state => state.isClientModalOpen);
export const useSelectedClient = () => useOrderStore(state => state.selectedClient);

export const useIsClothesModalOpen = () => {
  const result = useOrderStore(state => state.isClothesModalOpen);
  console.log("🟠 Hook useIsClothesModalOpen chamado, resultado:", result);
  console.log("🟠 Hook useIsClothesModalOpen - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
  return result;
};

export const useSelectedOrderForClothes = () => {
  const result = useOrderStore(state => state.selectedOrderForClothes);
  console.log("🟠 Hook useSelectedOrderForClothes chamado, resultado:", result);
  return result;
};

export const useActiveTab = () => useOrderStore(state => state.activeTab);

export const useOrderClothes = () => useOrderStore(state => state.orderClothes);
export const useLoadingClothes = () => useOrderStore(state => state.loadingClothes);
export const useClothesError = () => useOrderStore(state => state.clothesError);

// ✅ BEST PRACTICE: Separate Actions from State
// Ações são estáveis e não mudam, então podem ser agrupadas
export const useOrderActions = () => useOrderStore(state => ({
  // Data actions
  loadOrders: state.loadOrders,
  createOrder: state.createOrder,
  updateOrder: state.updateOrder,
  deleteOrder: state.deleteOrder,
  payOrderDebt: state.payOrderDebt,
  updateOrderStatus: state.updateOrderStatus,
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
