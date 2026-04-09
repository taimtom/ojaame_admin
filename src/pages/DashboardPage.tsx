import { useEffect, useState } from 'react';
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';

type Stats = {
  total_businesses: number;
  total_stores: number;
  total_staff: number;
  total_seats: number;
  total_revenue_period: number;
  total_transactions_period: number;
  total_revenue_prior_period: number;
  total_transactions_prior_period: number;
  period: string;
  note: string | null;
};

type TsPoint = { bucket: string; revenue: number; transactions: number };

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [ts, setTs] = useState<TsPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, t] = await Promise.all([
          api.get<Stats>('/api/admin/stats', { params: { period: '30d' } }),
          api.get<TsPoint[]>('/api/admin/stats/timeseries', { params: { period: '30d' } }),
        ]);
        if (!cancelled) {
          setStats(s.data);
          setTs(t.data);
        }
      } catch (e: unknown) {
        if (!cancelled) setError('Could not load dashboard.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!stats) return <p>Loading…</p>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted">{stats.note}</p>
      <div className="grid cards">
        <div className="card stat">
          <div className="label">Businesses</div>
          <div className="value">{stats.total_businesses}</div>
        </div>
        <div className="card stat">
          <div className="label">Stores</div>
          <div className="value">{stats.total_stores}</div>
        </div>
        <div className="card stat">
          <div className="label">Staff</div>
          <div className="value">{stats.total_staff}</div>
        </div>
        <div className="card stat">
          <div className="label">Seats (sub)</div>
          <div className="value">{stats.total_seats}</div>
        </div>
        <div className="card stat">
          <div className="label">Revenue ({stats.period})</div>
          <div className="value">{stats.total_revenue_period.toFixed(2)}</div>
        </div>
        <div className="card stat">
          <div className="label">Transactions ({stats.period})</div>
          <div className="value">{stats.total_transactions_period}</div>
        </div>
      </div>
      <div className="card chart-card">
        <h2>Revenue by day ({stats.period})</h2>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={ts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="bucket" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
              <Line type="monotone" dataKey="revenue" stroke="#38bdf8" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
