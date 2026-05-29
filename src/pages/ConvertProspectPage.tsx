import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { ProspectDetail } from '../lib/salesPlaybook';
import { MobilePageHeader } from '../components/MobilePageHeader';

type AgentRow = {
  id: number;
  first_name: string;
  last_name: string;
  agent_code: string;
  is_active: boolean;
};

type ConvertResult = {
  prospect_id: number;
  company_id: number;
  store_id: number;
  invitation_link: string;
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

export function ConvertProspectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { admin } = useAdminAuth();
  const [prospect, setProspect] = useState<ProspectDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [agentOptions, setAgentOptions] = useState<AgentRow[]>([]);

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [primaryIndustry, setPrimaryIndustry] = useState('retail');
  const [subIndustry, setSubIndustry] = useState('');
  const [exactBusiness, setExactBusiness] = useState('Retail store');
  const [storeName, setStoreName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [trialDays, setTrialDays] = useState(14);
  const [referringAgentId, setReferringAgentId] = useState('');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);

  const readOnly = admin?.role === 'billing_readonly';

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get<ProspectDetail>(`/api/admin/prospects/${id}`);
        if (data.converted_company_id) {
          navigate(`/businesses/${data.converted_company_id}`, { replace: true });
          return;
        }
        setProspect(data);
        const d = data.provision_defaults;
        setCompanyName(String(d.company_name ?? data.shop_name ?? ''));
        setCompanyLocation(String(d.company_location ?? ''));
        setPrimaryIndustry(String(d.primary_industry ?? 'retail'));
        setSubIndustry(String(d.sub_industry ?? ''));
        setExactBusiness(String(d.exact_business ?? 'Retail store'));
        setStoreName(String(d.store_name ?? data.shop_name ?? ''));
        setOwnerEmail(String(d.owner_email ?? data.email ?? ''));
        setOwnerFirstName(String(d.owner_first_name ?? ''));
        setOwnerLastName(String(d.owner_last_name ?? ''));
        setOwnerPhone(String(d.owner_phone ?? data.phone ?? ''));
        setTrialDays(Number(d.trial_days ?? 14));
        setSendInviteEmail(Boolean(d.send_invite_email ?? true));
      } catch {
        setErr('Failed to load prospect.');
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ items: AgentRow[] }>('/api/admin/agents', {
          params: { page_size: 200 },
        });
        setAgentOptions(data.items.filter((a) => a.is_active));
      } catch {
        setAgentOptions([]);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (!ownerEmail.trim()) {
      setErr('Owner email is required.');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const { data } = await api.post<ConvertResult>(`/api/admin/prospects/${id}/convert`, {
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
      navigate(`/businesses/${data.company_id}`, {
        state: { playbookJustCompleted: false, fromProspect: data.prospect_id },
      });
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      const d = ax.response?.data?.detail;
      setErr(typeof d === 'string' ? d : 'Conversion failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (readOnly) {
    return (
      <div>
        <p className="error">Your role cannot convert prospects.</p>
        <Link to={`/prospects/${id}`}>Back</Link>
      </div>
    );
  }

  if (!prospect) {
    return <p className="muted">{err ?? 'Loading…'}</p>;
  }

  return (
    <div>
      <MobilePageHeader title="Convert to business" backTo={`/prospects/${id}`} />
      <p className="muted">
        Creating account for <strong>{prospect.shop_name}</strong>. Fields prefilled from prospect.
      </p>

      <form className="card form-card" onSubmit={(e) => void submit(e)}>
        <label>
          Company name *
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </label>
        <label>
          Location
          <input value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} />
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
        <label>
          Store name *
          <input value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
        </label>
        <label>
          Owner email *
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
          />
        </label>
        <label>
          First name *
          <input value={ownerFirstName} onChange={(e) => setOwnerFirstName(e.target.value)} required />
        </label>
        <label>
          Last name *
          <input value={ownerLastName} onChange={(e) => setOwnerLastName(e.target.value)} required />
        </label>
        <label>
          Phone
          <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} />
        </label>
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
        <label>
          Referral agent
          <select value={referringAgentId} onChange={(e) => setReferringAgentId(e.target.value)}>
            <option value="">None</option>
            {agentOptions.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.first_name} {a.last_name} — {a.agent_code}
              </option>
            ))}
          </select>
        </label>
        <label className="inline">
          <input
            type="checkbox"
            checked={sendInviteEmail}
            onChange={(e) => setSendInviteEmail(e.target.checked)}
          />
          Send invitation email
        </label>
        {err && <p className="error">{err}</p>}
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create business'}
        </button>
      </form>
    </div>
  );
}
