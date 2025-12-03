console.log("⚡ CRAWLER NHANH - Không vào detail page");

const { Builder, By } = require("selenium-webdriver");
const { Pool } = require("pg");
const chrome = require("selenium-webdriver/chrome");
require("dotenv").config();

// ⚙️ CẤU HÌNH
const CONFIG = {
  MAX_JOBS: 300,  // Target 300 jobs
  BATCH_SIZE: 50,  // Lưu theo batch
};

function randomDelay(min = 500, max = 1500) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function crawlJobsFast() {
  console.log("🚀 Bắt đầu crawl NHANH từ CareerViet...\n");

  // Kết nối DB
  const isLocal = process.env.DB_HOST === "localhost";
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  let driver;

  try {
    await pool.connect();
    console.log("✅ Kết nối PostgreSQL thành công!");

    // Chrome headless
    const options = new chrome.Options();
    options.addArguments(
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1920,1080",
      "--disable-images",  // Tắt ảnh để load nhanh hơn
      "--blink-settings=imagesEnabled=false"
    );

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    console.log("🌐 Đang mở trang CareerViet...");
    await driver.get("https://careerviet.vn/vi/tim-viec-lam");

    await driver.wait(async () => {
      return await driver.executeScript("return document.readyState === 'complete'");
    }, 30000);

    console.log("✅ Trang đã load");
    await randomDelay(2000, 3000);

    // Scroll thông minh - scroll cho đến khi đạt target hoặc không load thêm
    console.log(`\n🌀 Bắt đầu scroll để load job (target: ${CONFIG.MAX_JOBS} jobs)...\n`);
    
    let previousCount = 0;
    let currentCount = 0;
    let noChangeCount = 0;
    let scrollAttempt = 0;
    const maxScrollAttempts = 50; // Tối đa 50 lần scroll
    
    while (scrollAttempt < maxScrollAttempts) {
      // Scroll xuống cuối trang
      await driver.executeScript("window.scrollTo(0, document.body.scrollHeight)");
      await randomDelay(1500, 2500);
      
      // Đếm số job hiện tại
      const jobCards = await driver.findElements(By.css(".job-item"));
      currentCount = jobCards.length;
      
      scrollAttempt++;
      
      // Log progress
      if (scrollAttempt % 5 === 0 || currentCount !== previousCount) {
        console.log(`   Scroll ${scrollAttempt}: ${currentCount} jobs`);
      }
      
      // Kiểm tra điều kiện dừng
      if (currentCount >= CONFIG.MAX_JOBS) {
        console.log(`   ✅ Đã đạt target ${CONFIG.MAX_JOBS} jobs!`);
        break;
      }
      
      // Nếu không load thêm job sau 3 lần scroll
      if (currentCount === previousCount) {
        noChangeCount++;
        if (noChangeCount >= 3) {
          console.log(`   ⚠️ Không load thêm job, dừng scroll (tìm được ${currentCount} jobs)`);
          break;
        }
      } else {
        noChangeCount = 0; // Reset counter nếu có job mới
      }
      
      previousCount = currentCount;
      
      // Scroll lên một chút rồi xuống lại (trick để trigger lazy load)
      if (scrollAttempt % 10 === 0) {
        await driver.executeScript("window.scrollBy(0, -500)");
        await randomDelay(500, 1000);
      }
    }

    console.log(`\n✅ Hoàn thành scroll sau ${scrollAttempt} lần`);
    console.log(`📦 Tổng số job trên trang: ${currentCount}\n`);

    // Lấy tất cả job-items
    const jobCards = await driver.findElements(By.css(".job-item"));
    const totalJobs = Math.min(CONFIG.MAX_JOBS, jobCards.length);
    
    console.log(`⚡ Sẽ crawl ${totalJobs} job\n`);

    // === CRAWL TẤT CẢ JOB MỘT LẦN ===
    const jobsData = [];
    
    console.log("🎯 Bắt đầu extract dữ liệu...\n");
    
    for (let i = 0; i < totalJobs; i++) {
      try {
        const job = jobCards[i];

        // Lấy thông tin nhanh
        const titleEl = await job.findElement(By.css("a.job_link")).catch(() => null);
        if (!titleEl) {
          console.log(`⚠️ Job ${i + 1}: Bỏ qua`);
          continue;
        }

        const title = (await titleEl.getText()).trim();
        const link = await titleEl.getAttribute("href");
        
        const company = await job.findElement(By.css("a.company-name"))
          .getText().catch(() => "N/A");
        
        const location = await job.findElement(By.css(".location"))
          .getText().catch(() => "N/A");
        
        const salary = await job.findElement(By.css(".salary"))
          .getText().catch(() => "N/A");

        // Lấy thêm thông tin từ trang list (nếu có)
        const deadline = await job.findElement(By.css(".time"))
          .getText().catch(() => null);

        jobsData.push({
          title,
          company,
          location,
          salary,
          url: link,
          source: "careerviet",
          description: JSON.stringify({ 
            deadline,
            crawled_from: "list_page",
            crawled_at: new Date().toISOString()
          })
        });

        if ((i + 1) % 10 === 0 || i === totalJobs - 1) {
          console.log(`   ✅ Extracted ${i + 1}/${totalJobs} jobs`);
        }

      } catch (err) {
        console.warn(`   ⚠️ Lỗi job ${i + 1}: ${err.message}`);
      }
    }

    console.log(`\n✅ Hoàn thành extract: ${jobsData.length} jobs`);
    console.log("\n💾 Bắt đầu lưu vào database...\n");

    // === LƯU VÀO DB THEO BATCH (NHANH HƠN) ===
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Chia thành các batch
    for (let i = 0; i < jobsData.length; i += CONFIG.BATCH_SIZE) {
      const batch = jobsData.slice(i, i + CONFIG.BATCH_SIZE);
      
      console.log(`📦 Batch ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}: Lưu ${batch.length} jobs...`);

      // Lưu từng job trong batch
      for (const jobData of batch) {
        try {
          const result = await pool.query(
            `INSERT INTO raw_jobs (title, company, location, salary, description, url, source)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (url) DO NOTHING
             RETURNING id`,
            [
              jobData.title,
              jobData.company,
              jobData.location,
              jobData.salary,
              jobData.description,
              jobData.url,
              jobData.source
            ]
          );

          if (result.rowCount > 0) {
            successCount++;
          } else {
            skipCount++;
          }

        } catch (err) {
          errorCount++;
          console.error(`   ❌ Lỗi lưu "${jobData.title}": ${err.message}`);
        }
      }

      console.log(`   ✅ Batch hoàn thành: ${successCount} saved, ${skipCount} skipped, ${errorCount} errors\n`);
    }

    // === TỔNG KẾT ===
    console.log("\n" + "=".repeat(70));
    console.log("🎯 TỔNG KẾT CRAWL NHANH");
    console.log("=".repeat(70));
    console.log(`⚡ Tốc độ:        NHANH (không vào detail page)`);
    console.log(`📊 Tổng jobs:     ${jobsData.length}`);
    console.log(`✅ Lưu thành công: ${successCount}`);
    console.log(`⏭️  Đã tồn tại:     ${skipCount}`);
    console.log(`❌ Lỗi:            ${errorCount}`);
    console.log("=".repeat(70));

  } catch (err) {
    console.error("\n❌ LỖI:", err.message);
    throw err;
  } finally {
    console.log("\n🧹 Dọn dẹp...");
    if (driver) await driver.quit();
    await pool.end();
    console.log("✅ Done!");
  }
}

// RUN
if (require.main === module) {
  const startTime = Date.now();
  
  crawlJobsFast()
    .then(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n⏱️  Tổng thời gian: ${elapsed}s`);
    })
    .catch(err => {
      console.error("💀 CRAWLER DỪNG:", err.message);
      process.exit(1);
    });
}

module.exports = { crawlJobsFast };