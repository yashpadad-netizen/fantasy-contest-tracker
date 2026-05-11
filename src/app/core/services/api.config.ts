declare global {
  interface Window {
    __env?: {
      API_BASE?: string;
    };
  }
}

const runtimeApiBase = window.__env?.API_BASE;
const defaultApiBase = window.location.hostname === 'localhost' ? 'http://localhost:4000/api' : '/api';
export const API_BASE = runtimeApiBase || defaultApiBase;
