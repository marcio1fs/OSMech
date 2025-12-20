import React from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, pageSize = 10, onPageSizeChange, pageSizeOptions = [10, 20, 50] }) => {
  const pagesToShow = 5;
  let start = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  let end = Math.min(totalPages, start + pagesToShow - 1);
  if (end - start < pagesToShow - 1) start = Math.max(1, end - pagesToShow + 1);

  const pages = [] as number[];
  for (let p = start; p <= end; p++) pages.push(p);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      onPageChange(Math.max(1, currentPage - 1));
    } else if (e.key === 'ArrowRight') {
      onPageChange(Math.min(totalPages, currentPage + 1));
    }
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-3">
        <div className="pagination" role="navigation" aria-label="pagination" tabIndex={0} onKeyDown={handleKeyDown}>
          <button aria-label="previous page" className="nav" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
            <ChevronLeft size={20} />
          </button>
          {start > 1 && (
            <button className="page" onClick={() => onPageChange(1)}>{1}</button>
          )}
          {start > 2 && <div className="page small">...</div>}

          {pages.map(p => (
            <button key={p} aria-current={p === currentPage ? 'page' : undefined} className={clsx('page', p === currentPage && 'active')} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ))}

          {end < totalPages - 1 && <div className="page small">...</div>}
          {end < totalPages && (
            <button className="page" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
          )}

          <button aria-label="next page" className="nav" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="small">Por página</label>
        <select value={pageSize} onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))} className="perpage">
          {pageSizeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Pagination;
