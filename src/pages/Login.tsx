import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LogIn, User as UserIcon, Lock, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import type { LoginDto, LoginResponseDto } from "../types/auth";

interface LoginProps {
  onLoginSuccess: (user: { id: string; login: string; role: string }) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [formData, setFormData] = useState<LoginDto>({
    login: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response: LoginResponseDto = await invoke("login", {
        loginDto: formData
      });

      if (response.success) {
        // Salvar informações do usuário no localStorage
        localStorage.setItem("user", JSON.stringify({
          id: response.id,
          login: response.login,
          role: response.role
        }));
        
        onLoginSuccess({
          id: response.id,
          login: response.login,
          role: response.role
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-primary-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header com Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
              <img 
                src="/editartlogo.png" 
                alt="EditArt Logo" 
                className="w-full h-full object-contain"
              />
          </div>
          <p className="text-primary-300">
            Entre com suas credenciais
          </p>
        </div>

        {/* Formulário */}
        <div className="glass-effect p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Login */}
            <div className="space-y-3">
              <label className="block text-primary-100 font-medium flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Login
              </label>
              <input
                type="text"
                value={formData.login}
                onChange={(e) => handleInputChange("login", e.target.value)}
                placeholder="Digite seu login"
                required
                disabled={loading}
                autoComplete="off"
                className="w-full px-4 py-3 bg-primary-800/50 border border-primary-600 rounded-xl text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
              />
            </div>

            {/* Campo Password */}
            <div className="space-y-3">
              <label className="block text-primary-100 font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Digite sua senha"
                required
                disabled={loading}
                autoComplete="off"
                className="w-full px-4 py-3 bg-primary-800/50 border border-primary-600 rounded-xl text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Botão de Login */}
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl font-medium hover-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                {loading ? "Entrando..." : "Entrar"}
              </span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
