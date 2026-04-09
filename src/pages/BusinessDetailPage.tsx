import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

type Detail = {
  company: Record<string, unknown>;
  owner: Record<string, unknown> | null;
  stores: { id: number; name: string; revenue_30d: number; staff_count: number; seat_count: number }[];
  subscription: Record<string, unknown> | null;
  revenue_30d: number;
  transaction_count_30d: number;
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
  const [tab, setTab] = useState<'overview' | 'stores' | 'activity' | 'subscription' | 'invoices'>(
    'overview'
  );
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [sub, setSub] = useState<SubExtra | null>(null);
  const [invoices, setInvoices] = useState<InvRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data } = await api.get<Detail>(`/api/admin/businesses/${id}`);
      if (!cancelled) setDetail(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

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

  if (!detail) return <p>Loading…</p>;

  return (
    <div>
      <h1>{String(detail.company.companyName ?? '')}</h1>
      <div className="tabs">
        {(['overview', 'stores', 'activity', 'subscription', 'invoices'] as const).map((t) => (
          <button
            key={t}
            type="button"
            className={tab === t ? 'tab active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {msg && <p className="success">{msg}</p>}
      {err && <p className="error">{err}</p>}

      {tab === 'overview' && (
        <div className="card">
          <pre className="json-pre">{JSON.stringify(detail.company, null, 2)}</pre>
          <p>
            <strong>Owner:</strong> {detail.owner ? String(detail.owner.email) : '—'}
          </p>
          <p>
            Revenue 30d: {detail.revenue_30d.toFixed(2)} · Transactions: {detail.transaction_count_30d}
          </p>
          <button type="button" className="btn primary" onClick={resetPassword}>
            Reset owner password
          </button>
        </div>
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
