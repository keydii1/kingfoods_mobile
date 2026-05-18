import "reflect-metadata";
import { chromium } from "playwright";
import { AppDataSource } from "./config/DataSource";
import { Product } from "./Entity/Product";
import * as fs from "fs-extra";
import * as path from "path";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getGoogleImageUrl(
  page: any,
  productName: string
): Promise<string | null> {
  try {
    // 1. Vào Google tìm kiếm
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
      productName
    )}&tbm=isch`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await delay(1500);

    // 2. Tìm ảnh đầu tiên trong kết quả (thẻ img trong grid)
    // Google Images có nhiều selector khác nhau - thử từng cái
    const imgSelectors = [
      'div[data-ri="0"] img',
      'div[jsname="N9Xkfe"] img',
      'g-img img',
      '.rg_i',
      'img.YQ4gaf',
      'div[data-ved] img[src^="https"]',
      'img[src^="https"][width]',
    ];

    let imgSrc: string | null = null;

    for (const selector of imgSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        const imgs = await page.$$(selector);
        for (const img of imgs) {
          const src = await img.getAttribute("src");
          if (
            src &&
            src.startsWith("http") &&
            !src.includes("google") &&
            !src.includes("gstatic.com/images/branding") &&
            src.length > 50
          ) {
            imgSrc = src;
            break;
          }
        }
        if (imgSrc) break;
      } catch (_) {
        continue;
      }
    }

    // 3. Nếu chưa tìm thấy, thử click vào ảnh đầu tiên để lấy URL full-size
    if (!imgSrc) {
      try {
        // Click ảnh đầu tiên
        const firstImg = await page.$('img.YQ4gaf, g-img img, [data-ri="0"] img');
        if (firstImg) {
          await firstImg.click();
          await delay(1500);

          // Sau khi click, panel bên phải mở ra - lấy ảnh lớn
          const bigImgSelectors = [
            'img.sFlh5c',
            'img[data-noaft]',
            '#Sva75c img',
            '.iPVvYb img',
          ];

          for (const sel of bigImgSelectors) {
            try {
              const bigImg = await page.$(sel);
              if (bigImg) {
                const src = await bigImg.getAttribute("src");
                if (
                  src &&
                  src.startsWith("http") &&
                  !src.includes("encrypted-tbn")
                ) {
                  imgSrc = src;
                  break;
                }
              }
            } catch (_) {
              continue;
            }
          }
        }
      } catch (_) {}
    }

    return imgSrc;
  } catch (err: any) {
    console.error(`  ⚠️  Lỗi khi tải Google cho "${productName}":`, err.message?.substring(0, 100));
    return null;
  }
}

async function run() {
  console.log("🔌 Kết nối database...");
  await AppDataSource.initialize();

  const products = await AppDataSource.manager.find(Product);
  console.log(`\n📦 Tổng cộng ${products.length} sản phẩm cần cập nhật ảnh thật từ Google Images.\n`);

  // Khởi động Chrome có thể nhìn thấy để xác thực
  const browser = await chromium.launch({
    headless: true, // headless để chạy nhanh
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
    locale: "vi-VN",
  });

  const page = await context.newPage();

  // Load mapping cũ để fallback
  const mappingFilePath = path.join(__dirname, "../data/product-images-mapping.json");
  const newMapping: { [key: string]: string } = {};

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`🔍 [${i + 1}/${products.length}] Đang tìm ảnh Google cho: "${product.name}"`);

    const imgUrl = await getGoogleImageUrl(page, product.name);

    if (imgUrl) {
      console.log(`  ✅ URL tìm được: ${imgUrl.substring(0, 80)}...`);
      product.image = imgUrl;
      await AppDataSource.manager.save(product);
      newMapping[product.name] = imgUrl;
      successCount++;
    } else {
      console.warn(`  ⚠️  Không lấy được ảnh từ Google - giữ nguyên ảnh cũ.`);
      failCount++;
      // Giữ ảnh cũ trong mapping
      if (product.image) {
        newMapping[product.name] = product.image;
      }
    }

    // Delay giữa các request để tránh bị Google block
    await delay(800);
  }

  await browser.close();

  // Lưu mapping mới
  await fs.ensureDir(path.dirname(mappingFilePath));
  await fs.writeJson(mappingFilePath, newMapping, { spaces: 2 });
  console.log(`\n📁 Đã lưu mapping ảnh mới vào: ${mappingFilePath}`);

  console.log(`\n🎉 HOÀN THÀNH!`);
  console.log(`   ✅ Cập nhật thành công: ${successCount}/${products.length}`);
  console.log(`   ⚠️  Không lấy được ảnh: ${failCount}/${products.length}`);

  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error("❌ Lỗi nghiêm trọng:", err);
  process.exit(1);
});
