export type OrderStatus = 'order_received' | 'in_production' | 'ready_for_delivery' | 'delivered';

export interface Order {
  id: string;
  name: string;
  client_id: string;
  client_name: string;
  client_contact: string;
  order_number: number;
  client_requisition_number: number;
  due_date: string; // Date como string
  discount: number;
  iva: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  debt: number;
  clothes: any[]; // TODO: Implementar store de clothes
  impressions: any[]; // TODO: Implementar store de impressions
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
  order_received: 'Pedido Recebido',
  in_production: 'Pedido na Produção',
  ready_for_delivery: 'Pedido Pronto pra Entrega',
  delivered: 'Pedido Entregue',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  order_received: 'bg-blue-600',
  in_production: 'bg-yellow-500',
  ready_for_delivery: 'bg-orange-600',
  delivered: 'bg-green-600',
};
