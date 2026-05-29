import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import type { ProspectListItem } from '../lib/salesPlaybook';
import { PlaybookProgressRing } from '../components/PlaybookProgressRing';
import { MobilePageHeader } from '../components/MobilePageHeader';

export function ProspectsPage() {
  const { admin } = useAdminAuth();
  const [rows, setRows] = useState<ProspectListItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const readOnly = admin?.role === 'billing_readonly';

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<ProspectListItem[]>('/api/admin/prospects', {
        params: {
          page_size: 100,
          search: search.trim() || undefined,
          status: status || undefined,
        },
      });
      setRows(data);
    } catch {
      setErr('Failed to load prospects.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <MobilePageHeader
        title="Prospects"
        actions={
          !readOnly ? (
            <>
              <Link to="/sales-guide" className="btn ghost btn-sm">
                Guide
              </Link>
              <Link to="/prospects/new" className="btn primary btn-sm">
                + New
              </Link>
            </>
          ) : (
            <Link to="/sales-guide" className="btn ghost btn-sm">
              Guide
            </Link>
          )
        }
      />

      <div className="toolbar">
        <input
          className="search"
          placeholder="Search shop, contact, area…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, background: '#0f172a', color: 'inherit' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <button type="button" className="btn ghost" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {err && <p className="error">{err}</p>}
      {loading && <p className="muted">Loading…</p>}

      <div className="prospect-cards hide-desktop">
        {!loading &&
          rows.map((r) => (
            <Link key={r.id} to={`/prospects/${r.id}`} className="prospect-card card">
              <div className="prospect-card-top">
                <PlaybookProgressRing percent={r.percent} size={52} />
                <div>
                  <strong>{r.shop_name}</strong>
                  {r.contact_name && <p className="muted">{r.contact_name}</p>}
                  <span className={`status-pill status-${r.status}`}>{r.status}</span>
                </div>
              </div>
              {r.next_step_label && (
                <p className="muted">Next: {r.next_step_label}</p>
              )}
              {r.phone && (
                <a href={`tel:${r.phone}`} className="prospect-phone" onClick={(e) => e.stopPropagation()}>
                  {r.phone}
                </a>
              )}
            </Link>
          ))}
        {!loading && rows.length === 0 && <p className="muted">No prospects yet.</p>}
      </div>

      <div className="table-wrap hide-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>Progress</th>
              <th>Shop</th>
              <th>Contact</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Next step</th>
              <th>Area</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <PlaybookProgressRing percent={r.percent} size={44} />
                </td>
                <td>
                  <Link to={`/prospects/${r.id}`}>{r.shop_name}</Link>
                </td>
                <td>{r.contact_name ?? '—'}</td>
                <td>{r.phone ?? '—'}</td>
                <td>{r.status}</td>
                <td>{r.next_step_label ?? '—'}</td>
                <td>{r.area ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="muted" style={{ padding: 16 }}>No prospects.</p>}
      </div>
    </div>
  );
}
