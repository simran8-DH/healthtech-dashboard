import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Encounters from './pages/Encounters';
import EncounterForm from './pages/EncounterForm';
import EncounterDetail from './pages/EncounterDetail';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import AuditLogs from './pages/AuditLogs';
import RolesGuide from './pages/RolesGuide';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/encounters" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="encounters" element={<Encounters />} />
            <Route
              path="encounters/new"
              element={
                <ProtectedRoute roles={['NURSE', 'DOCTOR']}>
                  <EncounterForm mode="create" />
                </ProtectedRoute>
              }
            />
            <Route path="encounters/:id" element={<EncounterDetail />} />
            <Route
              path="encounters/:id/edit"
              element={
                <ProtectedRoute roles={['DOCTOR']}>
                  <EncounterForm mode="edit" />
                </ProtectedRoute>
              }
            />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="roles" element={<RolesGuide />} />
            <Route
              path="audit"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
