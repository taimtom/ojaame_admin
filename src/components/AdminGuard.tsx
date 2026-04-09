import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { admin, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="centered">
        <p>Loading…</p>
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function RoleGuard({
  allow,
  children,
}: {
  allow: readonly string[];
  children: ReactNode;
}) {
  const { admin } = useAdminAuth();
  if (!admin || !allow.includes(admin.role)) {
    return (
      <div className="card">
        <h2>Access denied</h2>
        <p>Your role cannot view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
