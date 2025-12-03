// =============================================
// FILE 2: employerAuthController.js
// EMPLOYER AUTHENTICATION
// =============================================

const Employer = require('../models/Employer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    Register new employer
// @route   POST /api/employer/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      companyName, 
      email, 
      password, 
      contactPerson,
      phone,
      website,
      address 
    } = req.body;

    // Check if employer exists
    let employer = await Employer.findOne({ email });
    if (employer) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email đã được sử dụng' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create employer
    employer = await Employer.create({
      companyName,
      email,
      password: hashedPassword,
      contactPerson,
      phone,
      website,
      address,
      role: 'employer',
      isVerified: false, // Cần admin verify
      isActive: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng đợi admin xác minh tài khoản.',
      token,
      employer: {
        id: employer._id,
        companyName: employer.companyName,
        email: employer.email,
        role: employer.role,
        isVerified: employer.isVerified
      }
    });

  } catch (error) {
    console.error('Employer register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi đăng ký' 
    });
  }
};

// @desc    Login employer
// @route   POST /api/employer/auth/login
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

    // Check employer exists
    const employer = await Employer.findOne({ email }).select('+password');
    if (!employer) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check role
    if (employer.role !== 'employer') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền đăng nhập tại đây' 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email hoặc mật khẩu không đúng' 
      });
    }

    // Check if verified
    if (!employer.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản chưa được xác minh bởi admin' 
      });
    }

    // Check if active
    if (!employer.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Tài khoản đã bị khóa' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last login
    employer.lastLogin = Date.now();
    await employer.save();

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      employer: {
        id: employer._id,
        companyName: employer.companyName,
        email: employer.email,
        role: employer.role,
        contactPerson: employer.contactPerson,
        phone: employer.phone,
        logo: employer.logo,
        isVerified: employer.isVerified
      }
    });

  } catch (error) {
    console.error('Employer login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi đăng nhập' 
    });
  }
};

// @desc    Get employer profile
// @route   GET /api/employer/auth/me
// @access  Private (Employer)
exports.getMe = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id)
      .select('-password')
      .populate('jobs', 'title status createdAt');
    
    if (!employer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy nhà tuyển dụng' 
      });
    }

    res.json({
      success: true,
      employer
    });

  } catch (error) {
    console.error('Get employer profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
};

// @desc    Update employer profile
// @route   PUT /api/employer/auth/update-profile
// @access  Private (Employer)
exports.updateProfile = async (req, res) => {
  try {
    const { 
      companyName, 
      contactPerson, 
      phone, 
      website, 
      address,
      logo,
      description,
      industry,
      companySize,
      foundedYear
    } = req.body;

    const employer = await Employer.findByIdAndUpdate(
      req.user.id,
      { 
        companyName, 
        contactPerson, 
        phone, 
        website, 
        address,
        logo,
        description,
        industry,
        companySize,
        foundedYear
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      employer
    });

  } catch (error) {
    console.error('Update employer profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi cập nhật' 
    });
  }
};

// @desc    Change password
// @route   PUT /api/employer/auth/change-password
// @access  Private (Employer)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const employer = await Employer.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, employer.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Mật khẩu hiện tại không đúng' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    employer.password = await bcrypt.hash(newPassword, salt);
    await employer.save();

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server khi đổi mật khẩu' 
    });
  }
};

// @desc    Logout employer
// @route   POST /api/employer/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
};

// @desc    Get employer dashboard stats
// @route   GET /api/employer/auth/dashboard-stats
// @access  Private (Employer)
exports.getDashboardStats = async (req, res) => {
  try {
    const Job = require('../models/Job');
    const Application = require('../models/Application');

    const [
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications
    ] = await Promise.all([
      Job.countDocuments({ employer: req.user.id }),
      Job.countDocuments({ employer: req.user.id, status: 'active' }),
      Application.countDocuments({ 
        job: { $in: await Job.find({ employer: req.user.id }).select('_id') }
      }),
      Application.countDocuments({ 
        job: { $in: await Job.find({ employer: req.user.id }).select('_id') },
        status: 'pending'
      })
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications
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