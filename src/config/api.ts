// src/config/api.ts

function normalize(url: string) {
  return (url || "").trim().replace(/\/+$/, "");
}

export const MANAGE_CV_BASE = normalize(import.meta.env.VITE_MANAGE_CV_API_BASE_URL);
export const PROFILES_BASE  = normalize(import.meta.env.VITE_PROFILES_API_BASE_URL);

// Compat: certains fichiers attendent "API_URL"
export const API_URL = PROFILES_BASE || MANAGE_CV_BASE || "";

if (!MANAGE_CV_BASE) console.error("Missing VITE_MANAGE_CV_API_BASE_URL");
if (!PROFILES_BASE) console.error("Missing VITE_PROFILES_API_BASE_URL");

export const API_UPLOAD_URL  = `${MANAGE_CV_BASE}/upload`;
export const API_PARSE_URL   = `${MANAGE_CV_BASE}/parse`;     // si encore utilisé
export const API_PROFILE_URL = `${PROFILES_BASE}/profile`;
export const API_JSON_URL    = `${PROFILES_BASE}/candidates`; // /{candidate_id}/json
