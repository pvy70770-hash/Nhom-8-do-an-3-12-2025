// ===================== IMPORTS =====================

const express = require("express");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// ===================== SESSION =====================
app.use(
  session({
    secret: "job-portal-secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ===================== JWT SECRET =====================
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// ===================== GOOGLE LOGIN STRATEGY =====================
passport.use(
  "google-login",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/login/callback",
      authorizationParams: {
        prompt: 'select_account',
        access_type: 'offline'
      }
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Đang tìm user với Google ID:", profile.id);
        
        let user = await pool.query("SELECT * FROM users WHERE google_id = $1", [profile.id]);
        
        if (user.rows.length === 0) {
          console.log("⚠️ Không tìm thấy theo google_id, thử tìm theo email...");
          user = await pool.query("SELECT * FROM users WHERE email = $1", [profile.emails[0].value]);
          
          if (user.rows.length === 0) {
            console.log("❌ User chưa đăng ký");
            return done(null, false, { message: "User not found. Please register first." });
          }
          
          console.log("✅ Tìm thấy user qua email, đang cập nhật google_id...");
          await pool.query("UPDATE users SET google_id = $1 WHERE email = $2", [profile.id, profile.emails[0].value]);
          user.rows[0].google_id = profile.id;
        }
        
        console.log("✅ Đăng nhập thành công:", user.rows[0].email);
        return done(null, user.rows[0]);
      } catch (err) {
        console.error("❌ Lỗi khi đăng nhập Google:", err);
        done(err, null);
      }
    }
  )
);

// ===================== GOOGLE REGISTER STRATEGY =====================
passport.use(
  "google-register",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/auth/google/register/callback",
      passReqToCallback: true,
      authorizationParams: {
        prompt: 'select_account',
        access_type: 'offline'
      }
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Đang kiểm tra user với email:", profile.emails[0].value);
        
        const requestedRole = req.session.registrationRole || 'user';
        const companyInfo = req.session.companyInfo || {};
        
        console.log("📋 Requested role:", requestedRole);
        console.log("🏢 Company info:", companyInfo);
        
        const userCheck = await pool.query(
          "SELECT * FROM users WHERE google_id = $1 OR email = $2",
          [profile.id, profile.emails[0].value]
        );

        if (userCheck.rows.length > 0) {
          console.log("⚠️ User đã tồn tại, đăng nhập luôn");
          if (!userCheck.rows[0].google_id) {
            await pool.query("UPDATE users SET google_id = $1 WHERE email = $2", [profile.id, profile.emails[0].value]);
            userCheck.rows[0].google_id = profile.id;
          }
          return done(null, userCheck.rows[0]);
        }

        console.log("✅ Đang tạo user mới với role:", requestedRole);
        const generatedUsername = profile.emails[0].value.split('@')[0];
        const defaultPassword = 'GOOGLE_USER_' + profile.id;

        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          // ✅ Tạo user với đầy đủ thông tin
          const newUser = await client.query(
            `INSERT INTO users 
             (google_id, name, email, username, password, role, 
              company_name, contact_person, phone, company_size, industry, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
             RETURNING *`,
            [
              profile.id,
              profile.displayName,
              profile.emails[0].value,
              generatedUsername,
              defaultPassword,
              requestedRole,
              requestedRole === 'employer' ? companyInfo.companyName : null,
              requestedRole === 'employer' ? companyInfo.contactPerson : null,
              companyInfo.phone || null,
              companyInfo.companySize || null,
              companyInfo.industry || null
            ]
          );

          const userId = newUser.rows[0].id;

          if (requestedRole === 'user') {
            await client.query(
              `INSERT INTO user_profiles (user_id, ky_nang, kinh_nghiem, hoc_van, cv_file)
               VALUES ($1, $2, $3, $4, $5)`,
              [userId, '', '', '', null]
            );
            console.log("✅ Đã tạo user_profiles cho ứng viên");
          } else if (requestedRole === 'employer') {
            await client.query(
              `INSERT INTO employers (user_id, company, description)
               VALUES ($1, $2, $3)`,
              [userId, companyInfo.companyName || '', companyInfo.description || '']
            );
            console.log("✅ Đã tạo employers cho nhà tuyển dụng");
          }

          await client.query('COMMIT');
          console.log("🎉 Đăng ký thành công:", newUser.rows[0].email);
          
          delete req.session.registrationRole;
          delete req.session.companyInfo;
          
          return done(null, newUser.rows[0]);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      } catch (err) {
        console.error('❌ Google register error:', err);
        done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ===================== MIDDLEWARE XÁC THỰC TOKEN =====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ===================== ROUTES IMPORT =====================
const userRoutes = require("./routes/users");
const categoriesRoutes = require("./routes/categories");
const applicationsRoutes = require("./routes/applications");

app.use("/api/users", userRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/applications", applicationsRoutes);

// ===================== SET ROLE FOR REGISTRATION =====================
app.post("/auth/set-registration-role", (req, res) => {
  const { role, companyInfo } = req.body;
  
  if (!role || !['user', 'employer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "employer"' });
  }
  
  req.session.registrationRole = role;
  
  if (role === 'employer' && companyInfo) {
    req.session.companyInfo = companyInfo;
    console.log("🏢 Company info saved:", companyInfo);
  }
  
  console.log("📋 Registration role set:", role);
  
  res.json({ success: true, role });
});

// ===================== GOOGLE LOGIN ROUTES =====================
app.get("/auth/google/login", 
  passport.authenticate("google-login", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })
);

