import express from "express";
import LocationController from "../controllers/location.controller";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

const router = express.Router();

router.get("/", LocationController.getAll);
router.get("/:id", LocationController.getById);

router.use(authentication);
router.use(adminOnly);

router.post("/", LocationController.create);
router.put("/:id", LocationController.update);
router.delete("/:id", LocationController.delete);

export default router;
