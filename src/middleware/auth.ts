import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt";

export interface AuthenticatedUser {
  emailAddress: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthenticatedRequestWithUser extends Request {
  user: AuthenticatedUser;
}

export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): asserts req is AuthenticatedRequestWithUser {
  const header = req.headers.authorization;

  if (!header) {
    // Public access
    return;
  }
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unsupported Authorization header" });
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { emailAddress: payload.emailAddress };
    next();
  } catch (ex) {
    res.status(401).json({ error: "Invalid or expired access token: " + ex });
  }
}
