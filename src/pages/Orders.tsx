import { ClipboardList, FileText, BarChart3, RotateCcw, Construction } from 'lucide-react';

export default function Orders() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Gestão de Pedidos
        </h1>
        <p className="text-primary-300">
          Visualize e gerencie todos os pedidos dos clientes
        </p>
      </div>

      <div className="glass-effect p-8 text-center rounded-xl">
        <div className="mb-8">
          <ClipboardList className="w-16 h-16 text-primary-400 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-primary-100 mb-4">
          Módulo de Pedidos
        </h2>
        <p className="text-primary-300 mb-8 text-lg max-w-2xl mx-auto">
          Esta funcionalidade está em desenvolvimento. Em breve você poderá criar, visualizar e gerenciar todos os pedidos dos seus clientes de forma integrada.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
            <div className="flex justify-center mb-3">
              <FileText className="w-8 h-8 text-secondary-400" />
            </div>
            <h3 className="font-semibold text-primary-100 mb-2">Criar Pedidos</h3>
            <p className="text-primary-400 text-sm">Novo sistema de criação de pedidos vinculados aos clientes</p>
          </div>
          
          <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
            <div className="flex justify-center mb-3">
              <BarChart3 className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="font-semibold text-primary-100 mb-2">Relatórios</h3>
            <p className="text-primary-400 text-sm">Visualização de estatísticas e relatórios de vendas</p>
          </div>
          
          <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
            <div className="flex justify-center mb-3">
              <RotateCcw className="w-8 h-8 text-olive-400" />
            </div>
            <h3 className="font-semibold text-primary-100 mb-2">Status</h3>
            <p className="text-primary-400 text-sm">Acompanhamento do status dos pedidos em tempo real</p>
          </div>
        </div>

        <div className="mt-10">
          <span className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-500/20 text-secondary-400 rounded-xl font-medium border border-secondary-500/30">
            <Construction className="w-4 h-4" />
            Em Desenvolvimento
          </span>
        </div>
      </div>
    </div>
  );
}
