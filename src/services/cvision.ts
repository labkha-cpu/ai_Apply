// src/services/cvision.ts

import { API_PROFILE_URL, API_ARTIFACT_URL } from "../config/api";

export type IncludeMode = "preview" | "step1" | "step2" | "all";

export type CandidateProfileResponse = {
  candidate_id: string;
  meta?: any;
  step1_json?: any;
  step2_json?: any;
  step1_error?: any;
  step2_error?: any;
  status?: string;
  error_message?: string;
};

type ArtifactResponse = {
  candidate_id: string;
  type: string;
  url: string;
  expires_in_seconds?: number;
  key?: string;
  bucket?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit, timeoutMs = 15000): Promise<T> {
  const ctrl = new AbortController();
  const id = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const text = await res.text().catch(() => "");
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      const msg = data && (data.error || data.message)
        ? (data.error || data.message)
        : `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data as T;
  } finally {
    window.clearTimeout(id);
  }
}

export function getCandidateProfileUrl(candidateId: string, include: IncludeMode = "preview") {
  const u = new URL(`${API_PROFILE_URL}/${encodeURIComponent(candidateId)}/profile`);
  if (include) u.searchParams.set("include", include);
  return u.toString();
}

export async function getCandidateProfile(candidateId: string, include: IncludeMode = "preview") {
  return fetchJson<CandidateProfileResponse>(getCandidateProfileUrl(candidateId, include));
}

export function getArtifactUrlEndpoint(candidateId: string, type: string) {
  return `${API_ARTIFACT_URL}/${encodeURIComponent(candidateId)}/artifacts/${encodeURIComponent(type)}`;
}

export async function getArtifactUrl(candidateId: string, type: string) {
  return fetchJson<ArtifactResponse>(getArtifactUrlEndpoint(candidateId, type));
}
