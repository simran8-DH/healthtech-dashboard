import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format, subDays } from 'date-fns';
import api from '../api/client';

const PIE_COLORS = ['#0f766e', '#0ea5a4', '#0369a1', '#b45309', '#be123c', '#4d7c0f', '#7c3aed', '#64748b'];

export default function Dashboard() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 90), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { startDate, endDate };
      if (category) params.category = category;
      const res = await api.get('/dashboard/metrics', { params });
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, category]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh so new visits show up quickly
  useEffect(() => {
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Health trends</h1>
          <p>Anonymized encounter metrics for clinical planning</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="filters">
        <label>
          From
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All</option>
            {['viral', 'seasonal', 'diabetes', 'hypertension', 'maternal', 'respiratory', 'gastrointestinal', 'other'].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && !data ? (
        <div className="center-block"><div className="spinner" /></div>
      ) : data ? (
        <>
          <div className="stat-row">
            <div className="stat">
              <span>Encounters</span>
              <strong>{data.summary.totalEncounters}</strong>
            </div>
            <div className="stat">
              <span>Patients</span>
              <strong>{data.summary.totalPatients}</strong>
            </div>
            <div className="stat">
              <span>Follow-ups needed</span>
              <strong>{data.summary.followUpsNeeded}</strong>
            </div>
          </div>

          <div className="chart-grid">
            <section className="panel">
              <h2>Cases by category</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h2>Severity mix</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.bySeverity}
                    dataKey="count"
                    nameKey="severity"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label
                  >
                    {data.bySeverity.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </section>

            <section className="panel panel-wide">
              <h2>Daily encounter trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend.map((t) => ({ ...t, date: format(new Date(t.date), 'dd MMM') }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#0369a1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section className="panel">
              <h2>Age groups</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.byAgeGroup} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="ageGroup" width={50} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5a4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
