// Centralized configuration for ZENTRA API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:5000`
    : 'https://zentra-live-backend.onrender.com'
);
