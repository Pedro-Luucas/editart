import { useState, useEffect, useMemo, useCallback } from "react";
import { RotateCcw, Plus, Edit, Copy, Trash2, UserPlus, X } from 'lucide-react';
import { Button } from "../components/ui/button";
import { formatDateOnly } from "../utils/dateUtils.ts";
import { Client } from "../types/client";
import ClientSidePanel from "../components/clients/ClientSidePanel";
import { 
  useClients, 
  useClientsLoading, 
  useClientsError, 
  useSearchTerm, 
  useLoadClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  useSetSearchTerm,
  useGetFilteredClients
} from "../stores/clientStore";

export default function Clients() {
  // ===== STORE HOOKS =====
  const clients = useClients();
  const loading = useClientsLoading();
  const error = useClientsError();
  const searchTerm = useSearchTerm();
  
  // ===== ACTION HOOKS =====
  const loadClients = useLoadClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const setSearchTerm = useSetSearchTerm();
  const getFilteredClients = useGetFilteredClients();
  
  // ===== LOCAL STATE (apenas para UI específica) =====
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Debug: log para ver quantas vezes o componente renderiza
  console.log("🟢 Clients component renderizado");

  useEffect(() => {
    console.log("🟢 useEffect loadClients executado");
    loadClients();
  }, [loadClients]);

  // ===== COMPUTED VALUES (MEMOIZADOS) =====
  const filteredClients = useMemo(() => {
    console.log("🟢 useMemo filteredClients executado");
    return getFilteredClients();
  }, [clients, searchTerm, getFilteredClients]);

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) {
      return;
    }

    try {
      const success = await deleteClient(clientId);
      if (!success) {
        alert("Erro ao excluir cliente");
      }
    } catch (err) {
      console.error("Erro ao excluir cliente:", err);
      alert("Erro ao excluir cliente: " + err);
    }
  };

  const handleOpenPanel = (client?: Client) => {
    if (client) {
      setEditingClient(client);
    } else {
      setEditingClient(null);
    }
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = async (clientData: any) => {
    try {
      if (editingClient) {
        // Update client
        const success = await updateClient(editingClient.id, clientData);
        if (success) {
          handleClosePanel();
        } else {
          alert("Erro ao atualizar cliente");
        }
      } else {
        // Create client
        const newClient = await createClient(clientData);
        if (newClient) {
          handleClosePanel();
        } else {
          alert("Erro ao criar cliente");
        }
      }
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente: " + error);
    }
  };

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
          <Button
            onClick={loadClients}
            disabled={loading}
            variant="secondary"
            className="px-4 py-2 rounded-lg font-medium hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Atualizar'}
            </span>
          </Button>
          <Button
            onClick={() => handleOpenPanel()}
            className="px-4 py-2 rounded-lg font-medium hover-lift"
          >
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Cliente
            </span>
          </Button>
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
          <Button
            onClick={loadClients}
            variant="destructive"
            className="px-6 py-3 rounded-lg font-medium hover-lift transition-all"
          >
            Tentar Novamente
          </Button>
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
            <Button
              onClick={() => handleOpenPanel()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-200"
            >
              <UserPlus className="w-5 h-5" />
              Cadastrar Primeiro Cliente
            </Button>
          )}
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm("")}
              className="inline-block px-8 py-4 rounded-xl font-semibold text-lg hover-lift transition-all duration-200"
            >
              Limpar Busca
            </Button>
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
                      <div className="text-primary-100 font-semibold">
                        {client.contact.split(',').map((contact, index) => (
                          <p key={index} className="mb-1 last:mb-0">
                            {contact.trim()}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Categoria</p>
                      <span className="inline-block px-3 py-1 bg-teal-600 text-primary-100 rounded-full text-sm font-semibold shadow-teal">
                        {client.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Dívida</p>
                      <div className={`text-lg font-bold ${client.debt > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {client.debt > 0 ? (
                          <span className="flex items-center gap-1">
                            <span className="text-red-300">-</span>
                            {client.debt.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'MZN' 
                            })}
                          </span>
                        ) : (
                          <span className="text-green-300">
                            {client.debt.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'MZN' 
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      <span className="text-primary-300">{formatDateOnly(client.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-primary-400 mb-1 uppercase tracking-wide">Atualizado:</span>{" "}
                      <span className="text-primary-300">{formatDateOnly(client.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => handleOpenPanel(client)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
                    title="Editar cliente"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => handleDeleteClient(client.id)}
                    variant="destructive"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover-lift transition-all text-sm"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ClientSidePanel para adicionar/editar cliente */}
      <ClientSidePanel
        isOpen={isPanelOpen}
        editingClient={editingClient || undefined}
        onClose={handleClosePanel}
        onSave={handleSaveClient}
      />
    </div>
  );
}
