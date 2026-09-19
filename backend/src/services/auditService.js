const prisma = require('../config/db');

async function writeAuditLog({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

module.exports = { writeAuditLog };
