import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { AdminGuard, RoleGuard } from './components/AdminGuard';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { BusinessesPage } from './pages/BusinessesPage';
import { CreateBusinessPage } from './pages/CreateBusinessPage';
import { BusinessDetailPage } from './pages/BusinessDetailPage';
import { TicketsPage } from './pages/TicketsPage';
import { TicketDetailPage } from './pages/TicketDetailPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { BillingSummaryPage } from './pages/BillingSummaryPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentDetailPage } from './pages/AgentDetailPage';
import { AgentWithdrawalsPage } from './pages/AgentWithdrawalsPage';
import { CatalogPage } from './pages/CatalogPage';
import { ProspectsPage } from './pages/ProspectsPage';
import { ProspectFormPage } from './pages/ProspectFormPage';
import { ProspectDetailPage } from './pages/ProspectDetailPage';
import { ConvertProspectPage } from './pages/ConvertProspectPage';
import { SalesGuidePage } from './pages/SalesGuidePage';

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <AdminGuard>
                <AppLayout />
              </AdminGuard>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="prospects"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <ProspectsPage />
                </RoleGuard>
              }
            />
            <Route
              path="prospects/new"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <ProspectFormPage />
                </RoleGuard>
              }
            />
            <Route
              path="prospects/:id/convert"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <ConvertProspectPage />
                </RoleGuard>
              }
            />
            <Route
              path="prospects/:id"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <ProspectDetailPage />
                </RoleGuard>
              }
            />
            <Route
              path="sales-guide"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <SalesGuidePage />
                </RoleGuard>
              }
            />
            <Route path="businesses" element={<BusinessesPage />} />
            <Route path="businesses/new" element={<CreateBusinessPage />} />
            <Route path="businesses/:id" element={<BusinessDetailPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="billing" element={<BillingSummaryPage />} />
            <Route path="agents" element={<AgentsPage />} />
            <Route path="agents/:id" element={<AgentDetailPage />} />
            <Route path="agent-withdrawals" element={<AgentWithdrawalsPage />} />
            <Route
              path="catalog"
              element={
                <RoleGuard allow={['super_admin', 'support']}>
                  <CatalogPage />
                </RoleGuard>
              }
            />
            <Route
              path="admin-users"
              element={
                <RoleGuard allow={['super_admin']}>
                  <AdminUsersPage />
                </RoleGuard>
              }
            />
            <Route
              path="audit-logs"
              element={
                <RoleGuard allow={['super_admin']}>
                  <AuditLogPage />
                </RoleGuard>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  );
}
