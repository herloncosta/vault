import * as userService from "./users-service.js";
import { createUserSchema, updateUserSchema } from "./users-validator.js";

export async function list(req, res, next) {
  try {
    const users = await userService.list();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await userService.getById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.create(data);
    res.status(201).json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateUserSchema.parse(req.body);
    if (req.params.id === req.user.id && data.role && data.role !== req.user.role) {
      return res.status(403).json({ error: "You cannot change your own role" });
    }
    const user = await userService.update(req.params.id, data);
    res.json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account; use DELETE /api/auth/me instead" });
    }
    await userService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
