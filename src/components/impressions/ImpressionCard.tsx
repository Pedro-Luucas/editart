import React from 'react';
import { Trash2, Wallet } from 'lucide-react';
import { Button } from "../ui/button";
import { Impression, IMPRESSION_MATERIAL_LABELS } from "../../types/impression";
import { formatDateTime } from "../../utils/dateUtils";

interface ImpressionCardProps {
  impression: Impression;
  index: number;
  onDelete?: (impressionId: string) => void;
  deletingImpression?: string | null;
}

export default function ImpressionCard({ 
  impression, 
  index, 
  onDelete, 
  deletingImpression 
}: ImpressionCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  return (
    <div className="bg-primary-800 p-5 rounded-lg border border-primary-600">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-primary-100 mb-1 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-secondary-400" />
            {impression.name}
          </h3>
          <p className="text-primary-300">
            {impression.material === 'other' 
              ? `Outros: ${impression.custom_material || 'Não especificado'}`
              : IMPRESSION_MATERIAL_LABELS[impression.material]
            }
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-primary-400">Item #{index + 1}</p>
          <p className="text-lg font-bold text-secondary-400">
            {formatCurrency(impression.price)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Size and Material */}
        <div>
          <label className="block text-sm font-medium text-primary-400 mb-2">Tamanho</label>
          <div className="flex flex-wrap gap-2">
            <span className="bg-primary-700 px-3 py-1 rounded-full text-primary-200 text-sm font-medium">
              {impression.size}
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <label className="block text-sm font-medium text-primary-400 mb-2">Preço</label>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-primary-300">Preço total:</span>
              <span className="text-primary-200 font-medium">{formatCurrency(impression.price)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Material */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-primary-400 mb-2">Material</label>
        <div className="flex flex-wrap gap-2">
          <span className="bg-primary-700 px-3 py-1 rounded-full text-primary-200 text-sm font-medium">
            {impression.material === 'other' 
              ? impression.custom_material || 'Não especificado'
              : IMPRESSION_MATERIAL_LABELS[impression.material]
            }
          </span>
        </div>
      </div>

      {/* Description */}
      {impression.description && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary-400 mb-2">Descrição</label>
          <div className="bg-primary-700 p-3 rounded-lg border border-primary-600">
            <p className="text-primary-200 text-sm">{impression.description}</p>
          </div>
        </div>
      )}

      {/* Creation Date */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-primary-400 mb-2">Criado em</label>
        <p className="text-primary-300 text-sm">{formatDateTime(impression.created_at)}</p>
      </div>

      {/* Delete Button */}
      {onDelete && (
        <Button
          onClick={() => onDelete(impression.id)}
          variant="ghost"
          size="sm"
          className="mt-4 text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-600/30 hover:border-red-500/50"
          disabled={deletingImpression === impression.id}
        >
          {deletingImpression === impression.id ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400 border-t-transparent mr-2"></div>
          ) : (
            <Trash2 className="w-4 h-4 mr-2" />
          )}
          Excluir Impressão
        </Button>
      )}
    </div>
  );
}
