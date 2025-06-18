import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🚀 Starting React app...');
console.log('📁 Current directory:', window.location.href);
console.log('🔍 Looking for root element...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  console.error('🔍 Available elements:', document.body.children);
  throw new Error('Root element not found');
}

console.log('✅ Root element found:', root);
console.log('🎨 Root element classes:', root.className);
console.log('📏 Root element dimensions:', root.offsetWidth, 'x', root.offsetHeight);

try {
  console.log('🔧 Creating React root...');
  const reactRoot = createRoot(root);
  console.log('✅ React root created successfully');
  
  console.log('🎭 Rendering App component...');
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('✅ React app rendered successfully');
  
  // Add a visual indicator that React is working
  setTimeout(() => {
    console.log('🎯 React app should be visible now');
    if (root.children.length > 0) {
      console.log('✅ Root has children:', root.children.length);
    } else {
      console.warn('⚠️ Root has no children after render');
    }
  }, 100);
  
} catch (error: unknown) {
  console.error('❌ Error rendering React app:', error);
  console.error('🔍 Error details:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : 'No stack trace'
  });
  
  // Show error in the DOM
  root.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial, sans-serif;">
      <h1>❌ React App Error</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : String(error)}</p>
      <p><strong>Type:</strong> ${error instanceof Error ? error.name : 'Unknown'}</p>
      <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error instanceof Error ? error.stack : 'No stack trace'}</pre>
    </div>
  `;
}