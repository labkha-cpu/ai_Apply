// src/utils/profileAudit.ts
export type Level = "good" | "warn" | "bad" | "info";

export type Metric = {
  label: string;
  status: string;
  value: string;
  level: Level;
  recommendation: string;
};

export type AuditResult = {
  // extracted
  fullName: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  githubMissing: boolean;

  atsInternal: number | null;
  atsModel: number | null;
  yrs: number | null;

  experiencesCount: number;
  hardCount: number;
  softCount: number;
  normalizedCount: number;
  languagesCount: number;

  sectorsPrimary: string;

  tips: string[];
  qualityIssues: { code: string; message: string }[];

  // computed
  metrics: Metric[];
  positives: Metric[];
  improvements: Metric[];
  globalScore: number;
};

const asArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const hasText = (v: any): boolean => typeof v === "string" && v.trim().length > 0;
const safeText = (v: any, fallback = "—"): string => (hasText(v) ? v.trim() : fallback);
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function firstString(arr: any): string {
  for (const v of asArray<string>(arr)) {
    if (hasText(v)) return v.trim();
  }
  return "";
}

export function computeProfileAudit(profile: any): AuditResult {
  const meta = profile?.meta || {};
  const step1 = profile?.step1_json || {};

  const raw = meta?.raw_cv || profile?.raw_cv || {};
  const identity = raw?.identity || step1?.identity || {};
  const skills = raw?.skills || step1?.skills || {};
  const experiences = asArray<any>(step1?.experiences || raw?.experiences);
  const languages = asArray<any>(step1?.languages || raw?.languages);
  const sectors = step1?.sectors || raw?.sectors || null;

  const fullName = meta?.full_name || identity?.full_name || "";
  const headline = meta?.headline || identity?.headline || "";
  const location = meta?.location || identity?.location || "";
  const email = meta?.email || firstString(identity?.emails);
  const phone = meta?.phone || firstString(identity?.phones);

  const linkedin = identity?.linkedin || "";
  const github = identity?.github || "";
  const githubMissing = !hasText(github) || github === "unknown";

  const atsInternal =
    typeof meta?.ats_score_internal === "number"
      ? meta.ats_score_internal
      : typeof raw?.ats?.score_internal === "number"
        ? raw.ats.score_internal
        : typeof step1?.ats?.score_internal === "number"
          ? step1.ats.score_internal
          : null;

  const atsModel =
    typeof meta?.ats_score_model === "number"
      ? meta.ats_score_model
      : typeof raw?.ats?.score_model === "number"
        ? raw.ats.score_model
        : typeof step1?.ats?.score_model === "number"
          ? step1.ats.score_model
          : null;

  const yrs =
    typeof meta?.years_of_experience_inferred === "number"
      ? meta.years_of_experience_inferred
      : typeof raw?.career?.years_of_experience_inferred === "number"
        ? raw.career.years_of_experience_inferred
        : typeof step1?.career?.years_of_experience_inferred === "number"
          ? step1.career.years_of_experience_inferred
          : null;

  const hard = asArray<string>(skills?.hard_skills);
  const soft = asArray<string>(skills?.soft_skills);
  const normalized = asArray<string>(skills?.skills_normalized);

  const qualityIssues = asArray<{ code: string; message: string }>(step1?.quality?.issues || raw?.quality?.issues);
  const tips = asArray<string>(step1?.ats?.ats_improvement_tips || raw?.ats?.ats_improvement_tips);

  const metrics: Metric[] = [];

  // Identity / contact
  metrics.push({
    label: "Nom complet",
    status: hasText(fullName) ? "OK" : "Manquant",
    value: safeText(fullName),
    level: hasText(fullName) ? "good" : "bad",
    recommendation: hasText(fullName) ? "RAS" : "Renseigner le nom complet.",
  });

  metrics.push({
    label: "Titre (headline)",
    status: hasText(headline) ? "OK" : "À améliorer",
    value: safeText(headline),
    level: hasText(headline) ? "good" : "warn",
    recommendation: hasText(headline) ? "RAS" : "Ajouter un titre clair aligné au poste cible (ex: “Chef de projet IT / MOA-MOE”).",
  });

  metrics.push({
    label: "Localisation",
    status: hasText(location) ? "OK" : "À améliorer",
    value: safeText(location),
    level: hasText(location) ? "good" : "warn",
    recommendation: hasText(location) ? "RAS" : "Ajouter une ville (utile pour le matching).",
  });

  metrics.push({
    label: "Email",
    status: hasText(email) ? "OK" : "Manquant",
    value: safeText(email),
    level: hasText(email) ? "good" : "bad",
    recommendation: hasText(email) ? "RAS" : "Ajouter un email (obligatoire pour candidater).",
  });

  metrics.push({
    label: "Téléphone",
    status: hasText(phone) ? "OK" : "À améliorer",
    value: safeText(phone),
    level: hasText(phone) ? "good" : "warn",
    recommendation: hasText(phone) ? "RAS" : "Ajouter un téléphone pour augmenter le taux de rappel.",
  });

  // Links
  metrics.push({
    label: "LinkedIn",
    status: hasText(linkedin) ? "OK" : "À améliorer",
    value: hasText(linkedin) ? "Présent" : "Absent",
    level: hasText(linkedin) ? "good" : "warn",
    recommendation: hasText(linkedin) ? "RAS" : "Ajouter une URL LinkedIn (signal de confiance).",
  });

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
    status: atsInternal === null ? "Info" : atsInternal >= 70 ? "OK" : atsInternal >= 50 ? "À améliorer" : "Critique",
    value: atsInternal === null ? "—" : `${Math.round(atsInternal)}/100`,
    level: atsInternal === null ? "info" : atsInternal >= 70 ? "good" : atsInternal >= 50 ? "warn" : "bad",
    recommendation:
      atsInternal === null
        ? "Vérifier le calcul ATS interne côté Step1."
        : atsInternal >= 70
          ? "Bon niveau ATS."
          : atsInternal >= 50
            ? "Ajouter mots-clés + résultats chiffrés par expérience."
            : "Revoir structure + mots-clés + impacts quantifiés (priorité).",
  });

  metrics.push({
    label: "ATS modèle",
    status: atsModel === null ? "Info" : atsModel >= 70 ? "OK" : atsModel >= 50 ? "À améliorer" : "Critique",
    value: atsModel === null ? "—" : `${Math.round(atsModel)}/100`,
    level: atsModel === null ? "info" : atsModel >= 70 ? "good" : atsModel >= 50 ? "warn" : "bad",
    recommendation:
      atsModel === null ? "Vérifier le score modèle côté Step1." :
      atsModel >= 70 ? "Bon score modèle." :
      "Améliorer la pertinence: skills normalisés + bullets orientées résultats.",
  });

  // Coverage
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

  if (qualityIssues.length > 0) {
    metrics.push({
      label: "Issues qualité",
      status: "À corriger",
      value: `${qualityIssues.length}`,
      level: "warn",
      recommendation: qualityIssues[0]?.message || "Corriger les issues de qualité détectées.",
    });
  }

  // Global score
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

  const positives = metrics.filter(m => m.level === "good").slice(0, 6);
  const improvements = metrics.filter(m => m.level === "bad" || m.level === "warn").slice(0, 8);

  return {
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

    experiencesCount: experiences.length,
    hardCount: hard.length,
    softCount: soft.length,
    normalizedCount: normalized.length,
    languagesCount: languages.length,

    sectorsPrimary: sectors?.primary_sector || "",

    tips,
    qualityIssues,

    metrics,
    positives,
    improvements,
    globalScore,
  };
}
