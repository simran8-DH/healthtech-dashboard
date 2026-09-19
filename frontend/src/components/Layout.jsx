import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>HealthTech</strong>
            <small>Rural Telemedicine</small>
          </div>
        </div>

        <nav className="nav">
          {hasRole('DOCTOR', 'ADMIN') && (
            <NavLink to="/dashboard">Dashboard</NavLink>
          )}
          <NavLink to="/encounters">Visits</NavLink>
          {hasRole('NURSE', 'DOCTOR') && (
            <NavLink to="/encounters/new">+ New visit</NavLink>
          )}
          <NavLink to="/patients">Patients</NavLink>
          <NavLink to="/roles">Roles guide</NavLink>
          {hasRole('ADMIN') && <NavLink to="/audit">Audit logs</NavLink>}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user?.fullName}</strong>
            <small className="role-badge">{user?.role}</small>
          </div>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <p className="topbar-note">Anonymized patient data · clinic use only</p>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
