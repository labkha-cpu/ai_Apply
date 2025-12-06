import React, { useState } from 'react';
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
  HelpCircle
} from 'lucide-react';

// ---------------------------------------------------------------------------
// CONFIGURATION API
// L'URL pointe vers l'environnement 'v1'
// ID API mis à jour : qgbog8umw5
// ---------------------------------------------------------------------------
const API_URL = 'https://qgbog8umw5.execute-api.eu-west-1.amazonaws.com/v1'; 

// ---------------------------------------------------------------------------
// COMPOSANTS UI & MOCK DATA 
// (Inclus pour la démo, à remettre dans leurs fichiers respectifs en prod)
// ---------------------------------------------------------------------------

// --- MOCK DATA ---
const MOCK_CV_MASTER_V1 = {
  meta: { generated_at: '2023-10-27T10:30:00Z', version: '1.0', source: 'parsed_pdf' },
  candidate: { name: 'Alexandre Dupont', email: 'alex.dupont@example.com', title: 'Senior Frontend Developer', summary: "Développeur passionné..." },
  skills: [{ name: 'React', level: 'Expert' }, { name: 'TypeScript', level: 'Advanced' }],
};

const MOCK_HISTORY = [
  { id: 1, name: 'CV_Alexandre_2024.pdf', date: '2023-10-26', score: 85, template: 'Modern SaaS', status: 'Ready' },
  { id: 2, name: 'CV_Alex_V2.pdf', date: '2023-10-25', score: 72, template: 'Harvard', status: 'Draft' },
  { id: 3, name: 'CV_Old.pdf', date: '2023-10-20', score: 45, template: '-', status: 'Error' },
  { id: 4, name: 'Resume_EN.pdf', date: '2023-10-18', score: 91, template: 'LinkedIn', status: 'Ready' },
];

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
const mockAiReply = (prompt: string) => `Réponse simulée basée sur : ${prompt.slice(0, 80)}...\n\nPoints forts : leadership produit, impact business.`;

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

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setErrorMessage('');

    try {
      // ÉTAPE 1 : Obtenir l'URL présignée depuis votre Lambda
      // L'appel devient : https://qgbog8umw5.../v1/upload
      console.log(`Calling API: ${API_URL}/upload`);
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Note: On n'ajoute pas 'mode: no-cors' ici car on a besoin de lire la réponse JSON
        },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!response.ok) {
        // Tentative de lire le corps de l'erreur pour plus de détails
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error('API Error:', response.status, errorText);
        
        if (response.status === 403 || response.status === 0) {
           throw new Error("Erreur CORS (403). Activez CORS sur votre ressource API Gateway (Actions > Enable CORS).");
        }
        
        throw new Error(`Erreur API (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const { upload_url, key } = data;

      // ÉTAPE 2 : Uploader le fichier directement sur S3
      // IMPORTANT : Votre bucket S3 doit aussi avoir CORS activé pour accepter le PUT
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });

      if (!uploadResponse.ok) {
         if (uploadResponse.status === 403) {
            throw new Error('Erreur S3 CORS (403). Vérifiez la configuration CORS de votre Bucket S3.');
         }
         throw new Error('Erreur lors du transfert vers S3.');
      }

      setUploadedKey(key);
      setStatus('analyzing');

      // Simulation de l'attente du traitement asynchrone (OCR + Parsing)
      setTimeout(() => {
        setStatus('success');
        setHasData(true);
      }, 2500);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      // On enrichit le message d'erreur pour l'utilisateur
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          setErrorMessage('Bloqué par CORS. Configurez "Enable CORS" sur API Gateway et ajoutez une règle CORS sur le Bucket S3.');
      } else {
          setErrorMessage(error.message || 'Une erreur est survenue.');
      }
    }
  };

  const handleAiAction = async (mode: 'letter' | 'interview') => {
    setAiLoading(true);
    const prompt = mode === 'letter'
        ? `Rédige une lettre de motivation concise pour le poste suivant : ${jobDesc || 'Product Manager Fintech'}`
        : `Prépare 5 questions d'entretien ciblées pour ce profil. Job: ${jobDesc || 'Lead Frontend'} `;
    const result = await new Promise<string>((resolve) => setTimeout(() => resolve(mockAiReply(prompt)), 500));
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
          </div>
          <Button variant="gradient" className="flex items-center gap-2">
            <LayoutDashboard size={18} /> Nouvel import S3
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
              <Badge variant={hasData ? 'success' : 'neutral'}>{hasData ? '88%' : '--'}</Badge>
            </div>
            <div className="relative h-28 bg-indigo-50 rounded-xl overflow-hidden">
              {hasData ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-700 text-3xl">88%</div>
                  <div className="absolute bottom-0 left-0 h-full w-[88%] bg-gradient-to-r from-indigo-500 to-purple-600" />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">En attente d'analyse</div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {hasData ? "Alignement sur l’offre : 9/10. Keywords manquants : GraphQL, Product Analytics." : "Uploadez un CV pour calculer le score."}
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
              <Badge variant="secondary">Beta</Badge>
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
            <Badge variant="neutral">Demo</Badge>
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
                {MOCK_HISTORY.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.date}</td>
                    <td className="px-4 py-3 text-gray-900">{row.score}%</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{row.template}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'Ready' ? 'success' : row.status === 'Error' ? 'error' : 'warning'}>{row.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showJsonModal} onClose={() => setShowJsonModal(false)} title="cv_master_v1 (mock)">
        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">{JSON.stringify(MOCK_CV_MASTER_V1, null, 2)}</pre>
      </Modal>
    </div>
  );
};

export default DashboardPage;
