import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase';
import App from './App';
import { AuthProvider } from './components/AuthProvider';
import { ErrorBoundary } from './lib/error-boundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SessionContextProvider supabaseClient={supabase}>
        <AuthProvider>
          <App />
          <Toaster position="top-right" />
        </AuthProvider>
      </SessionContextProvider>
    </ErrorBoundary>
  </StrictMode>
);