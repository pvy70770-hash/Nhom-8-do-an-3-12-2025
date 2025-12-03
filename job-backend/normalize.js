// ========================
// 🚀 CHUẨN HOÁ DỮ LIỆU JOBS
// ========================

console.log("🔧 Bắt đầu chuẩn hoá dữ liệu từ raw_jobs...");

import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

// ========================
// 🔌 Kết nối PostgreSQL
// ========================
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "job_portal",
  password: process.env.DB_PASSWORD || "trang1718",
  port: process.env.DB_PORT || 5432,
});

// ========================
// 🧭 Hàm chuẩn hoá location
// ========================
function normalizeLocation(location) {
  if (!location) return null;
  const lc = location.toLowerCase().trim();

  if (lc.includes("ha noi") || lc.includes("hn")) return "Hà Nội";
  if (lc.includes("ho chi minh") || lc.includes("hcm")) return "TP. Hồ Chí Minh";
  if (lc.includes("da nang")) return "Đà Nẵng";
  if (lc.includes("can tho")) return "Cần Thơ";
  if (lc.includes("hai phong")) return "Hải Phòng";

  return location.charAt(0).toUpperCase() + location.slice(1);
}

// ========================
// 💰 Hàm chuẩn hoá lương
// ========================
function normalizeSalary(salary) {
  if (!salary) return { min: null, max: null, currency: "VND" };

  const cleaned = salary.replace(/\./g, "").replace(/,/g, "").toLowerCase();
  const regex = /(\d+)[^\d]+(\d+)?/;
  const match = cleaned.match(regex);

  let currency = "VND";
  if (cleaned.includes("usd") || cleaned.includes("$")) currency = "USD";

  if (!match) return { min: null, max: null, currency };

  const multiplier = currency === "USD" ? 1 : 1_000_000;
  const min = parseInt(match[1]) * multiplier;
  const max = match[2] ? parseInt(match[2]) * multiplier : min;

  return { min, max, currency };
}

