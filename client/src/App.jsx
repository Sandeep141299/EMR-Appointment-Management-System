import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppointmentsPage from './pages/AppointmentsPage.jsx';
import AuditLogsPage from './pages/AuditLogsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ForbiddenPage from './pages/ForbiddenPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import PatientsPage from './pages/PatientsPage.jsx';
import DoctorsPage from './pages/DoctorsPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import SchedulerPage from './pages/SchedulerPage.jsx';
import { ROLES } from './config/roleConfig.js';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/403" element={isAuthenticated ? <ForbiddenPage /> : <Navigate to="/login" replace />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route
          path="/audit-logs"
          element={(
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <AuditLogsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/scheduler"
          element={(
            <ProtectedRoute permission="BOOK_APPOINTMENT">
              <SchedulerPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/book-appointment"
          element={(
            <ProtectedRoute permission="BOOK_APPOINTMENT">
              <SchedulerPage />
            </ProtectedRoute>
          )}
        />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route
          path="/doctors"
          element={(
            <ProtectedRoute permission="MANAGE_STAFF">
              <DoctorsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/schedules"
          element={(
            <ProtectedRoute permission="MANAGE_DOCTOR_SCHEDULES">
              <SchedulePage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/patients"
          element={(
            <ProtectedRoute permission="VIEW_PATIENTS">
              <PatientsPage />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/staff"
          element={(
            <Navigate to="/doctors" replace />
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
    </Routes>
  );
}
