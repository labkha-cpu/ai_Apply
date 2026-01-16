// src/services/cvision.ts
import { API_PROFILE_BASE, API_ARTIFACTS_BASE, getStep2Endpoint } from "../config/api";

export type ProfileInclude = "preview" | "step1" | "step2" | "all";

/**
 * Attention: ton BFF peut renvoyer des variantes.
 * On garde les valeurs UI principales ici.
 */
export type Step2Status = "NOT_STARTED" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export type CandidateProfileResponse = {
  candidate_id: string;

  // La plupart du temps ton BFF renvoie tout dans meta
  meta?: any;

  // --- Step1 ---
  step1_json?: any;
  step1_s3?: { bucket: string; key: string };
  step1_read_ms?: number;
  step1_error?: { message: string; details?: string } | string | null;

  // --- Step2 ---
  step2_status?: Step2Status | string;
  step2_updated_at?: string;
  step2_meta?: any;
  step2_error?: string | { message?: string; details?: string } | null;

  // BFF peut hydrater step2_json directement ✅
  step2_json?: any;
  step2_s3?: { bucket: string; key: string };
  step2_read_ms?: number;

  // La clé peut être à la racine ou dans meta
  cv_master_s3_key?: string | null;

  [k: string]: any;
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

type PollOptions = {
  intervalMs?: number;
  timeoutMs?: number;
  include?: ProfileInclude; // "all" conseillé
};

function upper(v: any) {
  return String(v ?? "").trim().toUpperCase();
}

function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function hasNonEmptyObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0;
}

/**
 * ✅ Résolution robuste du statut Step2
 * Sources possibles:
 * - profile.step2_status
 * - profile.meta.step2_status
 * - existence artefacts: step2_json non vide OU cv_master_s3_key
 * - step2_error / meta.step2_error
 */
export function getResolvedStep2Status(profile?: CandidateProfileResponse | null): Step2Status {
  if (!profile) return "NOT_STARTED";

  const meta = profile.meta || {};

  const raw =
    upper(profile.step2_status) ||
    upper(meta.step2_status) ||
    upper(meta?.step2?.status) ||
    "";

  const step2Json = profile.step2_json ?? meta.step2_json;
  const cvMasterKey = (profile.cv_master_s3_key ?? meta.cv_master_s3_key) as string | null | undefined;

  const err =
    profile.step2_error ??
    meta.step2_error ??
    meta.step2_error_message ??
    profile.step2_error ??
    null;

  // 1) priorité: raw completed
  if (raw === "COMPLETED" || raw === "DONE" || raw === "SUCCESS") return "COMPLETED";

  // 2) si artefact présent => completed
  if (hasNonEmptyObject(step2Json) || hasText(cvMasterKey)) return "COMPLETED";

  // 3) si erreur => failed
  if (err) return "FAILED";

  // 4) statuts connus
  if (raw === "QUEUED") return "QUEUED";
  if (raw === "PROCESSING" || raw === "RUNNING" || raw === "IN_PROGRESS") return "PROCESSING";
  if (raw === "FAILED" || raw === "ERROR") return "FAILED";

  return "NOT_STARTED";
}

export function getStep2ErrorMessage(profile?: CandidateProfileResponse | null): string {
  if (!profile) return "";
  const meta = profile.meta || {};
  const err =
    profile.step2_error ??
    meta.step2_error ??
    meta.step2_error_message ??
    profile.step2_error ??
    null;

  if (!err) return "";
  if (typeof err === "string") return err.trim();
  if (typeof err === "object") return String(err.message || err.details || "").trim();
  return String(err).trim();
}

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
  return fetchJson<CandidateProfileResponse>(getProfileEndpoint(candidateId, include), { method: "GET" });
}

// --- BFF: artifacts presign ---
export function getArtifactEndpoint(candidateId: string, type: string) {
  return `${API_ARTIFACTS_BASE}/${candidateId}/artifacts/${type}`;
}

export async function getArtifactUrl(candidateId: string, type: string) {
  return fetchJson<ArtifactUrlResponse>(getArtifactEndpoint(candidateId, type), { method: "GET" });
}

// Helper : url Step2 JSON (download)
export async function getStep2CvMasterUrl(candidateId: string): Promise<string> {
  const r = await getArtifactUrl(candidateId, "step2_cv_master");
  return r.url;
}

// --- Manage_CV: trigger step2 ---
export async function triggerStep2(candidateId: string) {
  return fetchJson<{ status: string; candidate_id: string; message?: string }>(getStep2Endpoint(candidateId), {
    method: "POST",
    body: JSON.stringify({ candidate_id: candidateId }),
  });
}

/**
 * Poll Step2 until COMPLETED/FAILED.
 * Source of truth UI = BFF profile.
 *
 * ✅ robust:
 * - support step2_status in meta
 * - COMPLETED if artifact exists even if status missing
 */
export async function pollStep2UntilDone(
  candidateId: string,
  opts: PollOptions = {}
): Promise<CandidateProfileResponse> {
  const intervalMs = opts.intervalMs ?? 2500;
  const timeoutMs = opts.timeoutMs ?? 180000; // 3 min
  const include = opts.include ?? "all";

  const started = Date.now();
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  while (true) {
    const p = await getCandidateProfile(candidateId, include);
    const status = getResolvedStep2Status(p);

    if (status === "COMPLETED" || status === "FAILED") {
      return {
        ...p,
        step2_status: status,
      };
    }

    if (Date.now() - started > timeoutMs) {
      const lastErr = getStep2ErrorMessage(p);
      throw new Error(
        `Timeout: Step2 n'a pas terminé dans le délai imparti (${Math.round(timeoutMs / 1000)}s).` +
          (lastErr ? ` Dernière erreur: ${lastErr}` : "")
      );
    }

    await sleep(intervalMs);
  }
}
