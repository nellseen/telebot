import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../db/client.js';
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from '../../security/auth.js';
import { logger } from '../../logger.js';

export const authRouter = Router();

const AuthInputSchema = z.object({
  username: z.string().trim().min(3, 'Username minimal 3 karakter').max(32),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

// GET /api/auth/session - Check authentication status & if first-time bootstrap is needed
authRouter.get('/session', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const needsBootstrap = userCount === 0;

    let sessionId = req.cookies?.tbm_session;
    if (!sessionId && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        sessionId = parts[1];
      }
    }

    const session = validateSession(sessionId);
    if (!session) {
      return res.json({
        authenticated: false,
        needsBootstrap,
        user: null,
      });
    }

    return res.json({
      authenticated: true,
      needsBootstrap: false,
      user: {
        id: session.userId,
        username: session.username,
      },
      sessionId,
    });
  } catch (error) {
    logger.error('AUTH_SESSION_ERROR', 'Error checking session', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal memeriksa sesi' });
  }
});

// POST /api/auth/bootstrap - First-time admin account creation
authRouter.post('/bootstrap', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return res.status(403).json({
        error: 'BOOTSTRAP_DISABLED',
        message: 'Akun administrator sudah dibuat. Alur bootstrap dinonaktifkan.',
      });
    }

    const parseResult = AuthInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Input tidak valid',
      });
    }

    const { username, password } = parseResult.data;
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    const sessionId = createSession(user.id, user.username);
    res.cookie('tbm_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'BOOTSTRAP_ADMIN',
        resourceType: 'User',
        resourceId: user.id,
        metadataJson: JSON.stringify({ username }),
      },
    });

    logger.info('AUTH_BOOTSTRAP', `Administrator account [${username}] created successfully.`);

    return res.status(201).json({
      success: true,
      user: { id: user.id, username: user.username },
      sessionId,
    });
  } catch (error) {
    logger.error('AUTH_BOOTSTRAP_ERROR', 'Failed to create initial admin', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal membuat akun awal' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parseResult = AuthInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: parseResult.error.issues[0]?.message || 'Input tidak valid',
      });
    }

    const { username, password } = parseResult.data;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const rateLimitKey = `${clientIp}:${username}`;

    const rateCheck = checkLoginRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: 'TOO_MANY_REQUESTS',
        message: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${rateCheck.waitSeconds} detik.`,
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      recordLoginFailure(rateLimitKey);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Username atau password salah',
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      recordLoginFailure(rateLimitKey);
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Username atau password salah',
      });
    }

    recordLoginSuccess(rateLimitKey);

    const sessionId = createSession(user.id, user.username);
    res.cookie('tbm_session', sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user.id,
      },
    });

    logger.info('AUTH_LOGIN_SUCCESS', `User [${username}] logged in successfully.`);

    return res.json({
      success: true,
      user: { id: user.id, username: user.username },
      sessionId,
    });
  } catch (error) {
    logger.error('AUTH_LOGIN_ERROR', 'Login error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Gagal memproses login' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.tbm_session;
  destroySession(sessionId);
  res.clearCookie('tbm_session');
  return res.json({ success: true, message: 'Berhasil logout' });
});
