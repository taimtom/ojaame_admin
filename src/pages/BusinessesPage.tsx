import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import {
  SIGNUP_METHODS,
  signupMethodLabel,
  type SignupMethod,
} from '../lib/signupMethod';

type Row = {
  id: number;
  company_name: string;
  owner_email: string | null;
  store_count: number;
  staff_count: number;
  seat_count: number;
  product_count: number;
  expense_count: number;
  revenue_30d: number;
  subscription_status: string | null;
  signup_method: string;
  created_at: string | null;
};

export function BusinessesPage() {
  const [q, setQ] = useState('');
  const [signupFilter, setSignupFilter] = useState<'' | SignupMethod>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<Row[]>('/api/admin/businesses', {
          params: {
            search: q || undefined,
            signup_method: signupFilter || undefined,
            page: 1,
            page_size: 50,
          },
        });
        if (!cancelled) setRows(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, signupFilter]);

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
        <select
          value={signupFilter}
          onChange={(e) => setSignupFilter(e.target.value as '' | SignupMethod)}
          aria-label="Filter by signup method"
        >
          <option value="">All signup methods</option>
          {SIGNUP_METHODS.map((m) => (
            <option key={m} value={m}>
              {signupMethodLabel(m)}
            </option>
          ))}
        </select>
        <Link to="/businesses/new" className="btn primary">
          Create business
        </Link>
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
                <th>Products</th>
                <th>Expenses</th>
                <th>Rev 30d</th>
                <th>Subscription</th>
                <th>Signup</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.company_name}</td>
                  <td>{r.owner_email}</td>
                  <td>{r.store_count}</td>
                  <td>{r.product_count}</td>
                  <td>{r.expense_count}</td>
                  <td>{r.revenue_30d.toFixed(2)}</td>
                  <td>{r.subscription_status ?? '—'}</td>
                  <td>{signupMethodLabel(r.signup_method)}</td>
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
