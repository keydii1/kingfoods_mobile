import express from "express";
import BranchController from "../controllers/branch.controller";
import { authentication } from "../middlewares/auth.middleware";
import { adminOnly } from "../middlewares/role.middleware";

const router = express.Router();

router.get("/", BranchController.getAll);
router.get("/:id", BranchController.getById);

router.use(authentication);
router.use(adminOnly);

router.post("/", BranchController.create);
router.put("/:id", BranchController.update);
router.delete("/:id", BranchController.delete);

export default router;
