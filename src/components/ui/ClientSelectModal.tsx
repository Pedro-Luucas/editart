import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, X, User, Phone, FileText, Tag } from 'lucide-react';
import { Button } from "./button";
import { Client } from "../../types/client";

interface ClientSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  selectedClientId?: string;
}

export default function ClientSelectModal({ 
  isOpen, 
  onClose, 
  onSelect, 
  selectedClientId 
}: ClientSelectModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

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

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.nuit.includes(searchTerm) ||
    client.contact.includes(searchTerm) ||
    client.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSelect = (client: Client) => {
    onSelect(client);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl h-[90vh] m-4 bg-primary-800 border border-primary-600 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-600">
          <h2 className="text-xl font-bold text-primary-100 flex items-center gap-2">
            <User className="w-5 h-5 text-secondary-400" />
            Selecionar Cliente
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="p-2 text-primary-400 hover:text-primary-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-primary-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
            <input
              type="text"
              placeholder="Buscar por nome, NUIT, contato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark w-full pl-10 pr-4 py-3 rounded-lg"
            />
          </div>
          <p className="text-sm text-primary-400 mt-2">
            {filteredClients.length} cliente(s) encontrado(s)
            {searchTerm && ` de ${clients.length} total`}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          {error && (
            <div className="mb-4 p-4 bg-red-900/80 border border-red-600 rounded-lg backdrop-blur-sm">
              <p className="text-red-100 flex items-center gap-2">
                <X className="w-4 h-4" />
                Erro: {error}
              </p>
              <Button
                onClick={loadClients}
                variant="destructive"
                className="mt-2 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Tentar Novamente
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-secondary-400 border-t-transparent mx-auto mb-4"></div>
                <p className="text-primary-300">Carregando clientes...</p>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                <p className="text-primary-300 text-lg">
                  {searchTerm 
                    ? "Nenhum cliente encontrado com os critérios de busca." 
                    : "Nenhum cliente cadastrado ainda."}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    className="mt-4 px-6 py-2 rounded-lg font-medium hover-lift transition-all"
                  >
                    Limpar Busca
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto space-y-3">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all hover-lift
                    ${selectedClientId === client.id 
                      ? 'border-secondary-500 bg-secondary-500/10' 
                      : 'border-primary-600 hover:border-primary-500 bg-primary-800/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-primary-100">
                          {client.name}
                        </h3>
                        {selectedClientId === client.id && (
                          <span className="px-2 py-1 bg-secondary-500 text-primary-900 rounded-full text-xs font-semibold">
                            Selecionado
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400">NUIT:</span>
                          <span className="text-primary-200 font-mono">{client.nuit}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400">Contato:</span>
                          <span className="text-primary-200">{client.contact}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400">Categoria:</span>
                          <span className="inline-block px-2 py-1 bg-teal-600 text-primary-100 rounded-full text-xs font-semibold">
                            {client.category}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary-400" />
                          <span className="text-primary-400">Requisição:</span>
                          <span className="text-primary-200 truncate">{client.requisition}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-primary-600">
          <div className="flex justify-end gap-3">
            <Button
              onClick={onClose}
              variant="ghost"
              className="px-6 py-2 text-primary-300 hover:text-primary-100 font-medium transition-colors"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
