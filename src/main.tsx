import React from 'react';
import { createRoot } from 'react-dom/client';
import "leaflet/dist/leaflet.css";
import "./index.css";
import App from './App';

class GlobalErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#ffebee', color: '#b71c1c', border: '1px solid #ef9a9a', borderRadius: '4px', margin: '20px', fontFamily: 'sans-serif', zIndex: 99999, position: 'relative' }}>
          <h2 style={{marginTop: 0}}>Critical Rendering Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', background: '#ffcdd2', padding: '10px', borderRadius: '4px', overflowX: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log("[main.tsx] Mounting React app...");

const rootElement = document.getElementById("root");
console.log("[main.tsx] Root element:", rootElement);

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          <div style={{ display: 'contents' }} id="app-root-wrapper">
            <App />
          </div>
        </GlobalErrorBoundary>
      </React.StrictMode>
    );
    console.log("[main.tsx] React render command executed successfully");
  } catch (error) {
    console.error("Error during React rendering:", error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red;"><h1>App failed to start correctly:</h1><pre>${String(error)}</pre></div>`;
  }
}
