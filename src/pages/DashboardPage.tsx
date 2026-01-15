import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  FileText,
  AlertCircle,
  Loader2,
  X,
  Upload,
} from 'lucide-react';

import { API_UPLOAD_URL, API_PROFILE_URL, API_JSON_URL } from "../config/api";

// --------------------
// TYPES
// --------------------
type ParsedCV = {
  meta?: { generated_at?: string; version?: string; source?: string };
  candidate?: { name?: string; email?: string; title?: string; summary?: string };
  skills?: ParsedSkill[];
  experience?: ParsedExperience[];
  education?: ParsedEducation[];
};

// --- BADGE ---
type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'purple';
const Badge: React.FC<{ children: React.ReactNode; variant?: BadgeVariant }> = ({ children, variant = 'neutral' }) => {
  const styles: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>{children}</span>;
};

// --- BUTTON ---
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: ButtonVariant; size?: 'sm' | 'md' | 'lg'; }
const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm',
    secondary: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus:ring-indigo-500',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-600 hover:text-indigo-600 hover:bg-indigo-50',
    gradient: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md',
  };
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };
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
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- FILE UPLOAD ---
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

// ---------------------------------------------------------------------------
// DASHBOARD PAGE
// ---------------------------------------------------------------------------
const DashboardPage: React.FC = () => {
  const [showJsonModal, setShowJsonModal] = useState(false);
  
  // États pour le processus d'upload
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const [hasData, setHasData] = useState(false);
  const [candidateData, setCandidateData] = useState<ParsedCV | null>(null);

  const candidateName = useMemo(() => formatCandidateName(candidateData?.candidate), [candidateData]);

  const pollCandidate = async (id: string) => {
    try {
      const response = await fetch(`${API_CANDIDATES_BASE}/candidates/${id}/cv`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 404) {
        return { done: false };
      }

      if (!response.ok) {
        throw new Error(`Lecture du CV impossible (${response.status}).`);
      }

      const data = (await response.json()) as ParsedCV;
      setCandidateData(data);
      setStatus('success');
      setHasData(true);
      return { done: true };
    } catch (error: any) {
      setErrorMessage(error.message || 'Lecture du CV impossible.');
      setStatus('error');
      return { done: true };
    }
  };

  useEffect(() => {
    if (status !== 'analyzing' || !candidateId) return undefined;

    const interval = setInterval(async () => {
      const result = await pollCandidate(candidateId);
      if (result.done) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setErrorMessage('');
    setCandidateData(null);
    setHasData(false);

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
      if (error.message?.toLowerCase().includes('cors')) {
        setErrorMessage('Vérifiez la configuration CORS sur API Gateway et le bucket S3.');
      } else {
        setErrorMessage(error.message || 'Une erreur est survenue.');
      }
    }
  };

  const handleAiAction = async (mode: 'letter' | 'interview') => {
    setAiLoading(true);
    const role = jobDesc || 'Poste cible non renseigné';
    const candidateSummary = candidateData?.candidate?.summary || 'Résumé non disponible';
    const basePrompt =
      mode === 'letter'
        ? `Rédige une lettre de motivation concise pour ${role}. Contexte: ${candidateSummary}`
        : `Propose 5 questions d'entretien ciblées pour ${role}. Contexte: ${candidateSummary}`;

    // Placeholder local generation; swap with Bedrock/OpenAI call when connecté
    const result = await new Promise<string>((resolve) =>
      setTimeout(() => resolve(`${basePrompt}\n\n(Rédaction locale - connecter Bedrock/OpenAI en prod)`), 400),
    );

    setAiResult(result);
    setAiLoading(false);
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
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
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
                    <Button variant="outline" className="flex-1" onClick={() => setShowJsonModal(true)}>
                      Voir JSON (modal)
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={openJsonFromApi} disabled={!candidateData?.candidate_id}>
                      Ouvrir JSON (API)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Score ATS</h3>
              <Badge variant={hasData ? 'success' : 'neutral'}>{hasData ? 'Calculé' : '--'}</Badge>
            </div>
            <div className="relative h-28 bg-indigo-50 rounded-xl overflow-hidden">
              {hasData ? (
                <>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-bold text-indigo-700 text-xl">
                    <span className="text-sm text-indigo-200">Profil</span>
                    Aligné
                  </div>
                  <div className="absolute bottom-0 left-0 h-full w-full bg-gradient-to-r from-indigo-500/50 to-purple-600/50" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">En attente d'analyse</div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {hasData
                ? 'Score ATS calculé côté backend (Textract/Bedrock). Affichez les manques clés dans votre UI.'
                : 'Uploadez un CV pour déclencher le parsing et le scoring.'}
            </p>
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setShowJsonModal(true)} disabled={!hasData}>
              Voir le JSON <ArrowRight size={16} />
            </Button>
          </Card>
        </div>

        {/* Section Templates & Assistant IA */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Templates PDF</h3>
              <Badge variant="purple">Multi-formats</Badge>
            </div>
            <div className="grid sm:grid-cols-4 gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => setActiveTemplate(tpl)}
                  className={`border rounded-xl p-3 text-sm text-left hover:border-indigo-400 transition-colors ${activeTemplate === tpl ? 'border-indigo-500 shadow-soft' : 'border-gray-200'}`}
                >
                  <p className="font-semibold text-gray-900">{tpl}</p>
                  <p className="text-xs text-gray-500">Prévisualisation</p>
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="p-4 bg-indigo-50 border-indigo-100">
                <p className="text-xs text-indigo-600 font-semibold">Template actif</p>
                <p className="text-lg font-bold text-indigo-800">{activeTemplate}</p>
                <p className="text-sm text-indigo-700 mt-1">Sections alignées, typo optimisée ATS.</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500">Export</p>
                <Button variant="primary" className="w-full mt-2 flex items-center gap-2" disabled={!hasData}>
                  <Download size={16} /> Générer PDF
                </Button>
                <p className="text-xs text-gray-500 mt-2">Nécessite les données.</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500">Aperçu</p>
                <div className="mt-2 h-24 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100" />
              </Card>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Assistant IA</h3>
              <Badge variant="purple">Production-ready (branchez Bedrock/OpenAI)</Badge>
            </div>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Collez une description de poste..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={4}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleAiAction('letter')} disabled={aiLoading || !hasData}>Lettre de motiv.</Button>
              <Button variant="secondary" className="flex-1" onClick={() => handleAiAction('interview')} disabled={aiLoading || !hasData}>Entretien</Button>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm min-h-[96px] whitespace-pre-line">
              {aiLoading ? 'Rédaction en cours...' : aiResult || (hasData ? 'Prêt à générer...' : 'En attente du CV...')}
            </div>
          </Card>
        </div>

        {/* Historique */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Historique des CV traités</h3>
              <Badge variant="neutral">Historique</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-gray-500">
                  <th className="px-4 py-2">Nom du fichier</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Score ATS</th>
                  <th className="px-4 py-2">Template</th>
                  <th className="px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {candidateId && hasData ? (
                  <tr>
                    <td className="px-4 py-3 font-medium text-gray-900">{candidateData?.candidate?.name || 'CV importé'}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date().toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-900">OK</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{activeTemplate}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Ready</Badge>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-gray-500" colSpan={5}>
                      Aucun CV importé pour le moment. Chargez un fichier pour alimenter la table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} title="Données Structurées (Live AWS)">
        <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto h-[60vh]">
          {JSON.stringify(candidateData, null, 2)}
        </pre>
      </Modal>
    </div>
  );
};

export default DashboardPage;
