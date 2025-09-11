import { Wallet, Edit, Trash2, Calendar } from 'lucide-react';
import { Button } from "../ui/button";
import { Impression, IMPRESSION_MATERIAL_LABELS } from "../../types/impression";
import { formatDateTime } from "../../utils/dateUtils";

interface ImpressionListProps {
  impressions: Impression[];
  onEdit?: (impression: Impression) => void;
  onDelete?: (impressionId: string) => void;
  showActions?: boolean;
}

export default function ImpressionList({ 
  impressions, 
  onEdit, 
  onDelete, 
  showActions = true 
}: ImpressionListProps) {
  if (impressions.length === 0) {
    return (
      <div className="text-center py-8 text-primary-400">
        <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma impressão cadastrada</p>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value);
  };

  return (
    <div className="space-y-3">
      {impressions.map((impression) => (
        <div
          key={impression.id}
          className="bg-primary-700 rounded-lg p-4 border border-primary-600 hover:border-primary-500 transition-colors"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-primary-100 mb-1 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-secondary-400" />
                {impression.name}
              </h4>
              <div className="text-sm text-primary-300 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-primary-400">Tamanho:</span>
                  <span className="font-medium">{impression.size}</span>
                </div>
                                 <div className="flex items-center gap-2">
                   <span className="text-primary-400">Material:</span>
                   <span className="font-medium">
                     {impression.material === 'other' 
                       ? `Outros: ${impression.custom_material || 'Não especificado'}`
                       : IMPRESSION_MATERIAL_LABELS[impression.material]
                     }
                   </span>
                 </div>
                {impression.description && (
                  <div className="flex items-start gap-2">
                    <span className="text-primary-400">Descrição:</span>
                    <span className="font-medium">{impression.description}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-lg font-bold text-secondary-400 mb-1">
                {formatCurrency(impression.price)}
              </div>
              <div className="text-xs text-primary-400">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(impression.created_at)}
                </div>
              </div>
            </div>
          </div>

          {showActions && (onEdit || onDelete) && (
            <div className="flex gap-2 pt-3 border-t border-primary-600">
              {onEdit && (
                <Button
                  onClick={() => onEdit(impression)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="w-3 h-3" />
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  onClick={() => onDelete(impression.id)}
                  size="sm"
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Excluir
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
