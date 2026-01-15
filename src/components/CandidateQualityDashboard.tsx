import React from "react";

type AnyObj = Record<string, any>;

type Level = "good" | "warn" | "bad" | "info";

function levelStyles(level: Level) {
  switch (level) {
    case "good":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "warn":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "bad":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "info":
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function asArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

function hasText(v: any) {
  return typeof v === "string" && v.trim().length > 0;
}

function pickFirstString(arr: any): string | "" {
  const a = asArray<string>(arr);
  return a.find((x) => hasText(x)) || "";
}

type Metric = {
  label: string;
  value: string;
  level: Level;
  recommendation?: string;
};

function Pill({ level, children }: { level: Level; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${levelStyles(level)}`}>
      {children}
    </span>
  );
}

function ScoreCard({ title, score, subtitle }: { title: string; score: number; subtitle?: string }) {
  const s = clamp(score, 0, 100);
  const level: Level = s >= 70 ? "good" : s >= 50 ? "warn" : "bad";

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <Pill level={level}>{s}/100</Pill>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-current" style={{ width: `${s}%`, opacity: 0.9 }} />
      </div>
      {/* trick tailwind: "bg-current" uses currentColor (from pill), so we set color via wrapper */}
      <style>{`
        .bg-current { background-color: ${
          level === "good" ? "rgb(16 185 129)" : level === "warn" ? "rgb(245 158 11)" : "rgb(244 63 94)"
        }; }
      `}</style>
    </div>
  );
}

export default function CandidateQualityDashboard({ profile }: { profile: AnyObj }) {
  // --- Extract (Step1 structure) ---
  const meta = profile?.meta || {};
  const raw = profile?.raw_cv || {};

  const fullName = meta?.full_name || profile?.identity?.full_name || "Candidat";
  const headline = meta?.headline || profile?.identity?.headline || "";
  const location = meta?.location || profile?.identity?.location || "";

  const email = meta?.email || pickFirstString(profile?.identity?.emails) || pickFirstString(raw?.identity?.emails);
  const phone = meta?.phone || pickFirstString(profile?.identity?.phones) || pickFirstString(raw?.identity?.phones);

  const atsInternal = typeof meta?.ats_score_internal === "number" ? meta.ats_score_internal : null;
  const atsModel = typeof meta?.ats_score_model === "number" ? meta.ats_score_model : null;

  const soft = asArray<string>(raw?.skills?.soft_skills);
  const hard = asArray<string>(raw?.skills?.hard_skills);
  const tools = asArray<string>(raw?.skills?.tools);
  const experiences = asArray<any>(raw?.experiences);

  // --- Compute quality metrics ---
  const metrics: Metric[] = [];

  // Identity / contact
  metrics.push({
    label: "Nom complet",
    value: hasText(fullName) ? fullName : "Manquant",
    level: hasText(fullName) ? "good" : "bad",
    recommendation: hasText(fullName) ? undefined : "Renseigner le nom complet pour un CV exploitable.",
  });

  metrics.push({
    label: "Titre / Headline",
    value: hasText(headline) ? headline : "Manquant",
    level: hasText(headline) ? "good" : "warn",
    recommendation: hasText(headline) ? undefined : "Ajouter un titre clair (ex: “Chef de projet IT / MOA-MOE”).",
  });

  metrics.push({
    label: "Localisation",
    value: hasText(location) ? location : "Manquant",
    level: hasText(location) ? "good" : "warn",
    recommendation: hasText(location) ? undefined : "Ajouter une ville (utile pour le matching des offres).",
  });

  metrics.push({
    label: "Email",
    value: hasText(email) ? email : "Manquant",
    level: hasText(email) ? "good" : "bad",
    recommendation: hasText(email) ? undefined : "Renseigner un email (obligatoire pour candidater).",
  });

  metrics.push({
    label: "Téléphone",
    value: hasText(phone) ? phone : "Manquant",
    level: hasText(phone) ? "good" : "warn",
    recommendation: hasText(phone) ? undefined : "Ajouter un téléphone pour augmenter le taux de rappel.",
  });

  // ATS
  if (atsInternal !== null) {
    metrics.push({
      label: "ATS interne",
      value: `${atsInternal}/100`,
      level: atsInternal >= 70 ? "good" : atsInternal >= 50 ? "warn" : "bad",
      recommendation:
        atsInternal >= 70
          ? "Bon niveau ATS."
          : atsInternal >= 50
            ? "Améliorer: mots-clés, intitulés précis, résultats chiffrés."
            : "Priorité: structuration + mots-clés + expériences orientées résultats.",
    });
  } else {
    metrics.push({
      label: "ATS interne",
      value: "Non calculé",
      level: "info",
      recommendation: "Vérifier que Step1 remplit meta.ats_score_internal.",
    });
  }

  if (atsModel !== null) {
    metrics.push({
      label: "ATS modèle",
      value: `${atsModel}/100`,
      level: atsModel >= 70 ? "good" : atsModel >= 50 ? "warn" : "bad",
      recommendation:
        atsModel >= 70 ? "Bon score modèle." : "Améliorer la pertinence: skills, mots-clés et impacts.",
    });
  }

  // Skills coverage
  const hardCount = hard.length;
  const softCount = soft.length;
  const toolsCount = tools.length;

  metrics.push({
    label: "Hard skills",
    value: `${hardCount}`,
    level: hardCount >= 10 ? "good" : hardCount >= 5 ? "warn" : "bad",
    recommendation:
      hardCount >= 10 ? "Coverage OK." : "Ajouter des hard skills (technos, méthodes, outils) liés au poste cible.",
  });

  metrics.push({
    label: "Soft skills",
    value: `${softCount}`,
    level: softCount >= 8 ? "good" : softCount >= 4 ? "warn" : "info",
    recommendation: softCount >= 8 ? "OK." : "Compléter avec 5–10 soft skills pertinents (leadership, rigueur…).",
  });

  metrics.push({
    label: "Outils",
    value: `${toolsCount}`,
    level: toolsCount >= 8 ? "good" : toolsCount >= 3 ? "warn" : "info",
    recommendation: toolsCount >= 8 ? "OK." : "Ajouter les outils clés (Jira, Confluence, AWS, SQL, etc.).",
  });

  // Experiences completeness
  const expCount = experiences.length;
  metrics.push({
    label: "Expériences",
    value: `${expCount}`,
    level: expCount >= 3 ? "good" : expCount >= 1 ? "warn" : "bad",
    recommendation:
      expCount >= 3 ? "OK." : expCount >= 1 ? "Ajouter plus d’expériences ou enrichir celles existantes." : "Ajouter au moins 1 expérience.",
  });

  // --- Compute summary: global quality score ---
  // Simple scoring: contact completeness + ATS + skills + experiences
  const contactScore =
    (hasText(fullName) ? 20 : 0) +
    (hasText(headline) ? 10 : 0) +
    (hasText(location) ? 10 : 0) +
    (hasText(email) ? 20 : 0) +
    (hasText(phone) ? 10 : 0);

  const skillsScore = clamp(hardCount * 2 + toolsCount * 2 + softCount, 0, 30);
  const expScore = expCount >= 3 ? 20 : expCount === 2 ? 15 : expCount === 1 ? 10 : 0;
  const atsScore = atsInternal !== null ? clamp(atsInternal * 0.2, 0, 20) : 10; // if missing, neutral

  const global = clamp(Math.round(contactScore + skillsScore + expScore + atsScore), 0, 100);

  // Positive & improvements lists
  const positives = metrics.filter((m) => m.level === "good").slice(0, 6);
  const improvements = metrics.filter((m) => m.level === "bad" || m.level === "warn").slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="text-xl font-semibold text-slate-900">{fullName}</div>
          {hasText(headline) && <div className="text-sm text-slate-600">{headline}</div>}
          <div className="text-sm text-slate-500">
            {hasText(location) ? location : "Localisation non renseignée"}
            {hasText(email) ? ` • ${email}` : ""}
            {hasText(phone) ? ` • ${phone}` : ""}
          </div>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScoreCard title="Qualité globale du profil" score={global} subtitle="Complétude + skills + expériences + ATS" />
        <ScoreCard title="ATS interne" score={atsInternal ?? 0} subtitle={atsInternal === null ? "Non calculé" : "Lisibilité ATS + mots-clés"} />
        <ScoreCard title="ATS modèle" score={atsModel ?? 0} subtitle={atsModel === null ? "Non calculé" : "Pertinence modèle"} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="text-sm font-semibold text-slate-900">Audit qualité</div>
          <div className="text-xs text-slate-500">Vert = OK • Orange = amélioration • Rouge = manquant</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Critère</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Valeur</th>
                <th className="px-4 py-3">Recommandation</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {metrics.map((m, idx) => (
                <tr key={idx} className="border-t">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.label}</td>
                  <td className="px-4 py-3">
                    <Pill level={m.level}>
                      {m.level === "good" ? "OK" : m.level === "warn" ? "À améliorer" : m.level === "bad" ? "Manquant" : "Info"}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{m.value}</td>
                  <td className="px-4 py-3 text-slate-600">{m.recommendation || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Positives / Improvements */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">Points positifs</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {positives.length === 0 ? <li>Aucun point fort détecté (profil incomplet).</li> : null}
            {positives.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.label}</span> : {p.value}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-slate-900">Améliorations prioritaires</div>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {improvements.length === 0 ? <li>Rien de critique détecté.</li> : null}
            {improvements.map((p, i) => (
              <li key={i}>
                <span className="font-medium">{p.label}</span> : {p.recommendation || "À compléter"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
