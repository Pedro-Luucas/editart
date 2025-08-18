import { useState, ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-primary-950">
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={onNavigate}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={handleSidebarToggle}
      />
      
      {/* TopBar */}
      <TopBar sidebarCollapsed={sidebarCollapsed} />
      
      {/* Main Content */}
      <main className={`transition-all duration-300 pt-12 ${
        sidebarCollapsed ? "ml-12" : "ml-52"
      }`}>
        <div className="p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
