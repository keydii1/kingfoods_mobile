import express from "express";
import LocationController from "../controllers/location.controller";

const router = express.Router();

router.post("/", LocationController.create);
router.get("/", LocationController.getAll);
router.get("/:id", LocationController.getById);
router.put("/:id", LocationController.update);
router.delete("/:id", LocationController.delete);

export default router;
