import { useState, useEffect } from "react";
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
  DollarSign,
  User,
  Filter
} from 'lucide-react';
import SidePanel from "../components/ui/SidePanel";
import ClientSelectModal from "../components/ui/ClientSelectModal";
import { formatDateTime } from "../utils/dateUtils";
import { Order, CreateOrderDto, UpdateOrderDto, OrderStatus, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../types/order";
import { Client } from "../types/client";

export default function Orders() {
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

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await invoke<Order[]>("list_orders");
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

  const handleOpenPanel = (order?: Order) => {
    if (order) {
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
    } else {
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
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingOrder(null);
    setSelectedClient(null);
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
      if (editingOrder) {
        // Update order
        const updateDto: UpdateOrderDto = {
          name: formData.name,
          client_id: formData.client_id,
          due_date: formData.due_date,
          iva: formData.iva,
          discount: formData.discount,
          status: formData.status,
        };
        await invoke("update_order", { id: editingOrder.id, dto: updateDto });
      } else {
        // Create order
        await invoke("create_order", { dto: formData });
      }
      
      await loadOrders(); // Reload list
      handleClosePanel();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido: " + error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT');
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
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-primary-100 rounded-lg font-medium hover-lift shadow-teal disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </span>
            </button>
            <button
              onClick={() => handleOpenPanel()}
              className="px-4 py-2 bg-secondary-500 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary"
            >
              <span className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </span>
            </button>
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
          <button
            onClick={loadOrders}
            className="px-6 py-3 bg-red-700 text-red-100 rounded-lg font-medium hover:bg-red-600 hover-lift transition-all"
          >
            Tentar Novamente
          </button>
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
            <button
              onClick={() => handleOpenPanel()}
              className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-500 text-primary-900 rounded-xl font-semibold text-lg hover-lift shadow-secondary transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Pedido
            </button>
          )}
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-block px-8 py-4 bg-olive-600 text-primary-100 rounded-xl font-semibold text-lg hover-lift shadow-olive transition-all duration-200"
            >
              Limpar Filtros
            </button>
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
                  <span className="text-primary-200">{formatDate(order.due_date)}</span>
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
                  <button
                    onClick={() => handleOpenPanel(order)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary-600 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary transition-all text-sm"
                    title="Editar pedido"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(order.id)}
                    className="flex items-center justify-center px-3 py-2 bg-olive-600 text-primary-100 rounded-lg font-medium hover-lift shadow-olive transition-all text-sm"
                    title="Copiar ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-700 text-red-100 rounded-lg font-medium hover:bg-red-600 hover-lift transition-all text-sm"
                    title="Excluir pedido"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
        onSave={handleSubmit}
        title={editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
        isLoading={isSubmitting}
      >
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
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="px-4 py-2 bg-secondary-600 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary"
              >
                <User className="w-4 h-4" />
              </button>
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
              quando os itens do pedido forem implementados. Por enquanto, estes campos permanecerão em 0.
            </p>
          </div>
        </div>
      </SidePanel>

      {/* Modal de seleção de cliente */}
      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSelect={handleClientSelect}
        selectedClientId={selectedClient?.id}
      />
    </div>
  );
}
