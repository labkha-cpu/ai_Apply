// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { CheckCircle, FileText, AlertCircle, Loader2, X, Upload, Clock } from "lucide-react";

import { API_UPLOAD_URL } from "../config/api";
import { getCandidateProfile, getArtifactUrl, triggerStep2 } from "../services/cvision";
import { getStep2ErrorMessage, resolveStep2Status, startStep2Polling, Step2Status } from "../utils/step2";
import Step2AuditTable from "../components/Step2AuditTable";
import { computeAudit, safeText, hasText, clamp, Level } from "../utils/step2Audit";

// --------------------
// TYPES
// --------------------
type ParsedCV = {
  candidate_id?: string;
  status?: string; // COMPLETED, FAILED, PROCESSING...
  error_message?: string;

  meta?: any;
  step1_json?: any;

  // Step2 fields
  step2_error?: any;
  step2_json?: any;
  step2_status?: string;
  cv_master_s3_key?: string | null;
  step2_meta?: {
    completed_at?: string;
    duration_ms?: number;
    model?: string;
    output_key?: string;
    prompt_chars?: number;
  };

  raw_cv?: any;
  [k: string]: any;
};

// --------------------
// UI COMPONENTS
// --------------------
const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant }) => {
  const bg =
    variant === "purple"
      ? "bg-purple-100 text-purple-800"
      : variant === "success"
      ? "bg-green-100 text-green-800"
      : variant === "error"
      ? "bg-red-100 text-red-800"
      : variant === "warning"
      ? "bg-amber-100 text-amber-800"
      : "bg-gray-100 text-gray-800";

  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>{children}</span>;
};

const Button: React.FC<any> = ({ children, variant = "primary", className = "", ...props }) => {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2"
      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

const Step2StatusBadge: React.FC<{ status: Step2Status }> = ({ status }) => {
  const labels: Record<Step2Status, string> = {
    NOT_RUN: "Non généré",
    QUEUED: "En file",
    PROCESSING: "En cours",
    COMPLETED: "Prêt",
    FAILED: "Échec",
  };
  const variants: Record<Step2Status, string> = {
    NOT_RUN: "bg-gray-100 text-gray-700",
    QUEUED: "bg-amber-100 text-amber-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    FAILED: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${variants[status]}`}>
      {labels[status]}
    </span>
  );
};

const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const handleFile = (file: File) => onUpload(file);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
        isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept=".pdf"
      />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
          <Upload size={24} />
        </div>
        <p className="text-sm text-gray-600 font-medium">Glissez votre PDF ici</p>
        <p className="text-xs text-gray-400 mt-2">Mode Asynchrone (S3 Trigger + Polling)</p>
      </div>
    </div>
  );
};

// --------------------
// Audit UI
// --------------------
const Pill: React.FC<{ level: Level; children: React.ReactNode }> = ({ level, children }) => {
  const styles =
    level === "good"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : level === "warn"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : level === "bad"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>{children}</span>;
};

