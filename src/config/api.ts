// src/config/api.ts

// --- helpers ---
function must(v: string | undefined, name: string) {
  if (!v || !v.trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v.trim().replace(/\/+$/, "");
}

// Vite env vars
const VITE_MANAGE_CV_API_BASE = import.meta.env.VITE_MANAGE_CV_API_BASE as string | undefined;
const VITE_CVISION_BFF_API_BASE = import.meta.env.VITE_CVISION_BFF_API_BASE as string | undefined;

// 1) Manage_CV API (upload + step2 trigger)
export const MANAGE_CV_API_BASE = must(VITE_MANAGE_CV_API_BASE, "VITE_MANAGE_CV_API_BASE");

// 2) CVision BFF API (profile + artifacts)
export const CVISION_BFF_API_BASE = must(VITE_CVISION_BFF_API_BASE, "VITE_CVISION_BFF_API_BASE");

// --- endpoints ---
export const API_UPLOAD_URL = `${MANAGE_CV_API_BASE}/upload`;

// (optionnel) si tu veux garder ce nom dans cvision.ts
export const API_BASE_URL = CVISION_BFF_API_BASE;

// endpoints BFF
export const API_PROFILE_BASE = `${CVISION_BFF_API_BASE}/candidates`;
export const API_ARTIFACTS_BASE = `${CVISION_BFF_API_BASE}/candidates`;

// endpoint Step2 trigger (Manage_CV)
export function getStep2Endpoint(candidateId: string) {
  return `${MANAGE_CV_API_BASE}/${candidateId}/step2`;
}
