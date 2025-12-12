import { auth } from '#config/firebaseAdmin';
import { Request, Response, NextFunction } from 'express';

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    // Verify token and check if it has been revoked
    const decodedToken = await auth.verifyIdToken(idToken, true);
    (req as any).user = decodedToken;
    next();
  } catch (error: any) {
    console.error('Error verifying auth token:', error);
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ error: 'Unauthorized: Token revoked' });
    }
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
