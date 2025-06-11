import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Add error boundary at the root level
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render application:', error);
  
  // Render fallback UI on critical error
  rootElement.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; padding: 20px; text-align: center;">
      <h1 style="color: #e11d48; margin-bottom: 16px;">Application Error</h1>
      <p style="margin-bottom: 24px;">We encountered an error while loading the application. Please try refreshing the page.</p>
      <pre style="background: #f1f5f9; padding: 16px; border-radius: 8px; max-width: 800px; overflow: auto; text-align: left;">${error?.message || 'Unknown error'}</pre>
      <button 
        onclick="window.location.reload()" 
        style="margin-top: 24px; background: #0c8ee8; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;"
      >
        Refresh Page
      </button>
    </div>
  `;
}