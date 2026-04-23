import express from "express";
import CategoryController from "../controllers/category.controller";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

const router = express.Router();

router.get("/", CategoryController.getAll);
router.get("/:id", CategoryController.getById);

router.use(authentication);
router.use(adminOnly);

router.post("/", CategoryController.create);
router.put("/:id", CategoryController.update);
router.delete("/:id", CategoryController.delete);

export default router;
