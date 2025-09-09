import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
  onItemsPerPageChange: (items: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 glass-effect rounded-lg">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary-300">Itens por página:</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className="bg-primary-800 border border-primary-600 text-primary-100 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* Items info */}
      <div className="text-sm text-primary-300">
        Mostrando {startItem} a {endItem} de {totalItems} itens
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="sm"
          className="px-2 py-1"
          title="Primeira página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          size="sm"
          className="px-2 py-1"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-primary-400">...</span>
              ) : (
                <Button
                  onClick={() => onPageChange(page as number)}
                  variant={currentPage === page ? "default" : "secondary"}
                  size="sm"
                  className={`px-3 py-1 ${
                    currentPage === page
                      ? 'bg-secondary-600 text-primary-100'
                      : 'hover:bg-primary-700'
                  }`}
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next page */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="secondary"
          size="sm"
          className="px-2 py-1"
          title="Próxima página"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          variant="secondary"
          size="sm"
          className="px-2 py-1"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
