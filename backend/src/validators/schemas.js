const { z } = require('zod');

const AGE_GROUPS = ['0-5', '6-17', '18-40', '41-60', '60+'];
const CATEGORIES = [
  'viral',
  'seasonal',
  'diabetes',
  'hypertension',
  'maternal',
  'respiratory',
  'gastrointestinal',
  'other',
];
const SEVERITIES = ['mild', 'moderate', 'severe'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const ROLES = ['NURSE', 'DOCTOR', 'ADMIN'];

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name is required').max(100),
  role: z.enum(ROLES),
});

const patientSchema = z.object({
  ageGroup: z.enum(AGE_GROUPS, { errorMap: () => ({ message: 'Invalid age group' }) }),
  gender: z.enum(GENDERS).default('UNKNOWN'),
  villageCode: z
    .string()
    .max(20)
    .regex(/^[A-Z0-9-]*$/i, 'Village code must be alphanumeric')
    .optional()
    .nullable(),
});

const encounterSchema = z.object({
  patientId: z.string().uuid('Valid patient ID is required').optional(),
  // Inline patient creation for nurses entering new encounters
  newPatient: patientSchema.optional(),
  encounterDate: z.coerce.date({ required_error: 'Encounter date is required' }),
  symptoms: z.string().min(3, 'Symptoms description is required').max(2000),
  diagnosis: z.string().min(2, 'Diagnosis is required').max(1000),
  treatment: z.string().min(2, 'Treatment is required').max(2000),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Invalid category' }) }),
  severity: z.enum(SEVERITIES, { errorMap: () => ({ message: 'Invalid severity' }) }),
  followUpNeeded: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
}).refine((data) => data.patientId || data.newPatient, {
  message: 'Either patientId or newPatient details are required',
  path: ['patientId'],
});

const encounterUpdateSchema = z.object({
  encounterDate: z.coerce.date().optional(),
  symptoms: z.string().min(3).max(2000).optional(),
  diagnosis: z.string().min(2).max(1000).optional(),
  treatment: z.string().min(2).max(2000).optional(),
  category: z.enum(CATEGORIES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  followUpNeeded: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

const dashboardQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  category: z.enum(CATEGORIES).optional(),
  villageCode: z.string().optional(),
});

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check incomplete or invalid fields.',
        code: 'VALIDATION_ERROR',
        errors: (result.error.issues || result.error.errors).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.validated = result.data;
    return next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        errors: (result.error.issues || result.error.errors).map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.validatedQuery = result.data;
    return next();
  };
}

module.exports = {
  AGE_GROUPS,
  CATEGORIES,
  SEVERITIES,
  GENDERS,
  ROLES,
  loginSchema,
  registerSchema,
  patientSchema,
  encounterSchema,
  encounterUpdateSchema,
  dashboardQuerySchema,
  validate,
  validateQuery,
};
