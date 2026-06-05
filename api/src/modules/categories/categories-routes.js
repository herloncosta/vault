import { Router } from "express";
import * as controller from "./categories-controller.js";
import { auth } from "../../middleware/auth.js";

const router = Router();

router.use(auth);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