// ========================
// 🧠 Phân loại ngành nghề (IMPROVED - Xử lý tiếng Việt tốt hơn)
// ========================
function detectCategory(title, description = "") {
  // Chuẩn hóa text
  const text = (title + " " + description)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Helper function để check từ khóa linh hoạt hơn
  const contains = (keywords) => {
    return keywords.some(kw => text.includes(kw.replace(/\s+/g, " ")));
  };

  // 🎯 CHIẾN LƯỢC MỚI: Ưu tiên các từ CỤ THỂ trước
  
  // 1️⃣ QUẢN LÝ / CẤP CAO - Kiểm tra TRƯỚC để không bị overlap
  const isManager = contains([
    "giam doc", "tong giam doc", "pho giam doc",
    "truong phong", "pho phong",
    "quan ly", "country manager", "general manager",
    "ceo", "cfo", "coo", "cto",
    "director", "head of", "chief"
  ]);
  
  // Nếu là quản lý và KHÔNG có từ khóa chuyên môn mạnh → Quản lý
  const hasStrongSpecialty = contains([
    "ke toan", "ky toan", "accountant",
    "kinh doanh", "sales",
    "marketing",
    "nhan su", "hr",
    "ky su", "engineer", "ky thuat"
  ]);
  
  if (isManager && !hasStrongSpecialty) {
    return "Quản lý / Cấp cao";
  }

  // 2️⃣ KẾ TOÁN - TÀI CHÍNH - NGÂN HÀNG (Rất cụ thể)
  if (contains([
    "ke toan", "ky toan", "accountant", "accounting",
    "kiem toan", "auditor", "audit",
    "thu ngan", "cashier",
    "bao cao tai chinh", "financial report"
  ])) {
    return "Kế toán - Tài chính - Ngân hàng";
  }
  
  if (contains([
    "tai chinh", "finance", "financial",
    "ngan hang", "banking", "bank",
    "credit", "tin dung",
    "treasury", "investment", "dau tu",
    "risk management"
  ])) {
    return "Kế toán - Tài chính - Ngân hàng";
  }

  // 3️⃣ GIÁO DỤC - ĐÀO TẠO (Kiểm tra sớm)
  if (contains([
    "giao vien", "teacher", "giang vien", "lecturer",
    "gia su", "tutor",
    "dao tao", "training", "instructor",
    "huan luyen vien", "coach",
    "nghien cuu", "research", "khoa hoc", "scientist",
    "tro giang", "teaching assistant"
  ])) {
    return "Giáo dục - Đào tạo";
  }

  // 4️⃣ MARKETING - TRUYỀN THÔNG
  if (contains([
    "marketing", "mkt",
    "seo", "sem", "content",
    "social media", "truyen thong",
    "quang cao", "advertising",
    "pr", "public relation",
    "copywriter", "brand",
    "facebook ads", "google ads", "tiktok"
  ])) {
    return "Marketing - Truyền thông";
  }

  // 5️⃣ KINH DOANH - BÁN HÀNG
  if (contains([
    "kinh doanh", "business",
    "sales", "ban hang",
    "telesales", "tele sale",
    "tu van ban hang", "sale executive",
    "nhan vien ban hang",
    "tro ly kinh doanh",
    "bdm", "business development",
    "account manager", "key account",
    "sales engineer", "presales", "pre sales"
  ])) {
    return "Kinh doanh - Bán hàng";
  }

  // 6️⃣ KỸ THUẬT - XÂY DỰNG (Kiểm tra trước IT)
  // Check các từ khóa kỹ thuật KHÔNG PHẢI IT
  const isITEngineer = contains([
    "software", "phan mem",
    "web developer", "app developer", "mobile developer",
    "frontend", "backend", "fullstack",
    "data scientist", "data engineer", "ai engineer",
    "machine learning", "ml engineer"
  ]);
  
  if (!isITEngineer) {
    if (contains([
      "ky su", "ky thuat", "engineer",
      "kien truc su", "architect",
      "thi cong", "xay dung", "construction",
      "co khi", "mechanical",
      "dien", "electrical", "electronics",
      "tu dong hoa", "automation",
      "che tao", "manufacturing",
      "san xuat", "production",
      "qc", "qaqc", "quality control",
      "qhse", "ehs", "an toan",
      "maintenance", "bao tri", "bao duong",
      "van hanh", "operator",
      "thiet bi", "equipment",
      "may moc", "machinery",
      "lap rap", "assembly",
      "han", "welding",
      "cat", "cutting",
      "khuon", "mold",
      "cnc", "autocad", "solidworks", "revit",
      "civil", "cong trinh",
      "dau thau", "dao thau", "tender",
      "quy hoach", "planning"
    ])) {
      return "Kỹ thuật - Xây dựng";
    }
  }

  // 7️⃣ CÔNG NGHỆ THÔNG TIN (Rất cụ thể)
  if (contains([
    "lap trinh", "developer", "programmer", "coder",
    "software engineer", "software developer",
    "web developer", "web dev",
    "mobile developer", "app developer",
    "frontend", "backend", "fullstack",
    "devops", "devsecops",
    "data scientist", "data analyst", "data engineer",
    "ai engineer", "machine learning", "ml engineer",
    "deep learning", "ai", "ml",
    "cloud engineer", "cloud architect",
    "solution architect",
    "system analyst", "business analyst",
    "product owner", "scrum master",
    "tester", "qa", "qc software",
    "automation test", "manual test",
    "security engineer", "cybersecurity",
    "network engineer", "network admin",
    "system admin", "sysadmin",
    "database admin", "dba",
    "it support", "helpdesk", "technical support",
    "reactjs", "react", "nodejs", "node",
    "java", "python", "php", "dotnet", ".net",
    "angular", "vue", "laravel", "django",
    "ios", "android", "flutter", "react native",
    "phan mem", "software", "cntt", "cong nghe thong tin"
  ])) {
    return "Công nghệ thông tin";
  }

  // 8️⃣ NHÂN SỰ - HÀNH CHÍNH
  if (contains([
    "nhan su", "hr", "human resource",
    "tuyen dung", "recruiter", "recruitment",
    "c&b", "compensation", "payroll",
    "hanh chinh", "admin", "van phong",
    "tong vu", "thu ky", "secretary",
    "assistant", "tro ly"
  ])) {
    return "Nhân sự - Hành chính";
  }

  // 9️⃣ THIẾT KẾ - ĐỒ HOẠ
  if (contains([
    "designer", "thiet ke",
    "ui", "ux", "ui/ux",
    "graphic", "do hoa",
    "hoa sy", "illustrator",
    "motion", "animation",
    "3d", "2d",
    "video editor", "editor",
    "photoshop", "illustrator", "figma", "sketch"
  ])) {
    return "Thiết kế - Đồ hoạ";
  }

  // 🔟 DỊCH VỤ - KHÁCH HÀNG
  if (contains([
    "cham soc khach hang", "customer care", "customer service",
    "cskh", "cs", "telesale cskh",
    "call center", "contact center",
    "hotline", "support",
    "customer experience", "customer success"
  ])) {
    return "Dịch vụ - Khách hàng";
  }

  // 1️⃣1️⃣ BẤT ĐỘNG SẢN
  if (contains([
    "bat dong san", "real estate", "bds",
    "moi gioi", "broker",
    "nha dat", "property",
    "dat nen", "chung cu"
  ])) {
    return "Bất động sản";
  }

  // 1️⃣2️⃣ NHÀ HÀNG - KHÁCH SẠN
  if (contains([
    "nha hang", "restaurant",
    "khach san", "hotel",
    "chef", "dau bep", "cook",
    "phuc vu", "waiter", "waitress",
    "le tan", "receptionist",
    "f&b", "food and beverage",
    "barista", "bartender",
    "housekeeping"
  ])) {
    return "Nhà hàng - Khách sạn";
  }

  // 1️⃣3️⃣ LAO ĐỘNG PHỔ THÔNG
  if (contains([
    "lao dong pho thong", "lao dong",
    "phu kho", "kho", "warehouse",
    "boc vac", "porter",
    "shipper", "giao hang", "delivery",
    "bao ve", "security", "guard",
    "tap vu", "ve sinh", "cleaning",
    "lai xe", "driver",
    "cong nhan", "worker",
    "tho", "may", "theu", "cat"
  ])) {
    return "Lao động phổ thông";
  }

  // Nếu không match gì → Khác
  return "Khác";
}

