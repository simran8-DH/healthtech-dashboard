import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';

const AGE_GROUPS = ['0-5', '6-17', '18-40', '41-60', '60+'];
const CATEGORIES = ['viral', 'seasonal', 'diabetes', 'hypertension', 'maternal', 'respiratory', 'gastrointestinal', 'other'];
const SEVERITIES = ['mild', 'moderate', 'severe'];

const empty = {
  encounterDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  symptoms: '',
  diagnosis: '',
  treatment: '',
  category: 'viral',
  severity: 'mild',
  followUpNeeded: false,
  notes: '',
  patientMode: 'new',
  patientId: '',
  ageGroup: '18-40',
  gender: 'UNKNOWN',
  villageCode: '',
};

export default function EncounterForm({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [patients, setPatients] = useState([]);
  const [errors, setErrors] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(mode !== 'create');

  useEffect(() => {
    if (mode === 'create') {
      api.get('/patients', { params: { limit: 100 } }).then((res) => setPatients(res.data.data));
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'create' || !id) return;
    api
      .get(`/encounters/${id}`)
      .then((res) => {
        const e = res.data.data;
        setForm({
          ...empty,
          encounterDate: format(new Date(e.encounterDate), "yyyy-MM-dd'T'HH:mm"),
          symptoms: e.symptoms,
          diagnosis: e.diagnosis,
          treatment: e.treatment,
          category: e.category,
          severity: e.severity,
          followUpNeeded: e.followUpNeeded,
          notes: e.notes || '',
          patientId: e.patientId,
          patientMode: 'existing',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id, mode]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setErrors([]);

    try {
      if (mode === 'edit') {
        await api.put(`/encounters/${id}`, {
          encounterDate: new Date(form.encounterDate).toISOString(),
          symptoms: form.symptoms,
          diagnosis: form.diagnosis,
          treatment: form.treatment,
          category: form.category,
          severity: form.severity,
          followUpNeeded: form.followUpNeeded,
          notes: form.notes || null,
        });
        navigate(`/encounters/${id}`);
        return;
      }

      const payload = {
        encounterDate: new Date(form.encounterDate).toISOString(),
        symptoms: form.symptoms,
        diagnosis: form.diagnosis,
        treatment: form.treatment,
        category: form.category,
        severity: form.severity,
        followUpNeeded: form.followUpNeeded,
        notes: form.notes || null,
      };

      if (form.patientMode === 'existing') {
        payload.patientId = form.patientId;
      } else {
        payload.newPatient = {
          ageGroup: form.ageGroup,
          gender: form.gender,
          villageCode: form.villageCode || null,
        };
      }

      const res = await api.post('/encounters', payload);
      navigate(`/encounters/${res.data.data.id}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.code === 'TOKEN_EXPIRED') {
        setError('Session expired. Sign in again to finish this encounter.');
      } else if (data?.errors) {
        setErrors(data.errors);
        setError(data.message || 'Please fix the highlighted fields');
      } else {
        setError(data?.message || 'Save failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="center-block"><div className="spinner" /></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{mode === 'edit' ? 'Edit encounter' : 'New encounter'}</h1>
          <p>No names, phone numbers, or Aadhaar — anonymized fields only</p>
        </div>
        <Link className="btn btn-secondary" to="/encounters">Back</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {errors.length > 0 && (
        <ul className="field-errors">
          {errors.map((err) => (
            <li key={err.field}>{err.field}: {err.message}</li>
          ))}
        </ul>
      )}

      <form className="form-panel" onSubmit={handleSubmit} noValidate>
        {mode === 'create' && (
          <fieldset>
            <legend>Patient</legend>
            <div className="radio-row">
              <label>
                <input
                  type="radio"
                  checked={form.patientMode === 'new'}
                  onChange={() => update('patientMode', 'new')}
                />
                New anonymized patient
              </label>
              <label>
                <input
                  type="radio"
                  checked={form.patientMode === 'existing'}
                  onChange={() => update('patientMode', 'existing')}
                />
                Existing patient code
              </label>
            </div>

            {form.patientMode === 'new' ? (
              <div className="form-grid">
                <label>
                  Age group
                  <select value={form.ageGroup} onChange={(e) => update('ageGroup', e.target.value)} required>
                    {AGE_GROUPS.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label>
                  Gender
                  <select value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                    {['UNKNOWN', 'MALE', 'FEMALE', 'OTHER'].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Village / PHC code
                  <input
                    value={form.villageCode}
                    onChange={(e) => update('villageCode', e.target.value.toUpperCase())}
                    placeholder="e.g. RJ-07"
                    maxLength={20}
                  />
                </label>
              </div>
            ) : (
              <label>
                Patient
                <select
                  value={form.patientId}
                  onChange={(e) => update('patientId', e.target.value)}
                  required
                >
                  <option value="">Select…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.anonymizedCode} · {p.ageGroup} · {p.villageCode || '—'}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </fieldset>
        )}

        <fieldset>
          <legend>Clinical details</legend>
          <div className="form-grid">
            <label>
              Encounter date & time
              <input
                type="datetime-local"
                value={form.encounterDate}
                onChange={(e) => update('encounterDate', e.target.value)}
                required
              />
            </label>
            <label>
              Category
              <select value={form.category} onChange={(e) => update('category', e.target.value)} required>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label>
              Severity
              <select value={form.severity} onChange={(e) => update('severity', e.target.value)} required>
                {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <label>
            Symptoms
            <textarea
              rows={3}
              value={form.symptoms}
              onChange={(e) => update('symptoms', e.target.value)}
              required
              minLength={3}
            />
          </label>
          <label>
            Diagnosis
            <textarea
              rows={2}
              value={form.diagnosis}
              onChange={(e) => update('diagnosis', e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            Treatment
            <textarea
              rows={2}
              value={form.treatment}
              onChange={(e) => update('treatment', e.target.value)}
              required
              minLength={2}
            />
          </label>
          <label>
            Notes (optional)
            <textarea rows={2} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.followUpNeeded}
              onChange={(e) => update('followUpNeeded', e.target.checked)}
            />
            Follow-up needed
          </label>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save encounter'}
          </button>
        </div>
      </form>
    </div>
  );
}