app.get(
  "/auth/google/login/callback",
  passport.authenticate("google-login", { 
    failureRedirect: "http://localhost:3000/login?error=not_registered",
    session: false 
  }),
  (req, res) => {
    console.log("✅ Google login callback - User:", req.user.email);
    
    const token = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Token created:", token.substring(0, 30) + "...");
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Đang đăng nhập...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00B14F;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <p>Đăng nhập thành công! Đang đóng cửa sổ...</p>
        </div>
        <script>
          console.log('🔍 Callback page loaded');
          
          if (window.opener) {
            console.log('✅ Sending token to parent window...');
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${token}'
            }, 'http://localhost:3000');
            
            setTimeout(() => {
              console.log('🔄 Closing popup...');
              window.close();
            }, 1000);
          } else {
            console.log('⚠️ Not a popup, redirecting...');
            localStorage.setItem('token', '${token}');
            window.location.href = 'http://localhost:3000/?login=success';
          }
        </script>
      </body>
      </html>
    `);
  }
);

// ===================== GOOGLE REGISTER ROUTES =====================
app.get("/auth/google/register", (req, res, next) => {
  if (!req.session.registrationRole) {
    return res.redirect("http://localhost:3000/register?error=no_role_selected");
  }
  
  passport.authenticate("google-register", { 
    scope: ["profile", "email"],
    prompt: "select_account"
  })(req, res, next);
});

app.get(
  "/auth/google/register/callback",
  passport.authenticate("google-register", {
    failureRedirect: "http://localhost:3000/register?error=failed",
    session: false
  }),
  (req, res) => {
    console.log("✅ Google register callback - User:", req.user.email);
    
    const token = jwt.sign(
      { 
        id: req.user.id, 
        email: req.user.email, 
        role: req.user.role 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Token created:", token.substring(0, 30) + "...");
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Đang đăng ký...</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .loader {
            text-align: center;
          }
          .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #00B14F;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <p>Đăng ký thành công! Đang đóng cửa sổ...</p>
        </div>
        <script>
          console.log('🔍 Callback page loaded');
          
          if (window.opener) {
            console.log('✅ Sending token to parent window...');
            window.opener.postMessage({
              type: 'GOOGLE_AUTH_SUCCESS',
              token: '${token}'
            }, 'http://localhost:3000');
            
            setTimeout(() => {
              console.log('🔄 Closing popup...');
              window.close();
            }, 1000);
          } else {
            console.log('⚠️ Not a popup, redirecting...');
            localStorage.setItem('token', '${token}');
            window.location.href = 'http://localhost:3000/?register=success';
          }
        </script>
      </body>
      </html>
    `);
  }
);

