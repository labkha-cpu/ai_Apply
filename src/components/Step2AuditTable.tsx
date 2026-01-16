// src/components/Step2AuditTable.tsx
import React from "react";
import type { AuditRow } from "../utils/step2Audit";

type Props = {
  rows: AuditRow[];
};

const Pill: React.FC<{ level: "good" | "warn" | "bad" | "info"; children: React.ReactNode }> = ({ level, children }) => {
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

export default function Step2AuditTable({ rows }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Audit comparatif — Step1 vs Step2</h3>
            <p className="text-xs text-gray-500 mt-1">
              Ce tableau montre ce que l’IA a ajouté / amélioré (valeur business CVision).
            </p>
          </div>
          <Pill level="info">Auto</Pill>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-6 py-3">Champ</th>
              <th className="px-6 py-3">Step1 (origine)</th>
              <th className="px-6 py-3">Step2 (IA)</th>
              <th className="px-6 py-3">Ajout IA / amélioration</th>
              <th className="px-6 py-3">Statut</th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t align-top">
                <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap">{r.field}</td>
                <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{r.step1}</td>
                <td className="px-6 py-4 text-gray-700 whitespace-pre-wrap">{r.step2}</td>
                <td className="px-6 py-4 text-gray-600 whitespace-pre-wrap">{r.improvement}</td>
                <td className="px-6 py-4">
                  <Pill level={r.level}>
                    {r.level === "good" ? "OK" : r.level === "warn" ? "Amélioré" : r.level === "bad" ? "Manquant" : "Info"}
                  </Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
