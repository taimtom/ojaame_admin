export const SIGNUP_METHODS = ['default', 'admin_onboard', 'demo_business', 'field_sales'] as const;
export type SignupMethod = (typeof SIGNUP_METHODS)[number];

export const SIGNUP_METHOD_LABELS: Record<SignupMethod, string> = {
  default: 'Self signup',
  admin_onboard: 'Admin onboard',
  demo_business: 'Demo business',
  field_sales: 'Field sales',
};

export function signupMethodLabel(method: string | null | undefined): string {
  if (method && method in SIGNUP_METHOD_LABELS) {
    return SIGNUP_METHOD_LABELS[method as SignupMethod];
  }
  return method ?? '—';
}
