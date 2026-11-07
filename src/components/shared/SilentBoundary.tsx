import React from 'react';
import { logBlocCache } from '@/lib/crashLog';

/** Protège un petit bloc : s'il plante, il disparaît sans empêcher le reste de l'écran de s'ouvrir */
export class SilentBoundary extends React.Component<{ children: React.ReactNode; name?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: Error) {
    console.error(`${this.props.name ?? 'Bloc'} :`, e);
    void logBlocCache(this.props.name ?? 'Bloc sans nom', e); // visible dans le Monitoring (2026-11-07)
  }
  render() { return this.state.failed ? null : this.props.children; }
}
