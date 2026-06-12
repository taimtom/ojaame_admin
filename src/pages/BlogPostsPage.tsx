import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';
import { MobilePageHeader } from '../components/MobilePageHeader';

export type BlogPostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  status: string;
  published_at: string | null;
  updated_at: string;
};

export function BlogPostsPage() {
  const { admin } = useAdminAuth();
  const [rows, setRows] = useState<BlogPostRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const readOnly = admin?.role === 'billing_readonly';

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await api.get<BlogPostRow[]>('/api/admin/blog/posts', {
        params: {
          q: search.trim() || undefined,
          status: status || undefined,
        },
      });
      setRows(data);
    } catch {
      setErr('Failed to load blog posts.');
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
        title="Blog"
        actions={
          !readOnly ? (
            <Link to="/blog/new" className="btn primary btn-sm">
              + New post
            </Link>
          ) : undefined
        }
      />

      <div className="card filters-row">
        <input
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
        <button type="button" className="btn ghost" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {err && <p className="error">{err}</p>}
      {loading ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No posts found.</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.title}</strong>
                    <div className="muted small">/{row.slug}</div>
                  </td>
                  <td>
                    <span className={`badge ${row.status}`}>{row.status}</span>
                  </td>
                  <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/blog/${row.id}/edit`} className="btn ghost btn-sm">
                      Edit
                    </Link>
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
