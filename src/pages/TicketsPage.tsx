import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Ticket = {
  id: number;
  company_id: number;
  company_name: string | null;
  subject: string;
  status: string;
  priority: string;
  assignee_admin_id: number | null;
  created_at: string | null;
};

export function TicketsPage() {
  const [status, setStatus] = useState<string>('');
  const [rows, setRows] = useState<Ticket[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Ticket[]>('/api/admin/tickets', {
        params: { status: status || undefined },
      });
      setRows(data);
    })();
  }, [status]);

  return (
    <div>
      <h1>Tickets</h1>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">open</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.company_name}</td>
                <td>{t.subject}</td>
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>
                  <Link to={`/tickets/${t.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
