import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { AuthProvider } from './components/AuthProvider';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </StrictMode>
);