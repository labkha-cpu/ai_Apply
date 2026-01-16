import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Crown,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import { API_UPLOAD_URL } from "../config/api";
import { getArtifactUrl, getCandidateProfile, triggerStep2 } from "../services/cvision";
import Step2AuditTable from "../components/Step2AuditTable";
import { getStep2ErrorMessage, resolveStep2Status, startStep2Polling, Step2Status } from "../utils/step2";
import { computeAudit, clamp, hasText, safeText } from "../utils/step2Audit";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type PageStatus = "idle" | "uploading" | "analyzing" | "ready" | "error";

type CandidateProfile = {
  candidate_id?: string;
  status?: string;
  error_message?: string;
  meta?: any;
  step1_json?: any;
  step2_status?: string;
  step2_error?: any;
  step2_json?: any;
  cv_master_s3_key?: string | null;
  [k: string]: any;
};

// -----------------------------------------------------------------------------
// Small UI helpers
// -----------------------------------------------------------------------------

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Pill: React.FC<{ tone: "good" | "warn" | "bad" | "info"; children: React.ReactNode }> = ({ tone, children }) => {
  const styles =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : tone === "bad"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>{children}</span>;
};

const Button: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}> = ({ children, variant = "primary", className = "", disabled, onClick, type = "button" }) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2"
      : "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 px-4 py-2";

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Fermer">
            <X size={22} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

function upper(v: any) {
  return String(v ?? "").trim().toUpperCase();
}

function getStep1Status(profile: CandidateProfile | null): string {
  const raw = profile?.meta?.status ?? profile?.status;
  return upper(raw);
}

function computeVerdict(globalScore: number | null) {
  if (globalScore === null) return { label: "Analyse incomplète", tone: "info" as const, emoji: "…" };
  if (globalScore >= 75) return { label: "Bon, mais perfectible", tone: "good" as const, emoji: "✅" };
  if (globalScore >= 55) return { label: "Correct, mais pas assez vendeur", tone: "warn" as const, emoji: "⚠️" };
  return { label: "Bloquant pour les ATS", tone: "bad" as const, emoji: "❌" };
}

function computeGlobalScore(profile: CandidateProfile | null): number | null {
  if (!profile) return null;
  const meta = profile.meta || {};
  const s1 = profile.step1_json || {};
  const identity = s1.identity || {};

  // Simple, stable scoring (no magic): completeness + ATS internal if present.
  const parts: Array<{ ok: boolean; w: number }> = [
    { ok: hasText(identity?.full_name) || hasText(meta?.full_name), w: 10 },
    { ok: hasText(identity?.headline) || hasText(meta?.headline), w: 10 },
    { ok: Array.isArray(identity?.emails) && identity.emails.length > 0, w: 10 },
    { ok: Array.isArray(identity?.phones) && identity.phones.length > 0, w: 8 },
    { ok: hasText(identity?.location) || hasText(meta?.location), w: 7 },
    { ok: Array.isArray(s1?.experiences) && s1.experiences.length > 0, w: 15 },
    { ok: Array.isArray(s1?.education) && s1.education.length > 0, w: 8 },
    { ok: !!(s1?.summary?.profile_summary && String(s1.summary.profile_summary).trim().length > 50), w: 12 },
    { ok: Array.isArray(s1?.skills?.hard_skills) && s1.skills.hard_skills.length >= 8, w: 10 },
  ];

  const base = parts.reduce((acc, p) => acc + (p.ok ? p.w : 0), 0);
  const baseMax = parts.reduce((acc, p) => acc + p.w, 0);

  const atsInternal =
    typeof s1?.ats?.score_internal === "number" ? s1.ats.score_internal : typeof meta?.ats_score_internal === "number" ? meta.ats_score_internal : null;

  const score = Math.round((base / baseMax) * 70 + (atsInternal === null ? 0 : clamp(Math.round(atsInternal), 0, 100) * 0.3));
  return clamp(score, 0, 100);
}

