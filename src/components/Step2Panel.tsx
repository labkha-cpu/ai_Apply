// src/components/Step2Panel.tsx
import React, { useMemo, useState } from "react";
import { triggerStep2, pollStep2UntilDone, getStep2CvMasterUrl, CandidateProfileResponse } from "../services/cvision";

type Props = {
  candidateId: string;
  profile?: CandidateProfileResponse;
  onProfileUpdate?: (p: CandidateProfileResponse) => void;
};

export default function Step2Panel({ candidateId, profile, onProfileUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  const step2Status = (profile?.step2_status ?? profile?.meta?.step2_status ?? "NOT_STARTED") as string;

  // On récupère le JSON Step2 depuis step2_json (ou depuis meta si tu le ranges ailleurs)
  const step2Json = profile?.step2_json ?? profile?.meta?.step2_json ?? null;

  const step2ErrorText = useMemo(() => {
    const e: any = profile?.step2_error ?? profile?.meta?.step2_error ?? profile?.meta?.step2_error_message;
    if (!e) return "";
    if (typeof e === "string") return e;
    if (typeof e === "object") return e.message || e.details || JSON.stringify(e);
    return String(e);
  }, [profile]);

  const runStep2 = async () => {
    setError("");
    setMsg("");
    setLoading(true);
    try {
      await triggerStep2(candidateId);
      setMsg("Step2 lancée…");

      const finalProfile = await pollStep2UntilDone(candidateId, { intervalMs: 2500, timeoutMs: 180000, include: "all" });
      onProfileUpdate?.(finalProfile);

      const st = (finalProfile.step2_status ?? finalProfile?.meta?.step2_status) as string;
      if (st === "COMPLETED") setMsg("✅ Step2 terminée. Résultat prêt.");
      if (st === "FAILED") setError(step2ErrorText || "Step2 a échoué.");
    } catch (e: any) {
      setError(e?.message || "Erreur Step2");
    } finally {
      setLoading(false);
    }
  };

  const downloadCvMaster = async () => {
    setError("");
    setMsg("");
    try {
      const url = await getStep2CvMasterUrl(candidateId);
      window.open(url, "_blank", "noopener,noreferrer");
      setMsg("Téléchargement lancé ✅");
    } catch (e: any) {
      // ⚠️ On ne touche pas au step2_status ici
      setError(e?.message || "Impossible de télécharger le CV Master");
    }
  };

  return (
    <div style={{ border: "1px solid #333", borderRadius: 12, padding: 16, marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700 }}>Step2 — CV ATS</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            Statut: <b>{step2Status}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={runStep2} disabled={loading} style={{ padding: "8px 12px" }}>
            {loading ? "Traitement…" : "Relancer la génération"}
          </button>

          <button
            onClick={downloadCvMaster}
            disabled={loading || step2Status !== "COMPLETED"}
            style={{ padding: "8px 12px" }}
          >
            Télécharger JSON
          </button>
        </div>
      </div>

      {msg && <div style={{ marginTop: 10, color: "#9ee6a8" }}>{msg}</div>}
      {error && <div style={{ marginTop: 10, color: "#ff8b8b", whiteSpace: "pre-wrap" }}>{error}</div>}

      {/* ✅ Preview Step2 dès COMPLETED */}
      {step2Status === "COMPLETED" && step2Json && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #444", borderRadius: 10 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Aperçu (Step2)</div>

          <div style={{ fontSize: 13, opacity: 0.9 }}>
            <div><b>Nom :</b> {step2Json.full_name || "-"}</div>
            <div><b>Headline :</b> {step2Json.headline || "-"}</div>
            <div><b>Résumé :</b> {step2Json.summary || "-"}</div>

            {Array.isArray(step2Json?.key_achievements) && step2Json.key_achievements.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <b>Key achievements :</b>
                <ul style={{ marginTop: 4 }}>
                  {step2Json.key_achievements.slice(0, 5).map((x: string, i: number) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ Si FAILED, on affiche la vraie erreur */}
      {step2Status === "FAILED" && step2ErrorText && (
        <div style={{ marginTop: 10, color: "#ff8b8b", whiteSpace: "pre-wrap" }}>
          {step2ErrorText}
        </div>
      )}

      {profile?.step2_meta?.duration_ms != null && (
        <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
          Durée: {profile.step2_meta.duration_ms} ms — Modèle: {profile.step2_meta.model || "?"}
        </div>
      )}
    </div>
  );
}
