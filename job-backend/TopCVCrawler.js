console.log("🔥 TopCV Crawler - Bắt đầu...");

const { Builder, By } = require("selenium-webdriver");
const { Pool } = require("pg");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

// ⚙️ CẤU HÌNH
const CONFIG = {
  MAX_JOBS: 500,
  SCROLL_TIMES: 15,
  DELAY_BETWEEN_JOBS: 1500,
  MAX_RETRIES: 3,
  PAGE_TIMEOUT: 30000,
  DEBUG_DIR: "./debug",
};

async function ensureDebugDir() {
  try {
    await fs.mkdir(CONFIG.DEBUG_DIR, { recursive: true });
  } catch (err) {
    console.error("⚠️ Lỗi tạo thư mục debug:", err.message);
  }
}

function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function takeScreenshot(driver, filename) {
  try {
    const screenshot = await driver.takeScreenshot();
    const filepath = path.join(CONFIG.DEBUG_DIR, `${filename}.png`);
    await fs.writeFile(filepath, screenshot, 'base64');
    console.log(`📸 Screenshot: ${filepath}`);
  } catch (err) {
    console.error("⚠️ Lỗi screenshot:", err.message);
  }
}

async function crawlTopCV() {
  console.log("🚀 Bắt đầu crawl TopCV...\n");

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
    console.log("✅ Kết nối PostgreSQL thành công!\n");

    // Setup Chrome
    const options = new chrome.Options();
    options.addArguments(
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    options.setUserPreferences({
      'profile.default_content_setting_values.notifications': 2,
      'profile.managed_default_content_settings.images': 2
    });

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();

    await driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

    console.log("🌐 Đang mở TopCV...");
    await driver.get("https://www.topcv.vn/viec-lam-tot-nhat");

    console.log("⏳ Đợi trang load...");
    await driver.wait(async () => {
      const state = await driver.executeScript("return document.readyState");
      return state === "complete";
    }, CONFIG.PAGE_TIMEOUT);

    console.log("✅ Trang đã load!");
    await randomDelay(3000, 5000);
    await takeScreenshot(driver, "01-topcv-initial");

    // Scroll để load thêm jobs
    console.log(`\n🌀 Bắt đầu scroll ${CONFIG.SCROLL_TIMES} lần...`);
    
    let previousHeight = 0;
    let noChangeCount = 0;
    
    for (let i = 0; i < CONFIG.SCROLL_TIMES; i++) {
      await driver.executeScript(`
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      `);
      
      console.log(`   📜 Scroll ${i + 1}/${CONFIG.SCROLL_TIMES}`);
      await randomDelay(2000, 3000);
      
      // Kiểm tra có load thêm content không
      const currentHeight = await driver.executeScript("return document.body.scrollHeight");
      if (currentHeight === previousHeight) {
        noChangeCount++;
        if (noChangeCount >= 3) {
          console.log("   ⚠️ Đã đến cuối trang");
          break;
        }
      } else {
        noChangeCount = 0;
      }
      previousHeight = currentHeight;
    }

    console.log("✅ Scroll xong!\n");
    await randomDelay(3000, 4000);
    await takeScreenshot(driver, "02-topcv-after-scroll");

    // Tìm jobs
    console.log("🔍 Đang tìm job links...\n");

    const jobData = await driver.executeScript(`
      const jobs = [];
      const seen = new Set();
      
      // TopCV có nhiều selector khác nhau
      const selectors = [
        'a.transform-job-title',
        '.job-item-2 a',
        '.job-item a',
        '.job-body a',
        'div[class*="job-item"] a',
        'a[href*="/viec-lam/"]',
        'a[href*="job-"]'
      ];
      
      console.log('Thử các selector...');
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          console.log(selector + ': ' + elements.length + ' elements');
          
          elements.forEach(linkEl => {
            const url = linkEl.href;
            
            // Chỉ lấy link job detail
            if (!url || !url.includes('/viec-lam/')) return;
            if (url.includes('#') || url.includes('?page=')) return;
            if (seen.has(url)) return;
            seen.add(url);
            
            // Tìm title
            let title = linkEl.textContent.trim();
            
            // Nếu title ngắn, tìm trong parent
            if (!title || title.length < 10) {
              const parent = linkEl.closest('.job-item-2') || 
                           linkEl.closest('.job-item') || 
                           linkEl.closest('.job-body') ||
                           linkEl.parentElement;
              
              if (parent) {
                const titleEl = parent.querySelector('.title, h3, .job-title, .transform-job-title');
                title = titleEl ? titleEl.textContent.trim() : title;
              }
            }
            
            if (title && title.length >= 10 && title.length <= 200) {
              jobs.push({ title, url });
            }
          });
          
          // Nếu đã tìm thấy nhiều jobs thì dừng
          if (jobs.length > 10) break;
          
        } catch (e) {
          console.log('Error with selector ' + selector + ': ' + e.message);
        }
      }
      
      console.log('Total unique jobs: ' + jobs.length);
      return jobs;
    `);

    console.log(`✅ Tìm thấy ${jobData.length} job links!\n`);

    if (jobData.length === 0) {
      const html = await driver.getPageSource();
      await fs.writeFile(path.join(CONFIG.DEBUG_DIR, 'topcv-page-source.html'), html);
      console.log("💾 Đã lưu page source để debug");
      throw new Error("Không tìm thấy job nào!");
    }

    // Lưu danh sách jobs
    await fs.writeFile(
      path.join(CONFIG.DEBUG_DIR, 'topcv-job-list.json'),
      JSON.stringify(jobData, null, 2)
    );
    console.log(`💾 Đã lưu danh sách ${jobData.length} jobs\n`);

    // === CRAWL CHI TIẾT ===
    console.log("🚀 Bắt đầu crawl chi tiết...\n");

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    const maxJobs = Math.min(CONFIG.MAX_JOBS, jobData.length);

    for (let i = 0; i < maxJobs; i++) {
      const { title, url } = jobData[i];

      try {
        console.log(`📍 [${i + 1}/${maxJobs}] ${title.substring(0, 50)}...`);

        await driver.get(url);
        await driver.wait(async () => {
          return await driver.executeScript("return document.readyState === 'complete'");
        }, 15000);

        await randomDelay(1000, 2000);

        // Lấy thông tin chi tiết
        const details = await driver.executeScript(`
          return {
            title: document.querySelector('h1, .job-detail__info--title, .job-title')?.textContent.trim(),
            company: document.querySelector('.company-name, .company-name-label, .company-info .name')?.textContent.trim(),
            location: document.querySelector('.job-detail__info--section-content-value, .address, .job-location')?.textContent.trim(),
            salary: document.querySelector('.job-detail__info--section-content-value, .salary, .job-salary')?.textContent.trim(),
            description: document.querySelector('.job-description__item--content, .job-description, .detail-content')?.innerHTML
          };
        `);

        // Lưu vào database
        const query = `
          INSERT INTO raw_jobs (
            title, company, location, salary, description, url, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (url) DO UPDATE SET
            title = EXCLUDED.title,
            company = EXCLUDED.company,
            location = EXCLUDED.location,
            salary = EXCLUDED.salary,
            description = EXCLUDED.description
          RETURNING id;
        `;

        const values = [
          details.title || title,
          details.company,
          details.location,
          details.salary,
          details.description,
          url,
          'TopCV'
        ];

        const result = await pool.query(query, values);

        if (result.rows[0]) {
          successCount++;
          console.log(`   ✅ Lưu OK (ID: ${result.rows[0].id})`);
        } else {
          skipCount++;
          console.log(`   ⏭️ Đã tồn tại`);
        }

        await randomDelay(CONFIG.DELAY_BETWEEN_JOBS, CONFIG.DELAY_BETWEEN_JOBS + 1000);

      } catch (err) {
        errorCount++;
        console.error(`   ❌ Lỗi: ${err.message}`);
        
        if (errorCount <= 3) {
          await takeScreenshot(driver, `error-${i + 1}`);
        }
        continue;
      }
    }

    // === TỔNG KẾT ===
    console.log("\n" + "=".repeat(60));
    console.log("🎯 TỔNG KẾT CRAWL");
    console.log("=".repeat(60));
    console.log(`Nguồn: TopCV`);
    console.log(`✅ Lưu thành công:  ${successCount} job`);
    console.log(`⏭️  Đã tồn tại:     ${skipCount} job`);
    console.log(`❌ Lỗi:             ${errorCount} job`);
    console.log(`📊 Tổng cộng:       ${maxJobs} job`);
    console.log("=".repeat(60));

  } catch (err) {
    console.error("\n❌ LỖI NGHIÊM TRỌNG:", err.message);
    
    if (driver) {
      await takeScreenshot(driver, "99-fatal-error");
      const html = await driver.getPageSource();
      await fs.writeFile(path.join(CONFIG.DEBUG_DIR, 'fatal-error-page.html'), html);
    }
    
    throw err;

  } finally {
    console.log("\n🧹 Dọn dẹp...");
    if (driver) {
      await driver.quit();
      console.log("✅ Đã đóng browser");
    }
    await pool.end();
    console.log("✅ Đã đóng DB");
  }
}

// Main function với retry
async function main() {
  await ensureDebugDir();

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 LẦN THỬ ${attempt}/${CONFIG.MAX_RETRIES}`);
      console.log("=".repeat(60));

      await crawlTopCV();

      console.log("\n✅ CRAWL THÀNH CÔNG!");
      return;
    } catch (err) {
      console.error(`\n❌ Lần thử ${attempt} thất bại:`, err.message);
      if (attempt === CONFIG.MAX_RETRIES) {
        console.error("\n💀 Đã thử hết số lần cho phép!");
        process.exit(1);
      }
      console.log(`⏳ Đợi 5s rồi thử lại...`);
      await randomDelay(5000, 7000);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error("\n💀 CRAWLER DỪNG:", err.message);
    process.exit(1);
  });
}

module.exports = { crawlTopCV };