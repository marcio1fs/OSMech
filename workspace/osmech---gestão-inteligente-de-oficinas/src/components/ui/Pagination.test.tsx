import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders pages and responds to clicks', () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={10} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);

    // keyboard navigation (right arrow)
    const nav = screen.getByRole('navigation', { name: /pagination/i });
    fireEvent.keyDown(nav, { key: 'ArrowRight' });
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageSizeChange when select changes', () => {
    const onSize = vi.fn();
    render(<Pagination currentPage={1} totalPages={3} onPageChange={() => {}} onPageSizeChange={onSize} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '20' } });
    expect(onSize).toHaveBeenCalledWith(20);
  });
});
