const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// ===================== TEST REGISTER =====================
router.post('/test/register', async (req, res) => {
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

    // Validation
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

    // Nếu không truyền username → tự tạo từ email
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

// ===================== TEST LOGIN =====================
router.post('/test/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔑 Test login:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email và password là bắt buộc" });
    }

    // Tìm user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const user = result.rows[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    console.log('✅ Test login thành công:', user.email, 'Role:', user.role);

    // Tạo token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Trả về thông tin user (không có password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Đăng nhập thành công',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('❌ Lỗi test login:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===================== TEST CREATE MULTIPLE USERS =====================
router.post('/test/seed', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const users = [
      {
        name: 'Nguyễn Văn A',
        email: 'user1@test.com',
        password: '123456',
        role: 'user'
      },
      {
        name: 'Trần Thị B',
        email: 'user2@test.com',
        password: '123456',
        role: 'user'
      },
      {
        name: 'Công ty ABC',
        email: 'employer1@test.com',
        password: '123456',
        role: 'employer',
        companyName: 'Công ty ABC',
        contactPerson: 'Mr. ABC',
        phone: '0123456789',
        companySize: '50-100',
        industry: 'IT'
      },
      {
        name: 'Công ty XYZ',
        email: 'employer2@test.com',
        password: '123456',
        role: 'employer',
        companyName: 'Công ty XYZ',
        contactPerson: 'Ms. XYZ',
        phone: '0987654321',
        companySize: '100-500',
        industry: 'Marketing'
      }
    ];

    const createdUsers = [];

    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const username = userData.email.split('@')[0];

      // Tạo user
      const newUser = await client.query(
        `INSERT INTO users 
         (username, password, role, name, email, 
          company_name, contact_person, phone, company_size, industry, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
         RETURNING id, username, role, name, email`,
        [
          username,
          hashedPassword,
          userData.role,
          userData.name,
          userData.email,
          userData.companyName || null,
          userData.contactPerson || null,
          userData.phone || null,
          userData.companySize || null,
          userData.industry || null
        ]
      );

      const userId = newUser.rows[0].id;

      // Tạo profile
      if (userData.role === 'user') {
        await client.query(
          `INSERT INTO user_profiles (user_id, ky_nang, kinh_nghiem, hoc_van, cv_file)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, 'NodeJS, ReactJS', '2 năm', 'Đại học', null]
        );
      } else if (userData.role === 'employer') {
        await client.query(
          `INSERT INTO employers (user_id, company, description)
           VALUES ($1, $2, $3)`,
          [userId, userData.companyName || '', 'Công ty uy tín']
        );
      }

      createdUsers.push(newUser.rows[0]);
    }

    await client.query('COMMIT');

    console.log('✅ Seed data thành công!');
    res.json({
      message: 'Tạo dữ liệu test thành công',
      users: createdUsers,
      count: createdUsers.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi seed data:', error);
    res.status(500).json({ 
      message: 'Lỗi server',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// ===================== TEST DELETE ALL DATA =====================
router.delete('/test/clear', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Xóa theo thứ tự để tránh foreign key constraint
    await client.query('DELETE FROM applications');
    await client.query('DELETE FROM jobs');
    await client.query('DELETE FROM user_profiles');
    await client.query('DELETE FROM employers');
    await client.query('DELETE FROM users');

    // Reset sequences (optional)
    await client.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE user_profiles_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE employers_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE jobs_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE applications_id_seq RESTART WITH 1');

    await client.query('COMMIT');

    console.log('✅ Đã xóa tất cả dữ liệu test');
    res.json({ message: 'Đã xóa tất cả dữ liệu test thành công' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi xóa data:', error);
    res.status(500).json({ 
      message: 'Lỗi server',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// ===================== TEST GET ALL USERS =====================
router.get('/test/users', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.username, u.role, u.created_at,
              up.ky_nang, up.kinh_nghiem, up.hoc_van,
              e.company, e.description
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       LEFT JOIN employers e ON u.id = e.user_id
       ORDER BY u.created_at DESC`
    );

    res.json({
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('❌ Lỗi lấy danh sách users:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;