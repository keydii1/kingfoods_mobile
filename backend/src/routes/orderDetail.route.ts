import express from "express";
import OrderDetailController from "../controllers/orderDetail.controller";

const router = express.Router();

router.post("/", OrderDetailController.create);
router.get("/", OrderDetailController.getAll);
router.get("/:id", OrderDetailController.getById);
router.put("/:id", OrderDetailController.update);
router.delete("/:id", OrderDetailController.delete);

export default router;
