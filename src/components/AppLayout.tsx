import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

const nav = [
  { to: '/', label: 'Dashboard', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/prospects', label: 'Prospects', roles: ['super_admin', 'support'] },
  { to: '/sales-guide', label: 'Sales guide', roles: ['super_admin', 'support'] },
  { to: '/businesses', label: 'Businesses', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/tickets', label: 'Tickets', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/billing', label: 'Billing', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/agents', label: 'Agents', roles: ['super_admin', 'support', 'billing_readonly'] },
  { to: '/catalog', label: 'Catalog', roles: ['super_admin', 'support'] },
  { to: '/blog', label: 'Blog', roles: ['super_admin', 'support'] },
  { to: '/agent-withdrawals', label: 'Agent Withdrawals', roles: ['super_admin', 'support'] },
  { to: '/admin-users', label: 'Admin users', roles: ['super_admin'] },
  { to: '/audit-logs', label: 'Audit log', roles: ['super_admin'] },
  { to: '/settings', label: 'Settings', roles: ['super_admin', 'support', 'billing_readonly'] },
];

export function AppLayout() {
  const { admin, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const filtered = nav.filter((n) => admin && n.roles.includes(admin.role));

  return (
    <div className={`layout ${menuOpen ? 'nav-open' : ''}`}>
      <div
        className="sidebar-backdrop"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
      <aside className="sidebar">
        <div className="brand">Ojaa Admin</div>
        <nav>
          {filtered.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="navlink"
              onClick={() => setMenuOpen(false)}
            >
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
      <div className="main-column">
        <header className="top-bar hide-desktop">
          <button
            type="button"
            className="btn ghost menu-toggle"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="top-bar-title">Ojaa Admin</span>
        </header>
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
