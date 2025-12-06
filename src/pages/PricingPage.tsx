import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CheckCircle } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '19€/mois',
    description: 'Pour tester CVision sur quelques profils par mois.',
    features: ['5 CV/mois', 'Templates LinkedIn', 'Export JSON cv_master_v1'],
    cta: 'Commencer',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '49€/mois',
    description: 'Pour les équipes recrutement qui veulent accélérer.',
    features: ['50 CV/mois', 'Score ATS + Skills Atlas', 'Intégrations S3 / Webhook', 'Support prioritaire'],
    cta: 'Choisir ce plan',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    description: 'SLA, gouvernance data et déploiement multi-entités.',
    features: ['Volume illimité', 'Single Sign-On', 'Infra dédiée', 'Accompagnement onboarding'],
    cta: 'Parler à un expert',
    highlight: false,
  },
];

const PricingPage: React.FC = () => (
  <div className="bg-gray-50 min-h-screen pt-24 pb-16">
    <div className="max-w-6xl mx-auto px-4 text-center">
      <p className="text-sm text-indigo-600 font-semibold">Tarification simple</p>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Choisissez le plan adapté</h1>
      <p className="text-gray-600 mb-10">Des plans transparents pour tester, scaler et industrialiser votre pipeline CV.</p>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`p-8 text-left ${plan.highlight ? 'border-indigo-200 shadow-soft relative overflow-visible' : ''}`}
            hover
          >
            {plan.highlight && (
              <Badge variant="purple" >Best seller</Badge>
            )}
            <h3 className="text-2xl font-bold text-gray-900 mt-3">{plan.name}</h3>
            <p className="text-3xl font-bold text-indigo-700 mt-2">{plan.price}</p>
            <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" /> {feat}
                </li>
              ))}
            </ul>
            <Button variant={plan.highlight ? 'gradient' : 'primary'} className="w-full mt-6">
              {plan.cta}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default PricingPage;
