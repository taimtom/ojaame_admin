import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type AgentRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  agent_code: string;
  is_active: boolean;
  businesses_count: number;
  total_earned: number;
  total_paid_out: number;
  balance: number;
  created_at: string | null;
};

function formatNaira(v: number) {
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
}

export function AgentsPage() {
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ total: number; items: AgentRow[] }>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get('/api/admin/agents', {
          params: { search: q || undefined, page, page_size: 20 },
        });
        if (!cancelled) setData(res);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [q, page]);

  return (
    <div>
      <h1>Referral Agents</h1>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, email or code"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          className="search"
        />
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Code</th>
                <th>Status</th>
                <th>Businesses</th>
                <th>Total Earned</th>
                <th>Paid Out</th>
                <th>Balance</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center' }}>
                    No agents found
                  </td>
                </tr>
              ) : (
                data.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/agents/${a.id}`}>
                        {a.first_name} {a.last_name}
                      </Link>
                    </td>
                    <td>{a.email}</td>
                    <td>
                      <code>{a.agent_code}</code>
                    </td>
                    <td>
                      <span
                        style={{
                          color: a.is_active ? 'green' : 'gray',
                          fontWeight: 600,
                        }}
                      >
                        {a.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{a.businesses_count}</td>
                    <td>{formatNaira(a.total_earned)}</td>
                    <td>{formatNaira(a.total_paid_out)}</td>
                    <td style={{ fontWeight: 600 }}>{formatNaira(a.balance)}</td>
                    <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="pagination" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={data.items.length < 20}
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
