import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BusinessBulkProductsPanel } from '../components/BusinessBulkProductsPanel';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';

type AgentRow = {
  id: number;
  first_name: string;
  last_name: string;
  agent_code: string;
  is_active: boolean;
};

type ProvisionResult = {
  company_id: number;
  store_id: number;
  owner_user_id: number;
  invitation_link: string;
  next_billing_date: string;
  invite_email_sent: boolean;
};

const EXACT_BUSINESS_OPTIONS = [
  'Retail store',
  'Supermarket',
  'Fast food',
  'Restaurant',
  'Cafe',
  'Pharmacy',
];

type Step = 'business' | 'owner' | 'store' | 'trial' | 'products' | 'done';

export function CreateBusinessPage() {
  const { admin } = useAdminAuth();
  const [step, setStep] = useState<Step>('business');
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [agentOptions, setAgentOptions] = useState<AgentRow[]>([]);
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [primaryIndustry, setPrimaryIndustry] = useState('retail');
  const [subIndustry, setSubIndustry] = useState('');
  const [exactBusiness, setExactBusiness] = useState('Retail store');

  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [referringAgentId, setReferringAgentId] = useState('');

  const [storeName, setStoreName] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ items: AgentRow[] }>('/api/admin/agents', {
          params: { page_size: 200 },
        });
        if (!cancelled) setAgentOptions(data.items.filter((a) => a.is_active));
      } catch {
        if (!cancelled) setAgentOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const readOnly = admin?.role === 'billing_readonly';

  function nextStep() {
    setErr(null);
    if (step === 'business') {
      if (!companyName.trim()) {
        setErr('Company name is required.');
        return;
      }
      setStep('owner');
      return;
    }
    if (step === 'owner') {
      if (!ownerEmail.trim() || !ownerFirstName.trim() || !ownerLastName.trim()) {
        setErr('Owner email, first name, and last name are required.');
        return;
      }
      setStep('store');
      return;
    }
    if (step === 'store') {
      if (!storeName.trim()) {
        setErr('Store name is required.');
        return;
      }
      setStep('trial');
      return;
    }
    if (step === 'trial') {
      void runProvision();
    }
  }

  function prevStep() {
    setErr(null);
    if (step === 'owner') setStep('business');
    else if (step === 'store') setStep('owner');
    else if (step === 'trial') setStep('store');
  }

  async function runProvision() {
    setErr(null);
    setSubmitting(true);
    try {
      const { data } = await api.post<ProvisionResult>('/api/admin/businesses/provision', {
        company_name: companyName.trim(),
        company_location: companyLocation.trim() || null,
        primary_industry: primaryIndustry.trim() || null,
        sub_industry: subIndustry.trim() || null,
        exact_business: exactBusiness,
        store_name: storeName.trim(),
        owner_email: ownerEmail.trim(),
        owner_first_name: ownerFirstName.trim(),
        owner_last_name: ownerLastName.trim(),
        owner_phone: ownerPhone.trim() || null,
        trial_days: trialDays,
        referring_agent_id: referringAgentId ? Number(referringAgentId) : null,
        send_invite_email: sendInviteEmail,
      });
      setResult(data);
      setStep('products');
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      const d = ax.response?.data?.detail;
      setErr(typeof d === 'string' ? d : 'Failed to create business.');
    } finally {
      setSubmitting(false);
    }
  }

  async function copyInviteLink() {
    if (!result?.invitation_link) return;
    try {
      await navigator.clipboard.writeText(result.invitation_link);
    } catch {
      setErr('Could not copy link.');
    }
  }

  if (readOnly) {
    return (
      <div>
        <p className="error">Your role cannot create businesses.</p>
        <Link to="/businesses">Back to businesses</Link>
      </div>
    );
  }

  return (
    <div>
      <p>
        <Link to="/businesses">← Businesses</Link>
      </p>
      <h1>Create business</h1>
      <p className="muted">Set up a new shop for a seller who said yes on Jiji or WhatsApp.</p>

      <div className="tabs" style={{ marginBottom: 16 }}>
        {(['business', 'owner', 'store', 'trial', 'products', 'done'] as Step[]).map((s) => (
          <span
            key={s}
            className={step === s ? 'tab active' : 'tab'}
            style={{ cursor: 'default', opacity: step === s ? 1 : 0.5 }}
          >
            {s}
          </span>
        ))}
      </div>

      {err && <p className="error">{err}</p>}

      {step === 'business' && (
        <div className="card form-card">
          <label>
            Company name *
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label>
            Location
            <input
              value={companyLocation}
              onChange={(e) => setCompanyLocation(e.target.value)}
              placeholder="Lagos, Ikeja"
            />
          </label>
          <label>
            Primary industry
            <input value={primaryIndustry} onChange={(e) => setPrimaryIndustry(e.target.value)} />
          </label>
          <label>
            Sub-industry
            <input value={subIndustry} onChange={(e) => setSubIndustry(e.target.value)} />
          </label>
          <label>
            Business type
            <select value={exactBusiness} onChange={(e) => setExactBusiness(e.target.value)}>
              {EXACT_BUSINESS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 'owner' && (
        <div className="card form-card">
          <label>
            Owner email *
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </label>
          <label>
            First name *
            <input value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} />
          </label>
          <label>
            Last name *
            <input value={ownerLastName} onChange={(e) => setOwnerLastName(e.target.value)} />
          </label>
          <label>
            Phone
            <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
          </label>
          <label>
            Referral agent (optional)
            <select value={referringAgentId} onChange={(e) => setReferringAgentId(e.target.value)}>
              <option value="">None</option>
              {agentOptions.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.first_name} {a.last_name} — {a.agent_code}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 'store' && (
        <div className="card form-card">
          <label>
            First store name *
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Main shop"
            />
          </label>
        </div>
      )}

      {step === 'trial' && (
        <div className="card form-card">
          <p>
            The owner gets <strong>{trialDays} days</strong> before the first subscription charge.
          </p>
          <label>
            Trial days
            <input
              type="number"
              min={1}
              max={365}
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value) || 14)}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={sendInviteEmail}
              onChange={(e) => setSendInviteEmail(e.target.checked)}
            />
            Send invitation email to owner
          </label>
        </div>
      )}

      {step === 'products' && result && (
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p className="success">Business created successfully.</p>
            <p>
              <strong>Trial / first billing:</strong>{' '}
              {new Date(result.next_billing_date).toLocaleString()}
            </p>
            <p>
              <strong>Invite link:</strong>{' '}
              <code style={{ wordBreak: 'break-all' }}>{result.invitation_link}</code>
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <button type="button" className="btn" onClick={() => void copyInviteLink()}>
                Copy invite link
              </button>
              <button type="button" className="btn primary" onClick={() => setStep('done')}>
                Skip products
              </button>
            </div>
            {result.invite_email_sent && (
              <p className="muted">Invitation email was sent to the owner.</p>
            )}
          </div>
          <BusinessBulkProductsPanel
            companyId={String(result.company_id)}
            stores={[{ id: result.store_id, name: storeName }]}
          />
          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn primary" onClick={() => setStep('done')}>
              Finish
            </button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>All set</h2>
          <p>Send the owner their invite link on WhatsApp if you have not already.</p>
          <p>
            <code style={{ wordBreak: 'break-all' }}>{result.invitation_link}</code>
          </p>
          <button type="button" className="btn" onClick={() => void copyInviteLink()}>
            Copy invite link
          </button>
          <p style={{ marginTop: 16 }}>
            <Link to={`/businesses/${result.company_id}`} className="btn primary">
              View business
            </Link>
          </p>
        </div>
      )}

      {step !== 'products' && step !== 'done' && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          {step !== 'business' && (
            <button type="button" className="btn" onClick={prevStep}>
              Back
            </button>
          )}
          <button
            type="button"
            className="btn primary"
            disabled={submitting}
            onClick={() => void nextStep()}
          >
            {step === 'trial' ? (submitting ? 'Creating…' : 'Create business') : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
