import express from "express";
import ProductController from "../controllers/product.controller";
import { uploadImage } from "../middlewares/coudinary.middleware";
import multer from "multer";

const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
const router = express.Router();

router.post("/", upload.single("image"), uploadImage, ProductController.create);
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);
router.put("/:id", ProductController.update);
router.delete("/:id", ProductController.delete);

export default router;
