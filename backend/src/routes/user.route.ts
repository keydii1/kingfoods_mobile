import express from "express";
import UserController from "../controllers/user.controller";

const router = express.Router();

router.post("/login", UserController.login);
router.post("/", UserController.create);
router.get("/", UserController.getAll);
router.get("/:id", UserController.getById);
router.put("/:id", UserController.update);
router.delete("/:id", UserController.delete);

export default router;
