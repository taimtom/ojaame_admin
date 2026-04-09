import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';

type Comment = {
  id: number;
  author_type: string;
  body: string;
  internal: boolean;
  created_at: string | null;
};

type Ticket = {
  id: number;
  company_id: number;
  company_name: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  assignee_admin_id: number | null;
  comments: Comment[];
};

export function TicketDetailPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const [t, setT] = useState<Ticket | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [comment, setComment] = useState('');
  const [internal, setInternal] = useState(false);

  const canEdit = admin && admin.role !== 'billing_readonly';

  async function load() {
    if (!id) return;
    const { data } = await api.get<Ticket>(`/api/admin/tickets/${id}`);
    setT(data);
    setStatus(data.status);
    setPriority(data.priority);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function savePatch() {
    if (!id) return;
    await api.patch(`/api/admin/tickets/${id}`, { status, priority });
    await load();
  }

  async function sendComment(e: FormEvent) {
    e.preventDefault();
    if (!id || !comment.trim()) return;
    await api.post(`/api/admin/tickets/${id}/comments`, { body: comment, internal });
    setComment('');
    await load();
  }

  if (!t) return <p>Loading…</p>;

  return (
    <div>
      <h1>Ticket #{t.id}</h1>
      <p className="muted">
        {t.company_name} (company #{t.company_id})
      </p>
      <h2>{t.subject}</h2>
      <p>{t.body}</p>

      {canEdit && (
        <div className="card">
          <div className="row">
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
                <option value="waiting_on_customer">waiting_on_customer</option>
              </select>
            </label>
            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="urgent">urgent</option>
              </select>
            </label>
            <button type="button" className="btn primary" onClick={() => savePatch()}>
              Save
            </button>
          </div>
        </div>
      )}

      <h3>Thread</h3>
      <ul className="thread">
        {t.comments.map((c) => (
          <li key={c.id} className={c.internal ? 'internal' : ''}>
            <div className="meta">
              {c.author_type} · {c.created_at}
              {c.internal && <span className="badge">internal</span>}
            </div>
            <div>{c.body}</div>
          </li>
        ))}
      </ul>

      {canEdit && (
        <form className="card" onSubmit={sendComment}>
          <label>
            Comment
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
            />{' '}
            Internal note
          </label>
          <button type="submit" className="btn primary">
            Add comment
          </button>
        </form>
      )}
    </div>
  );
}
