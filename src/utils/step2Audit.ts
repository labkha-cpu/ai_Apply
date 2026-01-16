// src/utils/step2Audit.ts

export type Level = "good" | "warn" | "bad" | "info";

function hasNonEmptyObject(v: any): boolean {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  return Object.keys(v).length > 0;
}

export type AuditRow = {
  field: string;
  step1: string;
  step2: string;
  improvement: string;
  level: Level;
};

export function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

export function safeText(v: any, fallback = "—") {
  return hasText(v) ? String(v).trim() : fallback;
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const asArray = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

function joinList(arr: string[], max = 12) {
  const u = uniq(arr);
  if (u.length === 0) return "—";
  const shown = u.slice(0, max).join(", ");
  return u.length > max ? `${shown}, +${u.length - max}` : shown;
}

function diffAdded(step1List: string[], step2List: string[], max = 8) {
  const s1 = new Set(uniq(step1List).map((x) => x.toLowerCase()));
  const added = uniq(step2List).filter((x) => !s1.has(x.toLowerCase()));
  if (added.length === 0) return "—";
  const shown = added.slice(0, max).join(", ");
  return added.length > max ? `${shown}, +${added.length - max}` : shown;
}

/**
 * computeAudit:
 * - prend le profil BFF "all" (comme celui que tu as collé)
 * - lit Step1 dans step1_json
 * - lit Step2 dans step2_json
 * - retourne des lignes comparatives (step1 vs step2) + scores
 */
export function computeAudit(profile: any) {
  const step1 = profile?.step1_json || {};
  const step2 = profile?.step2_json || {};
  const meta = profile?.meta || {};

  // Step1 identity fallback
  const s1Identity = step1?.identity || {};
  const s2FullName = step2?.full_name;
  const s2Headline = step2?.headline;
  const s2Location = step2?.location;

  const s1FullName = s1Identity?.full_name || meta?.full_name;
  const s1Headline = s1Identity?.headline || meta?.headline;
  const s1Location = s1Identity?.location || meta?.location;

  const s1Email = asArray<string>(s1Identity?.emails)[0] || meta?.email;
  const s2Email = asArray<string>(step2?.emails)[0] || meta?.email;

  const s1Phone = asArray<string>(s1Identity?.phones)[0] || meta?.phone;
  const s2Phone = asArray<string>(step2?.phones)[0] || meta?.phone;

  // Skills
  const s1Skills = step1?.skills || {};
  const s1Hard = asArray<string>(s1Skills?.hard_skills);
  const s1Soft = asArray<string>(s1Skills?.soft_skills);
  const s1Norm = asArray<string>(s1Skills?.skills_normalized);
  const s1SkillsAll = uniq([...s1Hard, ...s1Soft, ...s1Norm, ...asArray<string>(s1Skills?.skills_raw)]);

  const s2Skills = step2?.skills || {};
  const s2Tech = asArray<string>(s2Skills?.technical);
  const s2Func = asArray<string>(s2Skills?.functional);
  const s2Soft = asArray<string>(s2Skills?.soft);
  const s2Tools = asArray<string>(s2Skills?.tools);
  const s2Cloud = asArray<string>(s2Skills?.cloud);
  const s2SkillsAll = uniq([...s2Tech, ...s2Func, ...s2Soft, ...s2Tools, ...s2Cloud]);

  // Summary
  const s1Summary = step1?.summary?.profile_summary || meta?.raw_cv?.summary?.profile_summary;
  const s2Summary = step2?.summary;

  // ATS
  const ats1 =
    typeof step1?.ats?.score_internal === "number"
      ? step1.ats.score_internal
      : typeof meta?.ats_score_internal === "number"
      ? meta.ats_score_internal
      : null;

  const ats2 =
    typeof meta?.ats_score_model === "number"
      ? meta.ats_score_model
      : typeof step2?.ats_keywords?.hard_skills?.length === "number"
      ? null
      : null;

  // If you have a Step2 computed score somewhere, plug it here later.
  // For now we display Step1 internal and Meta model as "ATS modèle" like your example JSON.
  const atsModel =
    typeof step1?.ats?.score_model === "number"
      ? step1.ats.score_model
      : typeof meta?.ats_score_model === "number"
      ? meta.ats_score_model
      : null;

  const rows: AuditRow[] = [];

  rows.push({
    field: "Titre",
    step1: safeText(s1Headline),
    step2: safeText(s2Headline),
    improvement:
      safeText(s2Headline) !== "—" && safeText(s2Headline) !== safeText(s1Headline)
        ? "Reformulation ATS"
        : "—",
    level:
      safeText(s1Headline) === "—" && safeText(s2Headline) !== "—"
        ? "good"
        : safeText(s2Headline) !== safeText(s1Headline)
        ? "warn"
        : "info",
  });

  rows.push({
    field: "Résumé",
    step1: safeText(s1Summary),
    step2: safeText(s2Summary),
    improvement:
      safeText(s2Summary) !== "—" && safeText(s2Summary) !== safeText(s1Summary)
        ? "Clarifié / restructuré"
        : "—",
    level:
      safeText(s1Summary) === "—" && safeText(s2Summary) !== "—"
        ? "good"
        : safeText(s2Summary) !== safeText(s1Summary)
        ? "warn"
        : "info",
  });

  rows.push({
    field: "Compétences (liste)",
    step1: joinList(s1SkillsAll),
    step2: joinList(s2SkillsAll),
    improvement: diffAdded(s1SkillsAll, s2SkillsAll),
    level: s2SkillsAll.length > s1SkillsAll.length ? "good" : "info",
  });

  rows.push({
    field: "Email",
    step1: safeText(s1Email),
    step2: safeText(s2Email),
    improvement:
      safeText(s1Email) === "—" && safeText(s2Email) !== "—" ? "Ajouté" : safeText(s2Email) !== safeText(s1Email) ? "Normalisé" : "—",
    level: safeText(s2Email) !== "—" ? "good" : "bad",
  });

  rows.push({
    field: "Téléphone",
    step1: safeText(s1Phone),
    step2: safeText(s2Phone),
    improvement:
      safeText(s1Phone) === "—" && safeText(s2Phone) !== "—" ? "Ajouté" : safeText(s2Phone) !== safeText(s1Phone) ? "Normalisé" : "—",
    level: safeText(s2Phone) !== "—" ? "good" : "warn",
  });

  rows.push({
    field: "Localisation",
    step1: safeText(s1Location),
    step2: safeText(s2Location),
    improvement:
      safeText(s1Location) === "—" && safeText(s2Location) !== "—"
        ? "Ajoutée"
        : safeText(s2Location) !== safeText(s1Location)
        ? "Normalisée"
        : "—",
    level: safeText(s2Location) !== "—" ? "good" : "warn",
  });

  // ATS row (based on your current data availability)
  rows.push({
    field: "ATS (Step1 interne)",
    step1: ats1 === null ? "—" : `${Math.round(ats1)}/100`,
    step2: atsModel === null ? "—" : `${Math.round(atsModel)}/100`,
    improvement:
      ats1 !== null && atsModel !== null ? `${Math.round(atsModel - ats1) >= 0 ? "+" : ""}${Math.round(atsModel - ats1)}` : "—",
    level: ats1 !== null && atsModel !== null ? (atsModel >= ats1 ? "good" : "warn") : "info",
  });

  return {
    step1,
    step2,
    meta,
    rows,
    step2Ready: !!(profile?.step2_json && hasNonEmptyObject(profile?.step2_json)),
  };
}
