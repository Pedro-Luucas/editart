import { useState, useEffect } from "react";
import { X, Plus, Minus, Shirt } from 'lucide-react';
import { Button } from "./button";
import { 
  ClothingType, 
  ServiceType, 
  ServiceLocation, 
  ClothingSize, 
  SizesMap, 
  CreateClothes,
  CLOTHING_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  SERVICE_LOCATION_LABELS,
  CLOTHING_SIZES
} from "../../types/clothes";
import { useOrderStore } from "../../stores/orderStore";

interface ClothesModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onClothesAdded?: () => void;
}

interface ServiceFormData {
  service_type: ServiceType;
  location: ServiceLocation;
  description?: string;
  unit_price: number;
}

export default function ClothesModal({ isOpen, onClose, orderId, onClothesAdded }: ClothesModalProps) {
  console.log("🟠 ClothesModal renderizado com props:", { isOpen, orderId, onClothesAdded: !!onClothesAdded });
  console.log("🟠 ClothesModal - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
  
  // Store actions
  const addClothesToOrder = useOrderStore(state => state.addClothesToOrder);
  const loadOrders = useOrderStore(state => state.loadOrders);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Form state
  const [clothingType, setClothingType] = useState<ClothingType>('collared_tshirts');
  const [customType, setCustomType] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [color, setColor] = useState<string>("");
  const [sizes, setSizes] = useState<SizesMap>({
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    XXXL: 0
  });

  // Services state
  const [services, setServices] = useState<ServiceFormData[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [newService, setNewService] = useState<ServiceFormData>({
    service_type: 'embroidery',
    location: 'front_right',
    description: '',
    unit_price: 0
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    console.log("🟠 ClothesModal useEffect [isOpen] executado, isOpen:", isOpen);
    console.log("🟠 ClothesModal useEffect - Stack trace:", new Error().stack?.split('\n').slice(1, 4).join('\n'));
    if (isOpen) {
      console.log("🟠 ClothesModal - Resetando formulário");
      setClothingType('collared_tshirts');
      setCustomType("");
      setUnitPrice(0);
      setColor("");
      setSizes({ S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 });
      setServices([]);
      setShowServiceForm(false);
      setError("");
    }
  }, [isOpen]);

  console.log("🟠 ClothesModal - Estado interno atual:", {
    loading,
    error,
    clothingType,
    customType,
    unitPrice,
    color,
    sizes,
    services: services.length,
    showServiceForm
  });

  const handleSizeChange = (size: ClothingSize, value: number) => {
    setSizes(prev => ({
      ...prev,
      [size]: Math.max(0, value)
    }));
  };

  const addService = () => {
    if (newService.unit_price <= 0) {
      setError("Preço do serviço deve ser maior que 0");
      return;
    }

    // Check if same service+location combination already exists
    const exists = services.some(s => 
      s.service_type === newService.service_type && 
      s.location === newService.location
    );

    if (exists) {
      setError("Já existe um serviço deste tipo nesta localização");
      return;
    }

    setServices(prev => [...prev, { ...newService }]);
    setNewService({
      service_type: 'embroidery',
      location: 'front_right',
      description: '',
      unit_price: 0
    });
    setShowServiceForm(false);
    setError("");
  };

  const removeService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index));
  };

  const getTotalQuantity = (): number => {
    return Object.values(sizes).reduce((sum, qty) => sum + qty, 0);
  };

  const getServicesTotal = (): number => {
    return services.reduce((sum, service) => sum + service.unit_price, 0);
  };

  const getTotalPrice = (): number => {
    const totalQuantity = getTotalQuantity();
    const servicesTotal = getServicesTotal();
    return (unitPrice + servicesTotal) * totalQuantity;
  };

  const handleSubmit = async () => {
    console.log("🟠 ClothesModal.handleSubmit iniciado para orderId:", orderId);
    try {
      setLoading(true);
      setError("");

      // Validation
      if (!color.trim()) {
        console.log("🟠 Erro de validação: Cor é obrigatória");
        setError("Cor é obrigatória");
        return;
      }

      if (clothingType === 'other' && !customType.trim()) {
        setError("Tipo personalizado é obrigatório");
        return;
      }

      if (unitPrice < 0) {
        setError("Preço unitário não pode ser negativo");
        return;
      }

      const totalQuantity = getTotalQuantity();
      if (totalQuantity === 0) {
        setError("Deve especificar pelo menos uma quantidade");
        return;
      }

      const createClothesData: CreateClothes = {
        order_id: orderId,
        clothing_type: clothingType,
        custom_type: clothingType === 'other' ? customType : undefined,
        unit_price: unitPrice,
        sizes,
        color: color.trim(),
        services: services.map(s => ({
          service_type: s.service_type,
          location: s.location,
          description: s.description || undefined,
          unit_price: s.unit_price
        }))
      };

      console.log("🟠 Chamando store action para criar clothes:", createClothesData);
      
      const success = await addClothesToOrder(orderId, createClothesData);

      if (success) {
        console.log("🟠 Produto criado com sucesso através do store");
        
        // Also refresh orders to update totals
        await loadOrders();
        
        if (onClothesAdded) {
          console.log("🟠 Chamando onClothesAdded callback");
          onClothesAdded();
        }
      } else {
        throw new Error("Erro ao criar produto através do store");
      }
      
      console.log("🟠 Fechando modal");
      onClose();
    } catch (err) {
              console.error("Erro ao criar produto:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log("🟠 ClothesModal não renderizado - isOpen:", isOpen);
    return null;
  }
  
  console.log("🟠 ClothesModal será renderizado - isOpen:", isOpen, "orderId:", orderId);
  console.log("🟠 ClothesModal - Renderizando JSX completo");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-primary-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-700 bg-primary-900 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Shirt className="w-6 h-6 text-secondary-500" />
            <h2 className="text-xl font-semibold text-primary-100">Adicionar Produtos</h2>
          </div>
          <button
            onClick={() => {
              console.log("🟠 ClothesModal - Botão fechar clicado");
              onClose();
            }}
            className="text-primary-400 hover:text-primary-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-primary-800">
          {error && (
            <div className="bg-red-900/20 border border-red-700/30 text-red-300 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Tipo de Produto
              </label>
              <select
                value={clothingType}
                onChange={(e) => setClothingType(e.target.value as ClothingType)}
                className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400"
              >
                {Object.entries(CLOTHING_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {clothingType === 'other' && (
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-2">
                  Tipo Personalizado
                </label>
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  placeholder="Descreva o tipo de produto"
                  autoComplete="off"
                  className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Cor
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Azul, Vermelho, Branco"
                autoComplete="off"
                className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary-200 mb-2">
                Preço Unitário (MT)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setUnitPrice(value === '' ? 0 : parseFloat(value) || 0);
                }}
                placeholder="0.00"
                autoComplete="off"
                className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-3">
              Tamanhos e Quantidades
            </label>
            <div className="grid grid-cols-6 gap-2">
              {CLOTHING_SIZES.map(size => (
                <div key={size} className="text-center">
                  <label className="block text-sm font-medium text-primary-300 mb-2">
                    {size}
                  </label>
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleSizeChange(size, sizes[size] - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-500 rounded-l-md text-primary-200 hover:text-primary-100 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={sizes[size] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleSizeChange(size, value === '' ? 0 : parseInt(value) || 0);
                      }}
                      autoComplete="off"
                      className="w-16 h-8 text-center bg-primary-700 border-t border-b border-primary-600 focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleSizeChange(size, sizes[size] + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-primary-600 hover:bg-primary-500 rounded-r-md text-primary-200 hover:text-primary-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-primary-300">
              Total: {getTotalQuantity()} peças
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-primary-200">
                Serviços
              </label>
              <Button
                type="button"
                onClick={() => setShowServiceForm(true)}
                variant="outline"
                size="sm"
                className="bg-secondary-500 hover:bg-secondary-600 text-primary-900"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar Serviço
              </Button>
            </div>

            {/* Existing Services */}
            {services.length > 0 && (
              <div className="space-y-2 mb-4">
                {services.map((service, index) => (
                  <div key={index} className="flex items-center justify-between bg-primary-700 p-3 rounded-md border border-primary-600">
                                      <div className="flex-1">
                    <span className="font-medium text-primary-100">{SERVICE_TYPE_LABELS[service.service_type]}</span>
                    <span className="text-primary-400 mx-2">•</span>
                    <span className="text-primary-300">{SERVICE_LOCATION_LABELS[service.location]}</span>
                    {service.description && (
                      <>
                        <span className="text-primary-400 mx-2">•</span>
                        <span className="text-primary-300 italic">{service.description}</span>
                      </>
                    )}
                    <span className="text-primary-400 mx-2">•</span>
                    <span className="text-secondary-400 font-medium">{service.unit_price.toFixed(2)} MT</span>
                  </div>
                    <button
                      onClick={() => removeService(index)}
                      className="text-red-400 hover:text-red-300 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Service Form */}
            {showServiceForm && (
              <div className="bg-primary-700/50 p-4 rounded-md space-y-3 border border-primary-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Tipo de Serviço
                    </label>
                    <select
                      value={newService.service_type}
                      onChange={(e) => setNewService(prev => ({ ...prev, service_type: e.target.value as ServiceType }))}
                      className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100"
                    >
                      {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Localização
                    </label>
                    <select
                      value={newService.location}
                      onChange={(e) => setNewService(prev => ({ ...prev, location: e.target.value as ServiceLocation }))}
                      className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100"
                    >
                      {Object.entries(SERVICE_LOCATION_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-1">
                      Preço Unitário (MT)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newService.unit_price || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewService(prev => ({ ...prev, unit_price: value === '' ? 0 : parseFloat(value) || 0 }));
                      }}
                      placeholder="0.00"
                      autoComplete="off"
                      className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-200 mb-1">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={newService.description || ''}
                    onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Logo da empresa, Nome personalizado"
                    rows={3}
                    className="w-full px-3 py-2 bg-primary-700 border border-primary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 text-primary-100 placeholder-primary-400 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addService}
                    size="sm"
                    className="bg-secondary-500 hover:bg-secondary-600 text-primary-900"
                  >
                    Adicionar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowServiceForm(false)}
                    variant="outline"
                    size="sm"
                    className="bg-primary-500 border-primary-500 text-primary-300 hover:bg-primary-600 hover:text-primary-100"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          {getTotalQuantity() > 0 && (
            <div className="bg-primary-700/30 p-4 rounded-md border border-primary-600">
              <h3 className="font-medium text-primary-100 mb-2">Resumo de Preços</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-300">Preço base por peça:</span>
                  <span className="text-primary-100">{unitPrice.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-300">Serviços por peça:</span>
                  <span className="text-primary-100">{getServicesTotal().toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-300">Total por peça:</span>
                  <span className="text-primary-100">{(unitPrice + getServicesTotal()).toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-300">Quantidade total:</span>
                  <span className="text-primary-100">{getTotalQuantity()} peças</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t border-primary-600 pt-1">
                  <span className="text-primary-100">Total Geral:</span>
                  <span className="text-secondary-400">{getTotalPrice().toFixed(2)} MT</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-primary-700 bg-primary-900 rounded-b-lg">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => {
              console.log("🟠 ClothesModal - Botão submit clicado");
              handleSubmit();
            }}
            disabled={loading || getTotalQuantity() === 0}
            className="bg-secondary-500 hover:bg-secondary-600 text-primary-900"
          >
            {loading ? "Criando..." : "Adicionar Produtos"}
          </Button>
        </div>
      </div>
    </div>
  );
}
