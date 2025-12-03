// routes/applications.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/db');

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

// ===================== POST: ỨNG TUYỂN CÔNG VIỆC =====================
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { job_id } = req.body;
    const userId = req.user.id;

    console.log('📝 Application request:', { job_id, userId });

    // Validate
    if (!job_id) {
      return res.status(400).json({ message: 'job_id là bắt buộc' });
    }

    // Kiểm tra user có phải là candidate không
    const userCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'user') {
      return res.status(403).json({ message: 'Chỉ ứng viên mới có thể ứng tuyển' });
    }

    // Kiểm tra job có tồn tại không
    const jobCheck = await pool.query(
      "SELECT * FROM jobs WHERE id = $1",
      [job_id]
    );

    if (jobCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Công việc không tồn tại' });
    }

    // Kiểm tra job còn mở không
    if (jobCheck.rows[0].status !== 'open') {
      return res.status(400).json({ message: 'Công việc này đã đóng' });
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

    console.log('✅ Application created:', result.rows[0].id);

    res.status(201).json({
      message: 'Ứng tuyển thành công',
      application: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Lỗi khi tạo application:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: LẤY ĐƠN ỨNG TUYỂN CỦA MÌNH (candidate) =====================
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT a.*, 
              j.title, j.location, j.min_salary, j.max_salary, j.currency, j.status as job_status,
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

    console.log(`✅ Found ${result.rows.length} applications for user ${userId}`);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Lỗi khi lấy applications:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: LẤY ĐƠN ỨNG TUYỂN CHO MỘT JOB (employer only) =====================
router.get('/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    console.log('📋 Get applications for job:', jobId, 'by user:', userId);

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

    console.log(`✅ Found ${result.rows.length} applications for job ${jobId}`);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Lỗi khi lấy applications cho job:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: LẤY CHI TIẾT MỘT APPLICATION =====================
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT a.*,
              j.title, j.description, j.location, j.min_salary, j.max_salary, j.currency,
              u.name as candidate_name, u.email as candidate_email, u.phone as candidate_phone,
              up.ky_nang, up.kinh_nghiem, up.hoc_van, up.cv_file,
              e.company, e.description as company_description,
              emp_user.company_name, emp_user.contact_person
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.user_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       JOIN employers e ON j.employer_id = e.id
       JOIN users emp_user ON e.user_id = emp_user.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const application = result.rows[0];

    // Kiểm tra quyền xem: phải là candidate sở hữu hoặc employer của job
    const isOwner = application.user_id === userId;
    const isEmployer = await pool.query(
      `SELECT * FROM employers WHERE user_id = $1 AND id = (SELECT employer_id FROM jobs WHERE id = $2)`,
      [userId, application.job_id]
    );

    if (!isOwner && isEmployer.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn này' });
    }

    console.log('✅ Application details:', id);
    res.json(application);
  } catch (err) {
    console.error('❌ Lỗi khi lấy chi tiết application:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== PUT: CẬP NHẬT TRẠNG THÁI ĐƠN (employer only) =====================
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    console.log('📝 Update application:', id, 'to status:', status);

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Status không hợp lệ',
        validStatuses 
      });
    }

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

    console.log('✅ Application updated:', id);

    res.json({
      message: 'Cập nhật trạng thái thành công',
      application: result.rows[0]
    });
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật application:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== DELETE: RÚT ĐƠN ỨNG TUYỂN (candidate only) =====================
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('🗑️ Delete application:', id, 'by user:', userId);

    // Kiểm tra application có thuộc về user này không
    const applicationCheck = await pool.query(
      "SELECT * FROM applications WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (applicationCheck.rows.length === 0) {
      return res.status(404).json({ message: "Application not found or not yours" });
    }

    // Kiểm tra trạng thái - chỉ được rút nếu còn pending
    if (applicationCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ 
        message: 'Chỉ có thể rút đơn khi đang ở trạng thái chờ duyệt',
        currentStatus: applicationCheck.rows[0].status
      });
    }

    const result = await pool.query(
      "DELETE FROM applications WHERE id = $1 RETURNING *",
      [id]
    );

    console.log('✅ Application deleted:', id);

    res.json({ 
      message: "Rút đơn ứng tuyển thành công", 
      application: result.rows[0] 
    });
  } catch (err) {
    console.error('❌ Lỗi khi xóa application:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: THỐNG KÊ ĐƠN ỨNG TUYỂN (candidate) =====================
router.get('/stats/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM applications
       WHERE user_id = $1`,
      [userId]
    );

    console.log('✅ Application stats for user:', userId);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: THỐNG KÊ ĐƠN THEO JOB (employer) =====================
router.get('/stats/job/:jobId', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Kiểm tra quyền
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
      return res.status(403).json({ message: 'Bạn không có quyền xem thống kê này' });
    }

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'reviewed' THEN 1 END) as reviewed,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM applications
       WHERE job_id = $1`,
      [jobId]
    );

    console.log('✅ Application stats for job:', jobId);

    res.json(stats.rows[0]);
  } catch (err) {
    console.error('❌ Lỗi khi lấy thống kê:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ===================== GET: TẤT CẢ ĐƠN ỨNG TUYỂN (admin only) =====================
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const result = await pool.query(
      `SELECT a.*,
              j.title as job_title,
              u.name as candidate_name, u.email as candidate_email,
              e.company
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN users u ON a.user_id = u.id
       JOIN employers e ON j.employer_id = e.id
       ORDER BY a.applied_at DESC`
    );

    console.log(`✅ Found ${result.rows.length} applications (admin)`);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Lỗi khi lấy tất cả applications:', err);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;