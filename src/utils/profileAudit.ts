// src/utils/profileAudit.ts
// Transforme le profile (meta + step1_json + step2_json) en objets "UI-ready"
// pour un rendu tableau + couleurs (StatusPill).
//
// Usage recommandé (DashboardPage):
//   const audit = buildProfileAudit(profile);
//   audit.summaryCards -> cartes KPI
//   audit.checks -> lignes "points positifs / améliorations"
//   audit.tables -> tableaux (skills, experiences, links, languages)

export type PillVariant = "good" | "warn" | "bad" | "info" | "neutral";

export type AuditCard = {
  key: string;
  title: string;
  value: string | number;
  subtitle?: string;
  variant: PillVariant;
};

export type AuditCheck = {
  key: string;
  label: string;
  details?: string;
  variant: PillVariant;
};

export type AuditTable = {
  key: string;
  title: string;
  columns: { key: string; label: string; width?: string }[];
  rows: Record<string, any>[];
  emptyHint?: string;
};

export type ProfileAuditResult = {
  // petites cartes de synthèse
  summaryCards: AuditCard[];
  // liste d'observations (✅ / ⚠️ / ❌)
  checks: AuditCheck[];
  // tables prêtes à afficher
  tables: AuditTable[];
  // helpers: statuts step
  step: {
    step1Status?: string;
    step2Status?: string;
    step2HasData: boolean;
    step2HasError: boolean;
    step2ErrorMessage?: string;
  };
};

type AnyDict = Record<string, any>;

