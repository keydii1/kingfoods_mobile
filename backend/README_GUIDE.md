# Hướng dẫn sử dụng Day.js & Ts.ED trong dự án

Tài liệu này hướng dẫn cách sử dụng hai thư viện mới đã được tích hợp vào dự án: **Day.js** (xử lý thời gian) và **Ts.ED** (Framework kiến trúc).

---

## 1. Day.js - Thư viện xử lý thời gian siêu nhẹ

Day.js là một thư viện thay thế Moment.js với kích thước cực nhỏ và API tương đồng.

### Tại sao chọn Day.js cho Mobile Backend?
- **Nhẹ**: Chỉ khoảng 2KB.
- **Immutable**: Không thay đổi object gốc khi thao tác.
- **Dễ dùng**: Parse, validate, thao tác và format ngày tháng cực nhanh.

### Cách sử dụng cơ bản:

```typescript
import dayjs from "dayjs";

// 1. Lấy thời gian hiện tại
const now = dayjs();

// 2. Format ngày tháng
console.log(now.format("DD/MM/YYYY HH:mm")); // 23/04/2026 21:30

// 3. Thao tác thời gian
const tomorrow = dayjs().add(1, "day");
const lastMonth = dayjs().subtract(1, "month");

// 4. Kiểm tra sự chênh lệch
const diff = dayjs().diff(dayjs("2026-01-01"), "days");
console.log(`Đã trôi qua ${diff} ngày tính từ đầu năm.`);

// 5. Native JS Date
const date = dayjs().toDate();
```

---

## 2. Ts.ED Framework - Cấu trúc Backend chuyên nghiệp

Ts.ED là một Framework xây dựng trên Express nhưng sử dụng **TypeScript Decorators** (giống NestJS hoặc Spring Boot) để quản lý code.

### Tại sao dùng Ts.ED?
- **Clean Code**: Sử dụng Class và Decorator giúp tách biệt logic rõ ràng.
- **Dependency Injection (DI)**: Tự động quản lý các service.
- **Validation**: Tích hợp sẵn validation dữ liệu từ client.

### Cấu trúc cơ bản của một Controller trong Ts.ED:

```typescript
import { Controller } from "@tsed/common";
import { Get, Post, Put, Delete } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-express";

@Controller("/products") // Tiền tố cho các route trong class này
export class ProductController {

  @Get("/") // Tương đương router.get("/")
  async getAll() {
    return { message: "Lấy danh sách thành công" };
  }

  @Post("/") // Tương đương router.post("/")
  async create(@BodyParams() body: any) {
    console.log(body);
    return { message: "Tạo thành công" };
  }
  
  @Get("/:id")
  async getById(@PathParams("id") id: string) {
    return { id, name: "Product Name" };
  }
}
```

### Cách Server vận hành trong Ts.ED:
Toàn bộ cấu hình (Middleware, Routes, Database) sẽ được tập trung tại file `Server.ts`. Điều này giúp `index.ts` chỉ còn nhiệm vụ bootstrap (khởi chạy) ứng dụng.

---

## 3. PM2 - Quản lý tiến trình (Ưu tiên sau)

PM2 giúp đảm bảo ứng dụng luôn chạy ngầm và tự động khởi động lại nếu bị crash.

### Các lệnh cơ bản:
- `pm2 start dist/index.js --name "my-backend"`: Chạy ứng dụng.
- `pm2 list`: Xem danh sách ứng dụng đang chạy.
- `pm2 logs`: Xem log thời gian thực.
- `pm2 restart all`: Khởi động lại tất cả.
- `pm2 stop all`: Dừng tất cả.
