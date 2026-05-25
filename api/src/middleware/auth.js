import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { isTokenRevoked } from "../modules/auth/auth-service.js";

function extractToken(req) {
  const fromCookie = req.cookies?.accessToken;
  if (fromCookie) return fromCookie;

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.split(" ")[1];

  return null;
}

export async function auth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);

    if (await isTokenRevoked(payload.jti)) {
      return res.status(401).json({ error: "Token has been revoked" });
    }

    req.user = payload;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

export default auth;
