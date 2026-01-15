import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';

interface PaymentStatusPageProps {
  status: 'success' | 'cancel';
}

const copy = {
  success: {
    title: 'Merci, votre paiement est confirmé',
    message: 'Vos crédits sont prêts. Un e-mail de confirmation et la facture Stripe seront disponibles dans le portail client.',
    icon: <CheckCircle2 size={32} className="text-green-600" />,
    cta: 'Accéder au dashboard',
    to: '/dashboard',
  },
  cancel: {
    title: 'Paiement annulé',
    message: 'Aucune carte n’a été débitée. Vous pouvez relancer le paiement ou modifier votre offre.',
    icon: <XCircle size={32} className="text-red-500" />,
    cta: 'Revenir aux tarifs',
    to: '/pricing',
  },
};

const PaymentStatusPage: React.FC<PaymentStatusPageProps> = ({ status }) => {
  const content = copy[status];
  const redirect = () => {
    window.location.assign(content.to);
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
          {content.icon}
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{content.title}</h1>
        <p className="text-gray-600 mb-8">{content.message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant={status === 'success' ? 'gradient' : 'primary'} onClick={redirect}>
            {content.cta}
          </Button>
        </div>
        <div className="mt-10 p-4 bg-white border border-gray-200 rounded-xl text-left">
          <p className="text-sm text-gray-700 font-semibold mb-2">Prochaines étapes</p>
          {status === 'success' ? (
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Vos crédits sont mis à jour via le webhook Stripe {'->'} Lambda {'->'} DynamoDB.</li>
              <li>Vous recevrez un e-mail dès que l’analyse CV sera terminée.</li>
              <li>Gérez votre abonnement et vos factures dans le portail client Stripe.</li>
            </ul>
          ) : (
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Le panier est conservé 24h côté Stripe.</li>
              <li>Vous pouvez changer de carte ou de plan avant de relancer.</li>
              <li>Besoin d’aide ? Contactez-nous sur support@cvision.ai.</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusPage;
