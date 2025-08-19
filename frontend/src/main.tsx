import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BACKEND_URL } from './utils/utils';

// Intercept global fetch to prefix `/api` calls with the backend host configured at build/runtime.
const API_BASE = import.meta.env.VITE_API_BASE_URL || BACKEND_URL;
const _originalFetch = window.fetch.bind(window);
(window as any).fetch = (input: RequestInfo, init?: RequestInit) => {
  try {
    if (typeof input === 'string') {
      if (input.startsWith('/api')) input = API_BASE + input;
    } else if (input instanceof Request) {
      // If a Request object with a relative URL is passed, create a new Request with absolute URL
      const url = input.url || '';
      if (url.startsWith('/api')) {
        input = new Request(API_BASE + url, input);
      }
    }
  } catch (e) {
    // swallow errors and continue with original fetch
    console.warn('fetch wrapper error', e);
  }
  return _originalFetch(input as RequestInfo, init);
};

createRoot(document.getElementById("root")!).render(<App />);
