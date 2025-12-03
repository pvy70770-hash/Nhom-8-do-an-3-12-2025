const { Builder, By } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs").promises;

async function analyzeJobItem() {
  console.log("🔍 Phân tích cấu trúc .job-item của CareerViet...\n");

  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1920,1080"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    console.log("🌐 Đang mở trang...");
    await driver.get("https://careerviet.vn/vi/tim-viec-lam");

    await driver.wait(async () => {
      return await driver.executeScript("return document.readyState === 'complete'");
    }, 30000);

    console.log("✅ Trang đã load");
    
    // Đợi và scroll
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    for (let i = 0; i < 3; i++) {
      await driver.executeScript("window.scrollBy(0, 800)");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log("✅ Đã scroll xong\n");

    // Phân tích cấu trúc job-item
    const analysis = await driver.executeScript(`
      const results = {
        totalJobItems: 0,
        sampleJobItems: [],
        allSelectors: {
          links: [],
          titles: [],
          companies: [],
          locations: [],
          salaries: []
        }
      };

      const jobItems = document.querySelectorAll('.job-item');
      results.totalJobItems = jobItems.length;

      // Lấy 3 job-item đầu tiên để phân tích
      for (let i = 0; i < Math.min(3, jobItems.length); i++) {
        const item = jobItems[i];
        
        const sample = {
          index: i + 1,
          outerHTML: item.outerHTML.substring(0, 1000),
          innerHTML: item.innerHTML.substring(0, 800),
          
          // Tìm tất cả links trong job-item
          links: [],
          
          // Tìm các elements
          allClasses: [],
          allTags: []
        };

        // Lấy tất cả links
        const links = item.querySelectorAll('a');
        links.forEach(link => {
          sample.links.push({
            href: link.getAttribute('href'),
            text: link.innerText.trim().substring(0, 100),
            className: link.className,
            title: link.getAttribute('title')
          });
        });

        // Lấy tất cả class names
        const allElements = item.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls && !sample.allClasses.includes(cls)) {
                sample.allClasses.push(cls);
              }
            });
          }
          if (!sample.allTags.includes(el.tagName.toLowerCase())) {
            sample.allTags.push(el.tagName.toLowerCase());
          }
        });

        results.sampleJobItems.push(sample);
      }

      // Tìm các selector phổ biến trong TẤT CẢ job-items
      jobItems.forEach(item => {
        // Links
        item.querySelectorAll('a').forEach(a => {
          const cls = a.className;
          if (cls && !results.allSelectors.links.includes(cls)) {
            results.allSelectors.links.push(cls);
          }
        });

        // Titles (thường là h3, h2, hoặc class có chứa "title")
        const titleSelectors = ['h2', 'h3', 'h4', '[class*="title"]', '[class*="name"]'];
        titleSelectors.forEach(sel => {
          try {
            const el = item.querySelector(sel);
            if (el && el.className && !results.allSelectors.titles.includes(el.className)) {
              results.allSelectors.titles.push(el.className);
            }
          } catch(e) {}
        });

        // Companies
        const companySelectors = ['[class*="company"]', '[class*="employer"]'];
        companySelectors.forEach(sel => {
          try {
            const el = item.querySelector(sel);
            if (el && el.className && !results.allSelectors.companies.includes(el.className)) {
              results.allSelectors.companies.push(el.className);
            }
          } catch(e) {}
        });

        // Locations
        const locationSelectors = ['[class*="location"]', '[class*="address"]', '[class*="city"]'];
        locationSelectors.forEach(sel => {
          try {
            const el = item.querySelector(sel);
            if (el && el.className && !results.allSelectors.locations.includes(el.className)) {
              results.allSelectors.locations.push(el.className);
            }
          } catch(e) {}
        });

        // Salaries
        const salarySelectors = ['[class*="salary"]', '[class*="wage"]'];
        salarySelectors.forEach(sel => {
          try {
            const el = item.querySelector(sel);
            if (el && el.className && !results.allSelectors.salaries.includes(el.className)) {
              results.allSelectors.salaries.push(el.className);
            }
          } catch(e) {}
        });
      });

      return results;
    `);

    console.log("=".repeat(80));
    console.log("📊 KẾT QUẢ PHÂN TÍCH");
    console.log("=".repeat(80));
    console.log(`\n📦 Tổng số .job-item: ${analysis.totalJobItems}\n`);

    // In ra cấu trúc 3 job items đầu
    analysis.sampleJobItems.forEach(sample => {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`🎯 JOB ITEM #${sample.index}`);
      console.log("=".repeat(80));
      
      console.log(`\n🔗 Links trong job-item (${sample.links.length}):`);
      sample.links.forEach((link, i) => {
        console.log(`\n  ${i + 1}. Text: "${link.text}"`);
        console.log(`     Href: ${link.href}`);
        console.log(`     Class: ${link.className || '(no class)'}`);
        console.log(`     Title attr: ${link.title || '(no title)'}`);
      });

      console.log(`\n📋 All Classes in this item:`);
      console.log(`   ${sample.allClasses.slice(0, 30).join(', ')}`);

      console.log(`\n🏷️  All Tags:`);
      console.log(`   ${sample.allTags.join(', ')}`);

      console.log(`\n📝 HTML Preview (first 500 chars):`);
      console.log(sample.innerHTML.substring(0, 500));
    });

    console.log(`\n\n${"=".repeat(80)}`);
    console.log("🎯 SELECTORS PHỔ BIẾN TRONG TẤT CẢ JOB-ITEMS");
    console.log("=".repeat(80));
    
    console.log(`\n🔗 Link classes: `);
    console.log(analysis.allSelectors.links.slice(0, 10).join(', ') || '(không tìm thấy)');
    
    console.log(`\n📰 Title classes: `);
    console.log(analysis.allSelectors.titles.slice(0, 10).join(', ') || '(không tìm thấy)');
    
    console.log(`\n🏢 Company classes: `);
    console.log(analysis.allSelectors.companies.slice(0, 10).join(', ') || '(không tìm thấy)');
    
    console.log(`\n📍 Location classes: `);
    console.log(analysis.allSelectors.locations.slice(0, 10).join(', ') || '(không tìm thấy)');
    
    console.log(`\n💰 Salary classes: `);
    console.log(analysis.allSelectors.salaries.slice(0, 10).join(', ') || '(không tìm thấy)');

    // Lưu kết quả
    const outputPath = 'debug/job-item-analysis.json';
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n\n💾 Đã lưu phân tích chi tiết vào: ${outputPath}`);

    console.log("\n\n" + "=".repeat(80));
    console.log("💡 ĐỀ XUẤT SELECTOR CHO CRAWLER");
    console.log("=".repeat(80));

    if (analysis.sampleJobItems.length > 0 && analysis.sampleJobItems[0].links.length > 0) {
      const firstLink = analysis.sampleJobItems[0].links[0];
      console.log("\nDựa vào phân tích, có thể dùng:");
      
      if (firstLink.className) {
        console.log(`1. By class: .${firstLink.className.split(' ')[0]}`);
      }
      if (firstLink.href && firstLink.href.includes('/vi/')) {
        console.log(`2. By href: a[href*="/vi/tim-viec-lam/"]`);
      }
      console.log(`3. Generic: .job-item a[href]`);
    }

  } catch (err) {
    console.error("❌ Lỗi:", err.message);
    console.error(err.stack);
  } finally {
    await driver.quit();
    console.log("\n✅ Done!");
  }
}

analyzeJobItem();