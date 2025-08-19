export type OrderStatus = 'pending' | 'payment_pending' | 'paid' | 'cancelled';

export interface Order {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  client_contact: string;
  due_date: string; // Date como string
  discount: number;
  iva: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  created_at: string; // TIMESTAMPTZ como string
  updated_at: string; // TIMESTAMPTZ como string
}

export interface CreateOrderDto {
  name: string;
  client_id: string;
  due_date: string; // Date como string
  iva: number;
  discount?: number;
  status?: OrderStatus;
}

export interface UpdateOrderDto {
  name?: string;
  client_id?: string;
  due_date?: string;
  discount?: number;
  iva?: number;
  subtotal?: number;
  total?: number;
  status?: OrderStatus;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  payment_pending: 'Aguardando Pagamento',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-600',
  payment_pending: 'bg-orange-600',
  paid: 'bg-green-600',
  cancelled: 'bg-red-600',
};
