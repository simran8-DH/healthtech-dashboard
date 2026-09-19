import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/patients/${id}`)
      .then((res) => setPatient(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Not found'));
  }, [id]);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!patient) return <div className="center-block"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><code>{patient.anonymizedCode}</code></h1>
          <p>
            Patient profile · {patient.ageGroup} · {patient.gender} · {patient.villageCode || 'no location code'}
          </p>
        </div>
        <div className="header-actions">
          <Link className="btn btn-secondary" to="/patients">All patients</Link>
          <Link className="btn btn-primary" to="/encounters/new">New visit</Link>
        </div>
      </div>

      <div className="callout callout-info">
        This is the <strong>person</strong> (registry). Visits for this code are listed below.
      </div>

      <section className="panel">
        <h2>Visits for this patient</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Diagnosis</th>
                <th>By</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {patient.encounters.length === 0 ? (
                <tr><td colSpan={5}>No encounters</td></tr>
              ) : (
                patient.encounters.map((e) => (
                  <tr key={e.id}>
                    <td>{format(new Date(e.encounterDate), 'dd MMM yyyy')}</td>
                    <td>{e.category}</td>
                    <td>{e.diagnosis}</td>
                    <td>{e.createdBy.fullName}</td>
                    <td><Link to={`/encounters/${e.id}`}>Open</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
