import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function EncounterDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/encounters/${id}`)
      .then((res) => setItem(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!item) return <div className="center-block"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Encounter</h1>
          <p>
            <code>{item.patient.anonymizedCode}</code> ·{' '}
            {format(new Date(item.encounterDate), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-secondary" to="/encounters">Back</Link>
          {hasRole('DOCTOR') && (
            <Link className="btn btn-primary" to={`/encounters/${id}/edit`}>Edit</Link>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <section className="panel">
          <h2>Clinical</h2>
          <dl className="dl">
            <dt>Category</dt><dd><span className="tag">{item.category}</span></dd>
            <dt>Severity</dt><dd><span className={`sev sev-${item.severity}`}>{item.severity}</span></dd>
            <dt>Symptoms</dt><dd>{item.symptoms}</dd>
            <dt>Diagnosis</dt><dd>{item.diagnosis}</dd>
            <dt>Treatment</dt><dd>{item.treatment}</dd>
            <dt>Follow-up</dt><dd>{item.followUpNeeded ? 'Yes' : 'No'}</dd>
            {item.notes && (<><dt>Notes</dt><dd>{item.notes}</dd></>)}
          </dl>
        </section>
        <section className="panel">
          <h2>Patient (anonymized)</h2>
          <dl className="dl">
            <dt>Code</dt><dd><code>{item.patient.anonymizedCode}</code></dd>
            <dt>Age group</dt><dd>{item.patient.ageGroup}</dd>
            <dt>Gender</dt><dd>{item.patient.gender}</dd>
            <dt>Village code</dt><dd>{item.patient.villageCode || '—'}</dd>
            <dt>Entered by</dt><dd>{item.createdBy.fullName} ({item.createdBy.role})</dd>
          </dl>
        </section>
      </div>
    </div>
  );
}
