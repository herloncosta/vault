import * as categoryService from "./categories-service.js";
import { createCategorySchema, updateCategorySchema } from "./categories-validator.js";

export async function list(req, res, next) {
  try {
    const categories = await categoryService.list(req.user, req.query);
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const category = await categoryService.getById(req.user, req.params.id);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await categoryService.create(req.user, data);
    res.status(201).json(category);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateCategorySchema.parse(req.body);
    const category = await categoryService.update(req.user, req.params.id, data);
    res.json(category);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await categoryService.remove(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
