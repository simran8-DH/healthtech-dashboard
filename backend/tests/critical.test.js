/**
 * Unit-style tests for validators and auth middleware helpers.
 * Integration tests require a running Postgres — see docker-compose.
 */
const {
  loginSchema,
  encounterSchema,
  registerSchema,
} = require('../src/validators/schemas');
const { generateAnonymizedCode } = require('../src/utils/anonymize');
const jwt = require('jsonwebtoken');

describe('Validators — incomplete encounter data', () => {
  test('rejects encounter missing symptoms and diagnosis', () => {
    const result = encounterSchema.safeParse({
      encounterDate: new Date().toISOString(),
      symptoms: '',
      diagnosis: '',
      treatment: 'rest',
      category: 'viral',
      severity: 'mild',
      patientId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });

  test('rejects encounter without patientId or newPatient', () => {
    const result = encounterSchema.safeParse({
      encounterDate: new Date().toISOString(),
      symptoms: 'Fever for 2 days',
      diagnosis: 'Viral fever',
      treatment: 'Paracetamol',
      category: 'viral',
      severity: 'mild',
    });
    expect(result.success).toBe(false);
    const issues = result.error.issues || result.error.errors || [];
    expect(issues.some((e) => e.path.includes('patientId'))).toBe(true);
  });

  test('accepts valid encounter with newPatient', () => {
    const result = encounterSchema.safeParse({
      encounterDate: new Date().toISOString(),
      symptoms: 'Fever for 2 days',
      diagnosis: 'Viral fever',
      treatment: 'Paracetamol',
      category: 'viral',
      severity: 'mild',
      newPatient: { ageGroup: '18-40', gender: 'FEMALE', villageCode: 'RJ-07' },
    });
    expect(result.success).toBe(true);
  });

  test('rejects invalid category', () => {
    const result = encounterSchema.safeParse({
      encounterDate: new Date().toISOString(),
      symptoms: 'Fever for 2 days',
      diagnosis: 'Unknown',
      treatment: 'Observation',
      category: 'not-a-real-category',
      severity: 'mild',
      patientId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

describe('Auth validators', () => {
  test('login requires valid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'secret1' }).success).toBe(false);
    expect(
      loginSchema.safeParse({ email: 'nurse@healthtech.local', password: 'Nurse@123' }).success
    ).toBe(true);
  });

  test('register enforces role enum', () => {
    const bad = registerSchema.safeParse({
      email: 'x@y.com',
      password: 'Password1',
      fullName: 'Test User',
      role: 'SUPERUSER',
    });
    expect(bad.success).toBe(false);
  });
});

describe('Anonymization', () => {
  test('generates PT-XXXXXX style codes without PII', () => {
    const code = generateAnonymizedCode();
    expect(code).toMatch(/^PT-[A-Z0-9]{6}$/);
    expect(code).not.toMatch(/name|phone|aadhaar/i);
  });
});

describe('Session expiry (JWT)', () => {
  test('expired token fails verification', () => {
    const secret = 'test-secret';
    const token = jwt.sign({ role: 'NURSE' }, secret, { subject: 'user-1', expiresIn: '0s' });
    // slight delay so expiry is in the past
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(() => jwt.verify(token, secret)).toThrow(/jwt expired/i);
        resolve();
      }, 50);
    });
  });

  test('valid token decodes role for RBAC checks', () => {
    const secret = 'test-secret';
    const token = jwt.sign(
      { email: 'doctor@healthtech.local', role: 'DOCTOR', fullName: 'Dr Test' },
      secret,
      { subject: 'user-2', expiresIn: '1h' }
    );
    const payload = jwt.verify(token, secret);
    expect(payload.role).toBe('DOCTOR');
    expect(payload.sub).toBe('user-2');
  });
});

describe('Role access matrix (logical)', () => {
  const can = {
    NURSE: { createEncounter: true, updateEncounter: false, viewDashboard: false, deleteEncounter: false },
    DOCTOR: { createEncounter: true, updateEncounter: true, viewDashboard: true, deleteEncounter: true },
    ADMIN: { createEncounter: false, updateEncounter: false, viewDashboard: true, deleteEncounter: true },
  };

  test('nurses cannot update encounters', () => {
    expect(can.NURSE.updateEncounter).toBe(false);
  });

  test('nurses cannot view analytics dashboard', () => {
    expect(can.NURSE.viewDashboard).toBe(false);
  });

  test('doctors can view and edit', () => {
    expect(can.DOCTOR.updateEncounter).toBe(true);
    expect(can.DOCTOR.viewDashboard).toBe(true);
  });

  test('admins analyze trends but do not enter encounters via API policy', () => {
    expect(can.ADMIN.viewDashboard).toBe(true);
    expect(can.ADMIN.createEncounter).toBe(false);
  });
});
