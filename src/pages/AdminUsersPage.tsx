import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';

type Row = { id: number; email: string; role: string; name: string | null; is_active: boolean };

export function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('support');
  const [name, setName] = useState('');

  async function load() {
    const { data } = await api.get<Row[]>('/api/admin/users');
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/admin/users', { email, password, role, name: name || null });
    setPassword('');
    await load();
  }

  async function toggle(row: Row) {
    await api.patch(`/api/admin/users/${row.id}`, { is_active: !row.is_active });
    await load();
  }

  return (
    <div>
      <h1>Admin users</h1>
      <form className="card" onSubmit={create}>
        <h2>Create admin</h2>
        <div className="row">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="super_admin">super_admin</option>
            <option value="support">support</option>
            <option value="billing_readonly">billing_readonly</option>
          </select>
          <input type="text" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" className="btn primary">
            Create
          </button>
        </div>
      </form>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.email}</td>
                <td>{r.role}</td>
                <td>{r.is_active ? 'yes' : 'no'}</td>
                <td>
                  <button type="button" className="btn ghost" onClick={() => toggle(r)}>
                    Toggle active
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
