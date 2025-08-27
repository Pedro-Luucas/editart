import React from 'react';
import { 
  Edit, 
  Copy, 
  Trash2, 
  Calendar,
  User,
  Shirt,
  Eye,
  CheckCircle,
  XCircle,
  Hash,
  FileText
} from 'lucide-react';
import { Button } from "../ui/button";
import { formatDateTime, formatDateOnly } from "../../utils/dateUtils";
import { Order, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "../../types/order";

interface OrderCardProps {
  order: Order;
  onView: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (orderId: string) => void;
  onAddClothes: (orderId: string) => void;
  onCopyId: (orderId: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onView,
  onEdit,
  onDelete,
  onAddClothes
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
      <div className={`inline-flex items-center gap-1 px-3 py-1 ${colorClass} text-primary-100 rounded-full text-xs font-semibold`}>
        {label}
      </div>
    );
  };

  const getPaidBadge = (paid: boolean) => {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        paid 
          ? 'bg-green-600 text-green-100' 
          : 'bg-red-600 text-red-100'
      }`}>
        {paid ? (
          <>
            <CheckCircle className="w-3 h-3" />
            Pago
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3" />
            Pendente
          </>
        )}
      </div>
    );
  };

  const handleAddClothes = () => {
    console.log("🟡 OrderCard.handleAddClothes chamado para order:", order.id);
    onAddClothes(order.id);
  };

  console.log("🟡 OrderCard finalizando renderização para order:", order.id);

  return (
    <div className="glass-effect p-5 rounded-xl hover-lift">
      <div className="space-y-4">
        {/* Header com status */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary-100 mb-1 flex items-center gap-2">
              <User className="w-4 h-4" />
              {order.client_name}
            </h3>
            <p className="text-primary-400 text-sm flex items-center gap-1">
              {order.name} 
            </p>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {getStatusBadge(order.status)}
            {getPaidBadge(order.paid)}

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