// ===================== TEST REGISTER (Không cần Google) =====================
app.post('/api/auth/test/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      name,
      email, 
      password, 
      username, 
      role = "user",
      companyName,
      contactPerson,
      phone,
      companySize,
      industry
    } = req.body;

    console.log("📝 Test register request:", { email, role, companyName });

    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    if (role === 'employer' && !companyName) {
      return res.status(400).json({ message: "Tên công ty là bắt buộc cho nhà tuyển dụng" });
    }

    // Kiểm tra trùng email
    const checkEmail = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    const realUsername = username || email.split('@')[0];

    // Bắt đầu transaction
    await client.query('BEGIN');
    
    console.log("🔄 Bắt đầu transaction...");

    // ✅ Tạo user với đầy đủ thông tin
    const newUser = await client.query(
      `INSERT INTO users 
       (username, password, role, name, email, 
        company_name, contact_person, phone, company_size, industry, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, username, role, name, email, company_name, contact_person, phone, company_size, industry`,
      [
        realUsername, 
        hashedPassword, 
        role, 
        name, 
        email,
        role === 'employer' ? companyName : null,
        role === 'employer' ? contactPerson : null,
        phone || null,
        companySize || null,
        industry || null
      ]
    );

    const userId = newUser.rows[0].id;
    console.log("✅ Đã tạo user với ID:", userId);

    // Tạo profile tương ứng với role
    if (role === 'user') {
      const profileResult = await client.query(
        `INSERT INTO user_profiles (user_id, ky_nang, kinh_nghiem, hoc_van, cv_file)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, '', '', '', null]
      );
      console.log("✅ Đã tạo user_profiles:", profileResult.rows[0]);
    } else if (role === 'employer') {
      const employerResult = await client.query(
        `INSERT INTO employers (user_id, company, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, companyName || '', '']
      );
      console.log("✅ Đã tạo employers:", employerResult.rows[0]);
    }

    await client.query('COMMIT');
    console.log("✅ Transaction COMMIT thành công!");

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: newUser.rows[0].id, 
        email: newUser.rows[0].email,
        role: newUser.rows[0].role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: "Tạo user thành công",
      user: newUser.rows[0],
      token
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Lỗi test register (đã ROLLBACK):", error);
    res.status(500).json({ 
      message: "Lỗi server", 
      error: error.message,
      detail: error.detail || 'No detail available'
    });
  } finally {
    client.release();
    console.log("🔓 Client đã được release");
  }
});

// ===================== LOGOUT =====================
app.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:3000/login");
  });
});

