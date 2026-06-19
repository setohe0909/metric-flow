import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-950/15 border border-red-900/30 rounded-xl p-4 flex flex-col items-center justify-center text-center h-full min-h-[140px] space-y-1">
            <span className="text-red-400 text-xs font-bold">Error de Renderizado</span>
            <p className="text-[10px] text-slate-500 max-w-[200px] line-clamp-2">
              {this.state.error?.message || 'Ejes o datos no válidos para este gráfico.'}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
