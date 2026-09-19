import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Patient registry — who the person is (anonymized demographics).
 * Not a visit log; that lives under Encounters / Visits.
 */
export default function Patients() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .get('/patients', { params: { search: search || undefined, limit: 50 } })
        .then((res) => setItems(res.data.data))
        .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Registry</p>
          <h1>Patients</h1>
          <p>
            One card per person — age group, gender, and location code only.
            Clinical visits are listed under <strong>Visits</strong>.
          </p>
        </div>
        {hasRole('NURSE', 'DOCTOR') && (
          <Link className="btn btn-primary" to="/encounters/new">
            Add visit for new patient
          </Link>
        )}
      </div>

      <div className="callout callout-info">
        <strong>Patients ≠ Visits.</strong> This page is the anonymized registry
        (who). Open <Link to="/encounters">Visits</Link> to see symptoms,
        diagnosis, and treatment (what happened).
      </div>

      <div className="filters">
        <label>
          Search patient code
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="PT-…"
          />
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-block"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h2>No patients yet</h2>
          <p>Create a visit — a new anonymized patient code is generated automatically.</p>
          {hasRole('NURSE', 'DOCTOR') && (
            <Link className="btn btn-primary" to="/encounters/new">New visit</Link>
          )}
        </div>
      ) : (
        <div className="patient-grid">
          {items.map((p) => (
            <article key={p.id} className="patient-card">
              <header>
                <code className="patient-code">{p.anonymizedCode}</code>
                <span className="visit-count">
                  {p._count?.encounters ?? 0} visit{(p._count?.encounters ?? 0) === 1 ? '' : 's'}
                </span>
              </header>
              <dl className="patient-meta">
                <div>
                  <dt>Age group</dt>
                  <dd>{p.ageGroup}</dd>
                </div>
                <div>
                  <dt>Gender</dt>
                  <dd>{p.gender}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{p.villageCode || '—'}</dd>
                </div>
                <div>
                  <dt>Registered</dt>
                  <dd>{format(new Date(p.createdAt), 'dd MMM yyyy')}</dd>
                </div>
              </dl>
              <footer>
                <Link className="btn btn-secondary" to={`/patients/${p.id}`}>
                  Open profile
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
