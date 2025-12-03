const fs = require("fs").promises;
const path = require("path");

async function analyzeDebugHTML1() {
  try {
    const htmlPath = path.join(__dirname, "debug", "fatal-error.html");
    const html = await fs.readFile(htmlPath, "utf-8");
    
    console.log("🔍 PHÂN TÍCH CẤU TRÚC HTML\n");
    
    // Tìm các class có chứa "job"
    const jobClassRegex = /class="([^"]*job[^"]*)"/gi;
    const jobClasses = new Set();
    let match;
    
    while ((match = jobClassRegex.exec(html)) !== null) {
      jobClasses.add(match[1]);
    }
    
    console.log("📋 Các class chứa 'job':");
    console.log(Array.from(jobClasses).slice(0, 20).join("\n"));
    
    // Tìm các thẻ a có href chứa việc làm
    const linkRegex = /<a[^>]*href="([^"]*(?:viec-lam|job)[^"]*)"[^>]*>([^<]*)<\/a>/gi;
    const links = [];
    
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({ href: match[1], text: match[2].trim() });
    }
    
    console.log("\n🔗 Các link việc làm tìm thấy:");
    console.log(`Tổng số: ${links.length} link`);
    if (links.length > 0) {
      console.log("\nMẫu 5 link đầu:");
      links.slice(0, 5).forEach((link, i) => {
        console.log(`${i + 1}. ${link.text}`);
        console.log(`   ${link.href}\n`);
      });
    }
    
    // Tìm cấu trúc container
    const containerPatterns = [
      /class="([^"]*list[^"]*)"/gi,
      /class="([^"]*container[^"]*)"/gi,
      /class="([^"]*grid[^"]*)"/gi,
      /id="([^"]*job[^"]*)"/gi
    ];
    
    console.log("\n📦 Các container có thể chứa job list:");
    containerPatterns.forEach(pattern => {
      const matches = new Set();
      while ((match = pattern.exec(html)) !== null) {
        matches.add(match[1]);
      }
      if (matches.size > 0) {
        console.log(Array.from(matches).slice(0, 10).join(", "));
      }
    });
    
    // Tìm data attributes
    const dataAttrRegex = /data-[a-z-]+=["'][^"']*["']/gi;
    const dataAttrs = new Set();
    
    while ((match = dataAttrRegex.exec(html)) !== null) {
      const attrName = match[0].split("=")[0];
      if (attrName.includes("job") || attrName.includes("id")) {
        dataAttrs.add(attrName);
      }
    }
    
    console.log("\n🏷️ Data attributes liên quan:");
    console.log(Array.from(dataAttrs).join(", "));
    
    // Lưu kết quả phân tích
    const analysis = {
      timestamp: new Date().toISOString(),
      jobClasses: Array.from(jobClasses).slice(0, 50),
      links: links.slice(0, 20),
      dataAttributes: Array.from(dataAttrs),
      totalLinks: links.length
    };
    
    const outputPath = path.join(__dirname, "debug", "html-analysis.json");
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`\n✅ Đã lưu phân tích chi tiết vào: ${outputPath}`);
    
    // Đề xuất selector
    console.log("\n💡 ĐỀ XUẤT SELECTOR:");
    if (links.length > 5) {
      console.log("Thử các selector sau trong crawler:");
      console.log("1. a[href*='/viec-lam/']");
      console.log("2. a[href*='/job/']");
      if (jobClasses.size > 0) {
        const firstClass = Array.from(jobClasses)[0].split(" ")[0];
        console.log(`3. .${firstClass}`);
      }
    } else {
      console.log("⚠️ Không tìm thấy đủ job links. CareerViet có thể:");
      console.log("- Dùng JavaScript để render nội dung");
      console.log("- Có anti-bot protection");
      console.log("- Yêu cầu đăng nhập");
    }
    
  } catch (err) {
    console.error("❌ Lỗi phân tích:", err.message);
  }
}

analyzeDebugHTML1();