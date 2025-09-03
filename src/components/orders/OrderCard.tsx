import React from 'react';
import { 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Shirt,
  Wallet,
  Eye,
  CheckCircle,
  XCircle,
  Hash,
  FileText,
  ChevronDown
} from 'lucide-react';
import { Button } from "../ui/button";
import { formatDateTime, formatDateOnly } from "../../utils/dateUtils";
import { truncateText } from "../../lib/utils";
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, OrderStatus } from "../../types/order";
import ImpressionSummary from "../impressions/ImpressionSummary";

interface OrderCardProps {
  order: Order;
  isAdmin: boolean;
  onView: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onAddClothes: (orderId: string) => void;
  onAddImpression: (orderId: string) => void;
  onCopyId: (orderId: string) => void;
  onPayDebt: (orderId: string) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  onAddClothes,
  onAddImpression,
  onPayDebt,
  onUpdateStatus
}) => {
  console.log("🟡 OrderCard renderizado para order:", order.id, "name:", order.name);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS];
    const label = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS];
    
    return (
      <div className={`inline-flex items-center gap-1 px-3 py-1 ${colorClass} text-white rounded-full text-xs font-semibold`}>
        {label}
      </div>
    );
  };

  const getStatusDropdown = (status: string) => {
    const colorClass = ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS];
    
    return (
      <div className="relative group">
        <select
          value={status}
          onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
          className={`
            inline-flex items-center gap-2 px-3 py-1 
            ${colorClass} text-white rounded-full text-xs font-semibold 
            cursor-pointer border-none outline-none appearance-none 
            transition-all duration-200 ease-in-out
            hover:shadow-lg hover:scale-105 focus:ring-2 focus:ring-white/20
            min-w-[160px] text-center pr-8
            group-hover:shadow-xl group-hover:scale-110
          `}
          title="Clique para alterar o status do pedido"
        >
          <option value="order_received" className="bg-gray-800 text-white">Pedido Recebido</option>
          <option value="in_production" className="bg-gray-800 text-white">Pedido na Produção</option>
          <option value="ready_for_delivery" className="bg-gray-800 text-white">Pedido Pronto pra Entrega</option>
          <option value="delivered" className="bg-gray-800 text-white">Pedido Entregue</option>
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <ChevronDown className="w-3 h-3 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
        </div>
        
        {/* Enhanced glow effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none"
             style={{
               background: `radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 60%)`,
               filter: 'blur(2px)',
               transform: 'scale(1.05)'
             }}
        />
      </div>
    );
  };

  const getDebtBadge = (debt: number) => {
    const isPaid = debt === 0;
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isPaid 
          ? 'bg-green-600 text-green-100' 
          : 'bg-red-600 text-red-100'
      }`}>
        {isPaid ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Pago
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3" />
            {formatCurrency(debt)}
          </>
        )}
      </div>
    );
  };

  const handleAddClothes = () => {
    console.log("🟡 OrderCard.handleAddClothes chamado para order:", order.id);
    onAddClothes(order.id);
  };

  const handleAddImpression = () => {
    console.log("🟡 OrderCard.handleAddImpression chamado para order:", order.id);
    onAddImpression(order.id);
  };

  console.log("🟡 OrderCard finalizando renderização para order:", order.id);

  return (
    <div className="glass-effect p-5 rounded-xl hover-lift h-full flex flex-col">
      <div className="flex-1 space-y-4">
        {/* Header com status */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-100 mb-1 flex items-center gap-2" title={order.client_name}>
              <User className="w-4 h-4" />
              {truncateText(order.client_name)}
            </h3>
            <p className="text-primary-400 text-sm flex items-center gap-1" title={order.name}>
              {truncateText(order.name)} 
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {isAdmin ? getStatusDropdown(order.status) : getStatusBadge(order.status)}
            {getDebtBadge(order.debt)}

          </div>
        </div>

        {/* Números do pedido */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-primary-300">
            <Hash className="w-4 h-4" />
            <span className="font-semibold text-primary-100">#{order.order_number}</span>
          </div>
          <div className="flex items-center gap-2 text-primary-300">
            <FileText className="w-4 h-4" />
            <span className="text-primary-400">Requisição:</span>
            <span className="font-semibold text-primary-100">#{order.client_requisition_number}</span>
          </div>
        </div>

        {/* Contadores de produtos e impressões */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-primary-300">
            <Shirt className="w-4 h-4" />
            <span className="text-primary-400">Produtos:</span>
            <span className="font-semibold text-primary-100">{order.clothes?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2 text-primary-300">
            <Wallet className="w-4 h-4" />
            <span className="text-primary-400">Impressões:</span>
            <span className="font-semibold text-primary-100">{order.impressions?.length || 0}</span>
          </div>
        </div>

        {/* Resumo das impressões */}
        {order.impressions && order.impressions.length > 0 && (
          <ImpressionSummary impressions={order.impressions} />
        )}

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
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-primary-400">Débito Pago:</span>
            <span className="text-primary-200">{formatCurrency(order.total - order.debt)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-primary-400">Débito Restante:</span>
            <span className={`font-semibold ${order.debt === 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(order.debt)}
            </span>
          </div>
        </div>

        {/* Data de vencimento */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary-400" />
          <span className="text-primary-400">Vencimento:</span>
          <span className="text-primary-200">{formatDateOnly(order.due_date)}</span>
        </div>
      </div>

      {/* Timestamps e Actions - sempre no final do card */}
      <div className="border-t border-primary-600 pt-3 mt-4 space-y-3">
        {/* Timestamps */}
        <div className="space-y-1 text-xs text-primary-400">
          <div>
            <span className="text-primary-500 font-medium">Criado:</span>{" "}
            <span className="text-primary-300">{formatDateTime(order.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onView(order.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-blue-600 hover:bg-blue-700"
            title="Visualizar pedido"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </Button>
          <Button
            onClick={() => onEdit(order)}
            className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
            title="Editar pedido"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleAddClothes}
            className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-green-600 hover:bg-green-700"
            title="Adicionar produtos"
          >
            <Shirt className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleAddImpression}
            className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-purple-600 hover:bg-purple-700"
            title="Adicionar impressão"
          >
            <Wallet className="w-4 h-4" />
          </Button>
          {order.debt > 0 && (
            <Button
              onClick={() => onPayDebt(order.id)}
              className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm bg-orange-600 hover:bg-orange-700"
              title="Pagar dívida"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          <Button
            onClick={() => onDelete(order.id)}
            variant="destructive"
            className="flex items-center justify-center px-3 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
            title="Excluir pedido"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
