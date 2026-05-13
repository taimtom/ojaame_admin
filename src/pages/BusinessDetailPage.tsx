import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BusinessBulkProductsPanel } from '../components/BusinessBulkProductsPanel';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';

type ReferringAgent = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
};

type Detail = {
  company: Record<string, unknown> & {
    referred_by_agent_id?: number | null;
    referring_agent?: ReferringAgent | null;
  };
  owner: {
    user_id: number;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    phoneNumber?: string | null;
  } | null;
  stores: { id: number; name: string; revenue_30d: number; staff_count: number; seat_count: number }[];
  subscription: Record<string, unknown> | null;
  revenue_30d: number;
  transaction_count_30d: number;
  product_count: number;
  expense_count: number;
};

type AgentRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
  is_active: boolean;
};

type Activity = { type: string; at: string; detail: Record<string, unknown> };

type SubExtra = {
  business: Record<string, unknown> | null;
  stores: Record<string, unknown>[];
};

type InvRow = {
  id: number;
  invoice_number: string;
  period_start: string | null;
  period_end: string | null;
  total: number;
  status: string;
};

export function BusinessDetailPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const [tab, setTab] = useState<
    'overview' | 'stores' | 'bulk_products' | 'activity' | 'subscription' | 'invoices'
  >('overview');
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [sub, setSub] = useState<SubExtra | null>(null);
  const [invoices, setInvoices] = useState<InvRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [agentOptions, setAgentOptions] = useState<AgentRow[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [attachLoading, setAttachLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get<Detail>(`/api/admin/businesses/${id}`);
    setDetail(data);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Detail>(`/api/admin/businesses/${id}`);
        if (!cancelled) setDetail(data);
      } catch {
        if (!cancelled) setDetail(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!detail || admin?.role !== 'super_admin') return;
    const rid = detail.company.referred_by_agent_id;
    if (rid != null && rid !== undefined) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ items: AgentRow[] }>('/api/admin/agents', {
          params: { page_size: 200 },
        });
        if (!cancelled) {
          setAgentOptions(data.items.filter((a) => a.is_active));
        }
      } catch {
        if (!cancelled) setAgentOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [detail, admin?.role]);

  useEffect(() => {
    if (!id || tab !== 'activity') return;
    (async () => {
      const { data } = await api.get<Activity[]>(`/api/admin/businesses/${id}/activity`);
      setActivity(data);
    })();
  }, [id, tab]);

  useEffect(() => {
    if (!id || tab !== 'subscription') return;
    (async () => {
      const { data } = await api.get<SubExtra>(`/api/admin/businesses/${id}/subscription`);
      setSub(data);
    })();
  }, [id, tab]);

  useEffect(() => {
    if (!id || tab !== 'invoices') return;
    (async () => {
      const { data } = await api.get<InvRow[]>(`/api/admin/businesses/${id}/invoices`);
      setInvoices(data);
    })();
  }, [id, tab]);

  async function resetPassword() {
    if (!id || !window.confirm('Send password reset email to the business owner?')) return;
    setErr(null);
    setMsg(null);
    try {
      const { data } = await api.post<{ message: string }>(`/api/admin/businesses/${id}/reset-password`);
      setMsg(data.message);
    } catch {
      setErr('Failed to trigger reset.');
    }
  }

  async function attachReferringAgent() {
    if (!id || !selectedAgentId) return;
    if (
      !window.confirm(
        'Attach this referral agent to this business? This can only be done once for each business.'
      )
    ) {
      return;
    }
    setErr(null);
    setMsg(null);
    setAttachLoading(true);
    try {
      await api.patch(`/api/admin/businesses/${id}/referring-agent`, {
        agent_id: Number(selectedAgentId),
      });
      setMsg('Referring agent attached.');
      setSelectedAgentId('');
      await loadDetail();
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { detail?: string } } };
      const d = ax.response?.data?.detail;
      setErr(typeof d === 'string' ? d : 'Failed to attach referring agent.');
    } finally {
      setAttachLoading(false);
    }
  }

  if (!detail) return <p>Loading…</p>;
  const ownerName = detail.owner
    ? [detail.owner.firstName, detail.owner.lastName].filter(Boolean).join(' ').trim()
    : '';
  const ownerEmail = detail.owner?.email ?? null;
  const ownerPhone = detail.owner?.phoneNumber ?? null;

  return (
    <div>
      <h1>{String(detail.company.companyName ?? '')}</h1>
      <div className="tabs">
        {(
          [
            'overview',
            'stores',
            'bulk_products',
            'activity',
            'subscription',
            'invoices',
          ] as const
        ).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'tab active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t === 'bulk_products' ? 'bulk products' : t}
          </button>
        ))}
      </div>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      {tab === 'overview' && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Referring agent</h2>
          {detail.company.referring_agent ? (
            <p>
              <strong>{detail.company.referring_agent.first_name}{' '}
              {detail.company.referring_agent.last_name}</strong>
              {' · '}
              <code>{detail.company.referring_agent.agent_code}</code>
              {' · '}
              {detail.company.referring_agent.email}
              {' · '}
              <small>id {detail.company.referring_agent.id}</small>
            </p>
          ) : (
            <p>None</p>
          )}
          {admin?.role === 'super_admin' && !detail.company.referred_by_agent_id && (
              <div style={{ marginTop: 12 }}>
                <label htmlFor="attach-agent" style={{ display: 'block', marginBottom: 8 }}>
                  Attach agent (super admin only)
                </label>
                <select
                  id="attach-agent"
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  style={{ minWidth: 280, marginRight: 8 }}
                >
                  <option value="">Select an agent…</option>
                  {agentOptions.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.first_name} {a.last_name} — {a.agent_code} (id {a.id})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn primary"
                  disabled={!selectedAgentId || attachLoading}
                  onClick={() => void attachReferringAgent()}
                >
                  {attachLoading ? 'Attaching…' : 'Attach'}
                </button>
              </div>
            )}
          <pre className="json-pre">{JSON.stringify(detail.company, null, 2)}</pre>
          <p>
            <strong>Owner:</strong> {ownerName || '—'}
          </p>
          <p>
            <strong>Owner email:</strong> {ownerEmail || '—'}
          </p>
          <p>
            <strong>Owner phone:</strong> {ownerPhone || '—'}
          </p>
          <p>
            Revenue 30d: {detail.revenue_30d.toFixed(2)} · Transactions: {detail.transaction_count_30d}
            {' · '}
            Products: {detail.product_count} · Expenses: {detail.expense_count}
          </p>
          <button type="button" className="btn primary" onClick={resetPassword}>
            Reset owner password
          </button>
        </div>
      )}

      {tab === 'bulk_products' && id && (
        <BusinessBulkProductsPanel companyId={id} stores={detail.stores} />
      )}

      {tab === 'stores' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Rev 30d</th>
                <th>Staff</th>
                <th>Seats</th>
              </tr>
            </thead>
            <tbody>
              {detail.stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.revenue_30d.toFixed(2)}</td>
                  <td>{s.staff_count}</td>
                  <td>{s.seat_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'activity' && (
        <ul className="list">
          {activity.map((a, i) => (
            <li key={i}>
              <code>{a.type}</code> @ {a.at} — {JSON.stringify(a.detail)}
            </li>
          ))}
        </ul>
      )}

      {tab === 'subscription' && sub && (
        <div className="card">
          <pre className="json-pre">{JSON.stringify(sub, null, 2)}</pre>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Period</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.invoice_number}</td>
                  <td>
                    {inv.period_start} → {inv.period_end}
                  </td>
                  <td>{inv.total.toFixed(2)}</td>
                  <td>{inv.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
