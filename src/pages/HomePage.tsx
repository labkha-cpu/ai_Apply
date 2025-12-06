import React from 'react';
import { ArrowRight, BarChart, CheckCircle, Code, Cpu, Download, Eye, FileText, LayoutDashboard, Shield, Star, Upload, Zap } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { TESTIMONIALS } from '../data/mockData';

const steps = [
  { number: '01', title: 'Extraction texte + parsing PDF', desc: 'OCR + parsing intelligent pour isoler chaque section du CV.' },
  { number: '02', title: 'Structuration JSON (cv_master_v1)', desc: 'Normalisation dans notre schéma standard exploitable en API.' },
  { number: '03', title: 'ATS Scoring & Skills Atlas', desc: 'Alignement avec l’offre, détection des écarts et priorisation des skills.' },
  { number: '04', title: 'Génération multi-templates', desc: 'Export premium (LinkedIn, Consulting, Harvard…) prêt à envoyer.' },
];

const valueProps = [
  { icon: Zap, title: 'Gain de temps', desc: 'Automatisez la lecture et le formattage des CV en quelques secondes.' },
  { icon: Shield, title: 'Qualité professionnelle', desc: 'Templates premium cohérents avec vos guidelines marque employeur.' },
  { icon: BarChart, title: 'Standardisation', desc: 'Données structurées pour vos ATS, dashboards et APIs internes.' },
  { icon: Cpu, title: 'Exploitable en API', desc: 'Connectez S3, DynamoDB ou vos webhooks pour orchestrer le pipeline.' },
];

const HomePage: React.FC = () => (
  <div className="pt-24 bg-gray-50">
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <Badge variant="purple">SaaS AI · CV parsing · Templates PDF</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Analysez, structurez et optimisez vos CV automatiquement avec l’IA.
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            CVision transforme vos CV en données prêtes pour l’ATS, révèle les skills manquants et génère des versions premium adaptées à chaque usage.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" variant="gradient">
              Essayer CVision
            </Button>
            <Button size="lg" variant="outline" className="flex items-center gap-2">
              Voir une démo <ArrowRight size={18} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2"><Shield size={16} /> RGPD Ready</span>
            <span className="inline-flex items-center gap-2"><Cpu size={16} /> API-first</span>
            <span className="inline-flex items-center gap-2"><Download size={16} /> Templates PDF</span>
          </div>
        </div>
        <Card className="p-6 bg-white/80 backdrop-blur shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-semibold">CV</div>
              <div>
                <p className="text-sm text-gray-500">Simulation Dashboard</p>
                <p className="font-semibold text-gray-900">CVision Workbench</p>
              </div>
            </div>
            <Badge variant="success">Score 88%</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Parsing', value: '99%' }, { label: 'Sections détectées', value: '12' }, { label: 'Compétences', value: '24' }, { label: 'Templates', value: '8' }].map((item) => (
              <div key={item.label} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="text-lg font-semibold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <p className="text-sm text-gray-600">
              “Aligné sur le schéma <span className="font-semibold text-indigo-700">cv_master_v1</span>, prêt pour vos workflows S3 + Lambda + DynamoDB.”
            </p>
          </div>
        </Card>
      </div>
    </section>

    <section className="py-16 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-indigo-600 font-semibold text-sm">Pipeline IA complet</p>
            <h2 className="text-3xl font-bold text-gray-900">4 étapes pour un CV exploitable</h2>
          </div>
          <Button variant="ghost" className="flex items-center gap-2">
            Voir le détail API <ArrowRight size={16} />
          </Button>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.number} className="p-5" hover>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="font-semibold text-indigo-600">{step.number}</span>
                <FileText size={18} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-3">{step.title}</h3>
              <p className="text-sm text-gray-600 mt-2">{step.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <p className="text-indigo-600 font-semibold text-sm">Avantages</p>
          <h2 className="text-3xl font-bold text-gray-900">Pensé pour les équipes produit, talent et data</h2>
          <p className="text-gray-600">
            Générez des CV harmonisés, enrichissez les profils avec nos modèles IA, suivez les scores ATS et publiez directement via API.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {valueProps.map((item) => (
              <Card key={item.title} className="p-4" hover>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
                  <item.icon size={20} />
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
              </Card>
            ))}
          </div>
          <div className="flex gap-3 text-sm text-gray-500">
            <span className="inline-flex items-center gap-2"><LayoutDashboard size={16} /> Dashboard live</span>
            <span className="inline-flex items-center gap-2"><Eye size={16} /> Prévisualisations PDF</span>
            <span className="inline-flex items-center gap-2"><Code size={16} /> Schéma API</span>
          </div>
        </div>
        <Card className="p-8 bg-white border border-indigo-50 shadow-soft">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Comment ça marche</h3>
          <div className="space-y-5">
            {[{ title: 'Déposez ou connectez S3', desc: 'Nous détectons automatiquement les nouveaux CV.' }, { title: 'Pipeline IA', desc: 'Parsing, classification, Skills Atlas et scoring ATS en continu.' }, { title: 'Visualisez & exportez', desc: 'Choisissez un template, exportez JSON/PDF ou envoyez vers l’ATS.' }].map((step, idx) => (
              <div key={step.title} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-sm text-indigo-800 font-semibold flex items-center gap-2">
              <Cpu size={16} /> Intégrations : AWS, Bedrock, OpenAI, S3, DynamoDB
            </p>
          </div>
        </Card>
      </div>
    </section>

    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <Card key={t.id} className="p-8 bg-gray-50 border-none" hover>
              <div className="flex gap-1 text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-6">"{t.text}"</p>
              <div>
                <div className="font-bold text-gray-900">{t.name}</div>
                <div className="text-sm text-indigo-600">{t.role}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>

    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">Compatible avec</p>
        <div className="flex justify-center flex-wrap gap-8 md:gap-16 opacity-60">
          {['AWS', 'Bedrock', 'OpenAI', 'S3', 'DynamoDB'].map((brand) => (
            <span key={brand} className="font-semibold text-lg text-gray-500">
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default HomePage;
