import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Visit / encounter log — each row is a clinical visit (symptoms → treatment).
 */
export default function Encounters() {
  const { hasRole } = useAuth();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 50 };
      if (category) params.category = category;
      const res = await api.get('/encounters', { params });
      setItems(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visits');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  async function handleDelete(id) {
    if (!window.confirm('Delete this visit? This cannot be undone.')) return;
    try {
      await api.delete(`/encounters/${id}`);
      setMessage('Visit deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Clinical log</p>
          <h1>Visits</h1>
          <p>
            {meta.total} clinical visit{meta.total === 1 ? '' : 's'} — symptoms, diagnosis, and treatment.
            Patient demographics live under <strong>Patients</strong>.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={load}>
            Refresh
          </button>
          {hasRole('NURSE', 'DOCTOR') && (
            <Link className="btn btn-primary" to="/encounters/new">
              + New visit
            </Link>
          )}
        </div>
      </div>

      <div className="callout callout-visit">
        <strong>This is the visit log.</strong> Each row is one encounter with a doctor/nurse.
        Looking for age / location only? Go to <Link to="/patients">Patients</Link>.
      </div>

      <div className="filters">
        <label>
          Filter by category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {['viral', 'seasonal', 'diabetes', 'hypertension', 'maternal', 'respiratory', 'gastrointestinal', 'other'].map(
              (c) => (
                <option key={c} value={c}>{c}</option>
              )
            )}
          </select>
        </label>
      </div>

      {message && <div className="alert alert-ok">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap visit-table">
        <table>
          <thead>
            <tr>
              <th>Visit date</th>
              <th>Patient code</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Diagnosis</th>
              <th>Treatment (short)</th>
              <th>Entered by</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading && !items.length ? (
              <tr><td colSpan={8}>Loading visits…</td></tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  No visits yet.{' '}
                  {hasRole('NURSE', 'DOCTOR') && (
                    <Link to="/encounters/new">Record the first visit</Link>
                  )}
                </td>
              </tr>
            ) : (
              items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{format(new Date(e.encounterDate), 'dd MMM yyyy')}</strong>
                    <div className="muted-tiny">{format(new Date(e.encounterDate), 'HH:mm')}</div>
                  </td>
                  <td>
                    <Link to={`/patients/${e.patient.id}`}>
                      <code>{e.patient.anonymizedCode}</code>
                    </Link>
                    {e.patient.villageCode && (
                      <div className="muted-tiny">{e.patient.villageCode}</div>
                    )}
                  </td>
                  <td><span className="tag">{e.category}</span></td>
                  <td><span className={`sev sev-${e.severity}`}>{e.severity}</span></td>
                  <td>{e.diagnosis}</td>
                  <td className="clip">{e.treatment}</td>
                  <td>{e.createdBy.fullName}</td>
                  <td className="row-actions">
                    <Link to={`/encounters/${e.id}`}>Open visit</Link>
                    {hasRole('DOCTOR') && (
                      <Link to={`/encounters/${e.id}/edit`}>Edit</Link>
                    )}
                    {hasRole('DOCTOR', 'ADMIN') && (
                      <button type="button" className="link-danger" onClick={() => handleDelete(e.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
