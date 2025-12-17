const getEnv = (key: string) => (typeof import.meta !== 'undefined' ? import.meta.env?.[key] : undefined);

// API Gateway (billing, uploads, parsing)
export const API_URL = getEnv('VITE_API_URL') || 'https://qgbog8umw5.execute-api.eu-west-1.amazonaws.com/v1';
export const API_UPLOAD_URL = getEnv('VITE_UPLOAD_URL') || `${API_URL}/upload`;
export const API_PARSE_URL = getEnv('VITE_PARSE_URL') || `${API_URL}/parse`;

// Candidate read model (cv retrieval)
export const API_CANDIDATES_BASE =
  getEnv('VITE_CANDIDATES_BASE') || 'https://v2dxb5achk.execute-api.eu-west-1.amazonaws.com/v1';

// Stripe
export const STRIPE_PUBLISHABLE_KEY = getEnv('VITE_STRIPE_PUBLISHABLE_KEY') || '';
