import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './button';

interface SidePanelProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function SidePanel({
  isOpen,
  title,
  children,
  onSave,
  onCancel,
  onClose,
  isLoading = false,
}: SidePanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 w-full max-w-2xl h-full bg-primary-900 z-50 shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-primary-700 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between p-4 border-b border-primary-700 flex-shrink-0 bg-primary-800">
          <h2 className="text-lg font-semibold text-primary-100">{title}</h2>
          <Button 
            onClick={onClose} 
            variant="ghost"
            size="icon"
            className="text-primary-400 hover:text-primary-200 transition-colors p-1 rounded"
          >
            <span className="sr-only">Fechar</span>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-grow overflow-y-auto p-4">
          {children}
        </div>

        {/* Footer fixo */}
        {(onCancel || onSave) && (
          <div className="flex items-center justify-end gap-3 p-4 border-t border-primary-700 flex-shrink-0 bg-primary-800">
            {onCancel && (
              <Button
                onClick={onCancel}
                variant="outline"
                className="px-4 py-2 text-primary-300 rounded-lg text-sm hover:text-primary-100 transition-all"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
            {onSave && (
              <Button
                onClick={onSave}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 min-w-20 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 flex-shrink-0" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
