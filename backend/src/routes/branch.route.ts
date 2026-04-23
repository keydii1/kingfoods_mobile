import express from "express";
import BranchController from "../controllers/branch.controller";

const router = express.Router();

router.post("/", BranchController.create);
router.get("/", BranchController.getAll);
router.get("/:id", BranchController.getById);
router.put("/:id", BranchController.update);
router.delete("/:id", BranchController.delete);

export default router;
