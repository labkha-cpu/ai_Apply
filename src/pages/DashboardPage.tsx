import React, { useState } from 'react';
import { ArrowRight, BarChart, CheckCircle, Download, FileText, LayoutDashboard, PieChart, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import FileUpload from '../components/ui/FileUpload';
import { MOCK_CV_MASTER_V1, MOCK_HISTORY } from '../data/mockData';

const templates = ['Harvard', 'Notion', 'LinkedIn', 'Modern SaaS'];
const mockAiReply = (prompt: string) =>
  `Réponse simulée basée sur : ${prompt.slice(0, 80)}...\n\nPoints forts : leadership produit, impact business, ownership transverse.`;

const DashboardPage: React.FC = () => {
  const [activeTemplate, setActiveTemplate] = useState('LinkedIn');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState('');

  const handleUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setHasData(true);
    }, 1200);
  };

  const handleAiAction = async (mode: 'letter' | 'interview') => {
    setAiLoading(true);
    const prompt =
      mode === 'letter'
        ? `Rédige une lettre de motivation concise pour le poste suivant : ${jobDesc || 'Product Manager Fintech'}`
        : `Prépare 5 questions d'entretien ciblées pour ce profil. Job: ${jobDesc || 'Lead Frontend'} `;
    const result = await new Promise<string>((resolve) => setTimeout(() => resolve(mockAiReply(prompt)), 500));
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">Espace connecté</p>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard CVision</h1>
            <p className="text-gray-600">Simulation front-only : parsez, scorez et générez vos PDF sans backend.</p>
          </div>
          <Button variant="gradient" className="flex items-center gap-2">
            <LayoutDashboard size={18} /> Nouvel import S3
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Upload de CV</h2>
              <Badge variant={hasData ? 'success' : 'neutral'}>{hasData ? 'Analysé' : 'En attente'}</Badge>
            </div>
            <FileUpload onUpload={handleUpload} />
            {analyzing && <p className="text-sm text-indigo-600 mt-3">Analyse en cours...</p>}
            {hasData && (
              <div className="mt-4 flex gap-3 flex-wrap text-sm text-gray-500">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" /> Sections détectées : 12
                </span>
                <span className="inline-flex items-center gap-2">
                  <BarChart size={16} className="text-indigo-600" /> Score ATS : 88%
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} className="text-gray-500" /> Schéma : cv_master_v1
                </span>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Score ATS</h3>
              <Badge variant="success">88%</Badge>
            </div>
            <div className="relative h-28 bg-indigo-50 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-700 text-3xl">88%</div>
              <div className="absolute bottom-0 left-0 h-full w-[88%] bg-gradient-to-r from-indigo-500 to-purple-600" />
            </div>
            <p className="text-sm text-gray-600">
              Alignement sur l’offre : 9/10. Keywords manquants : GraphQL, Product Analytics.
            </p>
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={() => setShowJsonModal(true)}>
              Voir le JSON <ArrowRight size={16} />
            </Button>
          </Card>
        </div>

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
                  className={`border rounded-xl p-3 text-sm text-left hover:border-indigo-400 transition-colors ${
                    activeTemplate === tpl ? 'border-indigo-500 shadow-soft' : 'border-gray-200'
                  }`}
                >
                  <p className="font-semibold text-gray-900">{tpl}</p>
                  <p className="text-xs text-gray-500">Prévisualisation statique</p>
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
                <Button variant="primary" className="w-full mt-2 flex items-center gap-2">
                  <Download size={16} /> Générer PDF
                </Button>
                <p className="text-xs text-gray-500 mt-2">Mock sans génération réelle.</p>
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
              placeholder="Collez une description de poste pour personnaliser la lettre ou l'entretien"
              className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={4}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => handleAiAction('letter')} disabled={aiLoading}>
                Lettre de motivation
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => handleAiAction('interview')} disabled={aiLoading}>
                Questions entretien
              </Button>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm min-h-[96px] whitespace-pre-line">
              {aiLoading ? 'Rédaction en cours...' : aiResult || 'Résultats IA affichés ici (simulation)'}
            </div>
          </Card>
        </div>

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
                      <Badge
                        variant={row.status === 'Ready' ? 'success' : row.status === 'Error' ? 'error' : 'warning'}
                      >
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-white/70">Pipeline complet</p>
              <h3 className="text-2xl font-bold">S3 → Lambda → DynamoDB → API</h3>
              <p className="text-white/80">Aucune logique backend nécessaire ici : tout est simulé côté front.</p>
            </div>
            <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-white/90">
              Tester l'API mock
            </Button>
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
