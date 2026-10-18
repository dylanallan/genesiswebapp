import { applyLang, getLang, loadFrench } from './lib/i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';
import './index.css';
import { installErrorReporting } from './lib/error-report';
import { applyTextSize } from './lib/text-size';
import './lib/install'; // catches the browser's install offer early

installErrorReporting();
applyTextSize();
applyLang();

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

function start(root: HTMLElement) {
  try {
    createRoot(root).render(
      <React.StrictMode>
        <HelmetProvider>
          {/* Shows every toast() message in the app (errors, confirmations). */}
          <Toaster position="top-center" richColors closeButton />
          <App />
        </HelmetProvider>
      </React.StrictMode>
    );
  } catch (error: unknown) {
    // Plain text only: the message is never put into the page as HTML.
    const box = document.createElement('div');
    box.style.cssText = 'padding:20px;font-family:Arial,sans-serif';
    box.textContent = 'Genesis Heritage could not start. Please reload the page.';
    root.replaceChildren(box);
    console.error(error);
  }
}

// French users wait for the French text (a small file) so the page never flashes English first.
if (getLang() === 'fr') void loadFrench().finally(() => start(root));
else start(root);
