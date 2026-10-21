import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../security/auth.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check cookie or Authorization header
  let sessionId = req.cookies?.tbm_session;
  if (!sessionId && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      sessionId = parts[1];
    }
  }

  const session = validateSession(sessionId);
  if (!session) {
    return res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.',
    });
  }

  req.user = {
    userId: session.userId,
    username: session.username,
  };

  next();
}
