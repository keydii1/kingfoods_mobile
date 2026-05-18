import "reflect-metadata";
import { AppDataSource } from "./config/DataSource";
import { Product } from "./Entity/Product";
import * as fs from "fs-extra";
import * as path from "path";

async function run() {
  console.log("🔌 Đang kết nối cơ sở dữ liệu để lưu mapping ảnh...");
  await AppDataSource.initialize();

  const products = await AppDataSource.manager.find(Product);
  const mapping: { [key: string]: string } = {};

  for (const product of products) {
    if (product.image && !product.image.includes("unsplash.com") && !product.image.includes("placehold.co")) {
      mapping[product.name] = product.image;
    }
  }

  const mappingFilePath = path.join(__dirname, "../data/product-images-mapping.json");
  await fs.ensureDir(path.dirname(mappingFilePath));
  await fs.writeJson(mappingFilePath, mapping, { spaces: 2 });

  console.log(`✅ Đã lưu ${Object.keys(mapping).length} mapping ảnh sản phẩm thật vào file: ${mappingFilePath}`);
  await AppDataSource.destroy();
}

run().catch(err => console.error(err));
