import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Trash2, User, Shirt, Printer } from 'lucide-react';
import { Button } from "../ui/button";
import SidePanel from "../ui/SidePanel";
import ClientSelectModal from "../ui/ClientSelectModal";
import ClothesModal from "../ui/ClothesModal";

import { Order, OrderStatus } from "../../types/order";
import { Client } from "../../types/client";
import { Clothes, CLOTHING_TYPE_LABELS, SERVICE_TYPE_LABELS, SERVICE_LOCATION_LABELS } from "../../types/clothes";
import { Impression, IMPRESSION_MATERIAL_LABELS } from "../../types/impression";

interface OrderSidePanelProps {
  isOpen: boolean;
  editingOrder?: Order;
  onClose: () => void;
  onSave: (orderData: any) => void;
  impressions?: Impression[];
  onLoadImpressions?: (orderId: string) => void;
}

export default function OrderSidePanel({ 
  isOpen, 
  editingOrder, 
  onClose, 
  onSave,
  impressions = [],
  onLoadImpressions
}: OrderSidePanelProps) {
  console.log("IMPRESSION: OrderSidePanel rendered with impressions:", impressions);
  console.log("IMPRESSION: Number of impressions received:", impressions.length);
  // Estado interno do componente
  const [activeTab, setActiveTab] = useState<'details' | 'clothes' | 'impressions'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    client_id: '',
    due_date: '',
    iva: 16.0,
    discount: 0.0,
    status: 'order_received' as OrderStatus,
  });
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orderClothes, setOrderClothes] = useState<Clothes[]>([]);

  // Estado dos modais
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isClothesModalOpen, setIsClothesModalOpen] = useState(false);
  const [selectedOrderForClothes, setSelectedOrderForClothes] = useState<string | null>(null);

  // Inicializar dados quando editingOrder mudar
  useEffect(() => {
    if (editingOrder) {
      setFormData({
        name: editingOrder.name,
        client_id: editingOrder.client_id,
        due_date: editingOrder.due_date,
        iva: editingOrder.iva,
        discount: editingOrder.discount,
        status: editingOrder.status,
      });
      setSelectedClient({
        id: editingOrder.client_id,
        name: editingOrder.client_name,
        contact: editingOrder.client_contact,
        nuit: "",
        category: "",
        observations: "",
        created_at: "",
        updated_at: "",
        debt: editingOrder.debt,
      });
      // Sempre carregar as roupas quando uma ordem for editada
      loadOrderClothes(editingOrder.id);
    } else {
      setFormData({
        name: '',
        client_id: '',
        due_date: new Date().toISOString().split('T')[0],
        iva: 16.0,
        discount: 0.0,
        status: 'order_received' as OrderStatus,
      });
      setSelectedClient(null);
      setOrderClothes([]);
    }
  }, [editingOrder]);

  // Recarregar roupas quando mudar para a aba de produtos
  useEffect(() => {
    console.log("useEffect - activeTab:", activeTab, "editingOrder:", editingOrder?.id, "orderClothes.length:", orderClothes.length);
    if (activeTab === 'clothes' && editingOrder && orderClothes.length === 0) {
      console.log("useEffect - Recarregando roupas");
      loadOrderClothes(editingOrder.id);
    }
  }, [activeTab, editingOrder, orderClothes.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "iva" || name === "discount") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Por favor, digite um nome para o pedido");
      return;
    }

    if (!selectedClient) {
      alert("Por favor, selecione um cliente");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderData = {
        ...formData,
        client: selectedClient,
        clothes: orderClothes
      };
      
      await onSave(orderData);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido: " + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveTab('details');
    setFormData({
      name: '',
      client_id: '',
      due_date: '',
      iva: 16.0,
      discount: 0.0,
      status: 'order_received' as OrderStatus,
    });
    setSelectedClient(null);
    setOrderClothes([]);
    onClose();
  };

  const openClientModal = () => setIsClientModalOpen(true);
  const closeClientModal = () => setIsClientModalOpen(false);

  const openClothesModal = (orderId: string) => {
    setSelectedOrderForClothes(orderId);
    setIsClothesModalOpen(true);
  };

  const closeClothesModal = () => {
    setIsClothesModalOpen(false);
    setSelectedOrderForClothes(null);
  };

  const handleClothesAdded = () => {
    if (editingOrder) {
      loadOrderClothes(editingOrder.id);
    }
  };

  const loadOrderClothes = async (orderId: string) => {
    try {
      console.log("Carregando roupas para a ordem:", orderId);
      const clothes = await invoke<Clothes[]>("get_clothes_by_order_id", { orderId });
      console.log("Roupas carregadas:", clothes);
      setOrderClothes(clothes);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setOrderClothes([]);
    }
  };

  const handleTabChange = (tab: 'details' | 'clothes' | 'impressions') => {
    setActiveTab(tab);
    console.log("Mudando para aba:", tab, "editingOrder:", editingOrder?.id, "orderClothes.length:", orderClothes.length);
    console.log("IMPRESSION: Tab changed to:", tab);
    if (tab === 'impressions') {
      console.log("IMPRESSION: Switching to impressions tab");
      console.log("IMPRESSION: Current impressions count:", impressions.length);
      console.log("IMPRESSION: Current impressions data:", impressions);
      
      // Carregar impressões quando mudar para a tab de impressões
      if (editingOrder && onLoadImpressions) {
        console.log("IMPRESSION: Loading impressions for order:", editingOrder.id);
        onLoadImpressions(editingOrder.id);
      }
    }
    // Se mudar para a aba de produtos e temos uma ordem sendo editada, recarregar as roupas
    if (tab === 'clothes' && editingOrder && orderClothes.length === 0) {
      console.log("Recarregando roupas para a aba de produtos");
      loadOrderClothes(editingOrder.id);
    }
  };

  const handleDeleteClothes = async (clothesId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return;
    }

    try {
      const success = await invoke<boolean>("delete_clothes", { id: clothesId });
      if (success && editingOrder) {
        loadOrderClothes(editingOrder.id);
      }
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
      alert("Erro ao excluir produto: " + err);
    }
  };

  return (
    <>
      <SidePanel
        isOpen={isOpen}
        onClose={handleClose}
        onCancel={handleClose}
        onSave={activeTab === 'details' ? handleSubmit : undefined}
        title={editingOrder ? 'Editar Pedido' : 'Novo Pedido'}
        isLoading={isSubmitting}
      >
        {/* Tabs Navigation */}
        <div className="flex space-x-1 mb-6 bg-primary-800 p-1 rounded-lg">
          <button
            onClick={() => handleTabChange('details')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:text-white hover:bg-primary-700'
            }`}
          >
            Detalhes
          </button>
          <button
            onClick={() => handleTabChange('clothes')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'clothes'
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:text-white hover:bg-primary-700'
            }`}
          >
            Produtos
          </button>
          <button
            onClick={() => handleTabChange('impressions')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'impressions'
                ? 'bg-primary-600 text-white'
                : 'text-primary-300 hover:text-white hover:bg-primary-700'
            }`}
          >
            Impressões
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <div className="space-y-4">
            {/* Nome do pedido */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Nome do Pedido <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoComplete="off"
                className="input-dark w-full px-4 py-2 rounded-lg"
                placeholder="Digite um nome para identificar o pedido"
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Cliente <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedClient ? selectedClient.name : ""}
                  placeholder="Selecione um cliente"
                  readOnly
                  autoComplete="off"
                  className="input-dark flex-1 px-4 py-2 rounded-lg cursor-pointer"
                  onClick={openClientModal}
                />
                <Button
                  type="button"
                  onClick={openClientModal}
                  className="px-4 py-2 rounded-lg font-medium hover-lift"
                >
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Data de vencimento */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Data de Vencimento <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                required
                autoComplete="off"
                className="input-dark w-full px-4 py-2 rounded-lg"
              />
            </div>

            {/* IVA */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                IVA (%) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="iva"
                value={formData.iva}
                onChange={handleInputChange}
                required
                min="0"
                max="100"
                step="0.01"
                autoComplete="off"
                className="input-dark w-full px-4 py-2 rounded-lg"
                placeholder="16"
              />
            </div>

            {/* Desconto */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Desconto (valor absoluto)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                autoComplete="off"
                className="input-dark w-full px-4 py-2 rounded-lg"
                placeholder="0.00"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-primary-300 mb-2">
                Status <span className="text-red-400">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="input-dark w-full px-4 py-2 rounded-lg"
              >
                <option value="order_received">Pedido Recebido</option>
                <option value="in_production">Pedido na Produção</option>
                <option value="ready_for_delivery">Pedido Pronto pra Entrega</option>
                <option value="delivered">Pedido Entregue</option>
              </select>
            </div>

            {/* Nota sobre cálculos */}
            <div className="p-3 bg-primary-700/50 rounded-lg border border-primary-600">
              <p className="text-primary-300 text-sm">
                <strong>Nota:</strong> Os valores de subtotal e total serão calculados automaticamente 
                com base nos produtos adicionados.
              </p>
            </div>
          </div>
        ) : activeTab === 'clothes' ? (
          /* Clothes Tab */
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-primary-200">Produtos do Pedido</h3>
              <Button
                onClick={() => editingOrder && openClothesModal(editingOrder.id)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                Adicionar Produtos
              </Button>
            </div>

                          {/* Lista de produtos */}
            {orderClothes.length === 0 ? (
              <div className="text-center py-8 text-primary-400">
                <Shirt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum produto adicionado ainda.</p>
                                  <p className="text-sm">Clique em "Adicionar Produtos" para começar.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orderClothes.map((clothes) => (
                  <div key={clothes.id} className="bg-primary-800 p-4 rounded-lg border border-primary-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-primary-100">
                          {clothes.clothing_type === 'other' 
                            ? clothes.custom_type 
                            : CLOTHING_TYPE_LABELS[clothes.clothing_type] || clothes.clothing_type
                          }
                        </h4>
                        <p className="text-sm text-primary-300">Cor: {clothes.color}</p>
                      </div>
                      <Button
                        onClick={() => handleDeleteClothes(clothes.id)}
                        variant="destructive"
                        size="sm"
                        className="opacity-70 hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Tamanhos */}
                    <div className="mb-3">
                      <p className="text-sm text-primary-400 mb-1">Tamanhos:</p>
                      <div className="flex gap-2 text-sm">
                        {Object.entries(clothes.sizes).map(([size, qty]) => 
                          qty > 0 && (
                            <span key={size} className="bg-primary-700 px-2 py-1 rounded text-primary-200">
                              {size}: {qty}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-sm text-primary-300 mt-1">Total: {clothes.total_quantity} peças</p>
                    </div>

                    {/* Serviços */}
                    {clothes.services.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm text-primary-400 mb-1">Serviços:</p>
                        <div className="space-y-1">
                          {clothes.services.map((service) => (
                            <div key={service.id} className="text-sm text-primary-300 bg-primary-700 px-2 py-1 rounded">
                              {SERVICE_TYPE_LABELS[service.service_type]} - {' '}
                              {SERVICE_LOCATION_LABELS[service.location]}
                              {service.description && (
                                <span className="text-primary-400 italic"> - {service.description}</span>
                              )}
                              {' '} - {service.unit_price.toFixed(2)} MT
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preços */}
                    <div className="text-sm">
                      <div className="flex justify-between text-primary-300">
                        <span>Preço base: {clothes.unit_price.toFixed(2)} MT</span>
                        <span>Serviços: {clothes.services.reduce((sum, s) => sum + s.unit_price, 0).toFixed(2)} MT</span>
                      </div>
                      <div className="flex justify-between font-medium text-primary-100 mt-1 pt-1 border-t border-primary-600">
                        <span>Total:</span>
                        <span>{((clothes.unit_price + clothes.services.reduce((sum, s) => sum + s.unit_price, 0)) * clothes.total_quantity).toFixed(2)} MT</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Resumo total */}
                <div className="bg-green-900/30 p-4 rounded-lg border border-green-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-200">Total de Produtos:</span>
                    <span className="text-xl font-bold text-green-400">
                      {orderClothes.reduce((sum, clothes) => 
                        sum + ((clothes.unit_price + clothes.services.reduce((s, srv) => s + srv.unit_price, 0)) * clothes.total_quantity), 0
                      ).toFixed(2)} MT
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Impressions Tab */
          (() => {
            console.log("IMPRESSION: Rendering impressions tab content");
            console.log("IMPRESSION: impressions.length:", impressions.length);
            console.log("IMPRESSION: impressions data:", impressions);
            
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-primary-200">Impressões do Pedido</h3>
                </div>

                {/* Lista de impressões */}
                {impressions.length === 0 ? (
                  <div className="text-center py-8 text-primary-400">
                    {(() => {
                      console.log("IMPRESSION: Rendering empty state");
                      return null;
                    })()}
                    <Printer className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma impressão adicionada ainda.</p>
                    <p className="text-sm">As impressões serão exibidas aqui quando adicionadas ao pedido.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(() => {
                      console.log("IMPRESSION: Rendering impressions list");
                      return null;
                    })()}
                    {impressions.map((impression) => {
                      console.log("IMPRESSION: Rendering impression card:", impression);
                      return (
                  <div key={impression.id} className="bg-primary-800 p-4 rounded-lg border border-primary-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-primary-100">{impression.name}</h4>
                        <p className="text-sm text-primary-300">Tamanho: {impression.size}</p>
                      </div>
                    </div>

                    {/* Material */}
                    <div className="mb-3">
                      <p className="text-sm text-primary-400 mb-1">Material:</p>
                      <div className="text-sm text-primary-300 bg-primary-700 px-2 py-1 rounded">
                        {impression.material === 'other' 
                          ? impression.custom_material || 'Outros'
                          : IMPRESSION_MATERIAL_LABELS[impression.material]
                        }
                      </div>
                    </div>

                    {/* Descrição */}
                    {impression.description && (
                      <div className="mb-3">
                        <p className="text-sm text-primary-400 mb-1">Descrição:</p>
                        <p className="text-sm text-primary-300 bg-primary-700 px-2 py-1 rounded">
                          {impression.description}
                        </p>
                      </div>
                    )}

                    {/* Preço */}
                    <div className="text-sm">
                      <div className="flex justify-between font-medium text-primary-100 pt-1 border-t border-primary-600">
                        <span>Preço:</span>
                        <span>{impression.price.toFixed(2)} MT</span>
                      </div>
                    </div>
                  </div>
                  );
                })}

                    {/* Resumo total */}
                    <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-600">
                      {(() => {
                        const total = impressions.reduce((sum, impression) => sum + impression.price, 0);
                        console.log("IMPRESSION: Calculating total:", total);
                        return null;
                      })()}
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-blue-200">Total de Impressões:</span>
                        <span className="text-xl font-bold text-blue-400">
                          {impressions.reduce((sum, impression) => sum + impression.price, 0).toFixed(2)} MT
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </SidePanel>

      {/* Modal de seleção de cliente */}
      <ClientSelectModal
        isOpen={isClientModalOpen}
        onClose={closeClientModal}
        onSelect={handleClientSelect}
        selectedClientId={selectedClient?.id}
      />

                    {/* Modal de produtos */}
      {selectedOrderForClothes && isClothesModalOpen && (
        <ClothesModal
          isOpen={isClothesModalOpen}
          onClose={closeClothesModal}
          orderId={selectedOrderForClothes}
          onClothesAdded={handleClothesAdded}
        />
      )}
    </>
  );
}
