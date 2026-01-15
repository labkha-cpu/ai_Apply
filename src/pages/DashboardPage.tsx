import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Upload,
  Clock
} from 'lucide-react';

import { API_UPLOAD_URL } from "../config/api";
import { getCandidateProfile, getArtifactUrl, triggerStep2 } from "../services/cvision";
import {
  getStep2ErrorMessage,
  resolveStep2Status,
  startStep2Polling,
  Step2Status,
} from "../utils/step2";

// --------------------
// TYPES
// --------------------
type ParsedCV = {
  candidate_id?: string;
  status?: string; // COMPLETED, FAILED, PROCESSING...
  error_message?: string;

  meta?: any; // <- on travaille sur ta structure (meta contient raw_cv + scores + contact)
  step1_json?: any;
  step2_error?: any;
  step2_json?: any;
  step2_status?: string;

  identity?: {
    full_name?: string;
    headline?: string;
    emails?: string[];
    phones?: string[];
    location?: string;
    linkedin?: string;
    github?: string;
  };

  skills?: {
    hard_skills?: string[];
    soft_skills?: string[];
    skills_normalized?: string[];
  };

  experiences?: any[];
  education?: any[];
  languages?: any[];
  sectors?: any;

  summary?: {
    profile_summary?: string;
    value_proposition?: string[];
  };

  career?: {
    years_of_experience_inferred?: number;
    current_seniority?: string;
  };

  ats?: {
    score_internal?: number;
    score_model?: number;
    ats_improvement_tips?: string[];
  };

  quality?: {
    global_confidence?: number;
    issues?: { code: string; message: string }[];
  };

  years_of_experience?: number;
  years_of_experience_inferred?: number;

  raw_cv?: any;
};

// --------------------
// UI COMPONENTS
// --------------------
const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant }) => {
  const bg =
    variant === 'purple' ? 'bg-purple-100 text-purple-800' :
    variant === 'success' ? 'bg-green-100 text-green-800' :
    variant === 'error' ? 'bg-red-100 text-red-800' :
    variant === 'warning' ? 'bg-amber-100 text-amber-800' :
    'bg-gray-100 text-gray-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>
      {children}
    </span>
  );
};

const Button: React.FC<any> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-lg disabled:opacity-50";
  const styles =
    variant === 'primary'
      ? "bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2"
      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2";
  return <button className={`${base} ${styles} ${className}`} {...props}>{children}</button>;
};

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>{children}</div>
);

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
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
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
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
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600"><Upload size={24} /></div>
        <p className="text-sm text-gray-600 font-medium">Glissez votre PDF ici</p>
        <p className="text-xs text-gray-400 mt-2">Mode Asynchrone (S3 Trigger + Polling)</p>
      </div>
    </div>
  );
};

// --------------------
// Audit helpers (based on your actual profile shape)
// --------------------
type Level = 'good' | 'warn' | 'bad' | 'info';
type Metric = { label: string; status: string; value: string; level: Level; recommendation: string };

const asArray = <T,>(v: any): T[] => Array.isArray(v) ? v : [];
const hasText = (v: any) => typeof v === 'string' && v.trim().length > 0;
const safeText = (v: any, fallback = '—') => hasText(v) ? v.trim() : fallback;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const Pill: React.FC<{ level: Level; children: React.ReactNode }> = ({ level, children }) => {
  const styles =
    level === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    level === 'warn' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    level === 'bad' ? 'bg-rose-50 text-rose-700 border-rose-200' :
    'bg-slate-50 text-slate-700 border-slate-200';

  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>{children}</span>;
};

