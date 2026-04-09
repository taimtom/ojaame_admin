import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export function SettingsPage() {
  const { admin, refreshMe } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    await api.patch('/api/admin/auth/me', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    setCurrentPassword('');
    setNewPassword('');
    setMsg('Password updated.');
    await refreshMe();
  }

  return (
    <div>
      <h1>Settings</h1>
      <div className="card">
        <p>
          Signed in as <strong>{admin?.email}</strong> ({admin?.role})
        </p>
        <h2>Change password</h2>
        {msg && <p className="success">{msg}</p>}
        <form onSubmit={onSubmit}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn primary">
            Update
          </button>
        </form>
      </div>
    </div>
  );
}
