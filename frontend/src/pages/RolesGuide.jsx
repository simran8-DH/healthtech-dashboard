import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    id: 'NURSE',
    title: 'Nurse',
    login: 'nurse@healthtech.local',
    color: 'role-nurse',
    summary: 'Front-line data entry at the PHC / telemedicine desk.',
    can: [
      'Create a new visit (+ New visit) with symptoms, diagnosis, treatment',
      'Create a new anonymized patient while saving a visit (age, gender, location code)',
      'View the Patients registry (who) and Visits log (what happened)',
      'Open an existing patient profile and see their visit history',
    ],
    cannot: [
      'Edit or delete a visit after it is saved (doctor does that)',
      'Open the analytics Dashboard',
      'Open Audit logs or create staff accounts',
    ],
    screens: [
      { name: 'Visits', path: '/encounters', why: 'Your main work list — every clinical encounter' },
      { name: '+ New visit', path: '/encounters/new', why: 'Enter patient details + clinical findings in one form' },
      { name: 'Patients', path: '/patients', why: 'Find a PT- code by location/age without clinical clutter' },
    ],
  },
  {
    id: 'DOCTOR',
    title: 'Doctor',
    login: 'doctor@healthtech.local',
    color: 'role-doctor',
    summary: 'Clinical review, corrections, and decision support from trends.',
    can: [
      'Do everything a nurse can (create visits and patients)',
      'Edit visit details if diagnosis/treatment needs correction',
      'Delete incorrect visits',
      'Open Dashboard — viral rise, seasonal illness, diabetes, severity mix',
      'Filter Dashboard by date range and category',
    ],
    cannot: [
      'Open Audit logs (admin only)',
      'Register new clinic staff accounts (admin only)',
    ],
    screens: [
      { name: 'Dashboard', path: '/dashboard', why: 'Charts for planning referrals and outbreak response' },
      { name: 'Visits', path: '/encounters', why: 'Review nurse entries; Edit / Delete when needed' },
      { name: 'Patients', path: '/patients', why: 'Follow one anonymized patient across visits' },
    ],
  },
  {
    id: 'ADMIN',
    title: 'Administrator',
    login: 'admin@healthtech.local',
    color: 'role-admin',
    summary: 'Clinic oversight — trends, security trail, and staff accounts.',
    can: [
      'Open Dashboard to analyze health trends (same charts as doctor)',
      'Open Audit logs — logins, creates, updates, deletes, access denials',
      'View patients and visits (read) and delete bad visits if required',
      'Register new users via API (POST /api/auth/register)',
    ],
    cannot: [
      'Create new visits from the UI (nurses/doctors enter clinical data)',
      'Edit visit clinical fields (doctors own clinical corrections)',
    ],
    screens: [
      { name: 'Dashboard', path: '/dashboard', why: 'Aggregate metrics for the whole catchment' },
      { name: 'Audit logs', path: '/audit', why: 'Security & accountability — who did what, when' },
      { name: 'Visits / Patients', path: '/encounters', why: 'Read-only overview of clinic activity' },
    ],
  },
];

export default function RolesGuide() {
  const { user, hasRole } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Help</p>
          <h1>Roles &amp; what each can do</h1>
          <p>
            You are signed in as <strong>{user?.fullName}</strong> ({user?.role}).
            Screens you cannot open are hidden in the sidebar and blocked by the API.
          </p>
        </div>
      </div>

      <div className="role-guide-grid">
        {ROLES.map((role) => (
          <section
            key={role.id}
            className={`role-panel ${role.color} ${user?.role === role.id ? 'is-you' : ''}`}
          >
            <header>
              <h2>{role.title}</h2>
              {user?.role === role.id && <span className="you-badge">Your role</span>}
            </header>
            <p className="role-summary">{role.summary}</p>
            <p className="role-login">Demo login: <code>{role.login}</code></p>

            <h3>Can</h3>
            <ul>
              {role.can.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Cannot</h3>
            <ul className="cannot-list">
              {role.cannot.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h3>Main screens</h3>
            <ul className="screen-list">
              {role.screens.map((s) => (
                <li key={s.path}>
                  {hasRole(role.id) || role.id === user?.role ? (
                    <Link to={s.path}>{s.name}</Link>
                  ) : (
                    <strong>{s.name}</strong>
                  )}
                  <span> — {s.why}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="panel explain-block">
        <h2>Feature glossary</h2>
        <dl className="dl glossary">
          <dt>Patients</dt>
          <dd>
            Anonymized registry. Each person gets a code like <code>PT-6RCV5Q</code>.
            Stores only age group, gender, and location code (e.g. ULHASNAGAR). No name or phone.
            Nurses create a patient automatically when they save a <strong>new visit</strong> with “New anonymized patient”.
          </dd>
          <dt>Visits (Encounters)</dt>
          <dd>
            One clinical consultation: date, symptoms, diagnosis, treatment, category, severity, follow-up flag.
            This is what nurses enter in real time during telemedicine.
          </dd>
          <dt>Dashboard</dt>
          <dd>
            Charts for doctors and admins: total visits, follow-ups, cases by category (viral, diabetes…),
            severity mix, age groups, and daily trend. Filter by date range to spot seasonal rises.
          </dd>
          <dt>Audit logs</dt>
          <dd>
            Admin-only security trail. Records successful/failed logins, create/update/delete actions,
            and <em>ACCESS_DENIED</em> when someone tries a screen or API their role cannot use.
          </dd>
        </dl>
      </section>
    </div>
  );
}
