import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Aqui você poderia enviar para um serviço de monitoramento
    // reportErrorToService(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="bg-red-500 p-6 text-center">
              <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Oops! Algo deu errado</h1>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-center">
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada.
              </p>

              {/* Error details (collapsible) */}
              {this.state.error && (
                <details className="bg-slate-50 rounded-lg p-4">
                  <summary className="font-medium text-slate-700 cursor-pointer text-sm">
                    Detalhes técnicos
                  </summary>
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-red-600 font-mono break-all">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-slate-500 overflow-auto max-h-32 mt-2">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                >
                  <Home size={18} />
                  Página Inicial
                </button>
                <button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCcw size={18} />
                  Recarregar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
