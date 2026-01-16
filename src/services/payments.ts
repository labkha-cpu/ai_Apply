// src/services/payments.ts
// -----------------------------------------------------------------------------
// Billing integration (STUB)
// -----------------------------------------------------------------------------
// The current dashboard paywall uses a simple localStorage toggle to validate UX.
// This file exists to keep the Pricing page compiling until Stripe is wired.
//
// Replace these stubs with real API calls when your billing backend exists.

export type PlanCode = "starter" | "pro";

export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
}

function notImplemented(): never {
  throw new Error(
    "Billing backend not implemented yet. Wire Stripe (create-checkout-session / customer-portal) then update src/services/payments.ts."
  );
}

export async function createCheckoutSession(_plan: PlanCode): Promise<CheckoutSessionResponse> {
  // If you want a quick dev shortcut, you can return a fake URL:
  // return { url: "#" };
  return notImplemented();
}

export async function getCustomerPortalUrl(): Promise<string> {
  return notImplemented();
}
