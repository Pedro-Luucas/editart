import { useState, useEffect } from "react";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Clients from "./pages/Clients";
import Orders from "./pages/Orders";
import OrderView from "./pages/OrderView";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import "./App.css";

interface User {
  id: string;
  login: string;
  role: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [pageParams, setPageParams] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  

  // Simple routing based on hash
  const getCurrentPage = () => {
    const hash = window.location.hash.slice(1) || "home";
    const [page, params] = hash.split('?');
    return { page: page || "home", params };
  };

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  // Update page when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const { page, params } = getCurrentPage();
      setCurrentPage(page);
      if (params) {
        const urlParams = new URLSearchParams(params);
        const paramsObj: any = {};
        urlParams.forEach((value, key) => {
          paramsObj[key] = value;
        });
        setPageParams(paramsObj);
      } else {
        setPageParams(null);
      }
    };
    
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Call on initial load
    
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const handleNavigate = (page: string, params?: any) => {
    setCurrentPage(page);
    setPageParams(params);
    
    // Build hash with params
    let hash = page;
    if (params) {
      const urlParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        urlParams.set(key, params[key]);
      });
      hash += `?${urlParams.toString()}`;
    }
    
    // Atualizar a URL hash para manter sincronização
    window.location.hash = hash;
  };

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setCurrentPage("home");
    window.location.hash = "home";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setCurrentPage("home");
    window.location.hash = "home";
  };

  const renderPage = () => {
    switch (currentPage) {
      case "clients":
        return <Clients />;
      case "orders":
        return <Orders onNavigate={handleNavigate} currentUser={user || undefined} />;
      case "view-order":
        return <OrderView 
          orderId={pageParams?.id} 
          onNavigate={handleNavigate}
          onBack={() => handleNavigate("orders")}
        />;
      case "settings":
        return <Settings user={user!} onNavigate={handleNavigate} />;
      case "home":
      default:
        return <Home />;
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout 
      currentPage={currentPage} 
      onNavigate={handleNavigate}
      user={user}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
