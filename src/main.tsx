import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <App />
      <Toaster position="top-right" />
    </SessionContextProvider>
  </StrictMode>
);