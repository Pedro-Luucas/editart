interface TopBarProps {
  sidebarCollapsed: boolean;
}

export default function TopBar({ sidebarCollapsed }: TopBarProps) {
  return (
    <header className={`fixed top-0 right-0 h-12 bg-primary-800 border-b border-primary-700 transition-all duration-300 z-20 ${
      sidebarCollapsed ? "left-12" : "left-52"
    }`}>
      <div className="h-full flex items-center justify-between px-4">
        {/* Spacer - deixa espaço para o logo ficar à direita */}
        <div></div>
        
        {/* Logo/Brand */}
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-gradient-secondary">
            EditArt
          </h1>
        </div>
      </div>
    </header>
  );
}
