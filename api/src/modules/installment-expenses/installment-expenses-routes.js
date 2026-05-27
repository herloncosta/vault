import { Router } from "express";
import * as controller from "./installment-expenses-controller.js";
import { auth } from "../../middleware/auth.js";

const router = Router();

router.use(auth);

/**
 * @openapi
 * /api/installment-expenses:
 *   get:
 *     tags: [Installment Expenses]
 *     summary: List installment expenses (paginated, with filters)
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
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT_CARD, CARNE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Paginated list of installment expenses
 */
router.get("/", controller.list);

/**
 * @openapi
 * /api/installment-expenses/{id}:
 *   get:
 *     tags: [Installment Expenses]
 *     summary: Get an installment expense by ID
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
 *         description: Installment expense found
 *       404:
 *         description: Installment expense not found
 */
router.get("/:id", controller.getById);

/**
 * @openapi
 * /api/installment-expenses:
 *   post:
 *     tags: [Installment Expenses]
 *     summary: Create a new installment expense with auto-generated installments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [description, totalAmount, installmentCount, type, firstDueDate]
 *             properties:
 *               description:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               installmentCount:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 120
 *               type:
 *                 type: string
 *                 enum: [CREDIT_CARD, CARNE]
 *               category:
 *                 type: string
 *               firstDueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Installment expense created
 *       400:
 *         description: Validation error
 */
router.post("/", controller.create);

/**
 * @openapi
 * /api/installment-expenses/{id}:
 *   put:
 *     tags: [Installment Expenses]
 *     summary: Update an installment expense (metadata only, not installments)
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
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [CREDIT_CARD, CARNE]
 *               category:
 *                 type: string
 *               firstDueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Installment expense updated
 *       404:
 *         description: Installment expense not found
 */
router.put("/:id", controller.update);

/**
 * @openapi
 * /api/installment-expenses/{id}:
 *   delete:
 *     tags: [Installment Expenses]
 *     summary: Delete an installment expense and all its installments
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
 *         description: Installment expense deleted
 *       404:
 *         description: Installment expense not found
 */
router.delete("/:id", controller.remove);

/**
 * @openapi
 * /api/installment-expenses/installments/{installmentId}/paid:
 *   patch:
 *     tags: [Installment Expenses]
 *     summary: Mark an installment as paid or unpaid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: installmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paid]
 *             properties:
 *               paid:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Installment updated
 *       404:
 *         description: Installment not found
 */
router.patch("/installments/:installmentId/paid", controller.updateInstallmentPaid);

export default router;
