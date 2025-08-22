import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  RotateCcw, 
  Plus, 
  Trash2, 
  FileText, 
  X, 
  User,
  Shirt
} from 'lucide-react';
import { Button } from "../components/ui/button";
import SidePanel from "../components/ui/SidePanel";
import ClientSelectModal from "../components/ui/ClientSelectModal";
import ClothesModal from "../components/ui/ClothesModal";
import OrderCard from "../components/ui/OrderCard";

import { Order, OrderStatus } from "../types/order";
import { Client } from "../types/client";
import { Clothes } from "../types/clothes";

// Import orderStore hooks
import {
  useOrders,
  useOrdersLoading,
  useOrdersError,
  useSearchTerm,
  useStatusFilter,
  useIsPanelOpen,
  useIsSubmitting,
  useEditingOrder,
  useActiveTab,
  useIsClientModalOpen,
  useSelectedClient,
  useIsClothesModalOpen,
  useSelectedOrderForClothes,
  useTemporaryOrderId,
  useTemporaryClientId,
  useFormData
} from "../stores/orderStore";
import { useOrderStore } from "../stores/orderStore";

interface OrdersProps {
  onNavigate?: (page: string, params?: any) => void;
}

export default function Orders({ onNavigate }: OrdersProps = {}) {
  // Store state - migrated from local useState
  const orders = useOrders();
  const loading = useOrdersLoading();
  const error = useOrdersError();
  const searchTerm = useSearchTerm();
  const statusFilter = useStatusFilter();
  
  // SidePanel state - migrated from local useState
  const isPanelOpen = useIsPanelOpen();
  const isSubmitting = useIsSubmitting();
  const editingOrder = useEditingOrder();
  const activeTab = useActiveTab();
  
  // Client select modal state - migrated from local useState
  const isClientModalOpen = useIsClientModalOpen();
  const selectedClient = useSelectedClient();
  
  // Clothes modal state - migrated from local useState
  const isClothesModalOpen = useIsClothesModalOpen();
  const selectedOrderForClothes = useSelectedOrderForClothes();
  
  // Temporary order state - migrated from local useState
  const temporaryOrderId = useTemporaryOrderId();
  const temporaryClientId = useTemporaryClientId();
  const formData = useFormData();
  
  // Store actions - use individual actions to avoid re-render loops
  const loadOrders = useOrderStore(state => state.loadOrders);
  const deleteOrder = useOrderStore(state => state.deleteOrder);
  const updateOrder = useOrderStore(state => state.updateOrder);
  const createOrder = useOrderStore(state => state.createOrder);
  const getFilteredOrders = useOrderStore(state => state.getFilteredOrders);
  const getOrderClothes = useOrderStore(state => state.getOrderClothes);
  
  // UI actions
  const setSearchTerm = useOrderStore(state => state.setSearchTerm);
  const setStatusFilter = useOrderStore(state => state.setStatusFilter);
  const openPanel = useOrderStore(state => state.openPanel);
  const closePanel = useOrderStore(state => state.closePanel);
  const setIsSubmitting = useOrderStore(state => state.setIsSubmitting);
  const openClientModal = useOrderStore(state => state.openClientModal);
  const closeClientModal = useOrderStore(state => state.closeClientModal);
  const setSelectedClient = useOrderStore(state => state.setSelectedClient);
  const openClothesModal = useOrderStore(state => state.openClothesModal);
  const closeClothesModal = useOrderStore(state => state.closeClothesModal);
  const setActiveTab = useOrderStore(state => state.setActiveTab);
  
  // Clothes actions
  const loadOrderClothes = useOrderStore(state => state.loadOrderClothes);
  
  // Temporary actions
  const setTemporaryOrderId = useOrderStore(state => state.setTemporaryOrderId);
  const setTemporaryClientId = useOrderStore(state => state.setTemporaryClientId);
  const setFormData = useOrderStore(state => state.setFormData);
  const resetFormData = useOrderStore(state => state.resetFormData);
  const cleanupTemporaryData = useOrderStore(state => state.cleanupTemporaryData);
  
  // Keep a local state temporarily for sidebar display only
  const [orderClothes, setOrderClothes] = useState<Clothes[]>([]);

  useEffect(() => {
    loadOrders();
  }, []); // Remove actions dependency to prevent loop

  // Simplified cleanup on unmount - using store's cleanup method
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (temporaryOrderId || temporaryClientId) {
        cleanupTemporaryData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final cleanup on unmount
      if (temporaryOrderId || temporaryClientId) {
        cleanupTemporaryData();
      }
    };
  }, [temporaryOrderId, temporaryClientId]); // Remove actions dependency

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) {
      return;
    }

    const success = await deleteOrder(orderId);
    if (!success) {
      alert("Erro ao excluir pedido");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "iva" || name === "discount") {
      setFormData({ [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ [name]: value });
    }
  };

  const handleOpenPanel = async (order?: Order) => {
    console.log("🔵 handleOpenPanel chamado", { order: order ? "existente" : "novo", orderId: order?.id });
    
    if (order) {
      console.log("🔵 Editando order existente:", order.id);
      // Use store actions for editing existing order
      openPanel(order);
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
      loadOrderClothesLocal(order.id);
    } else {
      console.log("🔵 Criando nova order - iniciando processo temporário...");
      // Create temporary order for new order
      const tempOrder = await createTemporaryOrder();
      if (tempOrder) {
        console.log("🔵 Order temporária criada, configurando estado:", tempOrder);
        openPanel(tempOrder);
        resetFormData();
        setSelectedClient(null);
        setOrderClothes([]);
      } else {
        console.log("🔴 Falha ao criar order temporária, usando fallback");
        // Fallback if temporary order creation fails
        openPanel();
        resetFormData();
        setSelectedClient(null);
        setOrderClothes([]);
      }
    }
    console.log("🔵 handleOpenPanel finalizado");
  };

  const handleClosePanel = async () => {
    // Delete temporary data if exists (order and client)
    if (temporaryOrderId || temporaryClientId) {
      await cleanupTemporaryData();
      await loadOrders(); // Refresh to remove temp order from list
    }
    
    // Use store actions to close panel and reset state
    closePanel();
    resetFormData();
    setOrderClothes([]);
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
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
        const success = await updateOrder(editingOrder.id, formData);
        if (success) {
          handleClosePanel();
        } else {
          alert("Erro ao atualizar pedido");
        }
      } else if (temporaryOrderId) {
        // Update temporary order to make it permanent
        const success = await updateOrder(temporaryOrderId, formData);
        if (success) {
          // Clear temporary status - order and client are now permanent
          setTemporaryOrderId(null);
          setTemporaryClientId(null);
          
          // Switch to clothes tab to let user add clothes
          setActiveTab('clothes');
          // Don't close panel, let user add clothes
        } else {
          alert("Erro ao salvar pedido");
        }
      } else {
        // Fallback: create new order (shouldn't happen with new flow)
        const newOrder = await createOrder(formData);
        if (newOrder) {
          // Set as editing order and switch to clothes tab
          openPanel(newOrder);
          setActiveTab('clothes');
          // Don't close panel, let user add clothes
        } else {
          alert("Erro ao criar pedido");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = useMemo(() => getFilteredOrders(), [orders, searchTerm, statusFilter]);



  const handleOpenClothesModal = async (orderId: string) => {
    console.log("🔵 handleOpenClothesModal chamado com orderId:", orderId);
    openClothesModal(orderId);
  };

  const handleCloseClothesModal = () => {
    console.log("🔴 handleCloseClothesModal chamado");
    closeClothesModal();
  };

  const handleClothesAdded = () => {
    console.log("🟢 handleClothesAdded chamado");
    // Recarregar os pedidos para atualizar os valores
    loadOrders();
    // Se estivermos no SidePanel, também recarregar as roupas
    if (editingOrder) {
      console.log("🟢 Recarregando roupas para editingOrder:", editingOrder.id);
      loadOrderClothesLocal(editingOrder.id);
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
        
        const tempClient = await invoke<any>("create_client", { dto: clientDto });
        tempClientId = tempClient.id;
        setTemporaryClientId(tempClient.id);
        
      } catch (clientError) {
        console.error("❌ Erro ao criar cliente temporário:", clientError);
        // Try to get the first available client as fallback
        const clients = await invoke<any[]>("list_clients");
        if (clients.length > 0) {
          tempClientId = clients[0].id;
          console.log("🟨 Usando cliente existente:", clients[0]);
        } else {
          throw new Error("Nenhum cliente disponível");
        }
      }

      // Criar order temporária com dados mínimos
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const tempOrderData = {
        name: "Pedido Temporário",
        client_id: tempClientId,
        due_date: `${year}-${month}-${day}`,
        iva: 16.0,
        discount: 0.0,
        status: "order_received",
      };

      const tempOrder = await invoke<Order>("create_order", { dto: tempOrderData });
      setTemporaryOrderId(tempOrder.id);
      
      return tempOrder;
    } catch (error) {
      console.error("❌ Erro ao criar order temporária:", error);
      return null;
    }
  };

  const loadOrderClothesLocal = async (orderId: string) => {
    // Use store action to load clothes
    await loadOrderClothes(orderId);
    // Update local state for sidebar display
    const clothes = getOrderClothes(orderId);
    setOrderClothes(clothes);
  };

  const handleDeleteClothes = async (clothesId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta roupa?")) {
      return;
    }

    try {
      const success = await invoke<boolean>("delete_clothes", { id: clothesId });
      if (success) {
        if (editingOrder) {
          loadOrderClothesLocal(editingOrder.id);
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
              <option value="order_received">Pedido Recebido</option>
              <option value="in_production">Pedido na Produção</option>
              <option value="ready_for_delivery">Pedido Pronto pra Entrega</option>
              <option value="delivered">Pedido Entregue</option>
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
            <OrderCard
              key={order.id}
              order={order}
              onView={handleViewOrder}
              onEdit={handleOpenPanel}
              onDelete={handleDeleteOrder}
              onAddClothes={(orderId) => {
                console.log("🟡 Botão de roupas clicado no card, order.id:", orderId);
                handleOpenClothesModal(orderId);
              }}
              onCopyId={(orderId) => navigator.clipboard.writeText(orderId)}
            />
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
                onClick={() => openClientModal()}
              />
              <Button
                type="button"
                onClick={() => openClientModal()}
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
              <option value="order_received">Pedido Recebido</option>
              <option value="in_production">Pedido na Produção</option>
              <option value="ready_for_delivery">Pedido Pronto pra Entrega</option>
              <option value="delivered">Pedido Entregue</option>
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
        onClose={() => closeClientModal()}
        onSelect={handleClientSelect}
        selectedClientId={selectedClient?.id}
      />

      {/* Modal de roupas */}
      {selectedOrderForClothes && (
        <ClothesModal
          isOpen={isClothesModalOpen}
          onClose={handleCloseClothesModal}
          orderId={selectedOrderForClothes}
          onClothesAdded={handleClothesAdded}
        />
      )}
    </div>
  );
}
