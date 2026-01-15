// src/services/cvision.ts
import { API_PROFILE_BASE, API_ARTIFACTS_BASE, getStep2Endpoint } from "../config/api";

export type ProfileInclude = "preview" | "step1" | "step2" | "all";

export type CandidateProfileResponse = {
  candidate_id: string;
  meta?: any;

  step1_json?: any;
  step1_s3?: { bucket: string; key: string };
  step1_read_ms?: number;
  step1_error?: { message: string; details?: string };

  step2_json?: any;
  step2_s3?: { bucket: string; key: string };
  step2_read_ms?: number;
  step2_error?: { message: string; details?: string };
};

export type ArtifactUrlResponse = {
  candidate_id: string;
  type: string;
  bucket: string;
  key: string;
  url: string;
  expires_in_seconds: number;
  resolved_by?: string;
  presign_ms?: number;
};

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${txt}`);
  }

  return (await res.json()) as T;
}

// --- BFF: profile ---
export function getProfileEndpoint(candidateId: string, include: ProfileInclude = "preview") {
  return `${API_PROFILE_BASE}/${candidateId}/profile?include=${include}`;
}

export async function getCandidateProfile(candidateId: string, include: ProfileInclude = "preview") {
  return fetchJson<CandidateProfileResponse>(getProfileEndpoint(candidateId, include), {
    method: "GET",
  });
}

// --- BFF: artifacts presign ---
export function getArtifactEndpoint(candidateId: string, type: string) {
  return `${API_ARTIFACTS_BASE}/${candidateId}/artifacts/${type}`;
}

export async function getArtifactUrl(candidateId: string, type: string) {
  return fetchJson<ArtifactUrlResponse>(getArtifactEndpoint(candidateId, type), {
    method: "GET",
  });
}

// --- Manage_CV: trigger step2 ---
export async function triggerStep2(candidateId: string) {
  // ton API Gateway Step2 retourne 202 QUEUED
  return fetchJson<{ status: string; candidate_id: string; message?: string }>(getStep2Endpoint(candidateId), {
    method: "POST",
    body: JSON.stringify({ candidate_id: candidateId }),
  });
}
