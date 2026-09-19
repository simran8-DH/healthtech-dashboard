import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../api/client';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/audit-logs', { params: { limit: 100 } })
      .then((res) => setLogs(res.data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Audit logs</h1>
          <p>Security trail for logins, CRUD actions, and access denials</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading…</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5}>No logs yet</td></tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id}>
                  <td>{format(new Date(l.createdAt), 'dd MMM HH:mm')}</td>
                  <td><span className="tag">{l.action}</span></td>
                  <td>{l.user ? `${l.user.fullName} (${l.user.role})` : '—'}</td>
                  <td>{l.entityType || '—'}{l.entityId ? ` · ${l.entityId.slice(0, 8)}…` : ''}</td>
                  <td>{l.details || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
