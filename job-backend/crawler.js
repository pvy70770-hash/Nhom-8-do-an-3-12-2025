console.log("🔥 File crawler.js đang chạy...");

const { Builder, By, until } = require("selenium-webdriver");
const { Pool } = require("pg");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs").promises;
const path = require("path");
require("dotenv").config();

// ⚙️ CẤU HÌNH
const CONFIG = {
  MAX_JOBS: 100,
  SCROLL_TIMES: 5,
  DELAY_BETWEEN_JOBS: 2000,
  MAX_RETRIES: 3,
  PAGE_TIMEOUT: 40000,
  DEBUG_DIR: "./debug",
  WAIT_AFTER_SCROLL: 3000,
};

// 📁 Tạo thư mục debug
async function ensureDebugDir() {
  try {
    await fs.mkdir(CONFIG.DEBUG_DIR, { recursive: true });
  } catch (err) {
    console.error("⚠️ Không tạo được thư mục debug:", err.message);
  }
}

// 🔄 Delay random
function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// 📸 Screenshot
async function takeScreenshot(driver, filename) {
  try {
    const screenshot = await driver.takeScreenshot();
    const filepath = path.join(CONFIG.DEBUG_DIR, `${filename}.png`);
    await fs.writeFile(filepath, screenshot, 'base64');
    console.log(`📸 Screenshot: ${filepath}`);
    return filepath;
  } catch (err) {
    console.error("⚠️ Lỗi screenshot:", err.message);
  }
}

// 🩺 Lưu clean HTML
async function saveCleanDebugHTML(driver, filename) {
  try {
    const bodyHTML = await driver.executeScript(`
      const body = document.body.cloneNode(true);
      body.querySelectorAll('script, style, link[rel="stylesheet"]').forEach(el => el.remove());
      body.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
      return body.innerHTML;
    `);
    
    const cleanHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Debug - ${filename}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; max-width: 1200px; margin: 0 auto; }
    .highlight { background: yellow; padding: 2px 5px; }
    pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
    
    const filepath = path.join(CONFIG.DEBUG_DIR, `${filename}.html`);
    await fs.writeFile(filepath, cleanHTML);
    console.log(`🩺 Clean HTML: ${filepath}`);
    return filepath;
  } catch (err) {
    console.error("⚠️ Lỗi lưu HTML:", err.message);
  }
}

// 🔍 TỰ ĐỘNG TÌM JOB SELECTOR
async function autoDetectJobSelector(driver) {
  console.log("\n🤖 Đang tự động phát hiện job selector...");
  
  try {
    const selectorCandidates = await driver.executeScript(`
      const results = [];
      
      const allLinks = Array.from(document.querySelectorAll('a[href]'));
      const jobLinks = allLinks.filter(a => {
        const href = a.getAttribute('href') || '';
        return href.includes('/viec-lam/') || 
               href.includes('/job/') || 
               href.includes('/vi-tri/') ||
               href.includes('job-id') ||
               a.textContent.trim().length > 10;
      });
      
      console.log('Found job links:', jobLinks.length);
      
      if (jobLinks.length === 0) return results;
      
      const firstLink = jobLinks[0];
      let parent = firstLink.parentElement;
      let level = 0;
      
      while (parent && level < 10) {
        const className = parent.className || '';
        const tagName = parent.tagName.toLowerCase();
        
        const siblings = Array.from(parent.children).filter(child => {
          return child.querySelector('a[href]') !== null;
        });
        
        if (siblings.length >= 3) {
          const selector = className ? 
            '.' + className.split(' ').filter(c => c).join('.') : 
            tagName;
            
          results.push({
            selector: selector + ' > *',
            count: siblings.length,
            sampleHTML: parent.innerHTML.substring(0, 500),
            level: level,
            confidence: siblings.length >= 10 ? 'high' : 'medium'
          });
        }
        
        parent = parent.parentElement;
        level++;
      }
      
      const commonSelectors = [
        { selector: '.job-item', type: 'class' },
        { selector: '[class*="job-item"]', type: 'attribute' },
        { selector: '.list-job > div', type: 'class' },
        { selector: '[class*="job-card"]', type: 'attribute' },
        { selector: 'article', type: 'tag' },
        { selector: '[data-job-id]', type: 'attribute' },
      ];
      
      for (const {selector, type} of commonSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.push({
            selector: selector,
            count: elements.length,
            type: type,
            sampleHTML: elements[0] ? elements[0].outerHTML.substring(0, 500) : '',
            confidence: type === 'attribute' ? 'low' : 'medium'
          });
        }
      }
      
      return results.sort((a, b) => {
        const confScore = { high: 3, medium: 2, low: 1 };
        return (confScore[b.confidence] * b.count) - (confScore[a.confidence] * a.count);
      });
    `);
    
    console.log(`\n🎯 Tìm thấy ${selectorCandidates.length} selector candidates:`);
    selectorCandidates.slice(0, 5).forEach((candidate, i) => {
      console.log(`${i + 1}. "${candidate.selector}" - ${candidate.count} items (${candidate.confidence})`);
    });
    
    const analysisPath = path.join(CONFIG.DEBUG_DIR, 'selector-detection.json');
    await fs.writeFile(analysisPath, JSON.stringify(selectorCandidates, null, 2));
    
    return selectorCandidates;
    
  } catch (err) {
    console.error("⚠️ Lỗi auto-detect:", err.message);
    return [];
  }
}

