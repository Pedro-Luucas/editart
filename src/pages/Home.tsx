import { useEffect } from "react";
import { useOrders, useOrdersLoading, useLoadOrders } from "../stores/orderStore";
import { useClients, useClientsLoading, useLoadClients } from "../stores/clientStore";
import { Users, ClipboardList, DollarSign, AlertTriangle } from 'lucide-react';
import { ORDER_STATUS_LABELS } from "../types/order";

// Componente auxiliar para os cards de métricas
function MetricCard({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  console.log(`HOME: MetricCard renderizando - ${title}: ${value}`);
  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-300 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-primary-100 mt-1">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Home() {
  console.log("HOME: Componente Home renderizando");
  
  const orders = useOrders();
  const clients = useClients();
  const ordersLoading = useOrdersLoading();
  const clientsLoading = useClientsLoading();
  const loadOrders = useLoadOrders();
  const loadClients = useLoadClients();

  console.log("HOME: Estados carregados:", {
    ordersCount: orders.length,
    clientsCount: clients.length,
    ordersLoading,
    clientsLoading
  });

  useEffect(() => {
    console.log("HOME: useEffect executando - carregando dados");
    loadOrders();
    loadClients();
  }, [loadOrders, loadClients]);

  // Cálculos das estatísticas
  console.log("HOME: Iniciando cálculos das estatísticas");
  
  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrderDebts = orders.reduce((sum, order) => sum + order.debt, 0);
  const totalClientDebts = clients.reduce((sum, client) => sum + client.debt, 0);
  const averageOrderValue = orders.length > 0 ? totalSales / orders.length : 0;

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const overdueOrders = orders.filter(order => 
    new Date(order.due_date) < new Date() && order.status !== 'delivered'
  ).length;

  const thisMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.created_at);
    const now = new Date();
    return orderDate.getMonth() === now.getMonth() && 
           orderDate.getFullYear() === now.getFullYear();
  }).length;

  const clientsWithDebts = clients.filter(client => client.debt > 0).length;

  const pendingOrders = (ordersByStatus['order_received'] || 0) + (ordersByStatus['in_production'] || 0);

  console.log("HOME: Cálculos concluídos:", {
    totalSales,
    totalOrderDebts,
    totalClientDebts,
    averageOrderValue,
    ordersByStatus,
    overdueOrders,
    thisMonthOrders,
    clientsWithDebts,
    pendingOrders
  });

  if (ordersLoading || clientsLoading) {
    console.log("HOME: Mostrando loading state");
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-primary-300">A carregar estatísticas...</div>
        </div>
      </div>
    );
  }

  console.log("HOME: Renderizando dashboard principal");
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gradient-secondary mb-2">
          Dashboard EditArt
        </h1>
        <p className="text-primary-300">
          Visão geral do seu negócio
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total de Vendas"
          value={`${totalSales.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`}
          icon={<DollarSign className="w-6 h-6" />}
          color="bg-green-600"
        />
        <MetricCard
          title="Pedidos Pendentes"
          value={pendingOrders}
          icon={<ClipboardList className="w-6 h-6" />}
          color="bg-yellow-600"
        />
        <MetricCard
          title="Total de Clientes"
          value={clients.length}
          icon={<Users className="w-6 h-6" />}
          color="bg-blue-600"
        />
        <MetricCard
          title="Dívidas Pendentes"
          value={`${(totalOrderDebts + totalClientDebts).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT`}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="bg-red-600"
        />
      </div>

      {/* Seção de Estatísticas Detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status dos Pedidos */}
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-semibold text-primary-100 mb-4">
            Status dos Pedidos
          </h3>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-primary-200">
                  {ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] || status}
                </span>
                <span className="font-semibold text-primary-100">{count}</span>
              </div>
            ))}
            {Object.keys(ordersByStatus).length === 0 && (
              <div className="text-primary-300 text-center py-4">
                Nenhum pedido encontrado
              </div>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="glass-effect rounded-xl p-6">
          <h3 className="text-xl font-semibold text-primary-100 mb-4">
            Resumo Financeiro
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-primary-200">Valor Médio por Pedido:</span>
              <span className="font-semibold text-primary-100">
                {averageOrderValue.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-200">Pedidos em Atraso:</span>
              <span className="font-semibold text-red-400">{overdueOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-200">Pedidos Este Mês:</span>
              <span className="font-semibold text-primary-100">{thisMonthOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-primary-200">Clientes com Dívidas:</span>
              <span className="font-semibold text-red-400">{clientsWithDebts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Acções Rápidas */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-primary-100 mb-4">
          Acções Rápidas
        </h3>
        <div className="flex gap-4 justify-center flex-wrap">
          <a 
            href="#clients" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-secondary-500 text-primary-900 rounded-lg font-semibold hover-lift shadow-secondary hover:shadow-secondary transition-all duration-300"
          >
            <Users className="w-5 h-5" />
            <span>Gestão de Clientes</span>
          </a>
          <a 
            href="#orders" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-primary-100 rounded-lg font-semibold hover-lift shadow-teal hover:shadow-teal transition-all duration-300"
          >
            <ClipboardList className="w-5 h-5" />
            <span>Gestão de Pedidos</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;
