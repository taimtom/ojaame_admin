import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const nav = [
  { to: '/', label: 'Dashboard', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/businesses', label: 'Businesses', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/tickets', label: 'Tickets', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/billing', label: 'Billing', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/agents', label: 'Agents', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/agent-withdrawals', label: 'Agent Withdrawals', roles: ['super_admin', 'support'] },
  { to: '/admin-users', label: 'Admin users', roles: ['super_admin'] },
  { to: '/audit-logs', label: 'Audit log', roles: ['super_admin'] },
  { to: '/settings', label: 'Settings', roles: ['super_admin', 'support', 'billing_readonly'] },
];

export function AppLayout() {
  const { admin, logout } = useAdminAuth();
  const filtered = nav.filter((n) => admin && n.roles.includes(admin.role));

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Ojaa Admin</div>
        <nav>
          {filtered.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className="navlink">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="muted">{admin?.email}</span>
          <button type="button" className="btn ghost" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
