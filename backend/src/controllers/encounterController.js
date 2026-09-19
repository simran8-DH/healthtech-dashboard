const prisma = require('../config/db');
const { generateAnonymizedCode } = require('../utils/anonymize');
const { writeAuditLog } = require('../services/auditService');

async function ensurePatientId(data) {
  if (data.patientId) return data.patientId;

  let code = generateAnonymizedCode();
  for (let i = 0; i < 5; i += 1) {
    const existing = await prisma.patient.findUnique({ where: { anonymizedCode: code } });
    if (!existing) break;
    code = generateAnonymizedCode();
  }

  const patient = await prisma.patient.create({
    data: {
      anonymizedCode: code,
      ageGroup: data.newPatient.ageGroup,
      gender: data.newPatient.gender || 'UNKNOWN',
      villageCode: data.newPatient.villageCode || null,
    },
  });
  return patient.id;
}

async function createEncounter(req, res, next) {
  try {
    const data = req.validated;
    const patientId = await ensurePatientId(data);

    const encounter = await prisma.encounter.create({
      data: {
        patientId,
        createdById: req.user.id,
        encounterDate: data.encounterDate,
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        category: data.category,
        severity: data.severity,
        followUpNeeded: data.followUpNeeded ?? false,
        notes: data.notes || null,
      },
      include: {
        patient: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Encounter',
      entityId: encounter.id,
      details: `Created encounter for ${encounter.patient.anonymizedCode}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: encounter });
  } catch (err) {
    return next(err);
  }
}

async function listEncounters(req, res, next) {
  try {
    const { page = '1', limit = '20', category, severity, patientId, startDate, endDate } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (category) where.category = String(category);
    if (severity) where.severity = String(severity);
    if (patientId) where.patientId = String(patientId);
    if (startDate || endDate) {
      where.encounterDate = {};
      if (startDate) where.encounterDate.gte = new Date(startDate);
      if (endDate) where.encounterDate.lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      prisma.encounter.findMany({
        where,
        skip,
        take,
        orderBy: { encounterDate: 'desc' },
        include: {
          patient: true,
          createdBy: { select: { id: true, fullName: true, role: true } },
        },
      }),
      prisma.encounter.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { total, page: Math.floor(skip / take) + 1, limit: take },
    });
  } catch (err) {
    return next(err);
  }
}

async function getEncounter(req, res, next) {
  try {
    const encounter = await prisma.encounter.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });
    if (!encounter) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found',
        code: 'NOT_FOUND',
      });
    }
    return res.json({ success: true, data: encounter });
  } catch (err) {
    return next(err);
  }
}

async function updateEncounter(req, res, next) {
  try {
    const existing = await prisma.encounter.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found',
        code: 'NOT_FOUND',
      });
    }

    const encounter = await prisma.encounter.update({
      where: { id: req.params.id },
      data: req.validated,
      include: {
        patient: true,
        createdBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'Encounter',
      entityId: encounter.id,
      details: 'Updated encounter',
      ipAddress: req.ip,
    });

    return res.json({ success: true, data: encounter });
  } catch (err) {
    return next(err);
  }
}

async function deleteEncounter(req, res, next) {
  try {
    const existing = await prisma.encounter.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found',
        code: 'NOT_FOUND',
      });
    }

    await prisma.encounter.delete({ where: { id: req.params.id } });

    await writeAuditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'Encounter',
      entityId: req.params.id,
      details: 'Deleted encounter',
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Encounter deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createEncounter,
  listEncounters,
  getEncounter,
  updateEncounter,
  deleteEncounter,
};
