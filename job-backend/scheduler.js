const cron = require("node-cron");
const { crawlWithRetry } = require("./crawler");

console.log("⏰ Scheduler đã khởi động!");
console.log("📅 Sẽ chạy crawler mỗi 6 tiếng một lần");

// Chạy ngay lần đầu khi start
console.log("\n🚀 Chạy crawler lần đầu...");
crawlWithRetry().catch(err => {
  console.error("❌ Lỗi lần đầu:", err.message);
});

// Chạy mỗi 6 tiếng (lúc 0h, 6h, 12h, 18h)
cron.schedule("0 */6 * * *", () => {
  console.log("\n⏰ ============================================");
  console.log(`⏰ Cron job kích hoạt lúc: ${new Date().toLocaleString("vi-VN")}`);
  console.log("⏰ ============================================\n");
  
  crawlWithRetry().catch(err => {
    console.error("❌ Cron job thất bại:", err.message);
  });
});

console.log("✅ Scheduler đang chạy. Nhấn Ctrl+C để dừng.\n");