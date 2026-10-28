import React from 'react';

/** Protège un petit bloc : s'il plante, il disparaît sans empêcher le reste de l'écran de s'ouvrir */
export class SilentBoundary extends React.Component<{ children: React.ReactNode; name?: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: Error) { console.error(`${this.props.name ?? 'Bloc'} :`, e); }
  render() { return this.state.failed ? null : this.props.children; }
}
