import { useState, useEffect } from "react";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Orders from "./pages/Orders";
import Settings from "./pages/Settings";
import { useAutoResize } from "./hooks/useResponsiveWindow";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  
  // Auto-resize window on app startup using responsive configuration
  useAutoResize('sidebar', true); // Uses the 'sidebar' preset config

  // Simple routing based on hash
  const getCurrentPage = () => {
    const hash = window.location.hash.slice(1) || "home";
    return hash;
  };

  // Update page when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(getCurrentPage());
    };
    
    window.addEventListener("hashchange", handleHashChange);
    setCurrentPage(getCurrentPage());
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Atualizar a URL hash para manter sincronização
    window.location.hash = page;
  };

  const renderPage = () => {
    switch (currentPage) {
      case "clients":
        return <Clients />;
      case "orders":
        return <Orders />;
      case "settings":
        return <Settings />;
      case "home":
      default:
        return <Home />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default App;
