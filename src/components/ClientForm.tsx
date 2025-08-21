import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";

interface CreateClientDto {
  name: string;
  nuit: string;
  contact: string;
  category: string;
  requisition: string;
  observations: string;
}

export default function ClientForm() {
  const [formData, setFormData] = useState<CreateClientDto>({
    name: "",
    nuit: "",
    contact: "",
    category: "",
    requisition: "",
    observations: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const result = await invoke("create_client", { dto: formData });
      console.log("Client created:", result);
      setMessage("Cliente criado com sucesso!");
      
      // Reset form
      setFormData({
        name: "",
        nuit: "",
        contact: "",
        category: "",
        requisition: "",
        observations: "",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      setMessage(`Erro ao criar cliente: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-primary-100 mb-6 text-center">
        Cadastrar Novo Cliente
      </h2>
      
      <form onSubmit={handleSubmit} className="glass-effect p-6 rounded-xl">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-primary-300 mb-2">
            Nome *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="nuit" className="block text-sm font-medium text-primary-300 mb-2">
            NUIT *
          </label>
          <input
            type="text"
            id="nuit"
            name="nuit"
            value={formData.nuit}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contact" className="block text-sm font-medium text-primary-300 mb-2">
            Contato *
          </label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-primary-300 mb-2">
            Categoria *
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="requisition" className="block text-sm font-medium text-primary-300 mb-2">
            Requisição *
          </label>
          <input
            type="text"
            id="requisition"
            name="requisition"
            value={formData.requisition}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="observations" className="block text-sm font-medium text-primary-300 mb-2">
            Observações
          </label>
          <textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleInputChange}
            rows={3}
            disabled={isLoading}
            className="input-dark w-full px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed resize-vertical min-h-[80px]"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full py-3 rounded-lg font-semibold hover-lift disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin text-sm">⟳</span>
              Cadastrando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>✨</span>
              Cadastrar Cliente
            </span>
          )}
        </Button>
      </form>

      {message && (
        <div className={`mt-4 p-4 rounded-lg font-medium text-center transition-all duration-300 ${
          message.includes("Erro") 
            ? "bg-red-900/80 text-red-100 border border-red-600 backdrop-blur-sm" 
            : "bg-teal-900/80 text-teal-100 border border-teal-600 backdrop-blur-sm shadow-teal"
        }`}>
          <span className="flex items-center justify-center gap-2">
            <span>{message.includes("Erro") ? "❌" : "✅"}</span>
            {message}
          </span>
        </div>
      )}
    </div>
  );
}
