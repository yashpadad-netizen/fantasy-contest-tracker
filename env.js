window.__env = window.__env || {};
window.__env.API_BASE = window.__env.API_BASE || (window.location.hostname === 'localhost'
  ? 'http://localhost:4000/api'
  : '/api');
