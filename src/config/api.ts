const getEnv = (key: string) =>
  (typeof import.meta !== "undefined" ? import.meta.env?.[key] : undefined);

// Bases
export const CV_API_BASE =
  getEnv("VITE_CV_API_BASE") ||
  getEnv("VITE_API_URL") ||
  "https://qgbog8umw5.execute-api.eu-west-1.amazonaws.com/v1";

export const PROFILES_API_BASE =
  getEnv("VITE_PROFILES_API_BASE") ||
  getEnv("VITE_PROFILES_API_URL") ||
  "https://27p0ilpk34.execute-api.eu-west-1.amazonaws.com/v1";

// Endpoints CV
export const API_UPLOAD_URL =
  getEnv("VITE_UPLOAD_URL") || `${CV_API_BASE}/upload`;

export const API_PARSE_URL =
  getEnv("VITE_PARSE_URL") || `${CV_API_BASE}/parse`;

// Endpoints Profiles
export const API_PROFILE_URL =
  getEnv("VITE_PROFILE_URL") || `${PROFILES_API_BASE}/profile`;

// Backward compatibility (anciens imports)
export const API_URL = CV_API_BASE;
export const PROFILES_API_URL = PROFILES_API_BASE;
export const API_CANDIDATES_BASE = PROFILES_API_BASE;

// Stripe
export const STRIPE_PUBLISHABLE_KEY =
  getEnv("VITE_STRIPE_PUBLISHABLE_KEY") || "";
