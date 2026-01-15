// src/config/api.ts

function normalize(url: string) {
  return (url || "").trim().replace(/\/+$/, "");
}

export const MANAGE_CV_BASE = normalize(import.meta.env.VITE_MANAGE_CV_API_BASE_URL);
export const PROFILES_BASE  = normalize(import.meta.env.VITE_PROFILES_API_BASE_URL);

// Base BFF (Profiles API)
export const CANDIDATES_BASE = PROFILES_BASE ? `${PROFILES_BASE}/candidates` : "";

// Compat: certains fichiers attendent "API_URL"
export const API_URL = PROFILES_BASE || MANAGE_CV_BASE || "";

// En prod, on préfère échouer vite plutôt que d'avoir des URLs vides.
if (import.meta.env.PROD) {
  if (!MANAGE_CV_BASE) throw new Error("Missing VITE_MANAGE_CV_API_BASE_URL");
  if (!PROFILES_BASE) throw new Error("Missing VITE_PROFILES_API_BASE_URL");
} else {
  if (!MANAGE_CV_BASE) console.error("Missing VITE_MANAGE_CV_API_BASE_URL");
  if (!PROFILES_BASE) console.error("Missing VITE_PROFILES_API_BASE_URL");
}

export const API_UPLOAD_URL  = `${MANAGE_CV_BASE}/upload`;
export const API_PARSE_URL   = `${MANAGE_CV_BASE}/parse`;     // si encore utilisé
// BFF endpoints
// GET  /candidates/{candidate_id}/profile?include=preview|step1|step2|all
export const API_PROFILE_URL = `${CANDIDATES_BASE}`;
// GET  /candidates/{candidate_id}/artifacts/{type}
export const API_ARTIFACT_URL = `${CANDIDATES_BASE}`;

// Legacy (si tu veux encore supporter /candidates/{id}/json)
export const API_JSON_URL    = `${PROFILES_BASE}/candidates`; // /{candidate_id}/json
