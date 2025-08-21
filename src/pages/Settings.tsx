import { Settings as SettingsIcon, Database, Wrench, Palette, BarChart3, Save, RefreshCw, FileText, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/button';

interface SettingsProps {
  user?: {
    id: string;
    login: string;
    role: string;
  };
  onNavigate?: (page: string) => void;
}

export default function Settings({ user, onNavigate }: SettingsProps) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Configurações
        </h1>
        <p className="text-primary-300">
          Personalize sua experiência no EditArt
        </p>
      </div>

      <div className="space-y-6">
        {/* Seção Sistema */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
              <h3 className="font-semibold text-primary-100 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Banco de Dados
              </h3>
              <p className="text-primary-400 text-sm mb-4">Status da conexão com PostgreSQL</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                <span className="text-teal-400 font-medium">Conectado</span>
              </div>
            </div>

            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
              <h3 className="font-semibold text-primary-100 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Versão
              </h3>
              <p className="text-primary-400 text-sm mb-4">Informações da aplicação</p>
              <div className="space-y-1">
                <p className="text-primary-300 text-sm">EditArt v1.0.0</p>
                <p className="text-primary-500 text-xs">Tauri + React + Rust</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Aparência */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Aparência
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
              <h3 className="font-semibold text-primary-100 mb-3">Tema</h3>
              <p className="text-primary-400 text-sm mb-4">Tema escuro otimizado para desktop</p>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-primary-900 rounded border border-primary-600"></div>
                <span className="text-primary-300 font-medium">Modo Escuro</span>
                <span className="text-teal-400 text-sm">✓ Ativo</span>
              </div>
            </div>

            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600">
              <h3 className="font-semibold text-primary-100 mb-3">Layout</h3>
              <p className="text-primary-400 text-sm mb-4">Configurações de interface</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-primary-300 text-sm">Sidebar retrátil</span>
                  <span className="text-teal-400 text-sm">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-primary-300 text-sm">Efeitos glass</span>
                  <span className="text-teal-400 text-sm">✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Dados */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Dados
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600 text-center">
              <div className="flex justify-center mb-2">
                <Database className="w-6 h-6 text-secondary-400" />
              </div>
              <h3 className="font-semibold text-primary-100 mb-1">Clientes</h3>
              <p className="text-secondary-400 text-lg font-bold">-</p>
              <p className="text-primary-500 text-xs">Total cadastrados</p>
            </div>

            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600 text-center">
              <div className="flex justify-center mb-2">
                <FileText className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="font-semibold text-primary-100 mb-1">Pedidos</h3>
              <p className="text-secondary-400 text-lg font-bold">-</p>
              <p className="text-primary-500 text-xs">Em andamento</p>
            </div>

            <div className="p-6 bg-primary-800/50 rounded-xl border border-primary-600 text-center">
              <div className="flex justify-center mb-2">
                <Save className="w-6 h-6 text-olive-400" />
              </div>
              <h3 className="font-semibold text-primary-100 mb-1">Backup</h3>
              <p className="text-primary-400 text-sm font-medium">Manual</p>
              <p className="text-primary-500 text-xs">Último: Nunca</p>
            </div>
          </div>
        </div>

        {/* Seção Administração - Apenas para Admin */}
        {user?.role === "admin" && (
          <div className="glass-effect p-6 rounded-xl border-l-4 border-l-amber-500">
            <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" />
              Administração
            </h2>
            <p className="text-primary-400 text-sm mb-4">
              Funcionalidades exclusivas para administradores
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => onNavigate?.("register-user")}
                className="px-6 py-3 rounded-xl font-medium hover-lift transition-all"
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Cadastrar Usuário
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="glass-effect p-6 rounded-xl">
          <h2 className="text-lg font-bold text-primary-100 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Manutenção
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <Button className="px-6 py-3 rounded-xl font-medium hover-lift transition-all">
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Fazer Backup
              </span>
            </Button>
            
            <Button className="px-6 py-3 rounded-xl font-medium hover-lift transition-all">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sincronizar Dados
              </span>
            </Button>
            
            <Button variant="outline" className="px-6 py-3 text-primary-300 rounded-xl font-medium transition-all">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Exportar Relatório
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
