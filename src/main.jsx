import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App runtime error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 30, fontFamily: "'Segoe UI', system-ui, sans-serif", background: '#fff', color: '#222' }}>
          <h1 style={{ color: '#b00020' }}>Erro de execução na aplicação</h1>
          <p>{this.state.error?.message || 'Erro desconhecido'}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#444' }}>{String(this.state.errorInfo?.componentStack || '')}</pre>
          <p>Abra o console F12 para mais detalhes.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
)
