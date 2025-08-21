import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  RotateCcw, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  FileText, 
  X, 
  Calendar,
  User,
  Shirt,
  Eye
} from 'lucide-react';
import { Button } from "../components/ui/button";
import SidePanel from "../components/ui/SidePanel";
import ClientSelectModal from "../components/ui/ClientSelectModal";
import ClothesModal from "../components/ui/ClothesModal";
import { formatDateTime, formatDateOnly } from "../utils/dateUtils.ts";
import { Order, CreateOrderDto, UpdateOrderDto, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../types/order";
import { Client } from "../types/client";
import { Clothes } from "../types/clothes";

interface OrdersProps {
  onNavigate?: (page: string, params?: any) => void;
}

export default function Orders({ onNavigate }: OrdersProps = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  
  // SidePanel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  // Client select modal state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Clothes modal state
  const [isClothesModalOpen, setIsClothesModalOpen] = useState(false);
  const [selectedOrderForClothes, setSelectedOrderForClothes] = useState<string | null>(null);
  
  // SidePanel tabs state
  const [activeTab, setActiveTab] = useState<'details' | 'clothes'>('details');
  const [orderClothes, setOrderClothes] = useState<Clothes[]>([]);
  
  // Temporary order state
  const [temporaryOrderId, setTemporaryOrderId] = useState<string | null>(null);
  const [temporaryClientId, setTemporaryClientId] = useState<string | null>(null);
  
  // Use refs to track temporary IDs for cleanup without causing re-renders
  const temporaryOrderIdRef = useRef<string | null>(null);
  const temporaryClientIdRef = useRef<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateOrderDto>({
    name: "",
    client_id: "",
    due_date: "",
    iva: 16, // Default IVA 16%
    discount: 0,
    status: "pending" as OrderStatus,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  // Separate useEffect for cleanup on unmount only (not on state changes)
  useEffect(() => {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      if (temporaryOrderId || temporaryClientId) {
        // Note: Due to browser limitations, we can't await async operations in beforeunload
        // So we'll try to do cleanup but it might not complete
        cleanupTemporaryData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // No dependencies - only runs on mount/unmount

  // Cleanup only on component unmount - using refs to avoid dependency issues
  useEffect(() => {
    return () => {
      // Use ref values for cleanup
      const currentOrderId = temporaryOrderIdRef.current;
      const currentClientId = temporaryClientIdRef.current;
      
      if (currentOrderId || currentClientId) {
        // Call cleanup with ref values
        (async () => {
          if (currentOrderId) {
            try {
              await invoke<boolean>("delete_order", { id: currentOrderId });
              console.log("🧹 Order temporária deletada no unmount:", currentOrderId);
            } catch (error) {
              console.error("Erro ao deletar order temporária no unmount:", error);
            }
          }
          if (currentClientId) {
            try {
              await invoke<boolean>("delete_client", { id: currentClientId });
              console.log("🧹 Cliente temporário deletado no unmount:", currentClientId);
            } catch (error) {
              console.error("Erro ao deletar cliente temporário no unmount:", error);
            }
          }
        })();
      }
    };
  }, []); // No dependencies to avoid cleanup on every state change

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await invoke<Order[]>("list_orders");
      
      // Debug: log para ver formato das datas
      console.log("Pedidos recebidos do backend:", result);
      if (result.length > 0) {
        console.log("Exemplo de order:", result[0]);
        console.log("created_at tipo:", typeof result[0].created_at, "valor:", result[0].created_at);
        console.log("due_date tipo:", typeof result[0].due_date, "valor:", result[0].due_date);
      }
      
      setOrders(result);
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) {
      return;
    }

    try {
      const success = await invoke<boolean>("delete_order", { id: orderId });
      if (success) {
        setOrders(orders.filter(order => order.id !== orderId));
      } else {
        alert("Erro ao excluir pedido");
      }
    } catch (err) {
      console.error("Erro ao excluir pedido:", err);
      alert("Erro ao excluir pedido: " + err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "iva" || name === "discount") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOpenPanel = async (order?: Order) => {
    console.log("🔵 handleOpenPanel chamado", { order: order ? "existente" : "novo", orderId: order?.id });
    
    if (order) {
      console.log("🔵 Editando order existente:", order.id);
      setEditingOrder(order);
      setFormData({
        name: order.name,
        client_id: order.client_id,
        due_date: order.due_date,
        iva: order.iva,
        discount: order.discount,
        status: order.status,
      });
      setSelectedClient({
        id: order.client_id,
        name: order.client_name,
        contact: order.client_contact,
        nuit: "", // Will be fetched if needed
        category: "",
        requisition: "",
        observations: "",
        created_at: "",
        updated_at: "",
      });

      // Load clothes for this order
      loadOrderClothes(order.id);
    } else {
      console.log("🔵 Criando nova order - iniciando processo temporário...");
      // Create temporary order for new order
      const tempOrder = await createTemporaryOrder();
      if (tempOrder) {
        console.log("🔵 Order temporária criada, configurando estado:", tempOrder);
        setEditingOrder(tempOrder);
        setFormData({
          name: "",
          client_id: "",
          due_date: "",
          iva: 16,
          discount: 0,
          status: "pending" as OrderStatus,
        });
        setSelectedClient(null);
        setOrderClothes([]);
      } else {
        console.log("🔴 Falha ao criar order temporária, usando fallback");
        // Fallback if temporary order creation fails
        setEditingOrder(null);
        setFormData({
          name: "",
          client_id: "",
          due_date: "",
          iva: 16,
          discount: 0,
          status: "pending" as OrderStatus,
        });
        setSelectedClient(null);
        setOrderClothes([]);
      }
    }
    setActiveTab('details'); // Reset to details tab
    setIsPanelOpen(true);
    console.log("🔵 handleOpenPanel finalizado");
  };

  const handleClosePanel = async () => {
    // Delete temporary data if exists (order and client)
    if (temporaryOrderId || temporaryClientId) {
      await cleanupTemporaryData();
      await loadOrders(); // Refresh to remove temp order from list
    }
    
    setIsPanelOpen(false);
    setEditingOrder(null);
    setSelectedClient(null);
    setActiveTab('details');
    setOrderClothes([]);
    setFormData({
      name: "",
      client_id: "",
      due_date: "",
      iva: 16,
      discount: 0,
      status: "pending" as OrderStatus,
    });
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Por favor, digite um nome para o pedido");
      return;
    }

    if (!selectedClient) {
      alert("Por favor, selecione um cliente");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingOrder && !temporaryOrderId) {
        // Update existing order (not temporary)
        const updateDto: UpdateOrderDto = {
          name: formData.name,
          client_id: formData.client_id,
          due_date: formData.due_date,
          iva: formData.iva,
          discount: formData.discount,
          status: formData.status,
        };
        await invoke("update_order", { id: editingOrder.id, dto: updateDto });
        await loadOrders(); // Reload list
        handleClosePanel();
      } else if (temporaryOrderId) {
        // Update temporary order to make it permanent
        const updateDto: UpdateOrderDto = {
          name: formData.name,
          client_id: formData.client_id,
          due_date: formData.due_date,
          iva: formData.iva,
          discount: formData.discount,
          status: formData.status,
        };
        await invoke("update_order", { id: temporaryOrderId, dto: updateDto });
        
        // Clear temporary status - order and client are now permanent
        setTemporaryOrderId(null);
        setTemporaryClientId(null);
        temporaryOrderIdRef.current = null;
        temporaryClientIdRef.current = null;
        await loadOrders(); // Reload list
        
        // Switch to clothes tab to let user add clothes
        setActiveTab('clothes');
        // Don't close panel, let user add clothes
      } else {
        // Fallback: create new order (shouldn't happen with new flow)
        const newOrder = await invoke<Order>("create_order", { dto: formData });
        await loadOrders(); // Reload list
        
        // Set as editing order and switch to clothes tab
        setEditingOrder(newOrder);
        setActiveTab('clothes');
        // Don't close panel, let user add clothes
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido: " + error);
      
      // In case of error, don't cleanup if it was a temporary order being made permanent
      // Only cleanup if it was a completely new operation that failed
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_contact.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  const handleOpenClothesModal = async (orderId: string) => {
    console.log("🔵 handleOpenClothesModal chamado com orderId:", orderId);
    
    try {
      // Carregar todas as roupas do pedido para mostrar detalhes
      const clothes = await invoke<Clothes[]>("get_clothes_by_order_id", { orderId });
      
      console.log("👕 DETALHES COMPLETOS DAS ROUPAS DO PEDIDO:", {
        orderId: orderId,
        totalClothes: clothes.length,
        clothes: clothes.map(item => ({
          id: item.id,
          clothingType: item.clothing_type,
          customType: item.custom_type,
          unitPrice: item.unit_price,
          color: item.color,
          sizes: item.sizes,
          totalQuantity: item.total_quantity,
          services: item.services.map(service => ({
            id: service.id,
            serviceType: service.service_type,
            location: service.location,
            unitPrice: service.unit_price
          })),
          totalServicePrice: item.services.reduce((sum, s) => sum + s.unit_price, 0),
          pricePerItem: item.unit_price + item.services.reduce((sum, s) => sum + s.unit_price, 0),
          totalItemPrice: (item.unit_price + item.services.reduce((sum, s) => sum + s.unit_price, 0)) * item.total_quantity,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        orderTotal: clothes.reduce((sum, item) => 
          sum + ((item.unit_price + item.services.reduce((s, srv) => s + srv.unit_price, 0)) * item.total_quantity), 0
        )
      });
      
    } catch (error) {
      console.error("❌ Erro ao carregar roupas do pedido:", error);
    }
    
    setSelectedOrderForClothes(orderId);
    setIsClothesModalOpen(true);
    console.log("🔵 Modal state atualizado - selectedOrderForClothes:", orderId, "isOpen:", true);
  };

  const handleCloseClothesModal = () => {
    console.log("🔴 handleCloseClothesModal chamado");
    setIsClothesModalOpen(false);
    setSelectedOrderForClothes(null);
    console.log("🔴 Modal fechado - isOpen:", false, "selectedOrderForClothes:", null);
  };

  const handleClothesAdded = () => {
    console.log("🟢 handleClothesAdded chamado");
    // Recarregar os pedidos para atualizar os valores
    loadOrders();
    // Se estivermos no SidePanel, também recarregar as roupas
    if (editingOrder) {
      console.log("🟢 Recarregando roupas para editingOrder:", editingOrder.id);
      loadOrderClothes(editingOrder.id);
    }
    console.log("🟢 handleClothesAdded finalizado");
  };

  const createTemporaryOrder = async (): Promise<Order | null> => {
    console.log("🟨 Iniciando criação de order temporária...");
    
    try {
      // First, create a temporary client or use existing one
      let tempClientId = "";
      
      console.log("🟨 Tentando criar cliente temporário...");
      try {
        // Try to create a temporary client
        const clientDto = {
          name: "Cliente Temporário",
          nuit: "000000000",
          contact: "000000000",
          category: "Temporário",
          requisition: "",
          observations: "Cliente temporário - será removido se pedido for cancelado"
        };
        
        console.log("🟨 Dados do cliente temporário:", clientDto);
        
        const tempClient = await invoke<any>("create_client", { dto: clientDto });
        
        console.log("🟨 Cliente temporário criado com sucesso:", tempClient);
        tempClientId = tempClient.id;
        setTemporaryClientId(tempClient.id); // Store the temporary client ID
        temporaryClientIdRef.current = tempClient.id; // Store in ref for cleanup
        
        // Verify that the client actually exists in the database
        console.log("🟨 Verificando se o cliente realmente existe no banco...");
        try {
          const verifyClient = await invoke<any>("get_client_by_id", { id: tempClient.id });
          if (verifyClient) {
            console.log("✅ Cliente verificado no banco:", verifyClient);
          } else {
            console.log("❌ Cliente NÃO encontrado no banco após criação!");
          }
        } catch (verifyError) {
          console.error("❌ Erro ao verificar cliente no banco:", verifyError);
        }
      } catch (clientError) {
        console.error("❌ Erro ao criar cliente temporário:", clientError);
        // Try to get the first available client as fallback
        try {
          console.log("🟨 Tentando usar cliente existente como fallback...");
          const clients = await invoke<any[]>("list_clients");
          console.log("🟨 Clientes disponíveis:", clients);
          
          if (clients.length > 0) {
            tempClientId = clients[0].id;
            console.log("🟨 Usando cliente existente:", clients[0]);
            // Don't set temporaryClientId since we're using an existing client
          } else {
            throw new Error("Nenhum cliente disponível");
          }
        } catch (listError) {
          console.error("❌ Erro ao obter clientes:", listError);
          return null;
        }
      }

      // Criar order temporária com dados mínimos
      // Try different date formats to fix serialization issue
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const tempOrderData = {
        name: "Pedido Temporário",
        client_id: tempClientId,
        due_date: `${year}-${month}-${day}`, // YYYY-MM-DD format
        iva: 16.0, // Ensure it's a float
        discount: 0.0, // Ensure it's a float
        status: "pending",
      };

      console.log("🟨 Dados da order temporária:", tempOrderData);
      console.log("🟨 Tentando criar order temporária...");

      const tempOrder = await invoke<Order>("create_order", { dto: tempOrderData });
      
      console.log("🟨 Order temporária criada com sucesso:", tempOrder);
      setTemporaryOrderId(tempOrder.id);
      temporaryOrderIdRef.current = tempOrder.id; // Store in ref for cleanup
      
      // Wait a bit for database consistency (potential network/timing issue)
      console.log("🟨 Aguardando 500ms para consistência do banco...");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verify that the order actually exists in the database
      console.log("🟨 Verificando se a order realmente existe no banco...");
      try {
        const verifyOrder = await invoke<Order | null>("get_order_by_id", { id: tempOrder.id });
        if (verifyOrder) {
          console.log("✅ Order verificada no banco:", verifyOrder);
        } else {
          console.log("❌ Order NÃO encontrada no banco após criação!");
          
          // Try to fetch all orders to see if it appears
          console.log("🟨 Buscando todas as orders para debug...");
          const allOrders = await invoke<Order[]>("list_orders");
          const foundInList = allOrders.find(o => o.id === tempOrder.id);
          if (foundInList) {
            console.log("✅ Order encontrada na lista geral:", foundInList);
          } else {
            console.log("❌ Order NÃO encontrada nem na lista geral!");
          }
        }
      } catch (verifyError) {
        console.error("❌ Erro ao verificar order no banco:", verifyError);
      }
      
      return tempOrder;
    } catch (error) {
      console.error("❌ Erro ao criar order temporária:", error);
      return null;
    }
  };

  const deleteTemporaryOrder = async () => {
    if (temporaryOrderId) {
      try {
        await invoke<boolean>("delete_order", { id: temporaryOrderId });
        setTemporaryOrderId(null);
        temporaryOrderIdRef.current = null; // Clear ref
      } catch (error) {
        console.error("Erro ao deletar order temporária:", error);
      }
    }
  };

  const deleteTemporaryClient = async () => {
    if (temporaryClientId) {
      try {
        await invoke<boolean>("delete_client", { id: temporaryClientId });
        setTemporaryClientId(null);
        temporaryClientIdRef.current = null; // Clear ref
      } catch (error) {
        console.error("Erro ao deletar cliente temporário:", error);
      }
    }
  };

  const cleanupTemporaryData = async () => {
    console.log("🧹 Limpando dados temporários:", { temporaryOrderId, temporaryClientId });
    
    // Delete temporary order first (it references the client)
    await deleteTemporaryOrder();
    
    // Then delete temporary client
    await deleteTemporaryClient();
    
    console.log("🧹 Limpeza de dados temporários concluída");
  };

  const loadOrderClothes = async (orderId: string) => {
    try {
      const clothes = await invoke<Clothes[]>("get_clothes_by_order_id", { orderId });
      setOrderClothes(clothes);
    } catch (err) {
      console.error("Erro ao carregar roupas:", err);
      setOrderClothes([]);
    }
  };

  const handleDeleteClothes = async (clothesId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta roupa?")) {
      return;
    }

    try {
      const success = await invoke<boolean>("delete_clothes", { id: clothesId });
      if (success) {
        if (editingOrder) {
          loadOrderClothes(editingOrder.id);
        }
        loadOrders(); // Atualizar valores totais
      }
    } catch (err) {
      console.error("Erro ao excluir roupa:", err);
      alert("Erro ao excluir roupa: " + err);
    }
  };

  const handleViewOrder = (orderId: string) => {
    console.log("🔵 handleViewOrder chamado com orderId:", orderId);
    if (onNavigate) {
      onNavigate(`view-order`, { id: orderId }); // Changed from { orderId } to { id: orderId }
    } else {
      // Fallback usando hash navigation
      window.location.hash = `view-order?id=${orderId}`;
    }
  };



  const getStatusBadge = (status: OrderStatus) => {
    const colorClass = ORDER_STATUS_COLORS[status];
    const label = ORDER_STATUS_LABELS[status];
    
    return (
      <span className={`inline-block px-3 py-1 ${colorClass} text-primary-100 rounded-full text-sm font-semibold shadow-sm`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Gestão de Pedidos
        </h1>
        <p className="text-primary-300">
          Visualize, adicione e gerencie todos os pedidos dos clientes
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-60">
            <input
              type="text"
              placeholder="Buscar por cliente, ID do pedido ou contato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark w-full px-4 py-2 rounded-lg"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "all")}
              className="input-dark px-4 py-2 rounded-lg"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="payment_pending">Aguardando Pagamento</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <Button
              onClick={loadOrders}
              disabled={loading}
              variant="secondary"
              className="px-4 py-2 rounded-lg font-medium hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </span>
            </Button>
            <Button
              onClick={() => handleOpenPanel()}
              className="px-4 py-2 rounded-lg font-medium hover-lift"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 p-4 glass-effect rounded-lg">
        <p className="text-primary-100">
          <span className="font-bold text-secondary-400">
            {filteredOrders.length}
          </span> pedido(s) encontrado(s)
          {searchTerm && (
            <span className="text-primary-400">
              {" "}de {orders.length} total
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      {error && (
        <div className="mb-8 p-6 bg-red-900/80 border border-red-600 rounded-xl backdrop-blur-sm">
          <p className="text-red-100 text-lg mb-4 flex items-center gap-2">
            <X className="w-5 h-5" />
            Erro: {error}
          </p>
          <Button
            onClick={loadOrders}
            variant="destructive"
            className="px-6 py-3 rounded-lg font-medium hover-lift transition-all"
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-primary-300 text-lg">Carregando pedidos...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-effect p-12 text-center rounded-2xl">
          <FileText className="w-16 h-16 text-primary-400 mx-auto mb-6" />
          <p className="text-primary-300 mb-8 text-lg">
            {searchTerm || statusFilter !== "all"
              ? "Nenhum pedido encontrado com os critérios de busca." 
              : "Nenhum pedido cadastrado ainda."}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              onClick={() => handleOpenPanel()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Pedido
            </Button>
          )}
          {(searchTerm || statusFilter !== "all") && (
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-block px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-200"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="glass-effect p-5 rounded-xl hover-lift">
              <div className="space-y-4">
                {/* Header com status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-primary-100 mb-1">
                      {order.name}
                    </h3>
                    <p className="text-primary-400 text-sm flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {order.client_name} - {order.client_contact}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Valores */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-primary-400 text-sm">Valor Total:</span>
                    <span className="text-xl font-bold text-secondary-400">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary-400">Subtotal:</span>
                    <span className="text-primary-200">{formatCurrency(order.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary-400">IVA ({order.iva}%):</span>
                    <span className="text-primary-200">{formatCurrency(order.subtotal * order.iva / 100)}</span>
                  </div>
                  
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary-400">Desconto:</span>
                      <span className="text-green-400">-{formatCurrency(order.discount)}</span>
                    </div>
                  )}
                </div>

                {/* Data de vencimento */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <span className="text-primary-400">Vencimento:</span>
                  <span className="text-primary-200">{formatDateOnly(order.due_date)}</span>
                </div>

                {/* Timestamps */}
                <div className="border-t border-primary-600 pt-3 space-y-1 text-xs text-primary-400">
                  <div>
                    <span className="text-primary-500 font-medium">Criado:</span>{" "}
                    <span className="text-primary-300">{formatDateTime(order.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-primary-500 font-medium">ID:</span>{" "}
                    <span className="text-primary-300 font-mono">{order.id.slice(0, 8)}...</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleViewOrder(order.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-blue-600 hover:bg-blue-700"
                    title="Visualizar pedido"
                  >
                    <Eye className="w-4 h-4" />
                    Visualizar
                  </Button>
                  <Button
                    onClick={() => handleOpenPanel(order)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
                    title="Editar pedido"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("🟡 Botão de roupas clicado no card, order.id:", order.id);
                      handleOpenClothesModal(order.id);
                    }}
                    className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-green-600 hover:bg-green-700"
                    title="Adicionar roupas"
                  >
                    <Shirt className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => navigator.clipboard.writeText(order.id)}
                    className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
                    title="Copiar ID"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteOrder(order.id)}
                    variant="destructive"
                    className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
                    title="Excluir pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SidePanel para adicionar/editar pedido */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onCancel={handleClosePanel}
        onSave={activeTab === 'details' ? handleSubmit : undefined}
        title={editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
        isLoading={isSubmitting}
      >
        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-6 bg-primary-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:text-white hover:bg-primary-700'
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => setActiveTab('clothes')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clothes'
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:text-white hover:bg-primary-700'
            }`}
          >
            Roupas
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <div className="space-y-4">
            {/* Nome do pedido */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Nome do Pedido <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="Digite um nome para identificar o pedido"
            />
          </div>

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Cliente <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedClient ? selectedClient.name : ""}
                placeholder="Selecione um cliente"
                readOnly
                className="input-dark flex-1 px-4 py-2 rounded-lg cursor-pointer"
                onClick={() => setIsClientModalOpen(true)}
              />
              <Button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="px-4 py-2 rounded-lg font-medium hover-lift"
              >
                <User className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Data de vencimento */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Data de Vencimento <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
            />
          </div>

          {/* IVA */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              IVA (%) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="iva"
              value={formData.iva}
              onChange={handleInputChange}
              required
              min="0"
              max="100"
              step="0.01"
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="16"
            />
          </div>

          {/* Desconto */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Desconto (valor absoluto)
            </label>
            <input
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="0.00"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Status <span className="text-red-400">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
            >
              <option value="pending">Pendente</option>
              <option value="payment_pending">Aguardando Pagamento</option>
              <option value="paid">Pago</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Nota sobre cálculos */}
          <div className="p-3 bg-primary-700/50 rounded-lg border border-primary-600">
            <p className="text-primary-300 text-sm">
              <strong>Nota:</strong> Os valores de subtotal e total serão calculados automaticamente 
              com base nas roupas adicionadas.
            </p>
          </div>
          </div>
        ) : (
          /* Clothes Tab */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-primary-200">Roupas do Pedido</h3>
              <Button
                onClick={() => editingOrder && handleOpenClothesModal(editingOrder.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Adicionar Roupas
              </Button>
            </div>

            {/* Lista de roupas */}
            {orderClothes.length === 0 ? (
              <div className="text-center py-8 text-primary-400">
                <Shirt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma roupa adicionada ainda.</p>
                <p className="text-sm">Clique em "Adicionar Roupas" para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderClothes.map((clothes) => (
                  <div key={clothes.id} className="bg-primary-800 p-4 rounded-lg border border-primary-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-primary-100">
                          {clothes.clothing_type === 'custom' 
                            ? clothes.custom_type 
                            : Object.entries({
                                with_collar: 'Com Gola',
                                without_collar: 'Sem Gola', 
                                thick_cap: 'Boné Grosso',
                                simple_cap: 'Boné Simples',
                                reflectors: 'Refletores',
                                uniform: 'Fardamento'
                              }).find(([key]) => key === clothes.clothing_type)?.[1] || clothes.clothing_type
                          }
                        </h4>
                        <p className="text-sm text-primary-300">Cor: {clothes.color}</p>
                      </div>
                      <Button
                        onClick={() => handleDeleteClothes(clothes.id)}
                        variant="destructive"
                        size="sm"
                        className="opacity-70 hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Tamanhos */}
                    <div className="mb-3">
                      <p className="text-sm text-primary-400 mb-1">Tamanhos:</p>
                      <div className="flex gap-2 text-sm">
                        {Object.entries(clothes.sizes).map(([size, qty]) => 
                          qty > 0 && (
                            <span key={size} className="bg-primary-700 px-2 py-1 rounded text-primary-200">
                              {size}: {qty}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-sm text-primary-300 mt-1">Total: {clothes.total_quantity} peças</p>
                    </div>

                    {/* Serviços */}
                    {clothes.services.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-primary-400 mb-1">Serviços:</p>
                        <div className="space-y-1">
                          {clothes.services.map((service) => (
                            <div key={service.id} className="text-sm text-primary-300 bg-primary-700 px-2 py-1 rounded">
                              {Object.entries({
                                stamping: 'Estampagem',
                                embroidery: 'Bordado',
                                transfer: 'Transfer'
                              }).find(([key]) => key === service.service_type)?.[1]} - {' '}
                              {Object.entries({
                                front_right: 'Frente Direita',
                                front_left: 'Frente Esquerda',
                                back: 'Atrás',
                                sleeve_left: 'Manga Esquerda',
                                sleeve_right: 'Manga Direita'
                              }).find(([key]) => key === service.location)?.[1]} - {' '}
                              {service.unit_price.toFixed(2)} MT
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preços */}
                    <div className="text-sm">
                      <div className="flex justify-between text-primary-300">
                        <span>Preço base: {clothes.unit_price.toFixed(2)} MT</span>
                        <span>Serviços: {clothes.services.reduce((sum, s) => sum + s.unit_price, 0).toFixed(2)} MT</span>
                      </div>
                      <div className="flex justify-between font-medium text-primary-100 mt-1 pt-1 border-t border-primary-600">
                        <span>Total:</span>
                        <span>{((clothes.unit_price + clothes.services.reduce((sum, s) => sum + s.unit_price, 0)) * clothes.total_quantity).toFixed(2)} MT</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Resumo total */}
                <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-200">Total de Roupas:</span>
                    <span className="text-xl font-bold text-green-400">
                      {orderClothes.reduce((sum, clothes) => 
                        sum + ((clothes.unit_price + clothes.services.reduce((s, srv) => s + srv.unit_price, 0)) * clothes.total_quantity), 0
                      ).toFixed(2)} MT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </SidePanel>

      {/* Modal de seleção de cliente */}
      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSelect={handleClientSelect}
        selectedClientId={selectedClient?.id}
      />

      {/* Modal de roupas */}
      {(() => {
        console.log("🟣 Verificando renderização do modal:", {
          selectedOrderForClothes,
          isClothesModalOpen,
          shouldRender: !!selectedOrderForClothes
        });
        return selectedOrderForClothes && (
          <ClothesModal
            isOpen={isClothesModalOpen}
            onClose={handleCloseClothesModal}
            orderId={selectedOrderForClothes}
            onClothesAdded={handleClothesAdded}
          />
        );
      })()}
    </div>
  );
}
