import type { CandidateProfileResponse } from "../services/cvision";

export type Step2Status = "NOT_RUN" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

const NORMALIZED_STATUSES: Record<string, Step2Status> = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ERROR: "FAILED",
};

export function resolveStep2Status(profile?: CandidateProfileResponse | null): Step2Status {
  if (!profile) return "NOT_RUN";
  const meta = (profile as any)?.meta || {};
  const step2Status = String(meta?.step2_status || (profile as any)?.step2_status || "").toUpperCase();
  const step2Json = (profile as any)?.step2_json;
  const step2Error = (profile as any)?.step2_error || meta?.step2_error || null;

  if (step2Error) return "FAILED";
  if (step2Status && NORMALIZED_STATUSES[step2Status]) return NORMALIZED_STATUSES[step2Status];
  if (step2Json && Object.keys(step2Json).length > 0) return "COMPLETED";

  return "NOT_RUN";
}

export function getStep2ErrorMessage(profile?: CandidateProfileResponse | null) {
  if (!profile) return "";
  const meta = (profile as any)?.meta || {};
  const step2Error = (profile as any)?.step2_error || meta?.step2_error || null;
  return (
    step2Error?.message ||
    step2Error?.details ||
    meta?.step2_error_message ||
    meta?.step2_error ||
    ""
  );
}

type Step2PollingOptions = {
  candidateId: string;
  getProfile: (candidateId: string) => Promise<CandidateProfileResponse>;
  onUpdate?: (profile: CandidateProfileResponse, status: Step2Status) => void;
  onDone?: (profile: CandidateProfileResponse, status: Step2Status) => void;
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
  const timer = window.setInterval(async () => {
    attempts += 1;
    try {
      const profile = await getProfile(candidateId);
      const status = resolveStep2Status(profile);
      onUpdate?.(profile, status);

      if (status === "COMPLETED" || status === "FAILED" || attempts >= maxAttempts) {
        window.clearInterval(timer);
        onDone?.(profile, status);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, intervalMs);

  return () => window.clearInterval(timer);
}
