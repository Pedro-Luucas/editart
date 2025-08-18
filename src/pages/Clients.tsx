import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RotateCcw, Plus, Edit, Copy, Trash2, UserPlus, X } from 'lucide-react';
import SidePanel from "../components/ui/SidePanel";
import { formatDateTime } from "../utils/dateUtils";
import { Client } from "../types/client";

interface CreateClientDto {
  name: string;
  nuit: string;
  contact: string;
  category: string;
  requisition: string;
  observations: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // SidePanel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<CreateClientDto>({
    name: "",
    nuit: "",
    contact: "",
    category: "",
    requisition: "",
    observations: "",
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await invoke<Client[]>("list_clients");
      setClients(result);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      const success = await invoke<boolean>("delete_client", { id: clientId });
      if (success) {
        setClients(clients.filter(client => client.id !== clientId));
      } else {
        alert("Erro ao excluir cliente");
      }
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      alert("Erro ao excluir cliente: " + err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenPanel = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        nuit: client.nuit,
        contact: client.contact,
        category: client.category,
        requisition: client.requisition,
        observations: client.observations,
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: "",
        nuit: "",
        contact: "",
        category: "",
        requisition: "",
        observations: "",
      });
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingClient(null);
    setFormData({
      name: "",
      nuit: "",
      contact: "",
      category: "",
      requisition: "",
      observations: "",
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (editingClient) {
        // Update client (quando implementado)
        // await invoke("update_client", { id: editingClient.id, dto: formData });
        alert("Edição de clientes será implementada em breve");
      } else {
        // Create client
        await invoke("create_client", { dto: formData });
        await loadClients(); // Recarregar lista
      }
      
      handleClosePanel();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nuit.includes(searchTerm) ||
    client.contact.includes(searchTerm) ||
    client.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-primary-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gradient-secondary mb-2">
          Gestão de Clientes
        </h1>
        <p className="text-primary-300">
          Visualize, adicione e gerencie todos os clientes
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-60">
          <input
            type="text"
            placeholder="Buscar por nome, NUIT, contato ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-dark w-full px-4 py-2 rounded-lg"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadClients}
            disabled={loading}
            className="px-4 py-2 bg-teal-600 text-primary-100 rounded-lg font-medium hover-lift shadow-teal disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Atualizar'}
            </span>
          </button>
          <button
            onClick={() => handleOpenPanel()}
            className="px-4 py-2 bg-secondary-500 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 p-4 glass-effect rounded-lg">
        <p className="text-primary-100">
          <span className="font-bold text-secondary-400">
            {filteredClients.length}
          </span> cliente(s) encontrado(s)
          {searchTerm && (
            <span className="text-primary-400">
              {" "}de {clients.length} total
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      {error && (
        <div className="mb-8 p-6 bg-red-900/80 border border-red-600 rounded-xl backdrop-blur-sm">
          <p className="text-red-100 text-lg mb-4 flex items-center gap-2">
            <X className="w-5 h-5" />
            Erro: {error}
          </p>
          <button
            onClick={loadClients}
            className="px-6 py-3 bg-red-700 text-red-100 rounded-lg font-medium hover:bg-red-600 hover-lift transition-all"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondary-400 border-t-transparent mx-auto mb-6"></div>
          <p className="text-primary-300 text-lg">Carregando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="glass-effect p-12 text-center rounded-2xl">
          <p className="text-primary-300 mb-8 text-lg">
            {searchTerm 
              ? "Nenhum cliente encontrado com os critérios de busca." 
              : "Nenhum cliente cadastrado ainda."}
          </p>
          {!searchTerm && (
                      <button
            onClick={() => handleOpenPanel()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-secondary-500 text-primary-900 rounded-xl font-semibold text-lg hover-lift shadow-secondary transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            Cadastrar Primeiro Cliente
          </button>
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="inline-block px-8 py-4 bg-olive-600 text-primary-100 rounded-xl font-semibold text-lg hover-lift shadow-olive transition-all duration-200"
            >
              Limpar Busca
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="glass-effect p-5 rounded-xl hover-lift">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div className="flex-1 min-w-80">
                  <div className="flex flex-wrap gap-6 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-primary-100 mb-1">
                        {client.name}
                      </h3>
                      <p className="text-primary-400 text-sm">
                        NUIT: <span className="text-secondary-400 font-mono font-semibold">{client.nuit}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Contato</p>
                      <p className="text-primary-100 font-semibold">{client.contact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Categoria</p>
                      <span className="inline-block px-3 py-1 bg-teal-600 text-primary-100 rounded-full text-sm font-semibold shadow-teal">
                        {client.category}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Requisição</p>
                      <p className="text-primary-200 text-sm leading-relaxed">{client.requisition}</p>
                    </div>
                    {client.observations && (
                      <div>
                        <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Observações</p>
                        <p className="text-primary-200 text-sm leading-relaxed">{client.observations}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-primary-400 border-t border-primary-600 pt-3">
                    <div>
                      <span className="text-primary-500 font-medium">Criado:</span>{" "}
                      <span className="text-primary-300">{formatDateTime(client.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-primary-500 font-medium">Atualizado:</span>{" "}
                      <span className="text-primary-300">{formatDateTime(client.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOpenPanel(client)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-600 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary transition-all text-sm"
                    title="Editar cliente"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(client.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-primary-100 rounded-lg font-medium hover-lift shadow-olive transition-all text-sm"
                    title="Copiar ID"
                  >
                    <Copy className="w-4 h-4" />
                    ID
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-700 text-red-100 rounded-lg font-medium hover:bg-red-600 hover-lift transition-all text-sm"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SidePanel para adicionar/editar cliente */}
      <SidePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onCancel={handleClosePanel}
        onSave={handleSubmit}
        title={editingClient ? 'Editar Cliente' : 'Novo Cliente'}
        isLoading={isSubmitting}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="Nome completo do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              NUIT <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nuit"
              value={formData.nuit}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg font-mono"
              placeholder="Número único de identificação tributária"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Contato <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="Telefone, email ou outros contatos"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Categoria <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="Categoria do cliente"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Requisição <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="requisition"
              value={formData.requisition}
              onChange={handleInputChange}
              required
              className="input-dark w-full px-4 py-2 rounded-lg"
              placeholder="Tipo de requisição ou serviço"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary-300 mb-2">
              Observações
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              rows={4}
              className="input-dark w-full px-4 py-2 rounded-lg resize-vertical"
              placeholder="Observações adicionais (opcional)"
            />
          </div>
        </div>
      </SidePanel>
    </div>
  );
}
