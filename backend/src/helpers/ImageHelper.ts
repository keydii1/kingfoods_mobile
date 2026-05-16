import { v2 as cloudinary } from "cloudinary";
import * as PImage from "pureimage";
import * as fs from "fs-extra";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export class ImageHelper {
  private static fontLoaded = false;
  private static fontAttempted = false;

  private static async ensureFont() {
    if (this.fontLoaded || this.fontAttempted) return;
    this.fontAttempted = true;
    
    const fontPath = "/System/Library/Fonts/Supplemental/Arial.ttf";
    if (await fs.pathExists(fontPath)) {
        console.log(`📜 Đang thử nạp font hệ thống một lần duy nhất (timeout 5s)...`);
        try {
            const font = PImage.registerFont(fontPath, "Arial");
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Font load timeout")), 5000);
                (font as any).load(() => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
            this.fontLoaded = true;
            console.log("✅ Đã nạp font thành công! Các ảnh sẽ có chữ.");
        } catch (err) {
            console.warn("⚠️ Không thể nạp font nhanh. Chuyển sang chế độ vẽ đồ họa tốc độ cao.");
        }
    }
  }

  static async createAndUpload(
    folder: string,
    fileName: string,
    text: string,
    color: string = "#f0f0f0"
  ): Promise<string> {
    const uploadDir = path.join(process.cwd(), "uploads", folder);
    await fs.ensureDir(uploadDir);

    const safeFileName = fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .toLowerCase();
      
    const localPath = path.join(uploadDir, `${safeFileName}.png`);

    try {
      const width = 640;
      const height = 480;
      const img = PImage.make(width, height);
      const ctx = img.getContext("2d");

      // 1. Vẽ nền trắng
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // 2. Vẽ dải màu Header
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, 120);

      await this.ensureFont();

      if (this.fontLoaded) {
          // VẼ CÓ FONT
          ctx.fillStyle = "#ffffff";
          ctx.font = "24pt Arial";
          ctx.fillText("KINGFOODS", 50, 75);

          ctx.fillStyle = "#333333";
          ctx.font = "20pt Arial";
          const displayTxt = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
          const truncatedTxt = displayTxt.length > 40 ? displayTxt.substring(0, 37) + "..." : displayTxt;
          ctx.fillText(truncatedTxt, 50, 250);

          ctx.font = "14pt Arial";
          ctx.fillStyle = "#666666";
          ctx.fillText("San pham KingFoods chinh hang", 50, 300);
      } else {
          // VẼ DỰ PHÒNG (Nếu font lỗi)
          ctx.fillStyle = "#333333";
          ctx.fillRect(50, 50, 200, 30); // Giả lập logo
          
          // Vẽ một khối màu lớn ở giữa để phân biệt
          ctx.fillStyle = color;
          ctx.fillRect(100, 150, 440, 200);
          
          // Vẽ ký tự đầu tiên của tên bằng khối vuông
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(120, 170, 60, 60);
      }

      // 3. Chèn watermark tên file ở góc dưới để dễ kiểm soát
      ctx.fillStyle = "#999999";
      ctx.fillRect(0, height - 40, width, 40);
      // (Không dùng fillText ở đây để an toàn nếu font lỗi)

      await PImage.encodePNGToStream(img, fs.createWriteStream(localPath));
      console.log(`💾 Đã lưu local: ${localPath}`);

      // 2. Upload lên Cloudinary
      const result = await cloudinary.uploader.upload(localPath, {
        folder: `kingfoods/${folder}`,
        public_id: safeFileName,
        overwrite: true,
      });
      console.log(`☁️ Cloudinary URL: ${result.secure_url}`);
      return result.secure_url;
    } catch (error) {
      console.error(`❌ Lỗi xử lý ảnh cho ${fileName}:`, error);
      return `https://placehold.co/640x480?text=${encodeURIComponent(text)}`;
    }
  }
}
