import { Home, ClipboardList, Users, Settings, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { Button } from '../ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ currentPage, onNavigate, isCollapsed, onToggleCollapse }: SidebarProps) {

  const menuItems = [
    {
      id: "home",
      label: "Início",
      icon: Home,
      path: "home"
    },
    {
      id: "orders",
      label: "Pedidos",
      icon: ClipboardList,
      path: "orders"
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Users,
      path: "clients"
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      path: "settings"
    }
  ];

  const handleItemClick = (path: string) => {
    onNavigate(path);
  };

  const isActive = (path: string) => {
    return currentPage === path;
  };

  return (
    <aside className={`fixed left-0 top-0 h-full bg-primary-900 border-r border-primary-700 transition-all duration-300 z-30 ${
      isCollapsed ? "w-12" : "w-52"
    }`}>
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <div className="p-3 border-b border-primary-700">
          <Button
            onClick={onToggleCollapse}
            variant="ghost"
            className="w-full flex items-center justify-center p-1.5 rounded-lg bg-primary-800 hover:bg-primary-700 transition-colors"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="text-primary-300 w-4 h-4" />
            ) : (
              <ChevronLeft className="text-primary-300 w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.id}>
                  <Button
                    onClick={() => handleItemClick(item.path)}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg font-medium transition-all duration-200 group ${
                      !isActive(item.path) ? "text-primary-300 hover:bg-primary-800 hover:text-primary-100" : ""
                    }`}
                    title={isCollapsed ? item.label : ""}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="flex-1 text-left text-sm">{item.label}</span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-primary-700">
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded bg-primary-800 ${
            isCollapsed ? "justify-center" : ""
          }`}>
            <Lightbulb className="text-primary-400 w-4 h-4" />
            {!isCollapsed && (
              <div className="flex-1">
                <p className="text-xs text-primary-400 font-medium">EditArt v1.0</p>
                <p className="text-xs text-primary-500">Sistema de Gestão</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
