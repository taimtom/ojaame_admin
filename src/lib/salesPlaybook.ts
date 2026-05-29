export type PlaybookPhase = 'prospect' | 'conversion' | 'adoption';

export type StepGuide = {
  summary?: string;
  goal?: string;
  success?: string[];
  how_to?: string[];
  questions?: string[];
  script?: string;
  script_filled?: string;
  template_id?: string;
  pitch_by_pain?: Record<string, string>;
};

export type PlaybookStepItem = {
  key: string;
  label: string;
  phase: PlaybookPhase;
  weight: number;
  completion_type: 'manual' | 'auto';
  done: boolean;
  auto: boolean;
  done_at: string | null;
  note: string | null;
  admin_id: number | null;
  guide?: StepGuide | null;
};

export type SalesGuideData = {
  steps: Record<string, StepGuide>;
  message_templates: Record<string, { title: string; body: string }>;
  objection_handlers: { objection: string; response: string }[];
  sections: { id: string; title: string; content: string[] }[];
  deal_card_fields: { field: string; example: string }[];
  vertical_by_day: { day: string; target: string; pain: string }[];
};

export type PlaybookProgress = {
  percent: number;
  steps: PlaybookStepItem[];
  completed_at: string | null;
  just_completed: boolean;
  next_step: PlaybookStepItem | null;
  prospect_id?: number;
  company_id?: number | null;
  shop_name?: string;
};

export type ProspectListItem = {
  id: number;
  shop_name: string;
  contact_name: string | null;
  phone: string | null;
  status: string;
  source: string;
  percent: number;
  next_step_label: string | null;
  converted_company_id: number | null;
  area: string | null;
  updated_at: string | null;
};

export type ProspectDetail = {
  id: number;
  shop_name: string;
  contact_name: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  location: string | null;
  area: string | null;
  source: string;
  pain_notes: string | null;
  jiji_listing_url: string | null;
  outreach_message: string | null;
  status: string;
  lost_reason: string | null;
  converted_company_id: number | null;
  assigned_admin_id: number | null;
  created_by_admin_id: number | null;
  created_at: string | null;
  updated_at: string | null;
  whatsapp_url: string | null;
  provision_defaults: Record<string, unknown>;
  playbook: PlaybookProgress;
};

export const PROSPECT_SOURCES = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'jiji', label: 'Jiji' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
] as const;

export const PHASE_LABELS: Record<PlaybookPhase, string> = {
  prospect: 'Prospect',
  conversion: 'Conversion',
  adoption: 'Adoption',
};

export function buildWaMeUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  let normalized = digits;
  if (digits.length === 11 && digits.startsWith('0')) {
    normalized = `234${digits.slice(1)}`;
  } else if (digits.length === 10) {
    normalized = `234${digits}`;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function celebrationStorageKey(kind: 'prospect' | 'company', id: number): string {
  return `playbook_celebrated_${kind}_${id}`;
}

export function shouldShowCelebration(
  kind: 'prospect' | 'company',
  id: number,
  justCompleted: boolean
): boolean {
  if (!justCompleted) return false;
  return localStorage.getItem(celebrationStorageKey(kind, id)) !== '1';
}

export function markCelebrationShown(kind: 'prospect' | 'company', id: number): void {
  localStorage.setItem(celebrationStorageKey(kind, id), '1');
}
