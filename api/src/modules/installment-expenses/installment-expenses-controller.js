import * as installmentExpenseService from "./installment-expenses-service.js";
import {
  createInstallmentExpenseSchema,
  updateInstallmentExpenseSchema,
  updateInstallmentPaidSchema,
} from "./installment-expenses-validator.js";

export async function list(req, res, next) {
  try {
    const result = await installmentExpenseService.list(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const expense = await installmentExpenseService.getById(req.user, req.params.id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createInstallmentExpenseSchema.parse(req.body);
    const expense = await installmentExpenseService.create(req.user, data);
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
    const data = updateInstallmentExpenseSchema.parse(req.body);
    const expense = await installmentExpenseService.update(req.user, req.params.id, data);
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
    await installmentExpenseService.remove(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function updateInstallmentPaid(req, res, next) {
  try {
    const data = updateInstallmentPaidSchema.parse(req.body);
    const installment = await installmentExpenseService.updateInstallmentPaid(req.user, req.params.installmentId, data);
    res.json(installment);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.issues });
    }
    next(err);
  }
}
