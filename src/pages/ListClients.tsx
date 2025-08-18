import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { formatDateTime } from "../utils/dateUtils";
import { Client } from "../types/client";

export default function ListClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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
          Lista de Clientes
        </h1>
        <p className="text-primary-300">
          Visualize e gerencie todos os clientes cadastrados
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
            {loading ? (
              <span className="flex items-center gap-1">
                <span className="animate-spin text-sm">⟳</span>
                Carregando...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                🔄 Atualizar
              </span>
            )}
          </button>
          <a
            href="#create-client"
            className="px-4 py-2 bg-secondary-500 text-primary-900 rounded-lg font-medium hover-lift shadow-secondary"
          >
            <span className="flex items-center gap-1">
              ➕ Novo Cliente
            </span>
          </a>
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
          <p className="text-red-100 text-lg mb-4">❌ Erro: {error}</p>
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
            <a
              href="#create-client"
              className="inline-block px-8 py-4 bg-secondary-500 text-primary-900 rounded-xl font-semibold text-lg hover-lift shadow-secondary transition-all duration-200"
            >
              Cadastrar Primeiro Cliente
            </a>
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
                    onClick={() => navigator.clipboard.writeText(client.id)}
                    className="px-4 py-2 bg-olive-600 text-primary-100 rounded-lg font-medium hover-lift shadow-olive transition-all text-sm"
                    title="Copiar ID"
                  >
                    📋 ID
                  </button>
                  <button
                    onClick={() => handleDeleteClient(client.id)}
                    className="px-4 py-2 bg-red-700 text-red-100 rounded-lg font-medium hover:bg-red-600 hover-lift transition-all text-sm"
                    title="Excluir cliente"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
