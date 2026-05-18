import "reflect-metadata";
import { AppDataSource } from "./config/DataSource";
import { Product } from "./Entity/Product";
import * as https from "https";

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { resolve(data); });
    }).on("error", (err) => { reject(err); });
  });
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("🔌 Đang khởi tạo kết nối cơ sở dữ liệu...");
  await AppDataSource.initialize();
  
  console.log("📦 Đang lấy danh sách tất cả các sản phẩm từ database...");
  const products = await AppDataSource.manager.find(Product);
  console.log(`🔎 Tìm thấy ${products.length} sản phẩm cần cập nhật hình ảnh.`);

  const forbiddenKeywords = [
    "bing.com", "microsoft.com", "w3.org", "placehold", 
    "logo", "favicon", "sharing", "avatar", "icon", "simg", 
    "pixel", "banner", "default", "loader"
  ];

  let successCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n🔄 [${i + 1}/${products.length}] Đang xử lý: "${product.name}"...`);

    try {
      // 1. Gửi truy vấn tìm kiếm hình ảnh
      const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(product.name)}`;
      const html = await fetchHtml(searchUrl);

      // 2. Trích xuất tất cả các link ảnh
      const regex = /https?:\/\/[^\s"'\x27\\><&]+?\.(jpg|jpeg|png|webp)/gi;
      const urls: string[] = [];
      let match;
      while ((match = regex.exec(html)) !== null) {
        const url = match[0];
        const lowerUrl = url.toLowerCase();
        const isForbidden = forbiddenKeywords.some(keyword => lowerUrl.includes(keyword));
        if (!isForbidden) {
          urls.push(url);
        }
      }

      if (urls.length > 0) {
        // Lấy link ảnh đầu tiên tìm thấy
        const bestUrl = urls[0];
        console.log(`✨ Đã tìm thấy ảnh thật tuyệt đẹp: ${bestUrl}`);

        // Cập nhật vào DB
        product.image = bestUrl;
        await AppDataSource.manager.save(product);
        successCount++;
      } else {
        console.warn(`⚠️ Không tìm thấy link ảnh thực tế nào cho: "${product.name}"`);
      }
    } catch (err: any) {
      console.error(`❌ Lỗi khi tải ảnh cho "${product.name}":`, err.message || err);
    }

    // Delay 200ms giữa các request để đảm bảo an toàn và không bị chặn
    await delay(200);
  }

  console.log(`\n🎉 Hoàn thành cập nhật! Đã cập nhật thành công ${successCount}/${products.length} sản phẩm.`);
  await AppDataSource.destroy();
}

run().catch(err => console.error(err));
