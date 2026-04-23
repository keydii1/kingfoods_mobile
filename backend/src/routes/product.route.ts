import express from "express";
import ProductController from "../controllers/product.controller";
import { uploadImage } from "../middlewares/coudinary.middleware";
import { authentication } from "../middlewares/auth.middleware";
import multer from "multer";

const storage = multer.diskStorage({});
const upload = multer({ storage: storage });
const router = express.Router();

router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

router.use(authentication);

router.post("/", upload.single("image"), uploadImage, ProductController.create);
router.put("/:id", ProductController.update);
router.delete("/:id", ProductController.delete);

export default router;
