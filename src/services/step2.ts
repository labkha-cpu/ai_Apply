// services/step2.ts
import { API_PROFILE_URL, API_UPLOAD_URL } from "../config/api";

export type Step2Status = "NOT_STARTED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type CandidateProfile = {
  candidate_id: string;
  status?: string; // step1 status
  json_s3_key?: string;

  step2_status?: Step2Status;
  step2_error?: string | null;
  cv_master_s3_key?: string | null;

  step2_meta?: {
    completed_at?: string;
    duration_ms?: number;
    model?: string;
    output_key?: string;
  };
};

export async function triggerStep2(candidateId: string): Promise<any> {
  const url = `${API_UPLOAD_URL}/${candidateId}/step2`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Step2 trigger failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function fetchProfileAll(candidateId: string): Promise<CandidateProfile> {
  const url = `${API_PROFILE_URL}/candidates/${candidateId}/profile?include=all`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Profile fetch failed (${res.status}): ${text}`);
  }
  return res.json();
}

export async function pollStep2UntilDone(
  candidateId: string,
  opts?: { intervalMs?: number; timeoutMs?: number }
): Promise<CandidateProfile> {
  const intervalMs = opts?.intervalMs ?? 2500;
  const timeoutMs = opts?.timeoutMs ?? 120000; // 2 min
  const start = Date.now();

  while (true) {
    const profile = await fetchProfileAll(candidateId);
    const st = profile.step2_status;

    if (st === "COMPLETED" || st === "FAILED") return profile;

    if (Date.now() - start > timeoutMs) {
      throw new Error("Step2 polling timeout");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

export async function getArtifactUrl(candidateId: string, type: string): Promise<string> {
  // type attendu côté BFF : "step2_cv_master" ou "cv_master" selon ton implémentation
  const url = `${API_PROFILE_URL}/candidates/${candidateId}/artifacts/${type}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Artifact URL fetch failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  // selon ton BFF, ça peut être { url: "..." } ou direct string
  return data.url ?? data;
}
