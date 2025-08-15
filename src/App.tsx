import { useState, useEffect } from "react";
import Home from "./pages/Home";
import CreateClient from "./pages/CreateClient";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

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

  const renderPage = () => {
    switch (currentPage) {
      case "create-client":
        return <CreateClient />;
      case "home":
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderPage()}
    </div>
  );
}

export default App;
