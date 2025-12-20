import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ToastProvider } from '../components/ui/Toast';

// Wrapper com providers necessários
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-exportar tudo
export * from '@testing-library/react';
export { customRender as render };
