import winston from "winston";
import path from "path";

// 1. Định nghĩa các cấp độ log (Levels)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// 2. Định nghĩa màu sắc cho từng cấp độ (để hiện thị trên console)
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};
winston.addColors(colors);

// 3. Cấu hình định dạng log (Format)
const format = winston.format.combine(
  // Thêm mốc thời gian
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  // Cho phép sử dụng màu sắc
  winston.format.colorize({ all: true }),
  // Định dạng dòng log cuối cùng
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// 4. Định nghĩa nơi lưu log (Transports)
const transports = [
  // Hiển thị ra Console
  new winston.transports.Console(),

  // Ghi các lỗi nghiêm trọng vào file error.log
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/error.log"),
    level: "error",
  }),

  // Ghi tất cả log vào file combined.log
  new winston.transports.File({
    filename: path.join(__dirname, "../../logs/combined.log"),
  }),
];

// 5. Khởi tạo logger
const logger = winston.createLogger({
  level: "debug",

  levels,
  format,
  transports,
});

export default logger;
