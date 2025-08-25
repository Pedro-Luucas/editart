import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  RotateCcw, 
  Plus, 
  FileText, 
  X
} from 'lucide-react';
import { Button } from "../components/ui/button";
import OrderCard from "../components/orders/OrderCard";
import OrderSidePanel from "../components/orders/OrderSidePanel";

import { Order, OrderStatus } from "../types/order";

// Import orderStore hooks
import {
  useOrders,
  useOrdersLoading,
  useOrdersError,
  useSearchTerm,
  useStatusFilter,
  useIsPanelOpen,
  useEditingOrder
} from "../stores/orderStore";
import { useOrderStore } from "../stores/orderStore";

interface OrdersProps {
  onNavigate?: (page: string, params?: any) => void;
}

export default function Orders({ onNavigate }: OrdersProps = {}) {
  console.log("🔵 Orders component renderizado");
  console.log("🔵 Orders component - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
  
  // Store state - migrated from local useState
  const orders = useOrders();
  const loading = useOrdersLoading();
  const error = useOrdersError();
  const searchTerm = useSearchTerm();
  const statusFilter = useStatusFilter();
  
  // SidePanel state - migrated from local useState
  const isPanelOpen = useIsPanelOpen();
  const editingOrder = useEditingOrder();
  

  
  console.log("🔵 Orders - Estado atual:", {
    ordersCount: orders.length,
    isPanelOpen,
    editingOrder: editingOrder?.id
  });
  
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
  


  useEffect(() => {
    console.log("🔵 Orders useEffect - loadOrders chamado");
    loadOrders();
  }, []); // Remove actions dependency to prevent loop

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja excluir este pedido?")) {
      return;
    }

    const success = await deleteOrder(orderId);
    if (!success) {
      alert("Erro ao excluir pedido");
    }
  };

  const handleOpenPanel = async (order?: Order) => {
    console.log("🔵 handleOpenPanel chamado", { order: order ? "existente" : "novo", orderId: order?.id });
    
    if (order) {
      console.log("🔵 Editando order existente:", order.id);
      openPanel(order);
    } else {
      console.log("🔵 Criando nova order");
      openPanel();
    }
    console.log("🔵 handleOpenPanel finalizado");
  };

  const handleClosePanel = async () => {
    closePanel();
  };

  const handleSaveOrder = async (orderData: any) => {
    try {
      if (editingOrder) {
        // Update existing order
        const success = await updateOrder(editingOrder.id, orderData);
        if (success) {
          handleClosePanel();
        } else {
          alert("Erro ao atualizar pedido");
        }
      } else {
        // Create new order
        const newOrder = await createOrder(orderData);
        if (newOrder) {
          // Set as editing order and switch to clothes tab
          openPanel(newOrder);
        } else {
          alert("Erro ao criar pedido");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido: " + error);
    }
  };

  const filteredOrders = useMemo(() => {
    console.log("🔵 Orders - getFilteredOrders executado");
    console.log("🔵 Orders - getFilteredOrders - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
    return getFilteredOrders();
  }, [orders, searchTerm, statusFilter]);



  const handleViewOrder = (orderId: string) => {
    console.log("🔵 handleViewOrder chamado com orderId:", orderId);
    if (onNavigate) {
      onNavigate(`view-order`, { id: orderId }); // Changed from { orderId } to { id: orderId }
    } else {
      // Fallback usando hash navigation
      window.location.hash = `view-order?id=${orderId}`;
    }
  };

  console.log("🔵 Orders - Antes do return, estado final:", {
    filteredOrdersCount: filteredOrders.length
  });

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
                // Abrir o SidePanel para editar o pedido e adicionar roupas
                handleOpenPanel(order);
              }}
              onCopyId={(orderId) => navigator.clipboard.writeText(orderId)}
            />
          ))}
        </div>
      )}

      {/* OrderSidePanel para adicionar/editar pedido */}
      <OrderSidePanel
        isOpen={isPanelOpen}
        editingOrder={editingOrder || undefined}
        onClose={handleClosePanel}
        onSave={handleSaveOrder}
      />


    </div>
  );
}
