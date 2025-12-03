const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs").promises;

async function testCareerVietStructure() {
  console.log("🔍 Test cấu trúc CareerViet...\n");

  const options = new chrome.Options();
  // Tắt headless để xem trực tiếp
  // options.addArguments("--headless=new");
  options.addArguments(
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1920,1080"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    // Test nhiều URL khác nhau
    const urls = [
      "https://careerviet.vn/viec-lam",
      "https://careerviet.vn/viec-lam/tat-ca-viec-lam-vi",
      "https://careerviet.vn/viec-lam/ha-noi-l1-trang-1-vi.html"
    ];

    for (const url of urls) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📍 Testing: ${url}`);
      console.log("=".repeat(80));

      await driver.get(url);
      
      // Đợi load
      await driver.wait(async () => {
        return await driver.executeScript("return document.readyState === 'complete'");
      }, 30000);

      console.log("✅ Trang đã load");

      // Đợi thêm cho JS render
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Phân tích trang
      const analysis = await driver.executeScript(`
        const results = {
          title: document.title,
          url: window.location.href,
          bodyText: document.body.innerText.substring(0, 200),
          
          // Tìm các element có khả năng là job
          jobElements: [],
          
          // Tìm links
          jobLinks: []
        };

        // Tìm tất cả links chứa /viec-lam/
        const allLinks = document.querySelectorAll('a[href*="/viec-lam/"]');
        results.jobLinks = Array.from(allLinks).slice(0, 10).map(a => ({
          text: a.innerText.trim().substring(0, 80),
          href: a.href,
          classes: a.className
        }));

        // Tìm các container có thể chứa jobs
        const possibleContainers = [
          '.job-item',
          '.job-list',
          '[class*="job"]',
          '.list-job',
          'article',
          '[data-job-id]'
        ];

        for (const selector of possibleContainers) {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              results.jobElements.push({
                selector: selector,
                count: elements.length,
                firstHTML: elements[0].outerHTML.substring(0, 300)
              });
            }
          } catch (e) {}
        }

        return results;
      `);

      console.log("\n📊 Kết quả phân tích:");
      console.log(`Title: ${analysis.title}`);
      console.log(`\n📝 Nội dung trang (200 ký tự đầu):`);
      console.log(analysis.bodyText);
      
      console.log(`\n🔗 Job Links tìm thấy: ${analysis.jobLinks.length}`);
      if (analysis.jobLinks.length > 0) {
        console.log("\nMẫu 3 links đầu:");
        analysis.jobLinks.slice(0, 3).forEach((link, i) => {
          console.log(`${i + 1}. ${link.text}`);
          console.log(`   ${link.href}`);
        });
      }

      console.log(`\n📦 Job Elements tìm thấy: ${analysis.jobElements.length}`);
      analysis.jobElements.forEach(el => {
        console.log(`- Selector: ${el.selector} (${el.count} items)`);
      });

      // Lưu HTML
      const html = await driver.getPageSource();
      const filename = `test-${url.replace(/[^a-z0-9]/gi, '-')}.html`;
      await fs.writeFile(filename, html);
      console.log(`\n💾 Đã lưu: ${filename}`);

      // Screenshot
      const screenshot = await driver.takeScreenshot();
      const screenshotFile = filename.replace('.html', '.png');
      await fs.writeFile(screenshotFile, screenshot, 'base64');
      console.log(`📸 Đã lưu: ${screenshotFile}`);

      // Đợi user xem
      console.log("\n⏸️  Browser sẽ đóng sau 10 giây (hoặc nhấn Ctrl+C)...");
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

  } catch (err) {
    console.error("❌ Lỗi:", err.message);
  } finally {
    await driver.quit();
    console.log("\n✅ Done!");
  }
}

testCareerVietStructure();