const ScoreCard: React.FC<{ title: string; score: number | null; subtitle?: string }> = ({ title, score, subtitle }) => {
  const s = score === null ? null : clamp(Math.round(score), 0, 100);
  const level: Level = s === null ? "info" : s >= 70 ? "good" : s >= 50 ? "warn" : "bad";
  const barColor =
    level === "good" ? "bg-emerald-500" : level === "warn" ? "bg-amber-500" : level === "bad" ? "bg-rose-500" : "bg-slate-300";

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <Pill level={level}>{s === null ? "—" : `${s}/100`}</Pill>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${s === null ? 0 : s}%` }} />
      </div>
    </Card>
  );
};

const AuditDashboard: React.FC<{ profile: ParsedCV; onOpenJson: () => void }> = ({ profile, onOpenJson }) => {
  const a = useMemo(() => computeAudit(profile), [profile]);
  const step2Error = (profile as any)?.step2_error || null;

  // ✅ hard guards (no crash)
  const positives = Array.isArray((a as any)?.positives) ? (a as any).positives : [];
  const improvements = Array.isArray((a as any)?.improvements) ? (a as any).improvements : [];
  const metrics = Array.isArray((a as any)?.metrics) ? (a as any).metrics : [];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{safeText((a as any)?.fullName, "Candidat")}</h2>
              <p className="text-gray-600">{safeText((a as any)?.headline, "Titre non renseigné")}</p>
              <p className="text-sm text-gray-500 mt-1">
                {safeText((a as any)?.location, "Localisation non renseignée")}
                {hasText((a as any)?.email) ? ` • ${(a as any).email}` : ""}
                {hasText((a as any)?.phone) ? ` • ${(a as any).phone}` : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onOpenJson}>
                Voir artefact Step1 (JSON)
              </Button>
            </div>
          </div>

          {step2Error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-rose-700 font-semibold">
                <AlertCircle size={16} /> Step2 indisponible
              </div>
              <div className="text-sm text-rose-700 mt-1">{safeText(step2Error?.message, "Erreur Step2")}</div>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-rose-800/90 bg-white/60 border border-rose-200 rounded-lg p-3">
                {safeText(step2Error?.details, "—")}
              </pre>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard title="Qualité globale" score={(a as any)?.globalScore ?? null} subtitle="Complétude + skills + expériences + ATS" />
        <ScoreCard title="ATS interne" score={(a as any)?.atsInternal ?? null} subtitle="Lisibilité ATS + mots-clés" />
        <ScoreCard title="ATS modèle" score={(a as any)?.atsModel ?? null} subtitle="Pertinence modèle" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Points positifs</h3>
            <Pill level="good">À conserver</Pill>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            {(positives?.length ?? 0) === 0 ? <li>Aucun point fort détecté (profil incomplet).</li> : null}
            {(positives ?? []).map((p: any, i: number) => (
              <li key={i}>
                <span className="font-semibold">{p.label}</span> — {p.value}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Améliorations prioritaires</h3>
            <Pill level="warn">Actionnable</Pill>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            {(improvements?.length ?? 0) === 0 ? <li>Rien de critique détecté.</li> : null}
            {(improvements ?? []).map((p: any, i: number) => (
              <li key={i}>
                <span className="font-semibold">{p.label}</span> — {p.recommendation}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Table KPI */}
      <Card className="p-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Audit qualité (tableau)</h3>
              <p className="text-xs text-gray-500 mt-1">Vert = OK • Orange = amélioration • Rouge = manquant</p>
            </div>
            <div className="flex gap-2">
              <Pill level="good">OK</Pill>
              <Pill level="warn">À améliorer</Pill>
              <Pill level="bad">Manquant</Pill>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-6 py-3">Critère</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Valeur</th>
                <th className="px-6 py-3">Recommandation</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {(metrics ?? []).map((m: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="px-6 py-4 font-semibold text-gray-900">{m.label}</td>
                  <td className="px-6 py-4">
                    <Pill level={m.level}>
                      {m.level === "good" ? "OK" : m.level === "warn" ? "À améliorer" : m.level === "bad" ? "Manquant" : "Info"}
                    </Pill>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{m.value}</td>
                  <td className="px-6 py-4 text-gray-600">{m.recommendation}</td>
                </tr>
              ))}
              {(metrics?.length ?? 0) === 0 ? (
                <tr className="border-t">
                  <td className="px-6 py-4 text-gray-500" colSpan={4}>
                    Aucun KPI disponible (profil incomplet).
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const Step2Section: React.FC<{
  status: Step2Status;
  errorMessage: string;
  isGenerating: boolean;
  elapsedSeconds: number;
  step1Completed: boolean;
  onGenerate: () => void;
  onDownloadPdf: () => void;
  onDownloadJson: () => void;
}> = ({ status, errorMessage, isGenerating, elapsedSeconds, step1Completed, onGenerate, onDownloadPdf, onDownloadJson }) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Step2 — CV ATS</h2>
            <Step2StatusBadge status={status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Générez un CV optimisé ATS à partir du parsing Step1.</p>
        </div>

        {(status === "NOT_RUN" || status === "FAILED") && (
          <Button onClick={onGenerate} disabled={isGenerating || !step1Completed}>
            {status === "FAILED" ? "Relancer la génération" : "Générer le CV ATS"}
          </Button>
        )}

        {status === "COMPLETED" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onDownloadPdf}>
              Télécharger PDF
            </Button>
            <Button variant="outline" onClick={onDownloadJson}>
              Télécharger JSON
            </Button>
          </div>
        )}
      </div>

      {!step1Completed && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Step2 est disponible uniquement quand Step1 est <b>COMPLETED</b>.
        </div>
      )}

      {status === "QUEUED" && (
        <div className="mt-4 flex items-center gap-3 text-sm text-amber-700">
          <Loader2 size={16} className="animate-spin" />
          Votre demande est en file d'attente.
        </div>
      )}

      {status === "PROCESSING" && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-indigo-700">
            <Loader2 size={16} className="animate-spin" />
            Traitement en cours • {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
          </div>
          <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-indigo-500 animate-pulse" />
          </div>
        </div>
      )}

      {status === "FAILED" && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle size={16} /> Échec de génération
          </div>
          <p className="mt-1">{errorMessage || "Une erreur est survenue lors du traitement."}</p>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle size={16} /> CV ATS prêt.
          </div>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// DASHBOARD PAGE (FULL)
// ---------------------------------------------------------------------------
const DashboardPage: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "uploading" | "analyzing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [hasData, setHasData] = useState(false);
  const [candidateData, setCandidateData] = useState<ParsedCV | null>(null);

  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [pollingTime, setPollingTime] = useState(0);

  const pollingInterval = useRef<number | null>(null);
  const timerInterval = useRef<number | null>(null);

  const [step2Status, setStep2Status] = useState<Step2Status>("NOT_RUN");
  const [step2ErrorMessage, setStep2ErrorMessage] = useState("");
  const [step2Elapsed, setStep2Elapsed] = useState(0);
  const [isStep2Generating, setIsStep2Generating] = useState(false);

  const step2Timer = useRef<number | null>(null);
  const stopStep2Polling = useRef<(() => void) | null>(null);

  const [showDebugModal, setShowDebugModal] = useState(false);

  // ✅ Step2 JSON auto-load (when COMPLETED but step2_json missing)
  const [step2JsonLoading, setStep2JsonLoading] = useState(false);
  const [step2JsonLoadError, setStep2JsonLoadError] = useState<string>("");

  // Cleanup
  useEffect(() => {
    return () => {
      stopPolling();
      stopStep2Timers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep derived step2 status up-to-date
  useEffect(() => {
    if (!candidateData) {
      setStep2Status("NOT_RUN");
      setStep2ErrorMessage("");
      return;
    }
    const resolved = resolveStep2Status(candidateData);
    setStep2Status(resolved);
    setStep2ErrorMessage(resolved === "FAILED" ? getStep2ErrorMessage(candidateData) : "");
  }, [candidateData]);

  const stopPolling = () => {
    if (pollingInterval.current) {
      window.clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
    if (timerInterval.current) {
      window.clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const stopStep2Timers = () => {
    if (step2Timer.current) {
      window.clearInterval(step2Timer.current);
      step2Timer.current = null;
    }
    if (stopStep2Polling.current) {
      stopStep2Polling.current();
      stopStep2Polling.current = null;
    }
  };

  const mergeCandidateData = (nextProfile: ParsedCV) => {
    setCandidateData((prev) => {
      const prevData: any = prev || {};
      const next: any = nextProfile || {};
      return {
        ...prevData,
        ...next,
        candidate_id: next.candidate_id || prevData.candidate_id,
        meta: next.meta || prevData.meta,
        step1_json: prevData.step1_json || next.step1_json,
        // Step2
        step2_json: next.step2_json || prevData.step2_json,
        step2_status: next.step2_status || prevData.step2_status,
        step2_meta: next.step2_meta || prevData.step2_meta,
        cv_master_s3_key: next.cv_master_s3_key ?? prevData.cv_master_s3_key,
        step2_error: next.step2_error || prevData.step2_error,
      };
    });
  };

  // ✅ Auto-resume Step2 polling after refresh / navigation
  useEffect(() => {
    if (!candidateData?.candidate_id) return;

    const st = resolveStep2Status(candidateData);
    if (st !== "QUEUED" && st !== "PROCESSING") return;

    if (stopStep2Polling.current) return;

    if (!step2Timer.current) {
      setStep2Elapsed(0);
      step2Timer.current = window.setInterval(() => setStep2Elapsed((t) => t + 1), 1000);
    }

    stopStep2Polling.current = startStep2Polling({
      candidateId: candidateData.candidate_id,
      getProfile: (id) => getCandidateProfile(id, "all"),
      onUpdate: (profile, statusResolved) => {
        mergeCandidateData(profile as any);
        setStep2Status(statusResolved);
        if (statusResolved === "FAILED") setStep2ErrorMessage(getStep2ErrorMessage(profile));
      },
      onDone: (profile, statusResolved) => {
        mergeCandidateData(profile as any);
        setStep2Status(statusResolved);
        setIsStep2Generating(false);
        if (statusResolved === "FAILED") setStep2ErrorMessage(getStep2ErrorMessage(profile));
        stopStep2Timers();
      },
      onError: (error) => console.error("Erreur polling Step2(auto):", error),
      intervalMs: 2500,
      maxAttempts: 200,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateData?.candidate_id, candidateData?.step2_status, candidateData?.cv_master_s3_key]);

  // ✅ Auto-fetch Step2 JSON as soon as COMPLETED (if missing)
  useEffect(() => {
    const cid = candidateData?.candidate_id;
    if (!cid) return;

    if (step2Status !== "COMPLETED") return;

    const already = candidateData?.step2_json && typeof candidateData.step2_json === "object" && Object.keys(candidateData.step2_json).length > 0;
    if (already) return;

    // Only try if we have the key (or meta key) to avoid useless calls
    const cvKey = (candidateData as any)?.cv_master_s3_key ?? (candidateData as any)?.meta?.cv_master_s3_key ?? null;
    if (!cvKey) return;

    let cancelled = false;

    (async () => {
      try {
        setStep2JsonLoadError("");
        setStep2JsonLoading(true);

        // Presigned download URL from BFF
        const art = await getArtifactUrl(cid, "step2_cv_master");

        // Fetch JSON content (may fail if S3 CORS not configured)
        const res = await fetch(art.url, { method: "GET" });
        if (!res.ok) throw new Error(`Fetch Step2 JSON échoué (${res.status})`);
        const json = await res.json();

        if (cancelled) return;

        mergeCandidateData({
          candidate_id: cid,
          step2_json: json,
          cv_master_s3_key: cvKey,
        } as any);
      } catch (e: any) {
        if (cancelled) return;
        setStep2JsonLoadError(
          e?.message ||
            "Impossible de charger automatiquement le JSON Step2 (souvent dû à la CORS S3). Tu peux quand même le télécharger via le bouton."
        );
      } finally {
        if (!cancelled) setStep2JsonLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step2Status, candidateData?.candidate_id, candidateData?.cv_master_s3_key]);

  const startPolling = (candidateId: string) => {
    stopPolling();
    setPollingTime(0);

    timerInterval.current = window.setInterval(() => {
      setPollingTime((t) => t + 1);
    }, 1000);

    let attempts = 0;
    const maxAttempts = 300; // 10 minutes @ 2s

    pollingInterval.current = window.setInterval(async () => {
      attempts++;
      try {
        const preview = await getCandidateProfile(candidateId, "preview").catch((e: any) => {
          const msg = String(e?.message || "");
          if (msg.includes("introuvable") || msg.includes("404")) return null;
          throw e;
        });

        if (!preview) {
          if (attempts >= maxAttempts) {
            stopPolling();
            setStatus("error");
            setErrorMessage("Délai d'attente dépassé (10min). Vérifie CloudWatch côté Step1.");
          }
          return;
        }

        const meta = (preview as any).meta || preview;
        const st = meta?.status || (preview as any).status;

        if (st === "FAILED") {
          stopPolling();
          setStatus("error");
          setErrorMessage(meta?.error_message || (preview as any).error_message || "L'analyse a échoué côté serveur (voir logs CloudWatch).");
          return;
        }

        if (st === "COMPLETED") {
          const full = await getCandidateProfile(candidateId, "all");

          const merged: ParsedCV = {
            ...(full as any),
            candidate_id: (full as any).candidate_id || candidateId,
            meta: (full as any).meta || meta,
            step1_json: (full as any).step1_json,
            // step2
            step2_json: (full as any).step2_json,
            step2_error: (full as any).step2_error,
            step2_status: (full as any).step2_status,
            cv_master_s3_key: (full as any).cv_master_s3_key ?? (full as any)?.meta?.cv_master_s3_key,
            step2_meta: (full as any).step2_meta ?? (full as any)?.meta?.step2_meta,
          };

          stopPolling();
          setCandidateData(merged);
          setHasData(true);
          setStatus("success");
        }

        if (attempts >= maxAttempts) {
          stopPolling();
          setStatus("error");
          setErrorMessage("Délai d'attente dépassé (10min). Vérifie CloudWatch côté Step1.");
        }
      } catch (err: any) {
        console.error("Erreur polling:", err);
      }
    }, 2000);
  };

  const handleUpload = async (file: File) => {
    setStatus("uploading");
    setErrorMessage("");
    setCandidateData(null);
    setHasData(false);
    setUploadedKey(null);
    stopPolling();
    stopStep2Timers();
    setStep2Status("NOT_RUN");
    setStep2ErrorMessage("");
    setStep2Elapsed(0);
    setIsStep2Generating(false);
    setStep2JsonLoading(false);
    setStep2JsonLoadError("");

    try {
      const uploadTicketResponse = await fetch(API_UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || "application/pdf",
          content_length: file.size,
        }),
      });

      if (!uploadTicketResponse.ok) {
        const txt = await uploadTicketResponse.text().catch(() => "");
        throw new Error(`Erreur API Upload (${uploadTicketResponse.status}). ${txt}`);
      }

      const ticket = await uploadTicketResponse.json();
      const upload_url = ticket.upload_url;
      const candidate_id = ticket.candidate_id;
      const key = ticket.key;
      const signed_content_type = ticket.content_type || (file.type || "application/pdf");

      if (!upload_url || !candidate_id || !key) {
        throw new Error("Réponse PostCV invalide: upload_url / candidate_id / key manquants.");
      }

      const putRes = await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": signed_content_type },
      });

      if (!putRes.ok) {
        const hint =
          putRes.status === 403
            ? " (403: mismatch Content-Type entre signature et PUT — assure-toi d'envoyer EXACTEMENT le même Content-Type)"
            : "";
        throw new Error(`Échec PUT S3 (${putRes.status})${hint}`);
      }

      setUploadedKey(key);
      setStatus("analyzing");
      startPolling(candidate_id);
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error?.message || "Une erreur est survenue.");
    }
  };

  const openStep1Artifact = async () => {
    const cid = candidateData?.candidate_id;
    if (!cid) return;
    try {
      const r = await getArtifactUrl(cid, "step1_json");
      window.open(r.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setErrorMessage(e?.message || "Impossible d'ouvrir l'artefact step1_json");
    }
  };

  const handleGenerateStep2 = async () => {
    const cid = candidateData?.candidate_id;
    if (!cid || isStep2Generating) return;

    const step1Status = String(candidateData?.meta?.status || candidateData?.status || "").toUpperCase();
    if (step1Status !== "COMPLETED") {
      setStep2Status("FAILED");
      setStep2ErrorMessage("Step1 n'est pas COMPLETED : impossible de lancer Step2.");
      return;
    }

    setStep2ErrorMessage("");
    setStep2JsonLoadError("");
    setIsStep2Generating(true);
    setStep2Status("QUEUED");
    setStep2Elapsed(0);

    stopStep2Timers();
    step2Timer.current = window.setInterval(() => setStep2Elapsed((t) => t + 1), 1000);

    try {
      await triggerStep2(cid);
    } catch (e: any) {
      setIsStep2Generating(false);
      stopStep2Timers();
      setStep2Status("FAILED");
      setStep2ErrorMessage(e?.message || "Impossible de lancer la génération Step2.");
      return;
    }

    stopStep2Polling.current = startStep2Polling({
      candidateId: cid,
      getProfile: (id) => getCandidateProfile(id, "all"),
      onUpdate: (profile, st) => {
        mergeCandidateData(profile as any);
        setStep2Status(st);
        if (st === "FAILED") setStep2ErrorMessage(getStep2ErrorMessage(profile));
      },
      onDone: (profile, st) => {
        mergeCandidateData(profile as any);
        setStep2Status(st);
        setIsStep2Generating(false);
        if (st === "FAILED") setStep2ErrorMessage(getStep2ErrorMessage(profile));
        stopStep2Timers();
      },
      onError: (error) => console.error("Erreur polling Step2:", error),
      intervalMs: 2500,
      maxAttempts: 200,
    });
  };

  const handleDownloadStep2Pdf = async () => {
    const cid = candidateData?.candidate_id;
    if (!cid) return;
    try {
      const r = await getArtifactUrl(cid, "step4_pdf");
      window.open(r.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      setStep2ErrorMessage(e?.message || "Impossible de télécharger le PDF.");
      setStep2Status("FAILED");
    }
  };

  const handleDownloadStep2Json = async () => {
    const cid = candidateData?.candidate_id;
    if (!cid) return;
    try {
      const r = await getArtifactUrl(cid, "step2_cv_master");
      window.open(r.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      setStep2ErrorMessage(e?.message || "Impossible de télécharger le JSON.");
      setStep2Status("FAILED");
    }
  };

  const step1Completed = useMemo(() => {
    const st = String(candidateData?.meta?.status || candidateData?.status || "").toUpperCase();
    return st === "COMPLETED";
  }, [candidateData?.meta?.status, candidateData?.status]);

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Espace Connecté AWS</p>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard CVision</h1>
            <p className="text-gray-600">
              Pipeline : <span className="text-indigo-500 font-bold">Asynchrone (S3 Trigger + Polling)</span>
            </p>
          </div>
          {status === "success" && candidateData?.candidate_id && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openStep1Artifact}>
                Artefact Step1
              </Button>
              <Button variant="outline" onClick={() => setShowDebugModal(true)}>
                Debug (JSON)
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload de CV</h2>
              <Badge
                variant={status === "success" ? "success" : status === "error" ? "error" : status !== "idle" ? "warning" : "neutral"}
              >
                {status === "idle" && "En attente"}
                {status === "uploading" && "Transfert S3..."}
                {status === "analyzing" && "Traitement IA en cours..."}
                {status === "success" && "Terminé"}
                {status === "error" && "Erreur"}
              </Badge>
            </div>

            <FileUpload onUpload={handleUpload} />

            <div className="mt-4">
              {status === "analyzing" && (
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-pulse">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-indigo-700 font-medium flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Analyse en arrière-plan...
                    </p>
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-100 px-2 py-1 rounded flex items-center gap-1">
                      <Clock size={12} /> {Math.floor(pollingTime / 60)}m {pollingTime % 60}s
                    </span>
                  </div>
                  <p className="text-xs text-indigo-500 mt-2">
                    L'IA analyse le document. Cela peut prendre quelques minutes selon la charge AWS.
                    {pollingTime > 60 && " (Traitement long détecté, patientez...)"}
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} /> Échec
                  </p>
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                </div>
              )}

              {status === "success" && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-green-600 flex items-center gap-2 font-medium">
                    <CheckCircle size={16} /> Analyse réussie en {pollingTime}s !
                  </p>
                  <p className="text-xs text-gray-500">ID: {candidateData?.candidate_id}</p>
                  {uploadedKey && <p className="text-xs text-gray-400">S3: {uploadedKey}</p>}
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" className="flex-1" onClick={openStep1Artifact} disabled={!candidateData?.candidate_id}>
                      Ouvrir artefact Step1
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowDebugModal(true)} disabled={!candidateData}>
                      Debug (JSON)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Résumé</h3>
            {hasData ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-xs text-gray-500">Nom détecté</p>
                  <p className="font-bold text-lg">{candidateData?.meta?.full_name || candidateData?.step1_json?.identity?.full_name || "Inconnu"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Titre</p>
                  <p className="font-medium">{candidateData?.meta?.headline || candidateData?.step1_json?.identity?.headline || "Non spécifié"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expérience</p>
                  <p className="font-medium text-indigo-600">
                    {typeof candidateData?.meta?.years_of_experience_inferred === "number"
                      ? `${candidateData?.meta?.years_of_experience_inferred.toFixed(1)} ans`
                      : "—"}
                  </p>
                </div>
                <div className="pt-2">
                  <Badge variant={step2Status === "FAILED" ? "warning" : step2Status === "COMPLETED" ? "success" : "neutral"}>
                    Step2: {step2Status}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <FileText size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">En attente de données</p>
              </div>
            )}
          </Card>
        </div>

        {hasData && candidateData && (
          <div className="mt-2 space-y-6">
            <AuditDashboard profile={candidateData} onOpenJson={openStep1Artifact} />

            {/* ✅ Step2 audit auto: show as soon as COMPLETED, even if JSON is still loading */}
            {step2Status === "COMPLETED" && (
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Audit Step2 (CV ATS-friendly)</h3>
                    <p className="text-sm text-gray-500">Comparaison Step1 vs Step2 (améliorations IA)</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDownloadStep2Json}>
                      Télécharger JSON
                    </Button>
                    <Button variant="outline" onClick={handleDownloadStep2Pdf}>
                      Télécharger PDF
                    </Button>
                  </div>
                </div>

                {step2JsonLoading && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-indigo-700">
                    <Loader2 size={16} className="animate-spin" />
                    Chargement automatique du JSON Step2…
                  </div>
                )}

                {step2JsonLoadError && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    {step2JsonLoadError}
                  </div>
                )}

                {candidateData.step2_json && (
                  <div className="mt-6">
                    <Step2AuditTable profile={candidateData as any} />
                  </div>
                )}

                {!step2JsonLoading && !candidateData.step2_json && !step2JsonLoadError && (
                  <div className="mt-4 text-sm text-gray-600">
                    Step2 est <b>COMPLETED</b> mais le JSON n’est pas encore hydraté. Ré-essaye dans 2 secondes ou télécharge le JSON.
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {hasData && candidateData && (
          <div className="mt-6">
            <Step2Section
              status={step2Status}
              errorMessage={step2ErrorMessage}
              isGenerating={isStep2Generating}
              elapsedSeconds={step2Elapsed}
              step1Completed={step1Completed}
              onGenerate={handleGenerateStep2}
              onDownloadPdf={handleDownloadStep2Pdf}
              onDownloadJson={handleDownloadStep2Json}
            />
          </div>
        )}

        {hasData && candidateData && (
          <div className="mt-6">
            <Step2Section
              status={step2Status}
              errorMessage={step2ErrorMessage}
              isGenerating={isStep2Generating}
              elapsedSeconds={step2Elapsed}
              onGenerate={handleGenerateStep2}
              onDownloadPdf={handleDownloadStep2Pdf}
              onDownloadJson={handleDownloadStep2Json}
            />
          </div>
        )}
      </div>

      <Modal isOpen={showDebugModal} onClose={() => setShowDebugModal(false)} title="Debug — Profil brut (Live AWS)">
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto h-[70vh]">
          {JSON.stringify(candidateData, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default DashboardPage;