async function putFileWithProgress(uploadUrl: string, file: File, contentType: string, onProgress?: (pct: number) => void) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable) return;
      const pct = Math.round((evt.loaded / evt.total) * 100);
      onProgress?.(clamp(pct, 0, 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      reject(new Error(`Echec PUT S3 (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload"));
    xhr.send(file);
  });
}

// -----------------------------------------------------------------------------
// Page
// -----------------------------------------------------------------------------

export default function DashboardPage() {
  const [pageStatus, setPageStatus] = useState<PageStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [analysisSeconds, setAnalysisSeconds] = useState<number>(0);

  // Step2 (manual)
  const [step2Status, setStep2Status] = useState<Step2Status>("NOT_RUN");
  const [step2Error, setStep2Error] = useState<string>("");
  const [step2Seconds, setStep2Seconds] = useState<number>(0);

  // Modals
  const [showStep1Json, setShowStep1Json] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // "Pro" simulation (until real billing exists)
  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      return localStorage.getItem("cvision_is_pro") === "1";
    } catch {
      return false;
    }
  });

  const analysisTimerRef = useRef<number | null>(null);
  const pollStep1Ref = useRef<number | null>(null);

  const step2TimerRef = useRef<number | null>(null);
  const stopStep2PollingRef = useRef<(() => void) | null>(null);

  const step1Status = getStep1Status(candidate);

  const globalScore = useMemo(() => computeGlobalScore(candidate), [candidate]);
  const verdict = useMemo(() => computeVerdict(globalScore), [globalScore]);

  const audit = useMemo(() => (candidate ? computeAudit(candidate) : null), [candidate]);
  const step2Ready = useMemo(() => resolveStep2Status(candidate) === "COMPLETED", [candidate]);

  // Keep Step2 status derived from candidate
  useEffect(() => {
    setStep2Status(resolveStep2Status(candidate));
    setStep2Error(resolveStep2Status(candidate) === "FAILED" ? getStep2ErrorMessage(candidate) : "");
  }, [candidate]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (pollStep1Ref.current) window.clearInterval(pollStep1Ref.current);
      if (analysisTimerRef.current) window.clearInterval(analysisTimerRef.current);
      if (step2TimerRef.current) window.clearInterval(step2TimerRef.current);
      if (stopStep2PollingRef.current) stopStep2PollingRef.current();
    };
  }, []);

  // Paywall: show once Step1 is COMPLETED and diagnosis is available
  useEffect(() => {
    if (!candidate) return;
    if (step1Status !== "COMPLETED") return;

    // Only after we have audit rows (diagnostic computed)
    if (!audit?.rows || audit.rows.length === 0) return;

    if (isPro) return;

    // avoid annoying loops
    try {
      const dismissed = sessionStorage.getItem("cvision_paywall_dismissed") === "1";
      if (!dismissed) setShowPaywall(true);
    } catch {
      setShowPaywall(true);
    }
  }, [audit?.rows?.length, candidate, isPro, step1Status]);

  function resetAll() {
    setPageStatus("idle");
    setErrorMessage("");
    setCandidate(null);
    setUploadPct(0);
    setAnalysisSeconds(0);
    setStep2Seconds(0);
    setStep2Error("");
    setShowStep1Json(false);
    setShowPaywall(false);

    if (pollStep1Ref.current) window.clearInterval(pollStep1Ref.current);
    if (analysisTimerRef.current) window.clearInterval(analysisTimerRef.current);
    if (step2TimerRef.current) window.clearInterval(step2TimerRef.current);
    if (stopStep2PollingRef.current) stopStep2PollingRef.current();

    pollStep1Ref.current = null;
    analysisTimerRef.current = null;
    step2TimerRef.current = null;
    stopStep2PollingRef.current = null;
  }

  async function handleUpload(file: File) {
    resetAll();
    setPageStatus("uploading");

    try {
      // 1) Ask for upload ticket
      const ticketRes = await fetch(API_UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/pdf",
          content_length: file.size,
        }),
      });

      if (!ticketRes.ok) {
        const txt = await ticketRes.text().catch(() => "");
        throw new Error(`Erreur API Upload (${ticketRes.status}). ${txt}`);
      }

      const ticket = await ticketRes.json();
      const uploadUrl = ticket.upload_url;
      const candidateId = ticket.candidate_id;
      const signedContentType = ticket.content_type || (file.type || "application/pdf");

      if (!uploadUrl || !candidateId) {
        throw new Error("Réponse upload invalide (upload_url / candidate_id manquants)");
      }

      // 2) PUT file to S3 with progress
      setUploadPct(0);
      await putFileWithProgress(uploadUrl, file, signedContentType, setUploadPct);
      setUploadPct(100);

      // 3) Start analysis polling
      setPageStatus("analyzing");
      setAnalysisSeconds(0);
      analysisTimerRef.current = window.setInterval(() => setAnalysisSeconds((s) => s + 1), 1000);

      let attempts = 0;
      const maxAttempts = 300; // ~10 min @ 2s

      pollStep1Ref.current = window.setInterval(async () => {
        attempts += 1;
        try {
          const preview = await getCandidateProfile(candidateId, "preview").catch((e: any) => {
            const msg = String(e?.message || "");
            if (msg.includes("404") || msg.toLowerCase().includes("introuvable")) return null;
            throw e;
          });

          if (!preview) {
            if (attempts >= maxAttempts) throw new Error("Délai d'attente dépassé (10min). Vérifie CloudWatch côté Step1.");
            return;
          }

          const meta = (preview as any).meta || preview;
          const st = upper(meta?.status || (preview as any).status);

          if (st === "FAILED") {
            throw new Error(meta?.error_message || (preview as any).error_message || "L'analyse a échoué côté serveur (voir logs CloudWatch). ");
          }

          if (st === "COMPLETED") {
            const full = await getCandidateProfile(candidateId, "all");
            setCandidate(full as any);

            if (pollStep1Ref.current) window.clearInterval(pollStep1Ref.current);
            if (analysisTimerRef.current) window.clearInterval(analysisTimerRef.current);
            pollStep1Ref.current = null;
            analysisTimerRef.current = null;

            setPageStatus("ready");
          }

          if (attempts >= maxAttempts) {
            throw new Error("Délai d'attente dépassé (10min). Vérifie CloudWatch côté Step1.");
          }
        } catch (e: any) {
          if (pollStep1Ref.current) window.clearInterval(pollStep1Ref.current);
          if (analysisTimerRef.current) window.clearInterval(analysisTimerRef.current);
          pollStep1Ref.current = null;
          analysisTimerRef.current = null;

          setPageStatus("error");
          setErrorMessage(e?.message || "Une erreur est survenue.");
        }
      }, 2000);
    } catch (e: any) {
      setPageStatus("error");
      setErrorMessage(e?.message || "Une erreur est survenue.");
    }
  }

  async function openStep1ArtifactInNewTab() {
    const cid = candidate?.candidate_id;
    if (!cid) return;
    const r = await getArtifactUrl(cid, "step1_json");
    window.open(r.url, "_blank", "noopener,noreferrer");
  }

  async function handleImproveStep2() {
    const cid = candidate?.candidate_id;
    if (!cid) return;

    // Paywall guard
    if (!isPro) {
      setShowPaywall(true);
      return;
    }

    // Step1 guard
    if (step1Status !== "COMPLETED") {
      setStep2Status("FAILED");
      setStep2Error("Step1 n'est pas COMPLETED : impossible de lancer l'amélioration.");
      return;
    }

    // Reset local Step2 timers/polling
    if (step2TimerRef.current) window.clearInterval(step2TimerRef.current);
    if (stopStep2PollingRef.current) stopStep2PollingRef.current();

    setStep2Seconds(0);
    setStep2Error("");
    setStep2Status("QUEUED");
    step2TimerRef.current = window.setInterval(() => setStep2Seconds((s) => s + 1), 1000);

    try {
      await triggerStep2(cid);
    } catch (e: any) {
      if (step2TimerRef.current) window.clearInterval(step2TimerRef.current);
      step2TimerRef.current = null;

      setStep2Status("FAILED");
      setStep2Error(e?.message || "Impossible de lancer Step2.");
      return;
    }

    stopStep2PollingRef.current = startStep2Polling({
      candidateId: cid,
      getProfile: (id) => getCandidateProfile(id, "all"),
      intervalMs: 2500,
      maxAttempts: 240,
      onUpdate: (profile, st) => {
        setCandidate(profile as any);
        setStep2Status(st);
        if (st === "FAILED") setStep2Error(getStep2ErrorMessage(profile));
      },
      onDone: (profile, st) => {
        setCandidate(profile as any);
        setStep2Status(st);
        if (step2TimerRef.current) window.clearInterval(step2TimerRef.current);
        step2TimerRef.current = null;
        stopStep2PollingRef.current = null;

        if (st === "FAILED") setStep2Error(getStep2ErrorMessage(profile));
      },
      onError: (err) => {
        console.error(err);
      },
    });
  }

  const canShowResults = pageStatus === "ready" && !!candidate;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              <Sparkles size={14} /> CVision — Diagnostic ATS
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-3">Je ne reçois pas de réponses → je veux comprendre pourquoi</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">
              Uploade ton CV. On te montre <b>ce qui bloque</b> (ATS, structure, mots-clés) puis on peut générer une version améliorée.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Pill tone={isPro ? "good" : "info"}>
              {isPro ? (
                <span className="inline-flex items-center gap-2">
                  <Crown size={14} /> Pro activé
                </span>
              ) : (
                "Freemium"
              )}
            </Pill>
            <Button
              variant="outline"
              onClick={() => {
                // small dev helper
                const next = !isPro;
                setIsPro(next);
                try {
                  localStorage.setItem("cvision_is_pro", next ? "1" : "0");
                } catch {
                  // ignore
                }
              }}
            >
              <ShieldCheck size={16} /> {isPro ? "Désactiver Pro" : "Simuler Pro"}
            </Button>
          </div>
        </div>

        {/* Upload */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">1) Upload</h2>
                <p className="text-sm text-gray-500 mt-1">Format PDF. Analyse asynchrone (S3 Trigger + polling).</p>
              </div>
              <Pill tone={pageStatus === "error" ? "bad" : pageStatus === "ready" ? "good" : "info"}>
                {pageStatus === "idle"
                  ? "Prêt"
                  : pageStatus === "uploading"
                  ? "Upload…"
                  : pageStatus === "analyzing"
                  ? "Analyse…"
                  : pageStatus === "ready"
                  ? "Diagnostic prêt"
                  : "Erreur"}
              </Pill>
            </div>
          </div>

          <div className="p-6">
            <div
              className="relative border-2 border-dashed rounded-2xl p-8 text-center border-gray-300 hover:border-indigo-400 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) void handleUpload(f);
              }}
            >
              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleUpload(f);
                }}
              />

              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                  <Upload size={24} />
                </div>
                <p className="text-sm text-gray-700 font-semibold">Glisse ton PDF ici, ou clique pour sélectionner</p>
                <p className="text-xs text-gray-500">On ne stocke que les artefacts nécessaires au traitement.</p>
              </div>
            </div>

            {/* Upload progress */}
            {pageStatus === "uploading" && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Upload en cours…
                  </span>
                  <span className="font-semibold">{uploadPct}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${uploadPct}%` }} />
                </div>
              </div>
            )}

            {/* Analyzing */}
            {pageStatus === "analyzing" && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                  <Loader2 size={16} className="animate-spin" /> Analyse en cours
                </div>
                <div className="text-sm text-indigo-800/80 mt-1">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} /> {Math.floor(analysisSeconds / 60)}m {analysisSeconds % 60}s
                  </span>
                  <span className="ml-3">• Lecture ATS • Détection des manques • Extraction des expériences</span>
                </div>
                <div className="mt-3 h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-indigo-500 animate-pulse" />
                </div>
              </div>
            )}

            {/* Error */}
            {pageStatus === "error" && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} /> Erreur
                </div>
                <p className="mt-1 whitespace-pre-wrap">{errorMessage}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Results */}
        {canShowResults && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">2) Résultat brut</h2>
                    <p className="text-sm text-gray-500 mt-1">Un score simple pour savoir où tu en es.</p>
                  </div>
                  <Button variant="outline" onClick={() => setShowStep1Json(true)}>
                    <FileText size={16} /> Voir Step1 JSON
                  </Button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <div className="text-sm font-semibold text-gray-500">Score de qualité CV</div>
                    <div className="mt-2 flex items-end gap-3">
                      <div className="text-5xl font-extrabold text-gray-900">{globalScore === null ? "—" : globalScore}</div>
                      <div className="text-sm text-gray-600 mb-2">/ 100</div>
                    </div>
                    <div className="mt-2">
                      <Pill tone={verdict.tone}>{verdict.emoji} {verdict.label}</Pill>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2">
                    <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${globalScore ?? 0}%` }} />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Basé sur la complétude + lisibilité ATS. (Step3/4 apporteront le matching par job + exports)
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">3) Diagnostic</h2>
                <p className="text-sm text-gray-500 mt-1">Ce qui explique concrètement le “pas de réponse”.</p>
              </div>
              <div className="p-6 space-y-3">
                {audit?.rows?.slice(0, 4).map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${r.level === "good" ? "bg-emerald-500" : r.level === "warn" ? "bg-amber-500" : r.level === "bad" ? "bg-rose-500" : "bg-slate-400"}`} />
                    <div className="text-sm">
                      <div className="font-semibold text-gray-900">{r.field}</div>
                      <div className="text-gray-600">{r.level === "bad" ? "Manquant ou faible" : r.level === "warn" ? "À optimiser" : "OK"}</div>
                    </div>
                  </div>
                ))}

                <div className="pt-2">
                  <div className="text-xs text-gray-500">
                    Tu vois enfin ce qui cloche. L’étape suivante : générer une version optimisée ATS (Step2).
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Full Diagnostic (table) */}
        {canShowResults && (
          <div className="mb-6">
            <Card>
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Audit qualité (tableau)</h3>
                    <p className="text-xs text-gray-500 mt-1">Vert = OK • Orange = amélioration • Rouge = manquant</p>
                  </div>
                  <div className="flex gap-2">
                    <Pill tone="good">OK</Pill>
                    <Pill tone="warn">À améliorer</Pill>
                    <Pill tone="bad">Manquant</Pill>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Reuse computed rows as diagnostic table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-gray-50 text-xs text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Critère</th>
                        <th className="px-4 py-3">Step1 (actuel)</th>
                        <th className="px-4 py-3">Recommandation</th>
                        <th className="px-4 py-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {(audit?.rows || []).map((r, idx) => (
                        <tr key={idx} className="border-t align-top">
                          <td className="px-4 py-4 font-semibold text-gray-900">{r.field}</td>
                          <td className="px-4 py-4 text-gray-700 whitespace-pre-wrap">{r.step1}</td>
                          <td className="px-4 py-4 text-gray-600 whitespace-pre-wrap">
                            {r.level === "bad"
                              ? "Bloquant : à compléter."
                              : r.level === "warn"
                              ? "Amélioration recommandée (ATS + clarté)."
                              : "OK."}
                          </td>
                          <td className="px-4 py-4">
                            <Pill tone={r.level === "good" ? "good" : r.level === "warn" ? "warn" : r.level === "bad" ? "bad" : "info"}>
                              {r.level === "good" ? "OK" : r.level === "warn" ? "À optimiser" : r.level === "bad" ? "Manquant" : "Info"}
                            </Pill>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step2 CTA */}
        {canShowResults && (
          <Card className="mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">4) Amélioration IA (Step2)</h2>
                  <p className="text-sm text-gray-500 mt-1">Un clic → CV réécrit, plus clair, plus ATS-friendly.</p>
                </div>

                <div className="flex items-center gap-2">
                  <Pill tone={step2Status === "COMPLETED" ? "good" : step2Status === "FAILED" ? "bad" : step2Status === "PROCESSING" || step2Status === "QUEUED" ? "warn" : "info"}>
                    {step2Status === "NOT_RUN"
                      ? "Non lancé"
                      : step2Status === "QUEUED"
                      ? "En file"
                      : step2Status === "PROCESSING"
                      ? "En cours"
                      : step2Status === "COMPLETED"
                      ? "Prêt"
                      : "Échec"}
                  </Pill>

                  {(step2Status === "NOT_RUN" || step2Status === "FAILED") && (
                    <Button onClick={() => void handleImproveStep2()}>
                      <Sparkles size={16} /> Améliorer mon CV !
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6">
              {!isPro && (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center gap-2 font-semibold text-indigo-900">
                    <Crown size={16} /> Débloquer l’amélioration IA
                  </div>
                  <div className="text-sm text-indigo-900/80 mt-1">
                    Tu as le diagnostic gratuit. La génération du CV optimisé + preview/export est disponible en Pro.
                  </div>
                  <div className="mt-3">
                    <Button onClick={() => setShowPaywall(true)}>
                      <Crown size={16} /> Voir l’offre
                    </Button>
                  </div>
                </div>
              )}

              {(step2Status === "QUEUED" || step2Status === "PROCESSING") && (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                  <div className="flex items-center gap-2 text-indigo-800 font-semibold">
                    <Loader2 size={16} className="animate-spin" /> Amélioration en cours
                  </div>
                  <div className="text-sm text-indigo-800/80 mt-1">
                    <Clock size={16} className="inline" /> {Math.floor(step2Seconds / 60)}m {step2Seconds % 60}s
                    <span className="ml-3">• Réécriture • Mots-clés • Structure</span>
                  </div>
                  <div className="mt-3 h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-indigo-500 animate-pulse" />
                  </div>
                </div>
              )}

              {step2Status === "FAILED" && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} /> Step2 a échoué
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{step2Error || "Une erreur est survenue."}</p>
                </div>
              )}

              {step2Status === "COMPLETED" && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle size={16} /> CV amélioré prêt
                  </div>
                  <p className="mt-1">Tu peux maintenant comparer Step1 vs Step2 et constater la valeur ajoutée.</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Step2 Audit compare */}
        {canShowResults && step2Ready && audit?.rows && (
          <div className="mb-10">
            <Step2AuditTable rows={audit.rows} />
          </div>
        )}

        {/* Step1 JSON modal */}
        <Modal isOpen={showStep1Json} title="Artefact Step1 (JSON)" onClose={() => setShowStep1Json(false)}>
          <div className="text-sm text-gray-600">
            Utile pour debug backend. Pour l’utilisateur final, ce sera caché.
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => void openStep1ArtifactInNewTab()}>
              <FileText size={16} /> Ouvrir dans un nouvel onglet
            </Button>
            <Button variant="outline" onClick={() => setShowStep1Json(false)}>
              Fermer
            </Button>
          </div>
        </Modal>

        {/* Paywall modal */}
        <Modal
          isOpen={showPaywall}
          title="Passe en Pro pour corriger ton CV"
          onClose={() => {
            setShowPaywall(false);
            try {
              sessionStorage.setItem("cvision_paywall_dismissed", "1");
            } catch {
              // ignore
            }
          }}
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Crown size={18} /> Pro = conversion (preview + export + IA)
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-emerald-600" /> Génération Step2 : CV plus ATS-friendly
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-emerald-600" /> Comparatif Step1 vs Step2 (preuve de valeur)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="mt-0.5 text-emerald-600" /> Exports (Step4 PDF) dès que branché
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <div className="font-semibold text-indigo-900">Pourquoi maintenant ?</div>
              <div className="text-sm text-indigo-900/80 mt-1">
                Tu viens d’identifier ce qui bloque. La valeur, c’est de te donner une version corrigée immédiatement.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => {
                  setIsPro(true);
                  setShowPaywall(false);
                  try {
                    localStorage.setItem("cvision_is_pro", "1");
                  } catch {
                    // ignore
                  }
                }}
                className="w-full"
              >
                <Crown size={16} /> Activer Pro (simulation)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaywall(false);
                  try {
                    sessionStorage.setItem("cvision_paywall_dismissed", "1");
                  } catch {
                    // ignore
                  }
                }}
                className="w-full"
              >
                Continuer en gratuit
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              Note: en prod, ce modal sera connecté à Clerk + Stripe. Ici, on simule le statut Pro pour valider l’UX.
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
