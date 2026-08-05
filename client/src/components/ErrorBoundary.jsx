import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fffdf5', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#444', textAlign: 'center', padding: 24 }}>
          <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#777', margin: '8px 0 16px', maxWidth: 280, lineHeight: 1.5 }}>
            An unexpected error occurred. Your data is safe — reload to continue.
          </p>
          <button onClick={() => window.location.reload()} style={{ background: '#d97706', color: '#fff', border: 0, borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
