import * as transactionService from "./transactions-service.js";
import { createTransactionSchema, updateTransactionSchema } from "./transactions-validator.js";

export async function list(req, res, next) {
  try {
    const result = await transactionService.list(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const transaction = await transactionService.getById(req.user, req.params.id);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await transactionService.create(req.user, data);
    res.status(201).json(transaction);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = updateTransactionSchema.parse(req.body);
    const transaction = await transactionService.update(req.user, req.params.id, data);
    res.json(transaction);
  } catch (err) {
    if (err.name === "ZodError") {
      return res.status(400).json({ error: err.errors });
    }
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await transactionService.remove(req.user, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
