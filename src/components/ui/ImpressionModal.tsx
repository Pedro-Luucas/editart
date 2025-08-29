import { useState, useEffect } from "react";
import { X, Wallet } from 'lucide-react';
import { Button } from "./button";
import { 
  ImpressionMaterial, 
  CreateImpression,
  IMPRESSION_MATERIAL_LABELS,
  IMPRESSION_MATERIALS
} from "../../types/impression";
import { useImpressionStore } from "../../stores/impressionStore";

interface ImpressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onImpressionAdded?: () => void;
}

export default function ImpressionModal({ isOpen, onClose, orderId, onImpressionAdded }: ImpressionModalProps) {
  console.log("🟠 ImpressionModal renderizado com props:", { isOpen, orderId, onImpressionAdded: !!onImpressionAdded });
  
  // Store actions
  const addImpression = useImpressionStore(state => state.addImpression);
  const closeModal = useImpressionStore(state => state.closeModal);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Form state
  const [name, setName] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [material, setMaterial] = useState<ImpressionMaterial>('vinyl_white');
  const [customMaterial, setCustomMaterial] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [price, setPrice] = useState<number>(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    console.log("🟠 ImpressionModal useEffect [isOpen] executado, isOpen:", isOpen);
    if (isOpen) {
      console.log("🟠 ImpressionModal - Resetando formulário");
      setName("");
      setSize("");
      setMaterial('vinyl_white');
      setCustomMaterial("");
      setDescription("");
      setPrice(0);
      setError("");
    }
  }, [isOpen]);

  console.log("🟠 ImpressionModal - Estado interno atual:", {
    loading,
    error,
    name,
    size,
    material,
    customMaterial,
    description,
    price
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !size.trim() || price <= 0) {
      setError("Nome, tamanho e preço são obrigatórios");
      return;
    }

    // Se material for "other", validar que o material customizado foi especificado
    if (material === 'other' && !customMaterial.trim()) {
      setError("Por favor, especifique o material quando selecionar 'Outros'");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const impressionData: CreateImpression = {
        order_id: orderId,
        name: name.trim(),
        size: size.trim(),
        material,
        custom_material: material === 'other' ? customMaterial.trim() : undefined,
        description: description.trim(),
        price
      };

      console.log("🟠 ImpressionModal - Dados para criar impressão:", impressionData);

      // Criar impressão usando o store
      const newImpression = await addImpression(impressionData);
      
      if (newImpression) {
        console.log("🟠 ImpressionModal - Impressão criada com sucesso:", newImpression);
        
        if (onImpressionAdded) {
          onImpressionAdded();
        }
        
        closeModal();
      } else {
        setError("Erro ao criar impressão. Verifique os dados e tente novamente.");
      }
    } catch (err) {
      console.error("🟠 ImpressionModal - Erro ao criar impressão:", err);
      setError("Erro ao criar impressão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary-100 flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Adicionar Impressão
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-primary-400 hover:text-primary-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primeira coluna */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Nome da Impressão */}
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">
                  Nome da Impressão *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Ex: Logo da empresa, Banner promocional..."
                  required
                />
              </div>

              {/* Tamanho */}
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">
                  Tamanho *
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="Ex: 1m x 2m, A4, 50cm x 30cm..."
                  required
                />
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">
                  Material *
                </label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value as ImpressionMaterial)}
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  required
                >
                  {IMPRESSION_MATERIALS.map((mat) => (
                    <option key={mat} value={mat}>
                      {IMPRESSION_MATERIAL_LABELS[mat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material Customizado (quando "Outros" for selecionado) */}
              {material === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-primary-300 mb-2">
                    Especificar Material *
                  </label>
                  <input
                    type="text"
                    value={customMaterial}
                    onChange={(e) => setCustomMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                    placeholder="Ex: Tecido de algodão, Papel fotográfico, Lona..."
                    required
                  />
                </div>
              )}
            </div>

            {/* Segunda coluna */}
            <div className="space-y-4">
              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">
                  Preço (MZN) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-primary-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-lg text-primary-100 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent resize-none"
                  placeholder="Detalhes técnicos, especificações, observações..."
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-400 text-sm bg-red-900 bg-opacity-20 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-secondary-600 hover:bg-secondary-700"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Impressão"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
