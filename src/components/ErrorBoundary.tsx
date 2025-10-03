import React from 'react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary to catch React component errors and display fallback UI
 * Prevents entire app from crashing when a component throws an error
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('Component error caught by ErrorBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    this.props.onReset?.();
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4 text-center">
            <div className="text-6xl">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground">
              Une erreur est survenue
            </h2>
            <p className="text-muted-foreground">
              {this.state.error?.message || 'Une erreur inattendue s\'est produite'}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <details className="text-left text-sm bg-muted p-4 rounded-md">
                <summary className="cursor-pointer font-semibold mb-2">
                  Détails de l'erreur (dev only)
                </summary>
                <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-64">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Réessayer
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
