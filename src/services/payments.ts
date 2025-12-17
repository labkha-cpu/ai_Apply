import { API_URL } from '../config/api';

export type PlanCode = 'starter' | 'pro';

export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
}

const handleError = async (response: Response): Promise<never> => {
  const details = await response.text().catch(() => '');
  const message = details || `Erreur API (${response.status})`;
  throw new Error(message);
};

export const createCheckoutSession = async (plan: PlanCode): Promise<CheckoutSessionResponse> => {
  const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    return handleError(response);
  }

  const data = (await response.json()) as CheckoutSessionResponse;

  if (!data.url) {
    throw new Error("Réponse Stripe invalide : l'URL de paiement est manquante.");
  }

  return data;
};

export const getCustomerPortalUrl = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/billing/customer-portal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return handleError(response);
  }

  const data = (await response.json()) as { url?: string };

  if (!data.url) {
    throw new Error("Réponse Stripe invalide : portail client manquant.");
  }

  return data.url;
};
