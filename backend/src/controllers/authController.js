const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const config = require('../config');
const { writeAuditLog } = require('../services/auditService');

function signToken(user) {
  return jwt.sign(
    {
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    config.jwtSecret,
    {
      subject: user.id,
      expiresIn: config.jwtExpiresIn,
    }
  );
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user || !user.isActive) {
      await writeAuditLog({
        action: 'LOGIN_FAILED',
        details: `Failed login for ${email}`,
        ipAddress: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      await writeAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        details: 'Wrong password',
        ipAddress: req.ip,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const token = signToken(user);
    await writeAuditLog({
      userId: user.id,
      action: 'LOGIN',
      details: 'Successful login',
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      data: {
        token,
        expiresIn: config.jwtExpiresIn,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        code: 'UNAUTHORIZED',
      });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
}

/** Admin-only: create clinic staff accounts */
async function register(req, res, next) {
  try {
    const { email, password, fullName, role } = req.validated;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role,
      },
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });

    await writeAuditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      details: `Created user ${user.email} with role ${user.role}`,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    return next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, me, register, listUsers };
