// client/src/components/common/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  showInfo = true,
  total = 0,
  limit = 20
}) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const debut = (page - 1) * limit + 1;
  const fin = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      {showInfo && (
        <p className="text-sm text-neutral-500">
          Affichage <span className="font-semibold text-neutral-700">{debut}</span> à{' '}
          <span className="font-semibold text-neutral-700">{fin}</span> sur{' '}
          <span className="font-semibold text-neutral-700">{total}</span> résultats
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {getPages().map((p, i) => (
          <button
            key={i}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={`
              min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium
              transition-colors
              ${p === page
                ? 'bg-primary-600 text-white'
                : p === '...'
                  ? 'cursor-default text-neutral-400'
                  : 'hover:bg-neutral-100 text-neutral-700'
              }
            `}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}