import * as userService from "./users-service.js";
import { createUserSchema, updateUserSchema } from "./users-validator.js";

export async function list(req, res, next) {
  try {
    const users = await userService.list(req.user);
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const user = await userService.getById(req.user, req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await userService.create(req.user, data);
    res.status(201).json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.update(req.user, req.params.id, data);
    res.json(user);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await userService.remove(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
