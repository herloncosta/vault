import { Router } from "express";
import * as controller from "./recurring-expenses-controller.js";
import { auth } from "../../middleware/auth.js";

const router = Router();

router.use(auth);

/**
 * @openapi
 * /api/recurring-expenses:
 *   get:
 *     tags: [Recurring Expenses]
 *     summary: List recurring expenses (paginated, with filters)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of recurring expenses
 */
router.get("/", controller.list);

/**
 * @openapi
 * /api/recurring-expenses/{id}:
 *   get:
 *     tags: [Recurring Expenses]
 *     summary: Get a recurring expense by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recurring expense found
 *       404:
 *         description: Recurring expense not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/recurring-expenses:
 *   post:
 *     tags: [Recurring Expenses]
 *     summary: Create a new recurring expense
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, description, dayOfMonth, startDate]
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               dayOfMonth:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 28
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Recurring expense created
 *       400:
 *         description: Validation error
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/recurring-expenses/{id}:
 *   put:
 *     tags: [Recurring Expenses]
 *     summary: Update a recurring expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               dayOfMonth:
 *                 type: integer
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Recurring expense updated
 *       404:
 *         description: Recurring expense not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/recurring-expenses/{id}:
 *   delete:
 *     tags: [Recurring Expenses]
 *     summary: Delete a recurring expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Recurring expense deleted
 *       404:
 *         description: Recurring expense not found
 */
router.delete("/:id", controller.remove);

export default router;
