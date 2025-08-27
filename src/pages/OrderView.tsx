import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  Package, 
  Edit,
  Shirt,
  MapPin,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Hash,
  Trash2
} from 'lucide-react';
import { Button } from "../components/ui/button";
import { formatDateTime, formatDateOnly } from "../utils/dateUtils";
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../types/order";
import { Clothes, CLOTHING_TYPE_LABELS, SERVICE_TYPE_LABELS, SERVICE_LOCATION_LABELS } from "../types/clothes";
import { Client } from "../types/client";

interface OrderViewProps {
  orderId?: string;
  onNavigate?: (page: string, params?: any) => void;
  onBack?: () => void;
}

export default function OrderView({ orderId, onNavigate, onBack }: OrderViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [clothes, setClothes] = useState<Clothes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingClothes, setDeletingClothes] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔵 OrderView useEffect - orderId prop:", orderId);
    console.log("🔵 OrderView useEffect - window.location.hash:", window.location.hash);
    
    if (orderId) {
      console.log("🔵 Usando orderId da prop:", orderId);
      loadOrderData(orderId);
    } else {
      // Try to get orderId from URL hash
      const hash = window.location.hash;
      const urlParams = new URLSearchParams(hash.split('?')[1] || '');
      const id = urlParams.get('id');
      console.log("🔵 ID extraído da URL:", id);
      
      if (id) {
        console.log("🔵 Usando ID da URL:", id);
        loadOrderData(id);
      } else {
        console.log("❌ Nenhum ID encontrado");
        setError("ID do pedido não fornecido");
        setLoading(false);
      }
    }
  }, [orderId]);

  const loadOrderData = async (id: string) => {
    try {
      setLoading(true);
      setError("");

      // Load order details
      const orders = await invoke<Order[]>("list_orders");
      const foundOrder = orders.find(o => o.id === id);
      
      if (!foundOrder) {
        throw new Error("Pedido não encontrado");
      }
      
      setOrder(foundOrder);

      // Load client details
      const clients = await invoke<Client[]>("list_clients");
      const foundClient = clients.find(c => c.id === foundOrder.client_id);
      setClient(foundClient || null);

      // Load clothes for this order
      const orderClothes = await invoke<Clothes[]>("get_clothes_by_order_id", { orderId: id });
      setClothes(orderClothes);

    } catch (err) {
      console.error("Erro ao carregar dados do pedido:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClothes = async (clothesId: string) => {
    if (!order || !confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      setDeletingClothes(clothesId);
      
      // Chamar a função para deletar o produto
      const success = await invoke<boolean>("delete_clothes", { id: clothesId });
      
      if (success) {
        // Remover o produto da lista local
        setClothes(prev => prev.filter(item => item.id !== clothesId));
        
        // Recarregar os dados do pedido para atualizar os cálculos
        await loadOrderData(order.id);
      } else {
        alert("Erro ao excluir produto");
      }
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert("Erro ao excluir produto: " + err);
    } finally {
      setDeletingClothes(null);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (onNavigate) {
      onNavigate("orders");
    } else {
      window.location.hash = "orders";
    }
  };

  const handleEdit = () => {
    if (onNavigate && order) {
      onNavigate("orders", { editOrderId: order.id });
    } else {
      window.location.hash = "orders";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS];
    const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS];
    
    const iconMap = {
      order_received: <Clock className="w-4 h-4" />,
      in_production: <AlertCircle className="w-4 h-4" />,
      ready_for_delivery: <CheckCircle className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />
    };

    const icon = iconMap[status as keyof typeof iconMap];
    
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 ${colorClass} text-primary-100 rounded-lg font-semibold shadow-lg`}>
        {icon}
        {label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-primary-300 text-lg">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 p-6 bg-red-900/80 border border-red-600 rounded-xl backdrop-blur-sm">
          <p className="text-red-100 text-lg mb-4 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error || "Pedido não encontrado"}
          </p>
          <Button
            onClick={handleBack}
            variant="secondary"
            className="px-6 py-3 rounded-lg font-medium hover-lift transition-all"
          >
            Voltar aos Pedidos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-primary-600 pb-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover-lift"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex gap-3">
            <Button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover-lift"
            >
              <Edit className="w-4 h-4" />
              Editar Pedido
            </Button>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient-secondary mb-2">
              {order.name}
            </h1>
            <div className="flex items-center gap-4 text-primary-400">
              <p>Pedido #{order.id.slice(0, 8)}...</p>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                <span>#{order.order_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Requisição #{order.client_requisition_number}</span>
              </div>
            </div>
          </div>
          {getStatusBadge(order.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Client Information */}
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold text-primary-100 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações do Cliente
            </h2>
            
            {client ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-1">Nome</label>
                  <p className="text-primary-100 font-medium">{order.client_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-1">Contato</label>
                  <p className="text-primary-100 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {order.client_contact}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-1">NUIT</label>
                  <p className="text-primary-100">{client.nuit}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-400 mb-1">Categoria</label>
                  <p className="text-primary-100">{client.category}</p>
                </div>
                {client.observations && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-primary-400 mb-1">Observações</label>
                    <p className="text-primary-100">{client.observations}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-primary-400">
                <p>Informações do cliente não disponíveis</p>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold text-primary-100 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalhes do Pedido
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-1">Data de Vencimento</label>
                <p className="text-primary-100 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDateOnly(order.due_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-1">IVA</label>
                <p className="text-primary-100">{order.iva}%</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-1">Desconto</label>
                <p className="text-primary-100">{formatCurrency(order.discount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-400 mb-1">Criado em</label>
                <p className="text-primary-100">{formatDateTime(order.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Clothes List */}
          <div className="glass-effect p-6 rounded-xl">
            <h2 className="text-xl font-bold text-primary-100 mb-4 flex items-center gap-2">
              <Shirt className="w-5 h-5" />
              Produtos do Pedido ({clothes.length} {clothes.length === 1 ? 'item' : 'itens'})
            </h2>
            
            {clothes.length === 0 ? (
              <div className="text-center py-8 text-primary-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum produto adicionado a este pedido.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {clothes.map((item, index) => (
                  <div key={item.id} className="bg-primary-800 p-5 rounded-lg border border-primary-600">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary-100 mb-1">
                          {item.clothing_type === 'other' 
                            ? item.custom_type 
                            : CLOTHING_TYPE_LABELS[item.clothing_type]}
                        </h3>
                        <p className="text-primary-300 flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-primary-300" style={{ backgroundColor: item.color.toLowerCase() }}></div>
                          {item.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-primary-400">Item #{index + 1}</p>
                        <p className="text-lg font-bold text-secondary-400">
                          {formatCurrency((item.unit_price + item.services.reduce((sum, s) => sum + s.unit_price, 0)) * item.total_quantity)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Sizes */}
                      <div>
                        <label className="block text-sm font-medium text-primary-400 mb-2">Tamanhos</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.sizes).map(([size, qty]) => 
                            qty > 0 && (
                              <span key={size} className="bg-primary-700 px-3 py-1 rounded-full text-primary-200 text-sm font-medium">
                                {size}: {qty}
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-sm text-primary-300 mt-2">
                          Total: <span className="font-medium">{item.total_quantity} peças</span>
                        </p>
                      </div>

                      {/* Pricing */}
                      <div>
                        <label className="block text-sm font-medium text-primary-400 mb-2">Preços</label>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-primary-300">Preço base:</span>
                            <span className="text-primary-200">{formatCurrency(item.unit_price)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-primary-300">Serviços:</span>
                            <span className="text-primary-200">{formatCurrency(item.services.reduce((sum, s) => sum + s.unit_price, 0))}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium pt-1 border-t border-primary-600">
                            <span className="text-primary-200">Por peça:</span>
                            <span className="text-primary-100">{formatCurrency(item.unit_price + item.services.reduce((sum, s) => sum + s.unit_price, 0))}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Services */}
                    {item.services.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-primary-400 mb-2">Serviços Aplicados</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {item.services.map((service) => (
                            <div key={service.id} className="bg-primary-700 p-3 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-primary-100">
                                    {SERVICE_TYPE_LABELS[service.service_type]}
                                  </p>
                                  <p className="text-sm text-primary-300 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {SERVICE_LOCATION_LABELS[service.location]}
                                  </p>
                                  {service.description && (
                                    <p className="text-sm text-primary-400 italic mt-1">
                                      {service.description}
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm font-bold text-secondary-400">
                                  {formatCurrency(service.unit_price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <Button
                      onClick={() => handleDeleteClothes(item.id)}
                      variant="ghost"
                      size="sm"
                      className="mt-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-600/30 hover:border-red-500/50"
                      disabled={deletingClothes === item.id}
                    >
                      {deletingClothes === item.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2"></div>
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Excluir Produto
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Resumo Financeiro
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-400">Subtotal:</span>
                <span className="font-medium text-primary-200">{formatCurrency(order.subtotal)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-primary-400">IVA ({order.iva}%):</span>
                <span className="font-medium text-primary-200">{formatCurrency(order.subtotal * order.iva / 100)}</span>
              </div>
              
              {order.discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-primary-400">Desconto:</span>
                  <span className="font-medium text-green-400">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              
              <div className="border-t border-primary-600 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary-100">Total:</span>
                  <span className="text-2xl font-bold text-secondary-400">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-lg font-bold text-primary-100 mb-4">Resumo do Pedido</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-primary-400">Total de itens:</span>
                <span className="font-medium text-primary-200">{clothes.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-primary-400">Total de peças:</span>
                <span className="font-medium text-primary-200">
                  {clothes.reduce((sum, item) => sum + item.total_quantity, 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-primary-400">Serviços aplicados:</span>
                <span className="font-medium text-primary-200">
                  {clothes.reduce((sum, item) => sum + item.services.length, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-effect p-6 rounded-xl">
            <h3 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Cronologia
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-primary-200 font-medium">Pedido criado</p>
                  <p className="text-primary-400 text-sm">{formatDateTime(order.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-primary-200 font-medium">Última atualização</p>
                  <p className="text-primary-400 text-sm">{formatDateTime(order.updated_at)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <div>
                  <p className="text-primary-200 font-medium">Data de vencimento</p>
                  <p className="text-primary-400 text-sm">{formatDateOnly(order.due_date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