function asString(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function asNumber(v: any): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function uniqStrings(values: any[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const v of values || []) {
    const s = (typeof v === "string" ? v : String(v || "")).trim();
    if (!s) continue;
    const k = s.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}

function safeArr(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function pct(n: number, max: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((n / max) * 100)));
}

// ---------------------------------------------
// Variants / rules
// ---------------------------------------------
function scoreVariant(score: number | null, thresholds?: { good: number; warn: number }): PillVariant {
  if (score === null) return "neutral";
  const good = thresholds?.good ?? 80;
  const warn = thresholds?.warn ?? 65;
  if (score >= good) return "good";
  if (score >= warn) return "warn";
  return "bad";
}

function completenessVariant(p: number): PillVariant {
  if (p >= 85) return "good";
  if (p >= 65) return "warn";
  return "bad";
}

function boolVariant(ok: boolean, warnInsteadOfBad = false): PillVariant {
  if (ok) return "good";
  return warnInsteadOfBad ? "warn" : "bad";
}

// ---------------------------------------------
// Public API
// ---------------------------------------------
export function buildProfileAudit(profile: AnyDict | null | undefined): ProfileAuditResult {
  const meta: AnyDict = (profile?.meta || {}) as AnyDict;
  const step1: AnyDict = (profile?.step1_json || {}) as AnyDict;
  const step2: AnyDict = (profile?.step2_json || {}) as AnyDict;

  const step1Status = meta?.status || meta?.step1_status || profile?.status;
  const step2Status = meta?.step2_status || profile?.step2_status;

  const step2Error = profile?.step2_error || meta?.step2_error || null;
  const step2ErrorMessage =
    step2Error?.message ||
    step2Error?.details ||
    meta?.step2_error_message ||
    meta?.step2_error ||
    "";

  const step2HasError = Boolean(step2Error && (step2Error.message || step2Error.details || step2ErrorMessage));
  const step2HasData = Boolean(step2 && Object.keys(step2).length > 0);

  // -------------------------
  // Extract key fields (Step1)
  // -------------------------
  const identity: AnyDict = (step1?.identity || meta?.raw_cv?.identity || meta?.identity || {}) as AnyDict;
  const skillsBlock: AnyDict = (step1?.skills || meta?.raw_cv?.skills || {}) as AnyDict;
  const quality: AnyDict = (step1?.quality || meta?.raw_cv?.quality || {}) as AnyDict;
  const ats: AnyDict = (step1?.ats || meta?.raw_cv?.ats || {}) as AnyDict;

  const fullName = identity?.full_name || meta?.full_name || "";
  const headline = identity?.headline || meta?.headline || "";
  const location = identity?.location || meta?.location || "";

  const emails = uniqStrings(safeArr(identity?.emails || meta?.email ? [meta?.email] : []).flat());
  const phones = uniqStrings(safeArr(identity?.phones || meta?.phone ? [meta?.phone] : []).flat());

  const linkedin = identity?.linkedin || meta?.raw_cv?.identity?.linkedin || "";
  const github = identity?.github || meta?.raw_cv?.identity?.github || "";

  const years = asNumber(step1?.career?.years_of_experience_inferred ?? meta?.years_of_experience_inferred ?? step1?.years_of_experience_inferred);
  const seniority = step1?.career?.current_seniority ?? meta?.raw_cv?.career?.current_seniority ?? "";

  const scoreInternal = asNumber(ats?.score_internal ?? meta?.ats_score_internal);
  const scoreModel = asNumber(ats?.score_model ?? meta?.ats_score_model);

  const tips: string[] = safeArr(ats?.ats_improvement_tips ?? meta?.raw_cv?.ats?.ats_improvement_tips).map(asString).filter(Boolean);

  // skills (normalized raw + hard/soft)
  const hardSkills = uniqStrings([
    ...safeArr(skillsBlock?.hard_skills),
    ...safeArr(skillsBlock?.skills_normalized),
    ...safeArr(skillsBlock?.skills_raw),
  ]);
  const softSkills = uniqStrings(safeArr(skillsBlock?.soft_skills));
  const tools = uniqStrings(safeArr(skillsBlock?.tools));

  // experiences (Step1 format)
  const experiences = safeArr(step1?.experiences);
  const expCount = experiences.length;

  // quality issues
  const qualityIssues = safeArr(quality?.issues);
  const confidence = asNumber(quality?.global_confidence);

  // -------------------------
  // Completeness heuristic
  // -------------------------
  const fieldsPresent = [
    Boolean(fullName),
    Boolean(headline),
    Boolean(location),
    emails.length > 0,
    phones.length > 0,
    expCount > 0,
    hardSkills.length > 0,
    softSkills.length > 0,
  ];
  const completeness = pct(fieldsPresent.filter(Boolean).length, fieldsPresent.length);

  // -------------------------
  // Cards (top KPI)
  // -------------------------
  const summaryCards: AuditCard[] = [
    {
      key: "ats_internal",
      title: "ATS (interne)",
      value: scoreInternal ?? "—",
      subtitle: "Score lisibilité + mots-clés",
      variant: scoreVariant(scoreInternal),
    },
    {
      key: "ats_model",
      title: "ATS (modèle)",
      value: scoreModel ?? "—",
      subtitle: "Score IA",
      variant: scoreVariant(scoreModel),
    },
    {
      key: "completeness",
      title: "Complétude",
      value: `${completeness}%`,
      subtitle: "Champs clés détectés",
      variant: completenessVariant(completeness),
    },
    {
      key: "experience",
      title: "Expérience",
      value: years ?? "—",
      subtitle: years !== null ? `ans (${seniority || "seniority n/a"})` : "Non estimée",
      variant: years !== null ? (years >= 8 ? "good" : years >= 3 ? "warn" : "info") : "neutral",
    },
    {
      key: "step2",
      title: "CV Master (Step2)",
      value: step2Status || (step2HasData ? "READY" : "N/A"),
      subtitle: step2HasError ? "Erreur Step2" : step2HasData ? "Disponible" : "Non généré",
      variant: step2HasError ? "bad" : step2HasData ? "good" : step2Status === "PROCESSING" ? "info" : "neutral",
    },
  ];

  if (confidence !== null) {
    summaryCards.push({
      key: "confidence",
      title: "Confiance parsing",
      value: Math.round(confidence * 100),
      subtitle: "Qualité extraction",
      variant: confidence >= 0.85 ? "good" : confidence >= 0.7 ? "warn" : "bad",
    });
  }

  // -------------------------
  // Checks (good/warn/bad)
  // -------------------------
  const checks: AuditCheck[] = [];

  // identity checks
  checks.push({
    key: "name",
    label: fullName ? "Nom détecté" : "Nom manquant",
    details: fullName || "—",
    variant: boolVariant(Boolean(fullName)),
  });
  checks.push({
    key: "headline",
    label: headline ? "Titre détecté" : "Titre manquant",
    details: headline || "—",
    variant: boolVariant(Boolean(headline), true),
  });
  checks.push({
    key: "emails",
    label: emails.length ? "Email présent" : "Email manquant",
    details: emails.join(", ") || "—",
    variant: boolVariant(emails.length > 0),
  });
  checks.push({
    key: "phones",
    label: phones.length ? "Téléphone présent" : "Téléphone manquant",
    details: phones.join(", ") || "—",
    variant: boolVariant(phones.length > 0, true),
  });
  checks.push({
    key: "linkedin",
    label: linkedin && linkedin !== "unknown" ? "LinkedIn présent" : "LinkedIn manquant",
    details: linkedin && linkedin !== "unknown" ? linkedin : "Ajoute ton LinkedIn (impact ATS + crédibilité)",
    variant: boolVariant(Boolean(linkedin && linkedin !== "unknown"), true),
  });
  checks.push({
    key: "github",
    label: github && github !== "unknown" ? "GitHub présent" : "GitHub manquant",
    details: github && github !== "unknown" ? github : "Ajoute un GitHub/portfolio (souvent cité dans les tips ATS)",
    variant: boolVariant(Boolean(github && github !== "unknown"), true),
  });

  // content checks
  checks.push({
    key: "experiences",
    label: expCount ? "Expériences détectées" : "Expériences manquantes",
    details: expCount ? `${expCount} expérience(s)` : "—",
    variant: expCount >= 3 ? "good" : expCount >= 1 ? "warn" : "bad",
  });

  checks.push({
    key: "hard_skills",
    label: hardSkills.length ? "Hard skills détectées" : "Hard skills manquantes",
    details: hardSkills.length ? `${hardSkills.length} compétence(s)` : "—",
    variant: hardSkills.length >= 12 ? "good" : hardSkills.length >= 6 ? "warn" : "bad",
  });

  checks.push({
    key: "soft_skills",
    label: softSkills.length ? "Soft skills détectées" : "Soft skills manquantes",
    details: softSkills.length ? `${softSkills.length} compétence(s)` : "—",
    variant: softSkills.length >= 8 ? "good" : softSkills.length >= 4 ? "warn" : "bad",
  });

  // ATS tips
  if (tips.length) {
    checks.push({
      key: "ats_tips",
      label: "Recommandations ATS",
      details: tips[0],
      variant: "warn",
    });
  }

  // Step2 issue surfaced
  if (step2HasError) {
    checks.push({
      key: "step2_error",
      label: "Step2 indisponible",
      details: step2ErrorMessage || "Erreur inconnue",
      variant: "bad",
    });
  }

  // quality issues surfaced
  for (const [idx, it] of qualityIssues.entries()) {
    const code = asString(it?.code || `issue_${idx}`);
    const msg = asString(it?.message || "");
    checks.push({
      key: `quality_${code}_${idx}`,
      label: "Qualité: point à améliorer",
      details: msg || code,
      variant: "warn",
    });
  }

  // -------------------------
  // Tables (for visual UI)
  // -------------------------
  const tables: AuditTable[] = [];

  // Links table
  tables.push({
    key: "links",
    title: "Liens",
    columns: [
      { key: "type", label: "Type", width: "160px" },
      { key: "value", label: "Valeur" },
      { key: "status", label: "Statut", width: "140px" },
    ],
    rows: [
      {
        type: "LinkedIn",
        value: linkedin && linkedin !== "unknown" ? linkedin : "—",
        status: linkedin && linkedin !== "unknown" ? "OK" : "À ajouter",
        variant: linkedin && linkedin !== "unknown" ? "good" : "warn",
      },
      {
        type: "GitHub",
        value: github && github !== "unknown" ? github : "—",
        status: github && github !== "unknown" ? "OK" : "À ajouter",
        variant: github && github !== "unknown" ? "good" : "warn",
      },
    ],
    emptyHint: "Ajoute LinkedIn/GitHub pour booster ATS + crédibilité.",
  });

  // Skills table (top 20)
  const topHard = hardSkills.slice(0, 20);
  const topSoft = softSkills.slice(0, 12);

  tables.push({
    key: "skills",
    title: "Compétences",
    columns: [
      { key: "category", label: "Catégorie", width: "160px" },
      { key: "items", label: "Éléments" },
      { key: "count", label: "Nb", width: "80px" },
      { key: "status", label: "Statut", width: "140px" },
    ],
    rows: [
      {
        category: "Hard skills",
        items: topHard.join(", ") || "—",
        count: hardSkills.length,
        status: hardSkills.length >= 12 ? "OK" : hardSkills.length ? "À enrichir" : "Manquant",
        variant: hardSkills.length >= 12 ? "good" : hardSkills.length ? "warn" : "bad",
      },
      {
        category: "Soft skills",
        items: topSoft.join(", ") || "—",
        count: softSkills.length,
        status: softSkills.length >= 8 ? "OK" : softSkills.length ? "À enrichir" : "Manquant",
        variant: softSkills.length >= 8 ? "good" : softSkills.length ? "warn" : "bad",
      },
      {
        category: "Outils / stack",
        items: tools.slice(0, 15).join(", ") || "—",
        count: tools.length,
        status: tools.length >= 6 ? "OK" : tools.length ? "À enrichir" : "Optionnel",
        variant: tools.length >= 6 ? "good" : tools.length ? "warn" : "neutral",
      },
    ],
    emptyHint: "Ajoute plus de mots-clés techniques pertinents (ATS).",
  });

  // Experience table (compact)
  tables.push({
    key: "experiences",
    title: "Expériences",
    columns: [
      { key: "period", label: "Période", width: "180px" },
      { key: "title", label: "Poste" },
      { key: "company", label: "Entreprise", width: "220px" },
      { key: "status", label: "Statut", width: "140px" },
    ],
    rows: experiences.slice(0, 8).map((e: AnyDict, idx: number) => {
      const title = asString(e?.title || e?.role || "");
      const company = asString(e?.company || "");
      const ds = asString(e?.date_start || e?.start_date || "");
      const de = asString(e?.date_end || e?.end_date || "");
      const period = [ds, de].filter(Boolean).join(" → ") || "—";
      const ok = Boolean(title) && Boolean(company) && Boolean(ds);
      return {
        _idx: idx,
        period,
        title: title || "—",
        company: company || "—",
        status: ok ? "OK" : "À compléter",
        variant: ok ? "good" : "warn",
      };
    }),
    emptyHint: "Aucune expérience détectée. Vérifie le CV source / parsing.",
  });

  // Step2 table (if present)
  if (step2HasData) {
    const s2skills: AnyDict = (step2?.skills || {}) as AnyDict;
    const s2links: AnyDict = (step2?.links || {}) as AnyDict;

    tables.push({
      key: "step2_master",
      title: "CV Master (Step2)",
      columns: [
        { key: "field", label: "Champ", width: "200px" },
        { key: "value", label: "Valeur" },
        { key: "status", label: "Statut", width: "140px" },
      ],
      rows: [
        {
          field: "Résumé",
          value: asString(step2?.summary || "").slice(0, 240) || "—",
          status: step2?.summary ? "OK" : "Manquant",
          variant: step2?.summary ? "good" : "bad",
        },
        {
          field: "Skills (tech)",
          value: uniqStrings(safeArr(s2skills?.technical)).slice(0, 20).join(", ") || "—",
          status: safeArr(s2skills?.technical).length ? "OK" : "Manquant",
          variant: safeArr(s2skills?.technical).length ? "good" : "bad",
        },
        {
          field: "Liens",
          value: [s2links?.linkedin, s2links?.github, s2links?.portfolio].filter(Boolean).join(" | ") || "—",
          status: (s2links?.linkedin || s2links?.github || s2links?.portfolio) ? "OK" : "À compléter",
          variant: (s2links?.linkedin || s2links?.github || s2links?.portfolio) ? "good" : "warn",
        },
      ],
    });
  }

  return {
    summaryCards,
    checks,
    tables,
    step: {
      step1Status: asString(step1Status),
      step2Status: asString(step2Status),
      step2HasData,
      step2HasError,
      step2ErrorMessage: asString(step2ErrorMessage),
    },
  };
}
