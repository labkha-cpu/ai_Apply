const getEnv = (key: string) => (typeof import.meta !== 'undefined' ? import.meta.env?.[key] : undefined);

// ------------------------------------------------------------------
// CONFIGURATION API GATEWAY (AWS)
// Remplacez l'URL par celle de votre "Invoke URL" API Gateway (ex: .../Prod)
// ------------------------------------------------------------------
export const API_URL = getEnv('VITE_API_URL') || 'https://qgbog8umw5.execute-api.eu-west-1.amazonaws.com/v1';

// Routes mappées sur vos Lambdas AWS
export const API_UPLOAD_URL = getEnv('VITE_UPLOAD_URL') || `${API_URL}/upload`;
export const API_PARSE_URL = getEnv('VITE_PARSE_URL') || `${API_URL}/parse`;
export const API_PROFILE_URL = getEnv('VITE_PROFILE_URL') || `${API_URL}/profile`;

// Route de secours/legacy pour éviter de casser d'autres fichiers
export const API_CANDIDATES_BASE = getEnv('VITE_CANDIDATES_BASE') || API_URL;

// Stripe
export const STRIPE_PUBLISHABLE_KEY = getEnv('VITE_STRIPE_PUBLISHABLE_KEY') || '';
