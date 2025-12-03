const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// ===================== MIDDLEWARE XÁC THỰC =====================
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

// ===================== ĐĂNG KÝ =====================
router.post('/register', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      name, 
      email, 
      password, 
      role = 'user',
      companyName,
      contactPerson,
      phone,
      companySize,
      industry
    } = req.body;

    console.log('📝 Đăng ký mới:', { email, role, companyName });

    // Validate
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và password là bắt buộc' });
    }

    if (role === 'employer' && !companyName) {
      return res.status(400).json({ message: 'Tên công ty là bắt buộc cho nhà tuyển dụng' });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo username từ email nếu không có
    const username = email.split('@')[0];

    // Bắt đầu transaction
    await client.query('BEGIN');

    // Lưu vào database
    const newUser = await client.query(
      `INSERT INTO users 
       (name, email, username, password, role, 
        company_name, contact_person, phone, company_size, industry, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, name, email, username, role, company_name, contact_person, phone, company_size, industry, created_at`,
      [
        name, 
        email, 
        username, 
        hashedPassword, 
        role,
        role === 'employer' ? companyName : null,
        role === 'employer' ? contactPerson : null,
        phone || null,
        companySize || null,
        industry || null
      ]
    );

    const userId = newUser.rows[0].id;

    // Tạo profile tương ứng với role
    if (role === 'user') {
      await client.query(
        `INSERT INTO user_profiles (user_id, ky_nang, kinh_nghiem, hoc_van, cv_file)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, '', '', '', null]
      );
      console.log('✅ Đã tạo user_profiles');
    } else if (role === 'employer') {
      await client.query(
        `INSERT INTO employers (user_id, company, description)
         VALUES ($1, $2, $3)`,
        [userId, companyName || '', '']
      );
      console.log('✅ Đã tạo employers');
    }

    await client.query('COMMIT');
    console.log('✅ Đăng ký thành công:', newUser.rows[0].email);

    // Tạo token
    const token = jwt.sign(
      { 
        id: newUser.rows[0].id, 
        email: newUser.rows[0].email,
        role: newUser.rows[0].role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: newUser.rows[0],
      token
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Lỗi đăng ký:', error);
    res.status(500).json({ 
      message: 'Lỗi server',
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// ===================== ĐĂNG NHẬP =====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Đăng nhập:', email);

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

    console.log('✅ Đăng nhập thành công:', user.email, 'Role:', user.role);

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
    console.error('❌ Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// ===================== LẤY THÔNG TIN USER (với profile) =====================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      `SELECT id, email, name, username, google_id, role, 
              company_name, contact_person, phone, company_size, industry, created_at 
       FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    let profileData = null;
    
    // Lấy profile tương ứng với role
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
    
    console.log('✅ User info found:', user.email);
    res.json({
      ...user,
      profile: profileData
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== CẬP NHẬT THÔNG TIN USER =====================
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      name,
      phone,
      companyName,
      contactPerson,
      companySize,
      industry
    } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           company_name = COALESCE($3, company_name),
           contact_person = COALESCE($4, contact_person),
           company_size = COALESCE($5, company_size),
           industry = COALESCE($6, industry)
       WHERE id = $7
       RETURNING id, email, name, username, role, company_name, contact_person, phone, company_size, industry`,
      [name, phone, companyName, contactPerson, companySize, industry, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User updated:', result.rows[0].email);
    res.json({
      message: 'Cập nhật thành công',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== CẬP NHẬT PROFILE (user_profiles hoặc employers) =====================
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Lấy role của user
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userRole = userResult.rows[0].role;
    
    if (userRole === 'user') {
      // Cập nhật user_profiles
      const { ky_nang, kinh_nghiem, hoc_van, cv_file } = req.body;
      
      const result = await pool.query(
        `UPDATE user_profiles 
         SET ky_nang = COALESCE($1, ky_nang), 
             kinh_nghiem = COALESCE($2, kinh_nghiem), 
             hoc_van = COALESCE($3, hoc_van), 
             cv_file = COALESCE($4, cv_file)
         WHERE user_id = $5
         RETURNING *`,
        [ky_nang, kinh_nghiem, hoc_van, cv_file, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      console.log('✅ User profile updated');
      res.json({
        message: 'Cập nhật profile thành công',
        profile: result.rows[0]
      });
      
    } else if (userRole === 'employer') {
      // Cập nhật employers
      const { company, description, company_name, contact_person, phone, company_size, industry } = req.body;
      
      // Cập nhật cả bảng users nếu có thông tin công ty
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
      
      // Cập nhật employers
      const result = await pool.query(
        `UPDATE employers 
         SET company = COALESCE($1, company), 
             description = COALESCE($2, description)
         WHERE user_id = $3
         RETURNING *`,
        [company, description, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Employer profile not found' });
      }
      
      console.log('✅ Employer profile updated');
      res.json({
        message: 'Cập nhật profile thành công',
        profile: result.rows[0]
      });
      
    } else {
      return res.status(400).json({ error: 'Invalid user role' });
    }
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== ĐỔI MẬT KHẨU =====================
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    // Lấy thông tin user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Kiểm tra mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    console.log('✅ Password changed for:', user.email);
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('❌ Error changing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ===================== XÓA TÀI KHOẢN =====================
router.delete('/delete', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Vui lòng nhập mật khẩu để xác nhận' });
    }

    // Lấy thông tin user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }

    await client.query('BEGIN');

    // Xóa các bản ghi liên quan (CASCADE sẽ tự động xóa)
    // Nhưng có thể cần xóa thủ công nếu không có CASCADE
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    console.log('✅ Account deleted:', user.email);
    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// ===================== LẤY DANH SÁCH TẤT CẢ USERS (admin only) =====================
router.get('/all', authenticateToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const result = await pool.query(
      `SELECT id, email, name, username, role, 
              company_name, contact_person, phone, company_size, industry, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching all users:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;