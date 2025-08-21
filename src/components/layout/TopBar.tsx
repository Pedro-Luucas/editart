import { Button } from "../ui/button";

interface TopBarProps {
  sidebarCollapsed: boolean;
  user: {
    id: string;
    login: string;
    role: string;
  };
  onLogout: () => void;
}

export default function TopBar({ sidebarCollapsed, user, onLogout }: TopBarProps) {
  return (
    <header className={`fixed top-0 right-0 h-12 bg-primary-800 border-b border-primary-700 transition-all duration-300 z-20 ${
      sidebarCollapsed ? "left-12" : "left-52"
    }`}>
      <div className="h-full flex items-center justify-between px-4">
        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="text-sm text-white">
            <span className="font-medium">{user.login}</span>
            <span className="ml-2 px-2 py-1 bg-primary-700 rounded text-xs uppercase">
              {user.role}
            </span>
          </div>
        </div>
        
        {/* Logo/Brand and Logout */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-gradient-secondary">
            EditArt
          </h1>
          <Button 
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="border-primary-600 bg-secondary-500 hover:bg-secondary-700 text-white"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
