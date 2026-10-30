import React from 'react';
import { logCrash } from '@/lib/crashLog';
import { estErreurMiseAJour, rechargerUneFois } from '@/lib/miseAJour';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Nouvelle version en ligne : on recharge sur la nouvelle version au lieu d'afficher le chat qui pleure
    if (estErreurMiseAJour(error) && rechargerUneFois()) return;
    void logCrash(error, errorInfo?.componentStack);
  }

  render() {
    if (this.state.hasError && estErreurMiseAJour(this.state.error)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
          <div className="space-y-3">
            <div className="text-5xl">✨</div>
            <p className="text-lg font-bold text-foreground">Nouvelle version de l'appli…</p>
            <button type="button" onClick={() => window.location.reload()} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 font-bold">Recharger</button>
          </div>
        </div>
      );
    }
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-6xl">😿</div>
            <h1 className="text-2xl font-bold text-foreground">Oups, quelque chose s'est mal passé !</h1>
            <p className="text-muted-foreground">
              Ne t'inquiète pas, ce n'est pas grave. Essaie de revenir à l'accueil.
            </p>
            {this.state.error && (
              <details className="text-left bg-muted rounded-lg p-3 text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium text-destructive">Détails de l'erreur (pour déboguer)</summary>
                <pre className="mt-2 whitespace-pre-wrap break-all">{this.state.error.toString()}</pre>
                {this.state.error.stack && (
                  <pre className="mt-1 whitespace-pre-wrap break-all text-[10px]">{this.state.error.stack}</pre>
                )}
              </details>
            )}
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Revenir à l'accueil
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