// ========================
// 🔎 Kiểm tra job trùng
// ========================
async function isDuplicate(title, company, location) {
  const res = await pool.query(
    `SELECT 1 FROM jobs WHERE title=$1 AND company=$2 AND location=$3 LIMIT 1`,
    [title, company, location]
  );
  return res.rowCount > 0;
}

// ========================
// 🧼 Chạy chuẩn hoá
// ========================
(async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM raw_jobs");
    console.log(`📦 Có ${rows.length} job thô cần xử lý`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id SERIAL PRIMARY KEY,
        title TEXT,
        company TEXT,
        location TEXT,
        min_salary NUMERIC,
        max_salary NUMERIC,
        currency VARCHAR(10),
        category TEXT,
        description TEXT,
        url TEXT UNIQUE,
        source TEXT,
        posted_at TIMESTAMP DEFAULT NOW()
      )
    `);

    let count = 0;
    for (const job of rows) {
      if (!job.title || !job.company) continue;

      const location = normalizeLocation(job.location);
      const { min, max, currency } = normalizeSalary(job.salary);
      const category = detectCategory(job.title, job.description || "");

      const duplicate = await isDuplicate(job.title, job.company, location);
      if (duplicate) {
        console.log(`⚠️ Bỏ qua job trùng: ${job.title}`);
        continue;
      }

      await pool.query(
        `INSERT INTO jobs (title, company, location, min_salary, max_salary, currency, category, description, url, source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (url) DO NOTHING;`,
        [
          job.title.trim(),
          job.company.trim(),
          location,
          min,
          max,
          currency,
          category,
          job.description || null,
          job.url,
          job.source || "topcv",
        ]
      );

      count++;
      console.log(`✅ ${count}. ${job.title} → ${category}`);
    }

    console.log(`🎯 Hoàn tất! Đã lưu ${count} job sạch vào bảng "jobs".`);
  } catch (err) {
    console.error("❌ Lỗi:", err);
  } finally {
    await pool.end();
  }
})();