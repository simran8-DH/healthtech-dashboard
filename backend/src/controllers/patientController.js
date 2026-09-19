const prisma = require('../config/db');
const { generateAnonymizedCode } = require('../utils/anonymize');
const { writeAuditLog } = require('../services/auditService');

async function createPatient(req, res, next) {
  try {
    let code = generateAnonymizedCode();
    // Retry on rare collision
    for (let i = 0; i < 5; i += 1) {
      const existing = await prisma.patient.findUnique({ where: { anonymizedCode: code } });
      if (!existing) break;
      code = generateAnonymizedCode();
    }

    const patient = await prisma.patient.create({
      data: {
        anonymizedCode: code,
        ageGroup: req.validated.ageGroup,
        gender: req.validated.gender,
        villageCode: req.validated.villageCode || null,
      },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Patient',
      entityId: patient.id,
      details: `Created anonymized patient ${patient.anonymizedCode}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: patient });
  } catch (err) {
    return next(err);
  }
}

async function listPatients(req, res, next) {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = search
      ? { anonymizedCode: { contains: String(search).toUpperCase(), mode: 'insensitive' } }
      : {};

    const [items, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { encounters: true } } },
      }),
      prisma.patient.count({ where }),
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

async function getPatient(req, res, next) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        encounters: {
          orderBy: { encounterDate: 'desc' },
          include: {
            createdBy: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found', code: 'NOT_FOUND' });
    }
    return res.json({ success: true, data: patient });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createPatient, listPatients, getPatient };
