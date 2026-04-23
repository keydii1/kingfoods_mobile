import express from "express";
import OrderController from "../controllers/order.controller";

const router = express.Router();

router.post("/", OrderController.create);
router.get("/", OrderController.getAll);
router.get("/:id", OrderController.getById);
router.put("/:id", OrderController.update);
router.delete("/:id", OrderController.delete);

export default router;
