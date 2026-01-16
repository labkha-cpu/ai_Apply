//src/utils/step2.ts
export type Step2Status = "NOT_RUN" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

const NORMALIZED_STATUSES: Record<string, Step2Status> = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  RUNNING: "PROCESSING",
  IN_PROGRESS: "PROCESSING",

  COMPLETED: "COMPLETED",
  DONE: "COMPLETED",
  SUCCESS: "COMPLETED",

  FAILED: "FAILED",
  ERROR: "FAILED",
};

type AnyProfile = {
  meta?: any;

  step2_status?: string;
  step2_json?: any;

  step2_error?: any;
  step2_error_message?: any;

  cv_master_s3_key?: string | null;

  // optional / future proof
  step2_s3?: { bucket?: string; key?: string } | null;

  [k: string]: any;
};

function upper(v: any) {
  return String(v ?? "").trim().toUpperCase();
}

function isPlainObject(v: any) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function hasNonEmptyObject(v: any) {
  return isPlainObject(v) && Object.keys(v).length > 0;
}

function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function safeMeta(profile: AnyProfile) {
  return isPlainObject(profile.meta) ? profile.meta : {};
}

/**
 * Règle robuste:
 * 1) Si status raw dit COMPLETED/DONE/SUCCESS => COMPLETED (même si erreur "fantôme")
 * 2) Sinon si artefacts Step2 présents (step2_json non vide OU cv_master_s3_key OU step2_s3.key) => COMPLETED
 * 3) Sinon si erreur => FAILED
 * 4) Sinon si status raw match => QUEUED/PROCESSING/FAILED
 * 5) Sinon => NOT_RUN
 */
export function resolveStep2Status(profile?: AnyProfile | null): Step2Status {
  if (!profile) return "NOT_RUN";

  const meta = safeMeta(profile);

  const step2StatusRaw = upper(meta.step2_status) || upper(profile.step2_status);

  const step2Json = profile.step2_json ?? meta.step2_json;
  const cvMasterKey = (profile.cv_master_s3_key ?? meta.cv_master_s3_key) as string | null | undefined;
  const step2S3Key = (profile.step2_s3?.key ?? meta.step2_s3?.key) as string | undefined;

  const step2Error =
    profile.step2_error ??
    meta.step2_error ??
    profile.step2_error_message ??
    meta.step2_error_message ??
    meta.step2_error; // compat legacy

  // ✅ 1) Hard priority: completed if raw says so
  if (step2StatusRaw === "COMPLETED" || step2StatusRaw === "DONE" || step2StatusRaw === "SUCCESS") {
    return "COMPLETED";
  }

  // ✅ 2) Completed if artifacts exist
  if (hasNonEmptyObject(step2Json) || hasText(cvMasterKey) || hasText(step2S3Key)) {
    return "COMPLETED";
  }

  // ✅ 3) Failed only if no completed signal
  if (step2Error) return "FAILED";

  // ✅ 4) Normalize other statuses
  if (step2StatusRaw && NORMALIZED_STATUSES[step2StatusRaw]) {
    return NORMALIZED_STATUSES[step2StatusRaw];
  }

  return "NOT_RUN";
}

export function getStep2ErrorMessage(profile?: AnyProfile | null) {
  if (!profile) return "";
  const meta = isPlainObject(profile.meta) ? profile.meta : {};

  const err =
    profile.step2_error ??
    meta.step2_error ??
    profile.step2_error_message ??
    meta.step2_error_message ??
    meta.step2_error;

  if (err && typeof err === "object") {
    const msg = err.message || err.details || "";
    return String(msg || "").trim();
  }

  return String(err || "").trim();
}

type Step2PollingOptions = {
  candidateId: string;
  getProfile: (candidateId: string) => Promise<any>;
  onUpdate?: (profile: any, status: Step2Status) => void;
  onDone?: (profile: any, status: Step2Status) => void;
  onError?: (error: Error) => void;
  intervalMs?: number;
  maxAttempts?: number;
};

export function startStep2Polling({
  candidateId,
  getProfile,
  onUpdate,
  onDone,
  onError,
  intervalMs = 3000,
  maxAttempts = 200,
}: Step2PollingOptions) {
  let attempts = 0;
  let stopped = false;

  const timer = window.setInterval(async () => {
    if (stopped) return;
    attempts += 1;

    try {
      const profile = await getProfile(candidateId);
      const status = resolveStep2Status(profile);

      onUpdate?.(profile, status);

      if (status === "COMPLETED" || status === "FAILED" || attempts >= maxAttempts) {
        stopped = true;
        window.clearInterval(timer);
        onDone?.(profile, status);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, intervalMs);

  return () => {
    stopped = true;
    window.clearInterval(timer);
  };
}