// ===================== GET USER WITH PROFILE =====================
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    console.log("🔍 Fetching user info for ID:", req.user.id);
    
    const userResult = await pool.query(
      `SELECT id, email, name, username, google_id, role, 
              company_name, contact_person, phone, company_size, industry, created_at 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    let profileData = null;
    
    if (user.role === 'user') {
      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [user.id]
      );
      profileData = profileResult.rows[0] || null;
    } else if (user.role === 'employer') {
      const employerResult = await pool.query(
        'SELECT * FROM employers WHERE user_id = $1',
        [user.id]
      );
      profileData = employerResult.rows[0] || null;
    }
    
    console.log("✅ User info found:", user.email);
    res.json({
      ...user,
      profile: profileData
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== UPDATE USER PROFILE =====================
app.put("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    
    if (userRole === 'user') {
      const { ky_nang, kinh_nghiem, hoc_van, cv_file } = req.body;
      
      const result = await pool.query(
        `UPDATE user_profiles 
         SET ky_nang = $1, kinh_nghiem = $2, hoc_van = $3, cv_file = $4
         WHERE user_id = $5
         RETURNING *`,
        [ky_nang, kinh_nghiem, hoc_van, cv_file, userId]
      );
      
      console.log("✅ User profile updated");
      res.json(result.rows[0]);
      
    } else if (userRole === 'employer') {
      const { company, description, company_name, contact_person, phone, company_size, industry } = req.body;
      
      // Cập nhật cả bảng users và employers
      if (company_name || contact_person || phone || company_size || industry) {
        await pool.query(
          `UPDATE users 
           SET company_name = COALESCE($1, company_name),
               contact_person = COALESCE($2, contact_person),
               phone = COALESCE($3, phone),
               company_size = COALESCE($4, company_size),
               industry = COALESCE($5, industry)
           WHERE id = $6`,
          [company_name, contact_person, phone, company_size, industry, userId]
        );
      }
      
      const result = await pool.query(
        `UPDATE employers 
         SET company = $1, description = $2
         WHERE user_id = $3
         RETURNING *`,
        [company, description, userId]
      );
      
      console.log("✅ Employer profile updated");
      res.json(result.rows[0]);
      
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== TEST ROUTE =====================
app.get("/", (req, res) => {
  res.send("🚀 Job Portal Backend Running with Google Login + Register (PostgreSQL version)");
});

// ===================== JOB MANAGEMENT (SAVED & APPLIED) =====================

// GET /api/jobs/saved - Lấy danh sách công việc đã lưu
app.get('/api/jobs/saved', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 User ID:', req.user.id);
        const result = await pool.query(
            'SELECT * FROM saved_jobs WHERE user_id = $1 ORDER BY saved_date DESC',
            [req.user.id]
        );
        console.log('✅ Found', result.rows.length, 'saved jobs');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching saved jobs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/jobs/save - Lưu công việc
app.post('/api/jobs/save', authenticateToken, async (req, res) => {
    const { job_id, job_title, company_name, company_logo, location, salary } = req.body;
    try {
        await pool.query(
            'INSERT INTO saved_jobs (user_id, job_id, job_title, company_name, company_logo, location, salary) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [req.user.id, job_id, job_title, company_name, company_logo, location, salary]
        );
        res.json({ message: 'Job saved successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Job already saved' });
        }
        console.error('Error saving job:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/jobs/unsave/:jobId - Bỏ lưu công việc
app.delete('/api/jobs/unsave/:jobId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2',
            [req.user.id, req.params.jobId]
        );
        res.json({ message: 'Job unsaved successfully' });
    } catch (error) {
        console.error('Error unsaving job:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/jobs/applied - Lấy danh sách công việc đã ứng tuyển
app.get('/api/jobs/applied', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM applied_jobs WHERE user_id = $1 ORDER BY applied_date DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching applied jobs:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/jobs/apply - Ứng tuyển công việc
app.post('/api/jobs/apply', authenticateToken, async (req, res) => {
    const { job_id, job_title, company_name, company_logo, location, salary, cv_used } = req.body;
    try {
        await pool.query(
            'INSERT INTO applied_jobs (user_id, job_id, job_title, company_name, company_logo, location, salary, cv_used) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [req.user.id, job_id, job_title, company_name, company_logo, location, salary, cv_used]
        );
        res.json({ message: 'Applied successfully' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Already applied to this job' });
        }
        console.error('Error applying to job:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/jobs/stats - Lấy thống kê jobs
app.get('/api/jobs/stats', authenticateToken, async (req, res) => {
    try {
        const savedCount = await pool.query(
            'SELECT COUNT(*) FROM saved_jobs WHERE user_id = $1',
            [req.user.id]
        );
        const appliedCount = await pool.query(
            'SELECT COUNT(*) FROM applied_jobs WHERE user_id = $1',
            [req.user.id]
        );
        
        res.json({
            saved: parseInt(savedCount.rows[0].count),
            applied: parseInt(appliedCount.rows[0].count)
        });
    } catch (error) {
        console.error('Error fetching job stats:', error);
        res.status(500).json({ error: 'Server error' });
    }
});// ===================== JOBS API - FINAL VERSION =====================
const categorySlugMap = {
  "cong-nghe-thong-tin": "Công nghệ thông tin",
  "ke-toan-tai-chinh": "Kế toán - Tài chính - Ngân hàng",
  "kinh-doanh-ban-hang": "Kinh doanh - Bán hàng",
  "marketing-truyen-thong": "Marketing - Truyền thông",
  "nhan-su-hanh-chinh": "Nhân sự - Hành chính",
  "thiet-ke-do-hoa": "Thiết kế - Đồ hoạ",
  "ky-thuat-xay-dung": "Kỹ thuật - Xây dựng",
  "giao-duc-dao-tao": "Giáo dục - Đào tạo",
  "bat-dong-san": "Bất động sản",
  "lao-dong-pho-thong": "Lao động phổ thông",
  "nha-hang-khach-san": "Nhà hàng - Khách sạn",
  "dich-vu-khach-hang": "Dịch vụ - Khách hàng",
  "quan-ly-cap-cao": "Quản lý / Cấp cao",
  "khac": "Khác"
};

// ⭐ ROUTE 1: Category route - PHẢI ĐỨNG TRƯỚC route /api/jobs
app.get("/api/jobs/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const { page = 0, limit = 6 } = req.query;
    const offset = parseInt(page) * parseInt(limit);
    
    console.log("==========================================");
    console.log("🔍 Category route - slug:", category);
    
    const categoryName = categorySlugMap[category] || decodeURIComponent(category);
    console.log("📂 Mapped to:", categoryName);
    
    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM jobs WHERE category = $1`,
      [categoryName]
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Get jobs
    const result = await pool.query(
      `SELECT j.*, 
              COALESCE(u.company_name, e.company, j.company) as company_name
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE j.category = $1
       ORDER BY j.posted_at DESC
       LIMIT $2 OFFSET $3`,
      [categoryName, parseInt(limit), offset]
    );
    
    console.log(`✅ Found ${total} total jobs in category "${categoryName}"`);
    console.log(`✅ Returning ${result.rows.length} jobs for page ${page}`);
    console.log("==========================================");
    
    res.json({
      jobs: result.rows,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error("==========================================");
    console.error("❌ Category route error:", err.message);
    console.error("❌ Stack:", err.stack);
    console.error("==========================================");
    res.status(500).json({ 
      error: "Server Error", 
      message: err.message 
    });
  }
});

