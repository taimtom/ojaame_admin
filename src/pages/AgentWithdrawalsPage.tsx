import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type WithdrawalRow = {
  id: number;
  agent_id: number;
  agent_name: string | null;
  agent_email: string | null;
  amount: number;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  admin_note: string | null;
  created_at: string;
  processed_at: string | null;
};

const STATUS_OPTIONS = ['pending', 'processing', 'completed', 'failed'];

function formatNaira(v: number) {
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function AgentWithdrawalsPage() {
  const [data, setData] = useState<{ total: number; items: WithdrawalRow[] }>({
    total: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<number, string>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get('/api/admin/agents/withdrawals/pending', {
        params: { page, page_size: 30, status: statusFilter || undefined },
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, statusFilter]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    setUpdating(id);
    try {
      await api.patch(`/api/admin/agents/withdrawals/${id}`, {
        status: newStatus,
        admin_note: noteInputs[id] || undefined,
      });
      fetchData();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <h1>Agent Withdrawals</h1>

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">Pending &amp; Processing</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <p style={{ color: 'gray' }}>{data.total} withdrawal(s)</p>
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Amount</th>
                <th>Bank</th>
                <th>Account</th>
                <th>Status</th>
                <th>Note</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center' }}>
                    No withdrawals
                  </td>
                </tr>
              ) : (
                data.items.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <div>{w.agent_name}</div>
                      <small style={{ color: 'gray' }}>{w.agent_email}</small>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatNaira(w.amount)}</td>
                    <td>{w.bank_name || '—'}</td>
                    <td>
                      <div>{w.account_number}</div>
                      <small>{w.account_name}</small>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            w.status === 'completed'
                              ? 'green'
                              : w.status === 'failed'
                              ? 'red'
                              : w.status === 'processing'
                              ? '#1976d2'
                              : '#f57c00',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td>{w.admin_note || '—'}</td>
                    <td>{new Date(w.created_at).toLocaleDateString()}</td>
                    <td>
                      {w.status !== 'completed' && w.status !== 'failed' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input
                            type="text"
                            placeholder="Note (optional)"
                            value={noteInputs[w.id] || ''}
                            onChange={(e) =>
                              setNoteInputs((p) => ({ ...p, [w.id]: e.target.value }))
                            }
                            style={{ width: 160, padding: '2px 6px', fontSize: 12 }}
                          />
                          <div style={{ display: 'flex', gap: 4 }}>
                            {w.status === 'pending' && (
                              <button
                                disabled={updating === w.id}
                                onClick={() => handleStatusChange(w.id, 'processing')}
                                style={{ fontSize: 11, padding: '2px 8px' }}
                              >
                                Mark Processing
                              </button>
                            )}
                            <button
                              disabled={updating === w.id}
                              onClick={() => handleStatusChange(w.id, 'completed')}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                background: '#2e7d32',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Paid
                            </button>
                            <button
                              disabled={updating === w.id}
                              onClick={() => handleStatusChange(w.id, 'failed')}
                              style={{
                                fontSize: 11,
                                padding: '2px 8px',
                                background: '#c62828',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                              }}
                            >
                              Fail
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={data.items.length < 30}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
