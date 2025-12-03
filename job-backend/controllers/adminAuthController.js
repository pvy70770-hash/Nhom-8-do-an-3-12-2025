// =============================================
// FILE 3: adminAuthController.js
// ADMIN AUTHENTICATION
// =============================================

const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    Login admin
// @route   POST /api/admin/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập email và mật khẩu' 
      });
    }

    // Check admin exists
    const admin = await Admin.findOne({ email }).select('+password');
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check role
    if (admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền truy cập admin' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if active
    if (!admin.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản admin đã bị khóa' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    res.json({
      success: true,
      message: 'Đăng nhập admin thành công',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi đăng nhập' 
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy admin' 
      });
    }

    res.json({
      success: true,
      admin
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// @desc    Create new admin (Super Admin only)
// @route   POST /api/admin/auth/create-admin
// @access  Private (Super Admin)
exports.createAdmin = async (req, res) => {
  try {
    // Check if requester is super admin
    const requester = await Admin.findById(req.user.id);
    if (!requester.permissions.includes('super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ Super Admin mới có quyền tạo admin mới' 
      });
    }

    const { name, email, password, permissions } = req.body;

    // Check if admin exists
    let admin = await Admin.findOne({ email });
    if (admin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin
    admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      permissions: permissions || ['manage_users', 'manage_jobs'],
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo admin mới thành công',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi tạo admin' 
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/auth/update-profile
// @access  Private (Admin)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      admin
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi cập nhật' 
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/auth/change-password
// @access  Private (Admin)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không đúng' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu admin thành công'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi đổi mật khẩu' 
    });
  }
};

// @desc    Logout admin
// @route   POST /api/admin/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/auth/dashboard-stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const User = require('../models/User');
    const Employer = require('../models/Employer');
    const Job = require('../models/Job');
    const Application = require('../models/Application');

    const [
      totalUsers,
      totalEmployers,
      totalJobs,
      totalApplications,
      activeJobs,
      pendingEmployers,
      recentUsers,
      recentJobs
    ] = await Promise.all([
      User.countDocuments(),
      Employer.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Employer.countDocuments({ isVerified: false }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Job.find().sort({ createdAt: -1 }).limit(5).populate('employer', 'companyName')
    ]);

    res.json({
      success: true,
      stats: {
        overview: {
          totalUsers,
          totalEmployers,
          totalJobs,
          totalApplications,
          activeJobs,
          pendingEmployers
        },
        recent: {
          users: recentUsers,
          jobs: recentJobs
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi lấy thống kê' 
    });
  }
};

// @desc    Update admin permissions (Super Admin only)
// @route   PUT /api/admin/auth/update-permissions/:id
// @access  Private (Super Admin)
exports.updatePermissions = async (req, res) => {
  try {
    // Check if requester is super admin
    const requester = await Admin.findById(req.user.id);
    if (!requester.permissions.includes('super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ Super Admin mới có quyền cập nhật quyền' 
      });
    }

    const { permissions } = req.body;
    const adminId = req.params.id;

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { permissions },
      { new: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy admin' 
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật quyền thành công',
      admin
    });

  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi cập nhật quyền' 
    });
  }
};

// @desc    Toggle admin active status (Super Admin only)
// @route   PUT /api/admin/auth/toggle-status/:id
// @access  Private (Super Admin)
exports.toggleStatus = async (req, res) => {
  try {
    // Check if requester is super admin
    const requester = await Admin.findById(req.user.id);
    if (!requester.permissions.includes('super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ Super Admin mới có quyền thay đổi trạng thái' 
      });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy admin' 
      });
    }

    // Cannot deactivate super admin
    if (admin.permissions.includes('super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Không thể khóa tài khoản Super Admin' 
      });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: `Đã ${admin.isActive ? 'kích hoạt' : 'khóa'} tài khoản admin`,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// @desc    Get all admins (Super Admin only)
// @route   GET /api/admin/auth/admins
// @access  Private (Super Admin)
exports.getAllAdmins = async (req, res) => {
  try {
    // Check if requester is super admin
    const requester = await Admin.findById(req.user.id);
    if (!requester.permissions.includes('super_admin')) {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ Super Admin mới có quyền xem danh sách admin' 
      });
    }

    const admins = await Admin.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: admins.length,
      admins
    });

  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};