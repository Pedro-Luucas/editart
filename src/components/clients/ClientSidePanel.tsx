import { useState, useEffect } from "react";
import { Plus, X } from 'lucide-react';
import { Button } from "../ui/button";
import SidePanel from "../ui/SidePanel";

import { Client } from "../../types/client";

interface CreateClientDto {
  name: string;
  nuit: string;
  contact: string;
  category: string;
  observations: string;
}

interface ClientSidePanelProps {
  isOpen: boolean;
  editingClient?: Client;
  onClose: () => void;
  onSave: (clientData: CreateClientDto) => void;
}

export default function ClientSidePanel({ 
  isOpen, 
  editingClient, 
  onClose, 
  onSave 
}: ClientSidePanelProps) {
  // Estado interno do componente
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateClientDto>({
    name: "",
    nuit: "",
    contact: "",
    category: "",
    observations: "",
  });
  const [contatos, setContatos] = useState<string[]>([]);
  const [novoContato, setNovoContato] = useState("");

  // Inicializar dados quando editingClient mudar
  useEffect(() => {
    if (editingClient) {
      setFormData({
        name: editingClient.name,
        nuit: editingClient.nuit,
        contact: editingClient.contact,
        category: editingClient.category,
        observations: editingClient.observations,
      });
      // Converter o contato único em array para compatibilidade
      setContatos([editingClient.contact]);
    } else {
      setFormData({
        name: "",
        nuit: "",
        contact: "",
        category: "",
        observations: "",
      });
      setContatos([]);
    }
    setNovoContato("");
  }, [editingClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddContato = () => {
    if (novoContato.trim() && !contatos.includes(novoContato.trim())) {
      setContatos(prev => [...prev, novoContato.trim()]);
      setNovoContato("");
    }
  };

  const handleRemoveContato = (index: number) => {
    setContatos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Por favor, digite um nome para o cliente");
      return;
    }

    if (!formData.nuit.trim()) {
      alert("Por favor, digite o NUIT do cliente");
      return;
    }

    if (contatos.length === 0) {
      alert("Por favor, adicione pelo menos um contato");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const clientData = {
        ...formData,
        contact: contatos.join(",") // Converter array para string separada por vírgula
      };
      
      await onSave(clientData);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      nuit: "",
      contact: "",
      category: "",
      observations: "",
    });
    setContatos([]);
    setNovoContato("");
    onClose();
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={handleClose}
      onCancel={handleClose}
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
            autoComplete="off"
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
            autoComplete="off"
            className="input-dark w-full px-4 py-2 rounded-lg font-mono"
            placeholder="Número único de identificação tributária"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary-300 mb-2">
            Contatos <span className="text-red-400">*</span>
          </label>
          
          {/* Campo para adicionar novo contato */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={novoContato}
              onChange={(e) => setNovoContato(e.target.value)}
              placeholder="Telefone, email ou outros contatos"
              autoComplete="off"
              className="input-dark flex-1 px-4 py-2 rounded-lg"
              onKeyPress={(e) => e.key === 'Enter' && handleAddContato()}
            />
            <Button
              type="button"
              onClick={handleAddContato}
              disabled={!novoContato.trim()}
              className="px-4 py-2 rounded-lg font-medium hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Lista de contatos */}
          {contatos.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-primary-400 uppercase tracking-wide">Contatos adicionados:</p>
              {contatos.map((contato, index) => (
                <div key={index} className="flex items-center gap-2 bg-primary-800 p-3 rounded-lg border border-primary-600">
                  <span className="flex-1 text-primary-100 text-sm">{contato}</span>
                  <Button
                    type="button"
                    onClick={() => handleRemoveContato(index)}
                    variant="destructive"
                    size="sm"
                    className="opacity-70 hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
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
            autoComplete="off"
            className="input-dark w-full px-4 py-2 rounded-lg"
            placeholder="Categoria do cliente"
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
  );
}
