const prisma = require('../config/db');

async function getMetrics(req, res, next) {
  try {
    const { startDate, endDate, category, villageCode } = req.validatedQuery || {};

    // Date-only strings (yyyy-MM-dd) become midnight UTC — extend endDate to end of day
    // so today's encounters are included in the dashboard range.
    let rangeStart = startDate || null;
    let rangeEnd = endDate || null;
    if (rangeStart) {
      rangeStart = new Date(rangeStart);
      rangeStart.setUTCHours(0, 0, 0, 0);
    }
    if (rangeEnd) {
      rangeEnd = new Date(rangeEnd);
      rangeEnd.setUTCHours(23, 59, 59, 999);
    }

    const dateFilter = {};
    if (rangeStart) dateFilter.gte = rangeStart;
    if (rangeEnd) dateFilter.lte = rangeEnd;

    const encounterWhere = {};
    if (Object.keys(dateFilter).length) encounterWhere.encounterDate = dateFilter;
    if (category) encounterWhere.category = category;
    if (villageCode) {
      encounterWhere.patient = { villageCode };
    }

    const [
      totalEncounters,
      totalPatients,
      byCategory,
      bySeverity,
      byAgeGroup,
      recentTrend,
      followUps,
    ] = await Promise.all([
      prisma.encounter.count({ where: encounterWhere }),
      prisma.patient.count({
        where: villageCode ? { villageCode } : undefined,
      }),
      prisma.encounter.groupBy({
        by: ['category'],
        where: encounterWhere,
        _count: { _all: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.encounter.groupBy({
        by: ['severity'],
        where: encounterWhere,
        _count: { _all: true },
      }),
      prisma.encounter.findMany({
        where: encounterWhere,
        select: { patient: { select: { ageGroup: true } } },
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('day', encounter_date)::date AS day, COUNT(*)::int AS count
        FROM encounters
        WHERE (${rangeStart}::timestamp IS NULL OR encounter_date >= ${rangeStart})
          AND (${rangeEnd}::timestamp IS NULL OR encounter_date <= ${rangeEnd})
          AND (${category}::text IS NULL OR category = ${category})
        GROUP BY 1
        ORDER BY 1 ASC
      `,
      prisma.encounter.count({
        where: { ...encounterWhere, followUpNeeded: true },
      }),
    ]);

    const ageGroupMap = {};
    recentTrend; // used below
    byAgeGroup.forEach((row) => {
      const ag = row.patient.ageGroup;
      ageGroupMap[ag] = (ageGroupMap[ag] || 0) + 1;
    });

    return res.json({
      success: true,
      data: {
        summary: {
          totalEncounters,
          totalPatients,
          followUpsNeeded: followUps,
        },
        byCategory: byCategory.map((c) => ({
          category: c.category,
          count: c._count._all,
        })),
        bySeverity: bySeverity.map((s) => ({
          severity: s.severity,
          count: s._count._all,
        })),
        byAgeGroup: Object.entries(ageGroupMap).map(([ageGroup, count]) => ({
          ageGroup,
          count,
        })),
        trend: (recentTrend || []).map((t) => ({
          date: t.day,
          count: t.count,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function listAuditLogs(req, res, next) {
  try {
    const take = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const logs = await prisma.auditLog.findMany({
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });
    return res.json({ success: true, data: logs });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMetrics, listAuditLogs };
