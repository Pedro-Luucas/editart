import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle, User as UserIcon, Lock, Shield } from "lucide-react";
import { Button } from "../components/ui/button";
import type { CreateUserDto, User } from "../types/auth";

interface RegisterUserProps {
  currentUser: {
    id: string;
    login: string;
    role: string;
  };
  onBack: () => void;
}

export default function RegisterUser({ currentUser, onBack }: RegisterUserProps) {
  const [formData, setFormData] = useState<CreateUserDto>({
    login: "",
    password: "",
    role: "user"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Verificar se o usuário atual é admin
  if (currentUser.role !== "admin") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="glass-effect p-8 rounded-xl text-center border-l-4 border-l-red-500">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-primary-300 mb-6">
            Apenas administradores podem acessar esta página.
          </p>
          <Button 
            onClick={onBack}
            variant="outline"
            className="px-6 py-3 text-primary-100 rounded-xl font-medium transition-all"
          >
            <span className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </span>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const newUser: User = await invoke("create_user", {
        createUserDto: formData
      });

      setSuccess(`Usuário "${newUser.login}" criado com sucesso!`);
      
      // Limpar formulário após sucesso
      setFormData({
        login: "",
        password: "",
        role: "user"
      });
    } catch (err) {
      setError(typeof err === "string" ? err : "Erro ao criar usuário. Tente novamente.");
      console.error("Create user error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b border-primary-600 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Button 
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="p-2 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary-300" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gradient-secondary flex items-center gap-2">
              <UserPlus className="w-6 h-6" />
              Cadastrar Usuário
            </h1>
            <p className="text-primary-300">
              Criar novo usuário no sistema
            </p>
          </div>
        </div>
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
              placeholder="Digite o login do usuário"
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
              placeholder="Digite a senha do usuário"
              required
              disabled={loading}
              autoComplete="off"
              className="w-full px-4 py-3 bg-primary-800/50 border border-primary-600 rounded-xl text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
            />
          </div>

          {/* Campo Role */}
          <div className="space-y-3">
            <label className="block text-primary-100 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value as "admin" | "user")}
              required
              disabled={loading}
              className="w-full px-4 py-3 bg-primary-800/50 border border-primary-600 rounded-xl text-primary-100 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Mensagens de Error/Success */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <span className="text-green-300 text-sm">{success}</span>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <Button 
              type="button"
              onClick={onBack}
              disabled={loading}
              variant="outline"
              className="flex-1 px-6 py-3 text-primary-300 rounded-xl font-medium transition-all disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </span>
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-medium hover-lift transition-all disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                {loading ? "Criando..." : "Criar Usuário"}
              </span>
            </Button>
          </div>
        </form>
      </div>

      {/* Informações importantes */}
      <div className="glass-effect p-6 rounded-xl mt-6 border-l-4 border-l-amber-500">
        <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Importante
        </h3>
        <div className="text-sm text-primary-300 space-y-2">
          <p>• O login deve ser único no sistema</p>
          <p>• A senha não possui criptografia (ambiente de desenvolvimento)</p>
          <p>• Administradores podem criar outros administradores</p>
          <p>• Usuários criados poderão fazer login imediatamente</p>
        </div>
      </div>
    </div>
  );
}
