import crypto from "node:crypto";
import prisma from "../../config/database.js";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";

function jti() {
  return crypto.randomUUID();
}

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti: jti() },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: "refresh" },
    env.jwtSecret,
    { expiresIn: env.jwtRefreshExpiresIn },
  );
}

async function logAccess({ userId, action, ip, userAgent, metadata }) {
  await prisma.accessLog.create({
    data: { userId, action, ip, userAgent, metadata: metadata ?? undefined },
  });
}

function parseExpiry(ms) {
  return new Date(Date.now() + ms);
}

function msFromDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return num * 1000;
    case "m": return num * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "d": return num * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export async function register(data, reqInfo) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const password = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: { email: data.email, password, name: data.name ?? null, role: "OPERATOR" },
    select: { id: true, email: true, name: true, role: true, monthlyBudget: true, createdAt: true },
  });

  await logAccess({
    userId: user.id,
    action: "REGISTER",
    ip: reqInfo?.ip,
    userAgent: reqInfo?.userAgent,
  });

  return user;
}

export async function login(data, reqInfo) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const valid = await argon2.verify(user.password, data.password);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = jwt.decode(refreshToken);
  await prisma.refreshToken.create({
    data: {
      tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      userId: user.id,
      expiresAt: new Date(decoded.exp * 1000),
    },
  });

  await logAccess({
    userId: user.id,
    action: "LOGIN",
    ip: reqInfo?.ip,
    userAgent: reqInfo?.userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      monthlyBudget: user.monthlyBudget,
    },
  };
}

export async function refreshToken(refreshTokenStr, reqInfo) {
  let decoded;
  try {
    decoded = jwt.verify(refreshTokenStr, env.jwtSecret);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }

  if (decoded.type !== "refresh") {
    const err = new Error("Invalid token type");
    err.status = 401;
    throw err;
  }

  const tokenHash = crypto.createHash("sha256").update(refreshTokenStr).digest("hex");
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored) {
    const err = new Error("Refresh token has been revoked");
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);
  const newDecoded = jwt.decode(newRefreshToken);
  await prisma.refreshToken.create({
    data: {
      tokenHash: crypto.createHash("sha256").update(newRefreshToken).digest("hex"),
      userId: user.id,
      expiresAt: new Date(newDecoded.exp * 1000),
    },
  });

  await logAccess({
    userId: user.id,
    action: "REFRESH_TOKEN",
    ip: reqInfo?.ip,
    userAgent: reqInfo?.userAgent,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      monthlyBudget: user.monthlyBudget,
    },
  };
}

export async function logout(userId, tokenJti, reqInfo) {
  const decoded = jwt.decode(tokenJti);
  const exp = decoded?.exp ?? Math.floor(Date.now() / 1000) + 3600;

  await prisma.revokedToken.create({
    data: {
      jti: tokenJti,
      userId,
      expiresAt: new Date(exp * 1000),
    },
  });

  await prisma.refreshToken.deleteMany({ where: { userId } });

  await logAccess({
    userId,
    action: "LOGOUT",
    ip: reqInfo?.ip,
    userAgent: reqInfo?.userAgent,
    metadata: { revokedJti: tokenJti },
  });
}

export async function isTokenRevoked(jti) {
  const found = await prisma.revokedToken.findUnique({ where: { jti } });
  return !!found;
}

export async function getProfile(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, monthlyBudget: true, createdAt: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return user;
}

export async function setBudget(userId, monthlyBudget) {
  return prisma.user.update({
    where: { id: userId },
    data: { monthlyBudget },
    select: { id: true, email: true, name: true, role: true, monthlyBudget: true, createdAt: true },
  });
}

export async function cleanupExpiredTokens() {
  await prisma.revokedToken.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
  await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lte: new Date() } },
  });
}
