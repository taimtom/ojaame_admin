import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type Row = {
  id: number;
  admin_id: number;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata_json: Record<string, unknown> | null;
  ip: string | null;
  created_at: string | null;
};

export function AuditLogPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await api.get<Row[]>('/api/admin/audit-logs');
      setRows(data);
    })();
  }, []);

  return (
    <div>
      <h1>Audit log</h1>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>When</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.created_at}</td>
                <td>{r.admin_id}</td>
                <td>{r.action}</td>
                <td>
                  {r.resource_type} {r.resource_id}
                  {r.metadata_json && (
                    <pre className="small-pre">{JSON.stringify(r.metadata_json)}</pre>
                  )}
                </td>
                <td>{r.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
