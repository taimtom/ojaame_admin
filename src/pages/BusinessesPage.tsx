import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Row = {
  id: number;
  company_name: string;
  owner_email: string | null;
  store_count: number;
  staff_count: number;
  seat_count: number;
  revenue_30d: number;
  subscription_status: string | null;
  created_at: string | null;
};

export function BusinessesPage() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Row[]>('/api/admin/businesses', {
          params: { search: q || undefined, page: 1, page_size: 50 },
        });
        if (!cancelled) setRows(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  return (
    <div>
      <h1>Businesses</h1>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name or owner email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search"
        />
      </div>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Stores</th>
                <th>Rev 30d</th>
                <th>Subscription</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.company_name}</td>
                  <td>{r.owner_email}</td>
                  <td>{r.store_count}</td>
                  <td>{r.revenue_30d.toFixed(2)}</td>
                  <td>{r.subscription_status ?? '—'}</td>
                  <td>
                    <Link to={`/businesses/${r.id}`}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