// 🌐 Hàm crawl với retry
async function crawlWithRetry(retries = CONFIG.MAX_RETRIES) {
  await ensureDebugDir();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 LẦN THỬ ${attempt}/${retries}`);
      console.log("=".repeat(60));
      await crawlJobs();
      console.log("\n✅ CRAWL THÀNH CÔNG!");
      return;
    } catch (err) {
      console.error(`\n❌ Lần thử ${attempt} thất bại:`, err.message);
      if (attempt === retries) {
        console.error("\n💀 Đã thử hết số lần cho phép.");
        throw err;
      }
      console.log(`⏳ Đợi 5s rồi thử lại...`);
      await randomDelay(5000, 7000);
    }
  }
}

async function crawlJobs() {
  console.log("🚀 Bắt đầu crawl từ CareerViet...\n");

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

    const options = new chrome.Options();
    options.addArguments(
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--window-size=1920,1080",
      `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`
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

    console.log("🌐 Đang mở trang CareerViet...");
    await driver.get("https://careerviet.vn/vi/tim-viec-lam");

    console.log("⏳ Đợi trang load...");
    await driver.wait(async () => {
      const state = await driver.executeScript("return document.readyState");
      return state === "complete";
    }, CONFIG.PAGE_TIMEOUT);
    
    console.log("✅ Trang đã load xong!");
    await randomDelay(3000, 5000);
    await takeScreenshot(driver, "01-initial-page");

    console.log(`\n🌀 Bắt đầu scroll ${CONFIG.SCROLL_TIMES} lần...`);
    
    for (let i = 0; i < CONFIG.SCROLL_TIMES; i++) {
      await driver.executeScript(`
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      `);
      
      console.log(`   📜 Scroll ${i + 1}/${CONFIG.SCROLL_TIMES}`);
      await randomDelay(2000, 3000);
      
      await driver.wait(async () => {
        return await driver.executeScript("return document.readyState === 'complete'");
      }, 5000).catch(() => {});
    }
    
    console.log(`✅ Đã scroll xong, đợi ${CONFIG.WAIT_AFTER_SCROLL}ms cho content load...`);
    await randomDelay(CONFIG.WAIT_AFTER_SCROLL, CONFIG.WAIT_AFTER_SCROLL + 1000);
    
    await takeScreenshot(driver, "02-after-scroll");
    await saveCleanDebugHTML(driver, "03-page-after-scroll");

    const selectorCandidates = await autoDetectJobSelector(driver);
    
    if (selectorCandidates.length === 0) {
      throw new Error("Không tìm thấy selector nào! Vui lòng kiểm tra debug files.");
    }

    let jobCards = [];
    let usedSelector = null;
    
    console.log("\n🎯 Thử các selector...");
    
    for (const candidate of selectorCandidates) {
      try {
        console.log(`   Thử: "${candidate.selector}"`);
        const elements = await driver.findElements(By.css(candidate.selector));
        
        if (elements.length >= 3) {
          jobCards = elements;
          usedSelector = candidate.selector;
          console.log(`   ✅ THÀNH CÔNG! Tìm thấy ${elements.length} job`);
          break;
        } else {
          console.log(`   ⚠️ Chỉ có ${elements.length} items, bỏ qua`);
        }
      } catch (err) {
        console.log(`   ❌ Lỗi: ${err.message}`);
      }
    }

    if (jobCards.length === 0) {
      console.error("\n🚫 KHÔNG TÌM THẤY JOB NÀO!");
      throw new Error("Không tìm thấy job sau khi thử tất cả selector!");
    }

    console.log(`\n✅ Sử dụng selector: "${usedSelector}"`);
    console.log(`📦 Tổng số job: ${jobCards.length}\n`);

    const jobLinks = [];
    const maxJobs = Math.min(CONFIG.MAX_JOBS, jobCards.length);

    console.log(`🎯 Bắt đầu extract ${maxJobs} job...\n`);

    for (let i = 0; i < maxJobs; i++) {
      try {
        const job = jobCards[i];

        let title = null;
        let link = null;

        try {
          const jobLinkEl = await job.findElement(By.css("a.job_link"));
          title = (await jobLinkEl.getText()).trim();
          link = await jobLinkEl.getAttribute("href");
        } catch (err) {
          const links = await job.findElements(By.css("a[href*='/tim-viec-lam/']"));
          if (links.length > 0) {
            title = (await links[0].getText()).trim();
            link = await links[0].getAttribute("href");
          }
        }

        if (!title || !link) {
          console.log(`⚠️ Job ${i + 1}: Không có title/link, bỏ qua`);
          continue;
        }

        const company = await job.findElement(
          By.css("a.company-name")
        ).getText().catch(() => "N/A");
        
        const location = await job.findElement(
          By.css(".location")
        ).getText().catch(() => "N/A");
        
        const salary = await job.findElement(
          By.css(".salary")
        ).getText().catch(() => "N/A");

        console.log(`✅ ${i + 1}/${maxJobs}: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
        
        jobLinks.push({ title, company, location, salary, link });
        
      } catch (err) {
        console.warn(`⚠️ Lỗi job ${i + 1}: ${err.message}`);
      }
    }

    console.log(`\n✅ Extract thành công ${jobLinks.length} job`);

    if (jobLinks.length === 0) {
      throw new Error("Không extract được job nào!");
    }

    const jobListPath = path.join(CONFIG.DEBUG_DIR, 'job-list.json');
    await fs.writeFile(jobListPath, JSON.stringify(jobLinks, null, 2));
    console.log(`💾 Đã lưu: ${jobListPath}\n`);

    // === CRAWL CHI TIẾT VÀ LƯU VÀO raw_jobs ===
    console.log("🚀 Bắt đầu crawl chi tiết và lưu vào raw_jobs...\n");
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jobLinks.length; i++) {
      const { title, company, location, salary, link } = jobLinks[i];
      
      try {
        console.log(`📍 [${i + 1}/${jobLinks.length}] ${title.substring(0, 50)}...`);

        await driver.get(link);
        await driver.wait(async () => {
          return await driver.executeScript("return document.readyState === 'complete'");
        }, 15000);

        await randomDelay(1000, 2000);

        // Lấy toàn bộ description dạng HTML
        const descriptionHTML = await driver.executeScript(`
          const descEl = document.querySelector('[class*="description"], [class*="detail-content"], .job-description, .detail-row.reset-bullet');
          return descEl ? descEl.innerHTML : null;
        `).catch(() => null);

        // Lưu vào bảng raw_jobs
        const query = `
          INSERT INTO raw_jobs (
            title, company, location, salary, description, url, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (url) DO NOTHING
          RETURNING id;
        `;
        
        const values = [
          title || null,
          company || null,
          location || null,
          salary || null,
          descriptionHTML || null,
          link || null,
          'CareerViet'
        ];

        const result = await pool.query(query, values);

        if (result.rowCount > 0) {
          successCount++;
          console.log(`   ✅ Lưu thành công (ID: ${result.rows[0].id})`);
        } else {
          skipCount++;
          console.log(`   ⏭️ Đã tồn tại`);
        }

        await randomDelay(CONFIG.DELAY_BETWEEN_JOBS, CONFIG.DELAY_BETWEEN_JOBS + 1000);

      } catch (err) {
        errorCount++;
        console.error(`   ❌ Lỗi: ${err.message}`);
        
        if (errorCount <= 2) {
          await takeScreenshot(driver, `error-detail-${i + 1}`);
        }
        continue;
      }
    }

    // === TỔNG KẾT ===
    console.log("\n" + "=".repeat(60));
    console.log("🎯 TỔNG KẾT CRAWL");
    console.log("=".repeat(60));
    console.log(`Selector sử dụng: ${usedSelector}`);
    console.log(`✅ Lưu thành công:  ${successCount} job`);
    console.log(`⏭️  Đã tồn tại:     ${skipCount} job`);
    console.log(`❌ Lỗi:             ${errorCount} job`);
    console.log(`📊 Tổng cộng:       ${jobLinks.length} job`);
    console.log("=".repeat(60));

  } catch (err) {
    console.error("\n❌ LỖI NGHIÊM TRỌNG:", err.message);
    
    if (driver) {
      await saveCleanDebugHTML(driver, "fatal-error");
      await takeScreenshot(driver, "99-fatal-error");
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

// 🚀 RUN
if (require.main === module) {
  crawlWithRetry().catch(err => {
    console.error("\n💀 CRAWLER DỪNG:", err.message);
    process.exit(1);
  });
}

module.exports = { crawlWithRetry };