const ScoreCard: React.FC<{ title: string; score: number | null; subtitle?: string }> = ({ title, score, subtitle }) => {
  const s = score === null ? null : clamp(Math.round(score), 0, 100);
  const level: Level = s === null ? 'info' : (s >= 70 ? 'good' : s >= 50 ? 'warn' : 'bad');

  const barColor =
    level === 'good' ? 'bg-emerald-500' :
    level === 'warn' ? 'bg-amber-500' :
    level === 'bad' ? 'bg-rose-500' :
    'bg-slate-300';

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
        <Pill level={level}>{s === null ? '—' : `${s}/100`}</Pill>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${barColor}`} style={{ width: `${s === null ? 0 : s}%` }} />
      </div>
    </Card>
  );
};

function computeAudit(profile: ParsedCV) {
  const meta = (profile as any)?.meta || {};
  const raw = meta?.raw_cv || (profile as any)?.raw_cv || {};
  const step1 = (profile as any)?.step1_json || {};

  const identity = raw?.identity || step1?.identity || {};
  const skills = raw?.skills || step1?.skills || {};
  const experiences = asArray<any>(step1?.experiences || raw?.experiences || []);
  const languages = asArray<any>(step1?.languages || raw?.languages || []);
  const sectors = step1?.sectors || raw?.sectors || null;

  const fullName = meta?.full_name || identity?.full_name || '';
  const headline = meta?.headline || identity?.headline || '';
  const location = meta?.location || identity?.location || '';
  const email = meta?.email || (asArray<string>(identity?.emails)[0] || '');
  const phone = meta?.phone || (asArray<string>(identity?.phones)[0] || '');

  const linkedin = identity?.linkedin || '';
  const github = identity?.github || '';

  const atsInternal = typeof meta?.ats_score_internal === 'number' ? meta.ats_score_internal : (typeof raw?.ats?.score_internal === 'number' ? raw.ats.score_internal : null);
  const atsModel = typeof meta?.ats_score_model === 'number' ? meta.ats_score_model : (typeof raw?.ats?.score_model === 'number' ? raw.ats.score_model : null);

  const yrs = typeof meta?.years_of_experience_inferred === 'number'
    ? meta.years_of_experience_inferred
    : (typeof raw?.career?.years_of_experience_inferred === 'number' ? raw.career.years_of_experience_inferred : null);

  const hard = asArray<string>(skills?.hard_skills);
  const soft = asArray<string>(skills?.soft_skills);
  const normalized = asArray<string>(skills?.skills_normalized);

  const qualityIssues = asArray<{ code: string; message: string }>(step1?.quality?.issues || raw?.quality?.issues);
  const tips = asArray<string>(step1?.ats?.ats_improvement_tips || raw?.ats?.ats_improvement_tips);

  const metrics: Metric[] = [];

  // Identity completeness
  metrics.push({
    label: "Nom complet",
    status: hasText(fullName) ? "OK" : "Manquant",
    value: hasText(fullName) ? fullName : "—",
    level: hasText(fullName) ? "good" : "bad",
    recommendation: hasText(fullName) ? "RAS" : "Renseigner le nom complet.",
  });

  metrics.push({
    label: "Titre (headline)",
    status: hasText(headline) ? "OK" : "À améliorer",
    value: hasText(headline) ? headline : "—",
    level: hasText(headline) ? "good" : "warn",
    recommendation: hasText(headline) ? "RAS" : "Ajouter un titre clair aligné au poste cible (ex: “Chef de projet IT / MOA-MOE”).",
  });

  metrics.push({
    label: "Localisation",
    status: hasText(location) ? "OK" : "À améliorer",
    value: hasText(location) ? location : "—",
    level: hasText(location) ? "good" : "warn",
    recommendation: hasText(location) ? "RAS" : "Ajouter une ville (utile pour le matching).",
  });

  metrics.push({
    label: "Email",
    status: hasText(email) ? "OK" : "Manquant",
    value: hasText(email) ? email : "—",
    level: hasText(email) ? "good" : "bad",
    recommendation: hasText(email) ? "RAS" : "Ajouter un email (obligatoire pour candidater).",
  });

  metrics.push({
    label: "Téléphone",
    status: hasText(phone) ? "OK" : "À améliorer",
    value: hasText(phone) ? phone : "—",
    level: hasText(phone) ? "good" : "warn",
    recommendation: hasText(phone) ? "RAS" : "Ajouter un téléphone pour augmenter le taux de rappel.",
  });

  // Links
  metrics.push({
    label: "LinkedIn",
    status: hasText(linkedin) ? "OK" : "À améliorer",
    value: hasText(linkedin) ? "Présent" : "Absent",
    level: hasText(linkedin) ? "good" : "warn",
    recommendation: hasText(linkedin) ? "RAS" : "Ajouter une URL LinkedIn (fort signal de confiance).",
  });

  // GitHub (you have 'unknown' => treat as missing)
  const githubMissing = !hasText(github) || github === 'unknown';
  metrics.push({
    label: "GitHub / Portfolio",
    status: githubMissing ? "Manquant" : "OK",
    value: githubMissing ? "Absent" : "Présent",
    level: githubMissing ? "bad" : "good",
    recommendation: githubMissing ? "Ajouter un GitHub ou portfolio (projets, code, démos). Priorité ATS." : "RAS",
  });

  // ATS
  metrics.push({
    label: "ATS interne",
    status: atsInternal === null ? "Info" : (atsInternal >= 70 ? "OK" : atsInternal >= 50 ? "À améliorer" : "Critique"),
    value: atsInternal === null ? "—" : `${Math.round(atsInternal)}/100`,
    level: atsInternal === null ? "info" : (atsInternal >= 70 ? "good" : atsInternal >= 50 ? "warn" : "bad"),
    recommendation:
      atsInternal === null ? "Vérifier le calcul ATS interne côté Step1." :
      atsInternal >= 70 ? "Bon niveau ATS." :
      atsInternal >= 50 ? "Ajouter mots-clés + résultats chiffrés par expérience." :
      "Revoir structure + mots-clés + impacts quantifiés (priorité).",
  });

  metrics.push({
    label: "ATS modèle",
    status: atsModel === null ? "Info" : (atsModel >= 70 ? "OK" : atsModel >= 50 ? "À améliorer" : "Critique"),
    value: atsModel === null ? "—" : `${Math.round(atsModel)}/100`,
    level: atsModel === null ? "info" : (atsModel >= 70 ? "good" : atsModel >= 50 ? "warn" : "bad"),
    recommendation:
      atsModel === null ? "Vérifier le score modèle côté Step1." :
      atsModel >= 70 ? "Bon score modèle." :
      "Améliorer la pertinence: skills normalisés + bullets orientées résultats.",
  });

  // Experience coverage
  metrics.push({
    label: "Expériences",
    status: experiences.length >= 3 ? "OK" : experiences.length >= 1 ? "À améliorer" : "Manquant",
    value: `${experiences.length}`,
    level: experiences.length >= 3 ? "good" : experiences.length >= 1 ? "warn" : "bad",
    recommendation:
      experiences.length >= 3 ? "RAS" :
      experiences.length >= 1 ? "Ajouter / détailler les expériences (3+ idéal)." :
      "Ajouter au moins 1 expérience.",
  });

  // Skills coverage
  metrics.push({
    label: "Hard skills",
    status: hard.length >= 10 ? "OK" : hard.length >= 5 ? "À améliorer" : "Critique",
    value: `${hard.length}`,
    level: hard.length >= 10 ? "good" : hard.length >= 5 ? "warn" : "bad",
    recommendation: hard.length >= 10 ? "RAS" : "Ajouter des hard skills ciblés (AWS, SQL, API, Agile, etc.).",
  });

  metrics.push({
    label: "Soft skills",
    status: soft.length >= 8 ? "OK" : soft.length >= 4 ? "À améliorer" : "Info",
    value: `${soft.length}`,
    level: soft.length >= 8 ? "good" : soft.length >= 4 ? "warn" : "info",
    recommendation: soft.length >= 8 ? "RAS" : "Compléter avec 5–10 soft skills pertinents (leadership, rigueur…).",
  });

  metrics.push({
    label: "Skills normalisés",
    status: normalized.length >= 12 ? "OK" : normalized.length >= 6 ? "À améliorer" : "Info",
    value: `${normalized.length}`,
    level: normalized.length >= 12 ? "good" : normalized.length >= 6 ? "warn" : "info",
    recommendation: normalized.length >= 12 ? "RAS" : "Ajouter des compétences normalisées (mots-clés ATS).",
  });

  metrics.push({
    label: "Langues",
    status: languages.length >= 1 ? "OK" : "Info",
    value: `${languages.length}`,
    level: languages.length >= 1 ? "good" : "info",
    recommendation: languages.length >= 1 ? "RAS" : "Ajouter au moins une langue avec niveau.",
  });

  metrics.push({
    label: "Secteur principal",
    status: sectors?.primary_sector ? "OK" : "Info",
    value: safeText(sectors?.primary_sector, "—"),
    level: sectors?.primary_sector ? "good" : "info",
    recommendation: sectors?.primary_sector ? "RAS" : "Ajouter un secteur principal (aide le matching).",
  });

  // Quality issues
  if (qualityIssues.length > 0) {
    metrics.push({
      label: "Issues qualité",
      status: "À corriger",
      value: `${qualityIssues.length}`,
      level: "warn",
      recommendation: qualityIssues[0]?.message || "Corriger les issues de qualité détectées.",
    });
  }

  // Global score (simple but effective)
  const contactScore =
    (hasText(fullName) ? 18 : 0) +
    (hasText(headline) ? 8 : 0) +
    (hasText(location) ? 6 : 0) +
    (hasText(email) ? 18 : 0) +
    (hasText(phone) ? 10 : 0) +
    (!githubMissing ? 10 : 0) +
    (hasText(linkedin) ? 6 : 0);

  const skillsScore = clamp(hard.length * 2 + normalized.length, 0, 30);
  const expScore = experiences.length >= 4 ? 20 : experiences.length === 3 ? 16 : experiences.length === 2 ? 12 : experiences.length === 1 ? 8 : 0;
  const atsScore = atsInternal === null ? 10 : clamp(Math.round(atsInternal * 0.2), 0, 20);

  const globalScore = clamp(Math.round(contactScore + skillsScore + expScore + atsScore), 0, 100);

  const positives = metrics.filter(m => m.level === 'good').slice(0, 6);
  const improvements = metrics.filter(m => m.level === 'bad' || m.level === 'warn').slice(0, 8);

  return {
    meta,
    raw,
    step1,
    identity,
    skills,
    experiences,
    languages,
    sectors,
    fullName,
    headline,
    location,
    email,
    phone,
    linkedin,
    github,
    githubMissing,
    atsInternal,
    atsModel,
    yrs,
    tips,
    qualityIssues,
    metrics,
    positives,
    improvements,
    globalScore,
  };
}

const AuditDashboard: React.FC<{ profile: ParsedCV; onOpenJson: () => void }> = ({ profile, onOpenJson }) => {
  const a = useMemo(() => computeAudit(profile), [profile]);

  const step2Error = (profile as any)?.step2_error || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{safeText(a.fullName, "Candidat")}</h2>
              <p className="text-gray-600">{safeText(a.headline, "Titre non renseigné")}</p>
              <p className="text-sm text-gray-500 mt-1">
                {safeText(a.location, "Localisation non renseignée")}
                {hasText(a.email) ? ` • ${a.email}` : ""}
                {hasText(a.phone) ? ` • ${a.phone}` : ""}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onOpenJson}>
                Voir artefact Step1 (JSON)
              </Button>
            </div>
          </div>

          {/* Step2 status (your screenshot shows AccessDenied s3:ListBucket) */}
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

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ScoreCard title="Qualité globale" score={a.globalScore} subtitle="Complétude + skills + expériences + ATS" />
        <ScoreCard title="ATS interne" score={a.atsInternal} subtitle="Lisibilité ATS + mots-clés" />
        <ScoreCard title="ATS modèle" score={a.atsModel} subtitle="Pertinence modèle" />
      </div>

      {/* Highlights + Improvements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Points positifs</h3>
            <Pill level="good">À conserver</Pill>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            {a.positives.length === 0 ? <li>Aucun point fort détecté (profil incomplet).</li> : null}
            {a.positives.map((p, i) => (
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
            {a.improvements.length === 0 ? <li>Rien de critique détecté.</li> : null}
            {a.improvements.map((p, i) => (
              <li key={i}>
                <span className="font-semibold">{p.label}</span> — {p.recommendation}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ATS tips + Quality issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Conseils ATS</h3>
            <Pill level="info">Optimisation</Pill>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            {a.tips.length === 0 ? <li>Aucun tip ATS fourni.</li> : null}
            {a.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Issues qualité</h3>
            <Pill level={a.qualityIssues.length > 0 ? "warn" : "good"}>
              {a.qualityIssues.length > 0 ? `${a.qualityIssues.length} issue(s)` : "OK"}
            </Pill>
          </div>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
            {a.qualityIssues.length === 0 ? <li>Aucune issue détectée.</li> : null}
            {a.qualityIssues.map((it, i) => (
              <li key={i}>
                <span className="font-semibold">{it.code}</span> — {it.message}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Audit table */}
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
              {a.metrics.map((m, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-6 py-4 font-semibold text-gray-900">{m.label}</td>
                  <td className="px-6 py-4">
                    <Pill level={m.level}>
                      {m.level === 'good' ? 'OK' : m.level === 'warn' ? 'À améliorer' : m.level === 'bad' ? 'Manquant' : 'Info'}
                    </Pill>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{m.value}</td>
                  <td className="px-6 py-4 text-gray-600">{m.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900">Résumé</h3>
          <p className="mt-2 text-sm text-gray-700 leading-relaxed">
            {safeText(a.raw?.summary?.profile_summary || a.step1?.summary?.profile_summary, "Résumé non disponible.")}
          </p>
          <div className="mt-3">
            <h4 className="text-xs font-semibold text-gray-500">Proposition de valeur</h4>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
              {asArray<string>(a.raw?.summary?.value_proposition || a.step1?.summary?.value_proposition).length === 0
                ? <li>—</li>
                : asArray<string>(a.raw?.summary?.value_proposition || a.step1?.summary?.value_proposition).map((v, i) => <li key={i}>{v}</li>)
              }
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900">Expérience & secteurs</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Expérience estimée</div>
              <div className="text-lg font-bold text-indigo-700 mt-1">
                {a.yrs === null ? "—" : `${a.yrs.toFixed(1)} ans`}
              </div>
              <div className="text-xs text-gray-500 mt-1">Seniorité: {safeText(a.raw?.career?.current_seniority || a.step1?.career?.current_seniority, "—")}</div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="text-xs text-gray-500">Secteur principal</div>
              <div className="text-base font-semibold text-gray-900 mt-1">
                {safeText(a.sectors?.primary_sector, "—")}
              </div>
              <div className="text-xs text-gray-500 mt-1">Expériences: {a.experiences.length}</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-500">Dernières expériences</h4>
            <div className="mt-2 space-y-2">
              {a.experiences.slice(0, 3).map((e: any, i: number) => (
                <div key={i} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-semibold text-gray-900">{safeText(e?.title, "Expérience")}</div>
                    <div className="text-xs text-gray-500">{safeText(e?.date_start, "—")} → {safeText(e?.date_end, "—")}</div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{safeText(e?.company, "—")} • {safeText(e?.location, "—")}</div>
                  {hasText(e?.summary) && <div className="text-sm text-gray-700 mt-2">{e.summary}</div>}
                  {asArray<string>(e?.highlights).length > 0 && (
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
                      {asArray<string>(e?.highlights).slice(0, 2).map((h, idx) => <li key={idx}>{h}</li>)}
                    </ul>
                  )}
                </div>
              ))}
              {a.experiences.length === 0 && <div className="text-sm text-gray-500">Aucune expérience détectée.</div>}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Step2Section: React.FC<{
  status: Step2Status;
  errorMessage: string;
  isGenerating: boolean;
  elapsedSeconds: number;
  onGenerate: () => void;
  onDownloadPdf: () => void;
  onDownloadJson: () => void;
}> = ({ status, errorMessage, isGenerating, elapsedSeconds, onGenerate, onDownloadPdf, onDownloadJson }) => {
  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Step2 — CV ATS</h2>
            <Step2StatusBadge status={status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Générez un CV optimisé ATS à partir de l'audit validé.
          </p>
        </div>
        {status === "NOT_RUN" && (
          <Button onClick={onGenerate} disabled={isGenerating}>
            Générer le CV ATS
          </Button>
        )}
        {status === "FAILED" && (
          <Button onClick={onGenerate} disabled={isGenerating}>
            Relancer la génération
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
            <CheckCircle size={16} /> CV ATS prêt au téléchargement.
          </div>
        </div>
      )}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// DASHBOARD PAGE (full)
// ---------------------------------------------------------------------------
const DashboardPage: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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

  // Optional debug modal
  const [showDebugModal, setShowDebugModal] = useState(false);

  useEffect(() => {
    return () => {
      stopPolling();
      stopStep2Timers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // 1) Fast path: preview only (small payload)
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
          setErrorMessage(
            meta?.error_message ||
              (preview as any).error_message ||
              "L'analyse a échoué côté serveur (voir logs CloudWatch)."
          );
          return;
        }

        if (st === "COMPLETED") {
          // 2) Hydrate all (step1 + step2 if exists)
          const full = await getCandidateProfile(candidateId, "all");

          // IMPORTANT: keep both meta and step1_json (your actual object has meta + step1_json + step2_error)
          const merged: ParsedCV = {
            ...(full as any),
            candidate_id: (full as any).candidate_id || candidateId,
            meta: (full as any).meta || meta,
            step1_json: (full as any).step1_json,
            step2_error: (full as any).step2_error,
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
    setStatus('uploading');
    setErrorMessage('');
    setCandidateData(null);
    setHasData(false);
    setUploadedKey(null);
    stopPolling();
    stopStep2Timers();
    setStep2Status("NOT_RUN");
    setStep2ErrorMessage("");
    setStep2Elapsed(0);
    setIsStep2Generating(false);

    try {
      // 1) POST /upload (Manage_CV API)
      const uploadTicketResponse = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type || 'application/pdf',
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
      const signed_content_type = ticket.content_type || (file.type || 'application/pdf');

      if (!upload_url || !candidate_id || !key) {
        throw new Error("Réponse PostCV invalide: upload_url / candidate_id / key manquants.");
      }

      // 2) PUT S3 presigned
      const putRes = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': signed_content_type }
      });

      if (!putRes.ok) {
        const hint = putRes.status === 403
          ? " (403: mismatch Content-Type entre signature et PUT — assure-toi d'envoyer EXACTEMENT le même Content-Type)"
          : "";
        throw new Error(`Échec PUT S3 (${putRes.status})${hint}`);
      }

      setUploadedKey(key);

      // 3) Polling on Profiles API
      setStatus('analyzing');
      startPolling(candidate_id);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error?.message || 'Une erreur est survenue.');
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

  const mergeCandidateData = (nextProfile: ParsedCV) => {
    setCandidateData((prev) => {
      const prevData = prev || {};
      return {
        ...prevData,
        ...nextProfile,
        candidate_id: nextProfile.candidate_id || prevData.candidate_id,
        meta: nextProfile.meta || prevData.meta,
        step1_json: prevData.step1_json || nextProfile.step1_json,
        step2_json: nextProfile.step2_json || prevData.step2_json,
        step2_error: nextProfile.step2_error || prevData.step2_error,
      };
    });
  };

  const handleGenerateStep2 = async () => {
    const cid = candidateData?.candidate_id;
    if (!cid || isStep2Generating) return;
    setStep2ErrorMessage("");
    setIsStep2Generating(true);
    setStep2Status("QUEUED");
    setStep2Elapsed(0);

    stopStep2Timers();
    step2Timer.current = window.setInterval(() => {
      setStep2Elapsed((t) => t + 1);
    }, 1000);

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
      getProfile: (id) => getCandidateProfile(id, "step2"),
      onUpdate: (profile, status) => {
        mergeCandidateData(profile as ParsedCV);
        setStep2Status(status);
        if (status === "FAILED") {
          setStep2ErrorMessage(getStep2ErrorMessage(profile));
        }
      },
      onDone: (profile, status) => {
        mergeCandidateData(profile as ParsedCV);
        setStep2Status(status);
        setIsStep2Generating(false);
        if (status === "FAILED") {
          setStep2ErrorMessage(getStep2ErrorMessage(profile));
        }
        stopStep2Timers();
      },
      onError: (error) => {
        console.error("Erreur polling Step2:", error);
      },
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
          {status === 'success' && candidateData?.candidate_id && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openStep1Artifact}>Artefact Step1</Button>
              <Button variant="outline" onClick={() => setShowDebugModal(true)}>Debug (JSON)</Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* LEFT: Upload */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload de CV</h2>
              <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'error' : status !== 'idle' ? 'warning' : 'neutral'}>
                {status === 'idle' && 'En attente'}
                {status === 'uploading' && 'Transfert S3...'}
                {status === 'analyzing' && 'Traitement IA en cours...'}
                {status === 'success' && 'Terminé'}
                {status === 'error' && 'Erreur'}
              </Badge>
            </div>

            <FileUpload onUpload={handleUpload} />

            <div className="mt-4">
              {status === 'analyzing' && (
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

              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 flex items-center gap-2 font-semibold">
                    <AlertCircle size={16} /> Échec
                  </p>
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                </div>
              )}

              {status === 'success' && (
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

          {/* RIGHT: Mini result */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Résumé</h3>
            {hasData ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <p className="text-xs text-gray-500">Nom détecté</p>
                  <p className="font-bold text-lg">{candidateData?.meta?.full_name || candidateData?.step1_json?.identity?.full_name || 'Inconnu'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Titre</p>
                  <p className="font-medium">{candidateData?.meta?.headline || candidateData?.step1_json?.identity?.headline || 'Non spécifié'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expérience</p>
                  <p className="font-medium text-indigo-600">
                    {typeof candidateData?.meta?.years_of_experience_inferred === 'number'
                      ? `${candidateData?.meta?.years_of_experience_inferred.toFixed(1)} ans`
                      : '—'}
                  </p>
                </div>
                <div className="pt-2">
                  <Badge variant={(candidateData as any)?.step2_error ? 'warning' : 'success'}>
                    {(candidateData as any)?.step2_error ? 'Step2 indisponible' : 'Step2 OK'}
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

        {/* MAIN AUDIT DASHBOARD */}
        {hasData && candidateData && (
          <div className="mt-2">
            <AuditDashboard profile={candidateData} onOpenJson={openStep1Artifact} />
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

      {/* Debug modal (optional) */}
      <Modal isOpen={showDebugModal} onClose={() => setShowDebugModal(false)} title="Debug — Profil brut (Live AWS)">
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto h-[70vh]">
          {JSON.stringify(candidateData, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default DashboardPage;