// ⭐ ROUTE 2: Main jobs route - SIMPLE & WORKS
app.get("/api/jobs", async (req, res) => {
  try {
    const { page = 0, limit = 6, search, location } = req.query;
    const offset = parseInt(page) * parseInt(limit);
    
    console.log("==========================================");
    console.log("🔍 Main jobs route - params:", { page, limit, search, location });
    
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;
    
    // ⭐ SEARCH FILTER - ILIKE cho mọi trường hợp
    if (search && search.trim()) {
      const searchTerm = search.trim();
      console.log(`🔍 Searching for: "${searchTerm}"`);
      
      whereConditions.push(`(
        j.title ILIKE $${paramIndex} OR 
        j.category ILIKE $${paramIndex} OR
        j.description ILIKE $${paramIndex} OR
        COALESCE(j.company, '') ILIKE $${paramIndex} OR
        COALESCE(e.company, '') ILIKE $${paramIndex} OR 
        COALESCE(u.company_name, '') ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }
    
    // ⭐ LOCATION FILTER
    if (location && location.trim()) {
      console.log(`📍 Filtering location: "${location}"`);
      whereConditions.push(`j.location ILIKE $${paramIndex}`);
      queryParams.push(`%${location.trim()}%`);
      paramIndex++;
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    console.log("📝 WHERE clause:", whereClause);
    console.log("📝 Query params:", queryParams);
    
    // Count query
    const countQuery = `
      SELECT COUNT(*) 
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
    `;
    
    // Jobs query
    const jobsQuery = `
      SELECT j.*, 
             COALESCE(u.company_name, e.company, j.company) as company_name
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY j.posted_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);
    
    const jobsParams = [...queryParams, parseInt(limit), offset];
    const jobsResult = await pool.query(jobsQuery, jobsParams);
    
    console.log(`✅ Found ${total} total jobs`);
    console.log(`✅ Returning ${jobsResult.rows.length} jobs for page ${page}`);
    
    if (jobsResult.rows.length > 0) {
      console.log("📌 Sample jobs:");
      jobsResult.rows.slice(0, 3).forEach(job => {
        console.log(`   - ${job.title} | ${job.company_name} | ${job.location}`);
      });
    }
    console.log("==========================================");
    
    res.json({
      jobs: jobsResult.rows,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
    
  } catch (err) {
    console.error("==========================================");
    console.error("❌ Main jobs route error:", err.message);
    console.error("❌ Stack:", err.stack);
    console.error("==========================================");
    res.status(500).json({ 
      error: "Server Error", 
      message: err.message 
    });
  }
});
// ✅ GET single job (phải đứng SAU các route cụ thể)
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT j.*, 
              COALESCE(u.company_name, e.company, j.company) as company_name,
              u.email as employer_email, 
              u.phone as employer_phone
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       WHERE j.id = $1`,
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Job not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi khi lấy job:", err.message);
    res.status(500).send("Server Error");
  }
});
// ✅ POST new job (chỉ employer)
app.post("/api/jobs", authenticateToken, async (req, res) => {
  try {
    const { title, description, requirements, benefits, location, salary, category, deadline, experience } = req.body;
    const userId = req.user.id;

    // Kiểm tra user có phải employer không và lấy employer_id
    const employerCheck = await pool.query(
      `SELECT e.id as employer_id, u.role 
       FROM users u
       LEFT JOIN employers e ON u.id = e.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (employerCheck.rows.length === 0 || employerCheck.rows[0].role !== 'employer') {
      return res.status(403).json({ message: 'Chỉ nhà tuyển dụng mới có thể đăng tin' });
    }

    const employerId = employerCheck.rows[0].employer_id;
    
    if (!employerId) {
      return res.status(400).json({ message: 'Không tìm thấy thông tin employer' });
    }

    // Parse salary nếu có
    let minSalary = null, maxSalary = null, currency = 'VND';
    if (salary) {
      const salaryMatch = salary.match(/(\d+)\s*-\s*(\d+)/);
      if (salaryMatch) {
        minSalary = parseInt(salaryMatch[1]);
        maxSalary = parseInt(salaryMatch[2]);
      }
    }

    const result = await pool.query(
      `INSERT INTO jobs (employer_id, title, description, requirements, benefits, location, 
                        min_salary, max_salary, currency, category, posted_at, deadline, status, experience)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13)
       RETURNING *`,
      [employerId, title, description, requirements, benefits, location, 
       minSalary, maxSalary, currency, category, deadline, 'open', experience]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi khi thêm job:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ UPDATE job (chỉ employer sở hữu)
app.put("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, requirements, benefits, location, salary, category, deadline, status, experience } = req.body;
    const userId = req.user.id;

    // Kiểm tra job có thuộc về employer này không
    const jobCheck = await pool.query(
      `SELECT j.*, e.user_id 
       FROM jobs j
       JOIN employers e ON j.employer_id = e.id
       WHERE j.id = $1`,
      [id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (jobCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tin này' });
    }

    // Parse salary nếu có
    let minSalary = null, maxSalary = null, currency = 'VND';
    if (salary) {
      const salaryMatch = salary.match(/(\d+)\s*-\s*(\d+)/);
      if (salaryMatch) {
        minSalary = parseInt(salaryMatch[1]);
        maxSalary = parseInt(salaryMatch[2]);
      }
    }

    const result = await pool.query(
      `UPDATE jobs
       SET title = $1, description = $2, requirements = $3, benefits = $4, 
           location = $5, min_salary = $6, max_salary = $7, currency = $8,
           category = $9, deadline = $10, status = $11, experience = $12
       WHERE id = $13
       RETURNING *`,
      [title, description, requirements, benefits, location, minSalary, maxSalary, 
       currency, category, deadline, status, experience, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật job:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ DELETE job (chỉ employer sở hữu)
app.delete("/api/jobs/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Kiểm tra job có thuộc về employer này không
    const jobCheck = await pool.query(
      `SELECT j.*, e.user_id 
       FROM jobs j
       JOIN employers e ON j.employer_id = e.id
       WHERE j.id = $1`,
      [id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (jobCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tin này' });
    }

    const result = await pool.query(
      "DELETE FROM jobs WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ message: "Job deleted successfully", job: result.rows[0] });
  } catch (err) {
    console.error("❌ Lỗi khi xóa job:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ GET jobs posted by current employer
app.get("/api/employer/jobs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Lấy employer_id từ user_id
    const employerResult = await pool.query(
      "SELECT id FROM employers WHERE user_id = $1",
      [userId]
    );

    if (employerResult.rows.length === 0) {
      return res.status(404).json({ message: "Employer profile not found" });
    }

    const employerId = employerResult.rows[0].id;

    // Lấy tất cả jobs của employer này
    const result = await pool.query(
      `SELECT j.*, 
              COUNT(a.id) as application_count
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.employer_id = $1
       GROUP BY j.id
       ORDER BY j.posted_at DESC`,
      [employerId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy jobs của employer:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ===================== APPLICATIONS API =====================
// ✅ Apply for a job
app.post("/api/applications", authenticateToken, async (req, res) => {
  try {
    const { job_id } = req.body;
    const userId = req.user.id;

    // Kiểm tra user có phải là candidate không
    const userCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows[0].role !== 'user') {
      return res.status(403).json({ message: 'Chỉ ứng viên mới có thể ứng tuyển' });
    }

    // Kiểm tra đã ứng tuyển chưa
    const applicationCheck = await pool.query(
      "SELECT * FROM applications WHERE user_id = $1 AND job_id = $2",
      [userId, job_id]
    );

    if (applicationCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Bạn đã ứng tuyển công việc này rồi' });
    }

    // Tạo application mới
    const result = await pool.query(
      `INSERT INTO applications (user_id, job_id, status, applied_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [userId, job_id, 'pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi khi ứng tuyển:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ GET applications by user (candidate's applications)
app.get("/api/applications/my", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT a.*, 
              j.title, j.location, j.min_salary, j.max_salary, j.currency,
              e.company,
              u.company_name
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN employers e ON j.employer_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE a.user_id = $1
       ORDER BY a.applied_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy applications:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ GET applications for a job (employer only)
app.get("/api/jobs/:jobId/applications", authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Kiểm tra job có thuộc về employer này không
    const jobCheck = await pool.query(
      `SELECT j.*, e.user_id 
       FROM jobs j
       JOIN employers e ON j.employer_id = e.id
       WHERE j.id = $1`,
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (jobCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn ứng tuyển này' });
    }

    // Lấy tất cả applications cho job này
    const result = await pool.query(
      `SELECT a.*, 
              u.name, u.email, u.phone,
              up.ky_nang, up.kinh_nghiem, up.hoc_van, up.cv_file
       FROM applications a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE a.job_id = $1
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Lỗi khi lấy applications cho job:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ UPDATE application status (employer only)
app.put("/api/applications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Kiểm tra application có thuộc về job của employer này không
    const applicationCheck = await pool.query(
      `SELECT a.*, e.user_id 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN employers e ON j.employer_id = e.id
       WHERE a.id = $1`,
      [id]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (applicationCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn này' });
    }

    // Cập nhật status
    const result = await pool.query(
      `UPDATE applications
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật application:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ✅ DELETE application (candidate only - withdraw application)
app.delete("/api/applications/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Kiểm tra application có thuộc về user này không
    const applicationCheck = await pool.query(
      "SELECT * FROM applications WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Application not found or not yours" });
    }

    const result = await pool.query(
      "DELETE FROM applications WHERE id = $1 RETURNING *",
      [id]
    );

    res.json({ message: "Application withdrawn successfully", application: result.rows[0] });
  } catch (err) {
    console.error("❌ Lỗi khi xóa application:", err.message);
    res.status(500).json({ error: "Server Error", detail: err.message });
  }
});

// ===================== ADMIN ROUTES - Thêm vào file server.js =====================

// ✅ ADMIN LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log("🔐 Admin login attempt:", username);
    
    // Query admin từ database
    const result = await pool.query(
      "SELECT * FROM admin WHERE username = $1",
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: "Tên đăng nhập không tồn tại" 
      });
    }
    
    const admin = result.rows[0];
    
    // So sánh password (plaintext - chỉ dùng cho demo)
    // Trong production nên dùng bcrypt
    if (password !== admin.password) {
      return res.status(401).json({ 
        success: false, 
        message: "Mật khẩu không đúng" 
      });
    }
    
    // Tạo JWT token cho admin
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username,
        role: 'admin',
        full_name: admin.full_name
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    
    console.log("✅ Admin logged in:", admin.username);
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name
      }
    });
    
  } catch (error) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server" 
    });
  }
});

// ✅ MIDDLEWARE: Verify Admin Token
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Kiểm tra role là admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    req.admin = decoded;
    next();
  });
};

// ✅ GET DASHBOARD STATS
app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
  try {
    // Tổng số users
    const totalUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'user'"
    );
    
    // Tổng số employers
    const totalEmployers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'employer'"
    );
    
    // Tổng số jobs
    const totalJobs = await pool.query(
      "SELECT COUNT(*) FROM jobs"
    );
    
    // Tổng số applications
    const totalApplications = await pool.query(
      "SELECT COUNT(*) FROM applications"
    );
    
    // Jobs theo tháng (6 tháng gần nhất)
    const jobsByMonth = await pool.query(
      `SELECT 
        TO_CHAR(posted_at, 'Mon') as month,
        COUNT(*) as count
       FROM jobs
       WHERE posted_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(posted_at, 'Mon'), EXTRACT(MONTH FROM posted_at)
       ORDER BY EXTRACT(MONTH FROM posted_at)`
    );
    
    // Applications theo tháng
    const applicationsByMonth = await pool.query(
      `SELECT 
        TO_CHAR(applied_at, 'Mon') as month,
        COUNT(*) as count
       FROM applications
       WHERE applied_at >= NOW() - INTERVAL '6 months'
       GROUP BY TO_CHAR(applied_at, 'Mon'), EXTRACT(MONTH FROM applied_at)
       ORDER BY EXTRACT(MONTH FROM applied_at)`
    );
    
    // Top categories
    const topCategories = await pool.query(
      `SELECT category, COUNT(*) as count
       FROM jobs
       GROUP BY category
       ORDER BY count DESC
       LIMIT 5`
    );
    
    // Recent jobs
    const recentJobs = await pool.query(
      `SELECT j.id, j.title, j.location, j.posted_at, j.status,
              COALESCE(u.company_name, e.company, j.company) as company_name
       FROM jobs j
       LEFT JOIN employers e ON j.employer_id = e.id
       LEFT JOIN users u ON e.user_id = u.id
       ORDER BY j.posted_at DESC
       LIMIT 10`
    );
    
    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalEmployers: parseInt(totalEmployers.rows[0].count),
      totalJobs: parseInt(totalJobs.rows[0].count),
      totalApplications: parseInt(totalApplications.rows[0].count),
      jobsByMonth: jobsByMonth.rows,
      applicationsByMonth: applicationsByMonth.rows,
      topCategories: topCategories.rows,
      recentJobs: recentJobs.rows
    });
    
  } catch (error) {
    console.error("❌ Error fetching admin stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET ALL USERS (with pagination)
app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT u.id, u.username, u.email, u.name, u.role, u.created_at,
             u.company_name, u.phone
      FROM users u
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (role) {
      query += ` AND u.role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Count total
    let countQuery = "SELECT COUNT(*) FROM users WHERE 1=1";
    const countParams = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR username ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    if (role) {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
    
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET ALL JOBS (with pagination)
app.get("/api/admin/jobs", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT j.id, j.title, j.location, j.category, j.status, j.posted_at, j.deadline,
             COALESCE(u.company_name, e.company, j.company) as company_name,
             COUNT(a.id) as application_count
      FROM jobs j
      LEFT JOIN employers e ON j.employer_id = e.id
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN applications a ON j.id = a.job_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (search) {
      query += ` AND (j.title ILIKE $${paramIndex} OR j.location ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    if (status) {
      query += ` AND j.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    query += ` GROUP BY j.id, u.company_name, e.company
               ORDER BY j.posted_at DESC 
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    // Count total
    let countQuery = "SELECT COUNT(*) FROM jobs WHERE 1=1";
    const countParams = [];
    let countParamIndex = 1;
    
    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR location ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }
    
    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
    }
    
    const countResult = await pool.query(countQuery, countParams);
    
    res.json({
      jobs: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
    
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ DELETE USER
app.delete("/api/admin/users/:id", authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Xóa related data trước
    await client.query("DELETE FROM user_profiles WHERE user_id = $1", [id]);
    await client.query("DELETE FROM employers WHERE user_id = $1", [id]);
    await client.query("DELETE FROM applications WHERE user_id = $1", [id]);
    await client.query("DELETE FROM saved_jobs WHERE user_id = $1", [id]);
    await client.query("DELETE FROM applied_jobs WHERE user_id = $1", [id]);
    
    // Xóa jobs của employer (nếu có)
    const employerResult = await client.query(
      "SELECT id FROM employers WHERE user_id = $1", [id]
    );
    if (employerResult.rows.length > 0) {
      const employerId = employerResult.rows[0].id;
      await client.query("DELETE FROM jobs WHERE employer_id = $1", [employerId]);
    }
    
    // Xóa user
    const result = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: "User deleted successfully",
      user: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error deleting user:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ✅ DELETE JOB
app.delete("/api/admin/jobs/:id", authenticateAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Xóa applications của job này
    await client.query("DELETE FROM applications WHERE job_id = $1", [id]);
    
    // Xóa job
    const result = await client.query(
      "DELETE FROM jobs WHERE id = $1 RETURNING *",
      [id]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: "Job deleted successfully",
      job: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error deleting job:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ✅ UPDATE JOB STATUS
app.patch("/api/admin/jobs/:id/status", authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const result = await pool.query(
      "UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    
    res.json({ 
      success: true, 
      message: "Job status updated",
      job: result.rows[0]
    });
    
  } catch (error) {
    console.error("❌ Error updating job status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ GET ALL APPLICATIONS
app.get("/api/admin/applications", authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await pool.query(
      `SELECT a.id, a.status, a.applied_at,
              u.name as applicant_name, u.email as applicant_email,
              j.title as job_title,
              COALESCE(emp_user.company_name, e.company) as company_name
       FROM applications a
       JOIN users u ON a.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       LEFT JOIN employers e ON j.employer_id = e.id
       LEFT JOIN users emp_user ON e.user_id = emp_user.id
       ORDER BY a.applied_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    const countResult = await pool.query("SELECT COUNT(*) FROM applications");
    
    res.json({
      applications: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
    
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    res.status(500).json({ error: "Server error" });
  }
});
 
// ===================== START SERVER =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});