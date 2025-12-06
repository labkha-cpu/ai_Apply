import React from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Cpu, Shield, Zap } from 'lucide-react';

const AboutPage: React.FC = () => (
  <div className="bg-gray-50 min-h-screen pt-24 pb-16">
    <div className="max-w-5xl mx-auto px-4 space-y-10">
      <div className="text-center space-y-3">
        <Badge variant="purple">À propos</Badge>
        <h1 className="text-4xl font-bold text-gray-900">Pourquoi CVision existe</h1>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Nous avons créé CVision pour donner aux candidats et aux recruteurs un langage commun : des données CV normalisées, des scores ATS transparents et des exports premium prêts à envoyer.
        </p>
      </div>

      <Card className="p-8 bg-white shadow-soft">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Notre vision produit</h2>
        <p className="text-gray-600 mb-4">
          L’IA permet d’automatiser la lecture, l’analyse et la réécriture de CV. CVision fournit un pipeline complet : parsing, structuration JSON, scoring ATS et génération PDF multi-templates.
        </p>
        <p className="text-gray-600">
          Nous croyons en des workflows API-first : S3 pour stocker, Lambdas pour les étapes 1–4, DynamoDB pour tracer les versions, et une API REST pour piloter l’ensemble. Le tout, présenté dans une interface moderne et intuitive.
        </p>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[{ title: 'Recruteurs', desc: 'Priorisez les candidats avec le scoring ATS et les insights Skills Atlas.', icon: Shield }, { title: 'Entreprises', desc: 'Industrialisez vos imports CV, alimentez votre ATS et vos dashboards.', icon: Cpu }, { title: 'Candidats', desc: 'Obtenez un CV premium instantanément avec nos templates.', icon: Zap }].map((item) => (
          <Card key={item.title} className="p-6" hover>
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3">
              <item.icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{item.desc}</p>
          </Card>
        ))}
      </div>

      <Card className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider text-white/70">Architecture</p>
          <h3 className="text-2xl font-bold">S3 · Lambdas Step1–4 · DynamoDB · API REST</h3>
          <p className="text-white/80">Description uniquement : aucun backend ici, mais tout est pensé pour se brancher à vos stacks cloud.</p>
        </div>
        <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-white/90">
          Voir les schémas
        </Button>
      </Card>
    </div>
  </div>
);

export default AboutPage;
