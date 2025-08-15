import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

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
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8 text-center">
        Cadastrar Novo Cliente
      </h2>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="nuit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="requisition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="mb-8">
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleInputChange}
            rows={4}
            disabled={isLoading}
            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical min-h-[100px]"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="w-full py-4 bg-blue-600 text-white rounded-lg font-medium text-lg transition-all duration-300 hover:bg-blue-700 hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
        >
          {isLoading ? "Cadastrando..." : "Cadastrar Cliente"}
        </button>
      </form>

      {message && (
        <div className={`mt-6 p-4 rounded-lg font-medium text-center transition-all duration-300 ${
          message.includes("Erro") 
            ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700" 
            : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
