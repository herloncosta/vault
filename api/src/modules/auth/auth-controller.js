import * as authService from "./auth-service.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from "./auth-validator.js";
import env from "../../config/env.js";

const isSecure = env.nodeEnv === "production";

const accessCookieOpts = {
  httpOnly: true,
  secure: isSecure,
  sameSite: "strict",
  path: "/",
};

const refreshCookieOpts = {
  httpOnly: true,
  secure: isSecure,
  sameSite: "strict",
  path: "/api/auth",
};

function reqInfo(req) {
  return {
    ip: req.ip || req.socket?.remoteAddress,
    userAgent: req.headers["user-agent"],
  };
}

function msFromDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await authService.register(data, reqInfo(req));
    res.status(201).json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data, reqInfo(req));

    res
      .cookie("accessToken", result.accessToken, {
        ...accessCookieOpts,
        maxAge: msFromDuration(env.jwtExpiresIn),
      })
      .cookie("refreshToken", result.refreshToken, {
        ...refreshCookieOpts,
        maxAge: msFromDuration(env.jwtRefreshExpiresIn),
      })
      .json({ user: result.user });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const refreshTokenStr = req.cookies?.refreshToken;
    if (!refreshTokenStr) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const result = await authService.refreshToken(
      refreshTokenStr,
      reqInfo(req),
    );

    res
      .cookie("accessToken", result.accessToken, {
        ...accessCookieOpts,
        maxAge: msFromDuration(env.jwtExpiresIn),
      })
      .cookie("refreshToken", result.refreshToken, {
        ...refreshCookieOpts,
        maxAge: msFromDuration(env.jwtRefreshExpiresIn),
      })
      .json({ user: result.user });
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const accessJti = req.user.jti;
    await authService.logout(req.user.id, accessJti || req.token, reqInfo(req));

    res
      .clearCookie("accessToken", accessCookieOpts)
      .clearCookie("refreshToken", refreshCookieOpts)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateBudget(req, res, next) {
  try {
    const { monthlyBudget } = req.body;
    if (typeof monthlyBudget !== "number" || !Number.isFinite(monthlyBudget) || monthlyBudget < 0) {
      return res.status(400).json({ error: "monthlyBudget must be a positive number" });
    }
    const user = await authService.setBudget(req.user.id, monthlyBudget);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await authService.updateProfile(req.user.id, data);
    res.json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function deleteMyAccount(req, res, next) {
  try {
    await authService.deleteMyAccount(req.user.id);
    res
      .clearCookie("accessToken", accessCookieOpts)
      .clearCookie("refreshToken", refreshCookieOpts)
      .status(204)
      .end();
  } catch (err) {
    next(err);
  }
}
