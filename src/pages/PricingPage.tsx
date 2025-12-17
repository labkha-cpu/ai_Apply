import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { CheckCircle, Loader2 } from 'lucide-react';
import { createCheckoutSession, getCustomerPortalUrl, PlanCode } from '../services/payments';
import { useAuth } from '../context/AuthContext';

type PricingPlan = {
  name: string;
  code: PlanCode | 'enterprise';
  price: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    code: 'starter' as PlanCode,
    price: '19€/mois',
    description: 'Pour tester CVision sur quelques profils par mois.',
    features: ['5 CV/mois', 'Templates LinkedIn', 'Export JSON cv_master_v1'],
    cta: 'Commencer',
    highlight: false,
  },
  {
    name: 'Pro',
    code: 'pro' as PlanCode,
    price: '49€/mois',
    description: 'Pour les équipes recrutement qui veulent accélérer.',
    features: ['50 CV/mois', 'Score ATS + Skills Atlas', 'Intégrations S3 / Webhook', 'Support prioritaire'],
    cta: 'Choisir ce plan',
    highlight: true,
  },
  {
    name: 'Enterprise',
    code: 'enterprise',
    price: 'Sur devis',
    description: 'SLA, gouvernance data et déploiement multi-entités.',
    features: ['Volume illimité', 'Single Sign-On', 'Infra dédiée', 'Accompagnement onboarding'],
    cta: 'Parler à un expert',
    highlight: false,
  },
];

const PricingPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<PlanCode | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureAuth = () => {
    if (!isAuthenticated) {
      login();
    }
  };

  const handleCheckout = async (plan: PlanCode) => {
    setError(null);
    ensureAuth();
    setLoadingPlan(plan);
    try {
      const session = await createCheckoutSession(plan);
      window.location.assign(session.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de démarrer la session de paiement.';
      setError(message);
      setLoadingPlan(null);
    }
  };

  const openPortal = async () => {
    setError(null);
    ensureAuth();
    setPortalLoading(true);
    try {
      const url = await getCustomerPortalUrl();
      window.location.assign(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portail client indisponible.';
      setError(message);
      setPortalLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-sm text-indigo-600 font-semibold">Tarification simple</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choisissez le plan adapté</h1>
        <p className="text-gray-600 mb-6">Des plans transparents pour tester, scaler et industrialiser votre pipeline CV.</p>
        <p className="text-xs text-gray-500 mb-10">Les pages /payment/success et /payment/cancel sont prêtes pour vos retours Stripe Checkout.</p>

        {error && (
          <div className="mb-6 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg text-left max-w-3xl mx-auto">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`p-8 text-left ${plan.highlight ? 'border-indigo-200 shadow-soft relative overflow-visible' : ''}`}
              hover
            >
              {plan.highlight && <Badge variant="purple" >Best seller</Badge>}
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
              {plan.code === 'enterprise' && (
                <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-3 mt-4">
                  SSO, conformité et volumes dédiés : échangez avec nous pour activer votre tenant.
                </p>
              )}
              <Button
                variant={plan.highlight ? 'gradient' : 'primary'}
                className="w-full mt-6"
                disabled={plan.code !== 'enterprise' && loadingPlan === plan.code}
                onClick={() => (plan.code === 'enterprise' ? window.location.assign('/contact') : handleCheckout(plan.code))}
              >
                {plan.code !== 'enterprise' && loadingPlan === plan.code ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Redirection Stripe...
                  </span>
                ) : (
                  plan.cta
                )}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-10 max-w-3xl mx-auto">
          <Card className="p-6 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Déjà client ?</p>
                <p className="text-sm text-gray-600">Accédez à votre portail Stripe pour télécharger vos factures ou mettre à jour votre carte.</p>
              </div>
              <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 size={16} className="animate-spin" /> : 'Ouvrir le portail client'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
