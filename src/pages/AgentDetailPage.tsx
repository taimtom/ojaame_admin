import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';

type BizRow = {
  id: number;
  company_name: string;
  completed_signup: boolean;
  is_active: boolean;
  subscription_status: string | null;
  joined: string | null;
};

type CommissionRow = {
  id: number;
  commission_type: string;
  amount: number;
  month_number: number | null;
  status: string;
  company_id: number | null;
  date: string;
};

type Totals = {
  total_earned: number;
  ledger_balance: number;
  total_paid_out: number;
  balance: number;
};

type AgentDetail = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  agent_code: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string | null;
  businesses: BizRow[];
  totals: Totals;
  recent_commissions: CommissionRow[];
};

function formatNaira(v: number) {
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { admin } = useAdminAuth();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingStatus, setTogglingStatus] = useState(false);

  const loadAgent = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AgentDetail>(`/api/admin/agents/${id}`);
      setAgent(data);
    } catch {
      setError('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAgent(); }, [id]);

  const toggleActive = async () => {
    if (!agent) return;
    setTogglingStatus(true);
    try {
      await api.patch(`/api/admin/agents/${id}/status`, null, {
        params: { is_active: !agent.is_active },
      });
      setAgent((a) => a ? { ...a, is_active: !a.is_active } : a);
    } catch {
      setError('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!agent) return null;

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <div>
      <p>
        <Link to="/agents">← Back to Agents</Link>
      </p>

      <h1>
        {agent.first_name} {agent.last_name}
      </h1>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value">{formatNaira(agent.totals.total_earned)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value">{formatNaira(agent.totals.total_paid_out)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ledger (pending unlock)</div>
          <div className="stat-value">{formatNaira(agent.totals.ledger_balance ?? 0)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Balance</div>
          <div className="stat-value">{formatNaira(agent.totals.balance)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Businesses</div>
          <div className="stat-value">{agent.businesses.length}</div>
        </div>
      </div>

      <table className="data-table" style={{ marginBottom: 16, width: 'auto' }}>
        <tbody>
          <tr><td><b>Email</b></td><td>{agent.email}</td></tr>
          <tr><td><b>Phone</b></td><td>{agent.phone || '—'}</td></tr>
          <tr><td><b>Agent Code</b></td><td><code>{agent.agent_code}</code></td></tr>
          <tr><td><b>Verified</b></td><td>{agent.is_verified ? 'Yes' : 'No'}</td></tr>
          <tr>
            <td><b>Status</b></td>
            <td>
              <span style={{ color: agent.is_active ? 'green' : 'gray', marginRight: 8 }}>
                {agent.is_active ? 'Active' : 'Inactive'}
              </span>
              {isSuperAdmin && (
                <button onClick={toggleActive} disabled={togglingStatus}>
                  {agent.is_active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </td>
          </tr>
          <tr><td><b>Joined</b></td><td>{agent.created_at ? new Date(agent.created_at).toLocaleDateString() : '—'}</td></tr>
        </tbody>
      </table>

      <h2>Referred Businesses</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Setup Complete</th>
            <th>Active</th>
            <th>Subscription</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {agent.businesses.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center' }}>No businesses yet</td></tr>
          ) : (
            agent.businesses.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link to={`/businesses/${b.id}`}>{b.company_name}</Link>
                </td>
                <td style={{ color: b.completed_signup ? 'green' : 'gray' }}>
                  {b.completed_signup ? 'Yes' : 'No'}
                </td>
                <td style={{ color: b.is_active ? 'green' : '#f57c00' }}>
                  {b.is_active ? 'Active' : 'Inactive'}
                </td>
                <td>{b.subscription_status || '—'}</td>
                <td>{b.joined ? new Date(b.joined).toLocaleDateString() : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <h2>Recent Commissions</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Amount</th>
            <th>Month #</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {agent.recent_commissions.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center' }}>No commissions yet</td></tr>
          ) : (
            agent.recent_commissions.map((c) => (
              <tr key={c.id}>
                <td>{c.commission_type === 'signup_bonus' ? 'Signup Bonus' : 'Monthly Token'}</td>
                <td>{formatNaira(c.amount)}</td>
                <td>{c.month_number ?? '—'}</td>
                <td style={{ color: (() => {
                  const s = c.status;
                  if (s === 'available' || s === 'credited') return 'green';
                  if (s === 'paid_out') return '#666';
                  return '#f57c00';
                })() }}>
                  {c.status}
                </td>
                <td>{new Date(c.date).toLocaleDateString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
