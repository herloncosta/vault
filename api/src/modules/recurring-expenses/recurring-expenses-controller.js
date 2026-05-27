import * as recurringExpenseService from "./recurring-expenses-service.js";
import { createRecurringExpenseSchema, updateRecurringExpenseSchema } from "./recurring-expenses-validator.js";

export async function list(req, res, next) {
  try {
    const result = await recurringExpenseService.list(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const expense = await recurringExpenseService.getById(req.user, req.params.id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createRecurringExpenseSchema.parse(req.body);
    const expense = await recurringExpenseService.create(req.user, data);
    res.status(201).json(expense);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateRecurringExpenseSchema.parse(req.body);
    const expense = await recurringExpenseService.update(req.user, req.params.id, data);
    res.json(expense);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await recurringExpenseService.remove(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
