import React, { useState, useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  FileText, 
  LayoutDashboard, 
  AlertCircle, 
  Loader2, 
  X, 
  Upload,
  ArrowRight,
  BarChart,
  Download,
  Clock
} from 'lucide-react';
// On utilise API_PROFILE_URL pour le polling au lieu de API_PARSE_URL
import { API_UPLOAD_URL, API_PROFILE_URL } from "../config/api";


// --- TYPES ---
type ParsedCV = {
  candidate_id?: string;
  status?: string; // Statut du traitement (COMPLETED, FAILED...)
  identity?: {
    full_name?: string;
    headline?: string;
    emails?: string[];
    phones?: string[];
    location?: string;
  };
  skills?: {
    hard_skills?: string[];
    soft_skills?: string[];
    tools?: string[];
  };
  experiences?: any[];
  education?: any[];
  summary?: {
    profile_summary?: string;
  };
  meta?: {
    cv_hash?: string;
    parsed_at?: string;
  };
  // Support pour les champs calculés
  years_of_experience?: number;
  years_of_experience_inferred?: number;
};

// --- COMPOSANTS UI ---

const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant }) => {
  const bg = variant === 'purple' ? 'bg-purple-100 text-purple-800' : 
             variant === 'success' ? 'bg-green-100 text-green-800' : 
             variant === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800';
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg}`}>{children}</span>;
};

const Button: React.FC<any> = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-lg disabled:opacity-50";
  const styles = variant === 'primary' ? "bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2" : 
                 "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2";
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

const FileUpload: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleFile = (file: File) => onUpload(file);

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
    >
      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} accept=".pdf" />
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600"><Upload size={24} /></div>
        <p className="text-sm text-gray-600 font-medium">Glissez votre PDF ici</p>
        <p className="text-xs text-gray-400 mt-2">Mode Asynchrone (Robuste)</p>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// PAGE DASHBOARD (MODE ASYNCHRONE / POLLING)
// ---------------------------------------------------------------------------

const DashboardPage: React.FC = () => {
  const [showJsonModal, setShowJsonModal] = useState(false);
  
  // États de l'upload et de l'analyse
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [hasData, setHasData] = useState(false);
  const [candidateData, setCandidateData] = useState<ParsedCV | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  
  // États pour le feedback visuel du temps
  const [pollingTime, setPollingTime] = useState(0);
  
  // Assistant IA
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [jobDesc, setJobDesc] = useState('');

  // Ref pour le timer de polling
  const pollingInterval = useRef<number | null>(null);
  const timerInterval = useRef<number | null>(null);

  // Nettoyage du timer si le composant est démonté
  useEffect(() => {
    return () => stopPolling();
  }, []);

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

  const startPolling = (candidateId: string) => {
    stopPolling();
    setPollingTime(0);
    console.log(`[POLLING] Démarrage de la surveillance pour ${candidateId}...`);
    
    // Timer visuel pour l'utilisateur
    timerInterval.current = window.setInterval(() => {
      setPollingTime(t => t + 1);
    }, 1000);
    
    let attempts = 0;
    // MODIFICATION: Augmentation du timeout à 10 minutes (300 tentatives * 2s)
    // Si la Lambda AWS plante silencieusement (timeout backend), le front attendra 10min avant d'échouer.
    const maxAttempts = 300; 

    pollingInterval.current = window.setInterval(async () => {
      attempts++;
      try {
        // On interroge l'API Profile pour voir si les données sont prêtes
        const res = await fetch(`${API_PROFILE_URL}/${candidateId}`);
        
        if (res.status === 502 || res.status === 500) {
          const text = await res.text().catch(() => "");
          stopPolling();
          setStatus("error");
          setErrorMessage(`GetProfile KO (${res.status}). Vérifie CloudWatch. ${text}`);
          return;
        }


        if (res.status === 200) {
          const data = await res.json();
          
          // Conditions de succès : statut COMPLETED ou présence de données brutes
          if (data.status === 'COMPLETED' || (data.raw_cv && data.identity)) {
            console.log("[POLLING] Analyse terminée avec succès !", data);
            stopPolling();
            
            // On fusionne les données pour l'affichage
            const finalData = { ...data, ...data.raw_cv };
            setCandidateData(finalData);
            setHasData(true);
            setStatus('success');
          } 
          else if (data.status === 'FAILED') {
            stopPolling();
            setStatus('error');
            setErrorMessage(data.error_message || "L'analyse a échoué côté serveur (voir logs CloudWatch).");
          }
          else {
            // Toujours en cours...
            const attemptLog = `[POLLING] En cours... Tentative ${attempts}/${maxAttempts} (${attempts * 2}s)`;
            if (attempts % 10 === 0) console.log(attemptLog);
          }
        } else if (res.status === 404) {
           if (attempts % 10 === 0) console.log(`[POLLING] Profil non trouvé (Lambda en cours d'exécution)...`);
        }

        if (attempts >= maxAttempts) {
          stopPolling();
          setStatus('error');
          setErrorMessage("Délai d'attente dépassé (10min). La Lambda a probablement planté (Timeout AWS). Vérifiez CloudWatch.");
        }
      } catch (err) {
        console.error("Erreur réseau pendant le polling:", err);
      }
    }, 2000); // Vérification toutes les 2 secondes
  };

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setErrorMessage('');
    setCandidateData(null);
    setHasData(false);
    stopPolling();

    try {
      // 1. Demande d'URL présignée pour l'upload (Lambda PostCV)
      console.log('1. Récupération du ticket d\'upload...');
      const uploadTicketResponse = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name }),
      });

      if (!uploadTicketResponse.ok) throw new Error('Erreur API Upload: Vérifiez API Gateway URL');
      
      const { upload_url, bucket, key, candidate_id } = await uploadTicketResponse.json();
      
      if (!candidate_id) {
        throw new Error("L'API Upload n'a pas renvoyé de candidate_id. Mettez à jour la Lambda PostCV.");
      }

      console.log('2. Upload vers S3...', { bucket, key, candidate_id });

      // 2. Upload S3 Direct
      const s3Upload = await fetch(upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/pdf' }
      });

      if (!s3Upload.ok) throw new Error('Échec du transfert S3 (Problème CORS ?)');
      
      setUploadedKey(key);
      
      // 3. Passage en mode Polling (Plus d'appel direct à /parse)
      // C'est le dépôt du fichier sur S3 qui déclenche la Lambda en arrière-plan
      setStatus('analyzing');
      startPolling(candidate_id);

    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Une erreur est survenue.');
    }
  };

  const handleAiAction = async (mode: 'letter' | 'interview') => {
    setAiLoading(true);
    setTimeout(() => {
        setAiResult(`Contenu généré pour ${mode} (Simulation front-end pour la démo).`);
        setAiLoading(false);
    }, 1500);
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
          {/* Carte d'Upload */}
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
            
            {/* Feedback Visuel */}
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
                </div>
              )}
            </div>
          </Card>

          {/* Carte Résultat Rapide */}
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Résultat</h3>
            {hasData ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                   <p className="text-xs text-gray-500">Nom détecté</p>
                   <p className="font-bold text-lg">{candidateData?.identity?.full_name || 'Inconnu'}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-500">Titre</p>
                   <p className="font-medium">{candidateData?.identity?.headline || 'Non spécifié'}</p>
                </div>
                <div>
                   <p className="text-xs text-gray-500">Expérience</p>
                   <p className="font-medium text-indigo-600">
                     {candidateData?.years_of_experience_inferred ?? candidateData?.years_of_experience ?? 0} ans
                   </p>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowJsonModal(true)}>
                  Voir le JSON complet
                </Button>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <FileText size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">En attente de données</p>
              </div>
            )}
          </Card>
        </div>

        {/* Section Assistant IA */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 space-y-4 col-span-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Assistant IA</h3>
              <Badge variant="purple">Démo Frontend</Badge>
            </div>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Collez une description de poste pour générer une lettre de motivation..."
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={3}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleAiAction('letter')} disabled={aiLoading || !hasData}>Générer Lettre</Button>
              <Button variant="secondary" className="flex-1" onClick={() => handleAiAction('interview')} disabled={aiLoading || !hasData}>Questions Entretien</Button>
            </div>
            {aiResult && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm min-h-[60px] whitespace-pre-line animate-in fade-in">
                {aiResult}
                </div>
            )}
          </Card>
        </div>
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
