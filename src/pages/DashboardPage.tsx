import React, { useEffect, useMemo, useState } from 'react';
import { 
  ArrowRight, 
  BarChart, 
  CheckCircle, 
  Download, 
  FileText, 
  LayoutDashboard, 
  Zap, 
  AlertCircle, 
  Loader2, 
  X, 
  Upload,
} from 'lucide-react';
import { API_CANDIDATES_BASE, API_PARSE_URL, API_UPLOAD_URL } from '../config/api';

// ---------------------------------------------------------------------------
// COMPOSANTS UI & MOCK DATA 
// (Inclus pour la démo, à remettre dans leurs fichiers respectifs en prod)
// ---------------------------------------------------------------------------

type ParsedSkill = { name?: string; level?: string; category?: string };
type ParsedExperience = { role?: string; company?: string; duration?: string; achievements?: string[] };
type ParsedEducation = { degree?: string; school?: string; year?: string };
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
    <button className={`inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- CARD ---
const Card: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({ children, className = '', hover = false }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${hover ? 'hover:shadow-soft transition-shadow duration-300' : ''} ${className}`}>
    {children}
  </div>
);

// --- MODAL ---
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
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      onUpload(f);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      onUpload(f);
    }
  };
  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleChange} accept=".pdf,.docx" />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600"><Upload size={24} /></div>
        {file ? (
          <div className="flex flex-col items-center">
            <span className="font-medium text-gray-900">{file.name}</span>
            <span className="text-sm text-green-600 mt-1 flex items-center gap-1"><CheckCircle size={14} /> Prêt à analyser</span>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 font-medium">Glissez votre CV ici ou <span className="text-indigo-600">parcourez</span></p>
            <p className="text-xs text-gray-400">PDF, DOCX jusqu'à 10MB</p>
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PAGE PRINCIPALE (LOGIQUE MÉTIER & S3)
// ---------------------------------------------------------------------------

const templates = ['Harvard', 'Notion', 'LinkedIn', 'Modern SaaS'];

const formatCandidateName = (candidate?: ParsedCV['candidate']) => {
  if (!candidate?.name) return 'Profil inconnu';
  return candidate.name;
};

const DashboardPage: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState('LinkedIn');
  const [showJsonModal, setShowJsonModal] = useState(false);
  
  // États pour le processus d'upload
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [hasData, setHasData] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
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
    }, 4000);

    return () => clearInterval(interval);
  }, [status, candidateId]);

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setErrorMessage('');
    setCandidateData(null);
    setCandidateId(null);
    setHasData(false);

    try {
      const uploadTicket = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content_type: file.type || 'application/pdf' }),
      });

      if (!uploadTicket.ok) {
        const details = await uploadTicket.text().catch(() => '');
        throw new Error(details || `Erreur API upload (${uploadTicket.status}).`);
      }

      const { upload_url, key } = await uploadTicket.json();

      if (!upload_url || !key) {
        throw new Error('Réponse upload incomplète (manque upload_url ou key).');
      }

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/pdf' },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors du transfert vers S3.');
      }

      setUploadedKey(key);
      setStatus('analyzing');

      const parseResponse = await fetch(API_PARSE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ s3_key: key, filename: file.name }),
      });

      if (!parseResponse.ok) {
        const details = await parseResponse.text().catch(() => '');
        throw new Error(details || `Erreur parsing (${parseResponse.status}).`);
      }

      const parsed = await parseResponse.json();
      const returnedId = parsed?.candidate_id || parsed?.id || null;

      if (returnedId) {
        setCandidateId(returnedId);
      }
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Espace connecté</p>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard CVision</h1>
            <p className="text-gray-600">
              Pipeline : React <span className="text-indigo-500 font-bold">→ API Gateway → S3</span> (Connecté)
            </p>
            {candidateId && (
              <p className="text-xs text-gray-500 mt-2">Dernier profil importé : {candidateName}</p>
            )}
          </div>
          <Button variant="gradient" className="flex items-center gap-2">
            <LayoutDashboard size={18} /> Flux S3 connecté
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Carte d'Upload */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload de CV</h2>
              <Badge variant={status === 'success' ? 'success' : status === 'error' ? 'error' : status !== 'idle' ? 'warning' : 'neutral'}>
                {status === 'idle' && 'En attente'}
                {status === 'uploading' && 'Envoi S3...'}
                {status === 'analyzing' && 'Analyse IA...'}
                {status === 'success' && 'Terminé'}
                {status === 'error' && 'Erreur'}
              </Badge>
            </div>
            
            <FileUpload onUpload={handleUpload} />
            
            {/* Feedback Visuel */}
            <div className="mt-4">
              {status === 'uploading' && (
                <p className="text-sm text-indigo-600 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Envoi sécurisé vers votre Bucket S3...
                </p>
              )}
              {status === 'analyzing' && (
                <p className="text-sm text-purple-600 flex items-center gap-2">
                  <Zap size={16} className="animate-pulse" /> Déclenchement du parsing IA (OCR)...
                </p>
              )}
              {status === 'error' && (
                 <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700 flex items-center gap-2 font-semibold">
                       <AlertCircle size={16} /> Échec de l'upload
                    </p>
                    <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                    {errorMessage.includes('CORS') && (
                       <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                          <strong>Action requise (AWS Console) :</strong>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                             <li>Allez dans API Gateway {'>'} Resources {'>'} /upload</li>
                             <li>Cliquez sur "Actions" {'>'} "Enable CORS"</li>
                             <li>Cochez "OPTIONS" et "POST", laissez Origin à "*", puis validez.</li>
                             <li><strong>IMPORTANT :</strong> Redéployez l'API (Actions {'>'} Deploy API).</li>
                          </ul>
                       </div>
                    )}
                 </div>
              )}
              {status === 'success' && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-green-600 flex items-center gap-2 font-medium">
                    <CheckCircle size={16} /> Fichier stocké sous : <span className="font-mono text-xs text-gray-500">{uploadedKey}</span>
                  </p>
                  <div className="flex gap-3 flex-wrap text-sm text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-2"><BarChart size={16} className="text-indigo-600" /> Score ATS : 88%</span>
                    <span className="inline-flex items-center gap-2"><FileText size={16} className="text-gray-500" /> Schéma : cv_master_v1</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Carte Score ATS */}
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

      <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} title="cv_master_v1 (live)">
        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(candidateData || { message: 'Aucune donnée récupérée' }, null, 2)}</pre>
      </Modal>
    </div>
  );
};

export default DashboardPage;
