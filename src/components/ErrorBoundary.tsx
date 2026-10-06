import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error no controlado en la aplicación', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-loading" style={{ flexDirection: 'column', gap: 16 }}>
          <div>Ocurrió un error inesperado.</div>
          <button className="btn" onClick={() => window.location.reload()}>Recargar la página</button>
        </div>
      );
    }
    return this.props.children;
  }
}
