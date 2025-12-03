// =============================================
// FILE 8: adminController.js
// ADMIN OPERATIONS
// =============================================

const User = require('../models/User');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Admin = require('../models/Admin');

// ============================================
// USER MANAGEMENT
// ============================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Get user's applications
    const applications = await Application.find({ user: user._id })
      .populate('job', 'title company')
      .limit(10);

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        applications
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Đã ${user.isActive ? 'kích hoạt' : 'khóa'} tài khoản người dùng`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Delete user's applications
    await Application.deleteMany({ user: user._id });

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Xóa người dùng thành công'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// ============================================
// EMPLOYER MANAGEMENT
// ============================================

// @desc    Get all employers
// @route   GET /api/admin/employers
// @access  Private (Admin)
exports.getAllEmployers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isVerified, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (search) {
      query.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const [employers, total] = await Promise.all([
      Employer.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Employer.countDocuments(query)
    ]);

    // Get job counts
    const employersWithStats = await Promise.all(
      employers.map(async (employer) => ({
        ...employer.toObject(),
        jobCount: await Job.countDocuments({ employer: employer._id })
      }))
    );

    res.json({
      success: true,
      count: employersWithStats.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      employers: employersWithStats
    });

  } catch (error) {
    console.error('Get all employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get employer by ID
// @route   GET /api/admin/employers/:id
// @access  Private (Admin)
exports.getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id)
      .select('-password');

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    // Get employer's jobs
    const jobs = await Job.find({ employer: employer._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      employer: {
        ...employer.toObject(),
        jobs
      }
    });

  } catch (error) {
    console.error('Get employer by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Verify employer
// @route   PUT /api/admin/employers/:id/verify
// @access  Private (Admin)
exports.verifyEmployer = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    employer.isVerified = true;
    await employer.save();

    res.json({
      success: true,
      message: 'Xác minh nhà tuyển dụng thành công',
      employer
    });

  } catch (error) {
    console.error('Verify employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Unverify employer
// @route   PUT /api/admin/employers/:id/unverify
// @access  Private (Admin)
exports.unverifyEmployer = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    employer.isVerified = false;
    await employer.save();

    res.json({
      success: true,
      message: 'Đã hủy xác minh nhà tuyển dụng',
      employer
    });

  } catch (error) {
    console.error('Unverify employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Toggle employer active status
// @route   PUT /api/admin/employers/:id/toggle-status
// @access  Private (Admin)
exports.toggleEmployerStatus = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    employer.isActive = !employer.isActive;
    await employer.save();

    res.json({
      success: true,
      message: `Đã ${employer.isActive ? 'kích hoạt' : 'khóa'} tài khoản nhà tuyển dụng`,
      employer
    });

  } catch (error) {
    console.error('Toggle employer status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Delete employer
// @route   DELETE /api/admin/employers/:id
// @access  Private (Admin)
exports.deleteEmployer = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id);

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    // Delete employer's jobs and applications
    const jobs = await Job.find({ employer: employer._id });
    const jobIds = jobs.map(job => job._id);
    
    await Application.deleteMany({ job: { $in: jobIds } });
    await Job.deleteMany({ employer: employer._id });
    await employer.deleteOne();

    res.json({
      success: true,
      message: 'Xóa nhà tuyển dụng thành công'
    });

  } catch (error) {
    console.error('Delete employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// ============================================
// JOB MANAGEMENT
// ============================================

// @desc    Get all jobs
// @route   GET /api/admin/jobs
// @access  Private (Admin)
exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (status) {
      query.status = status;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('employer', 'companyName logo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: jobs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      jobs
    });

  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Delete job's applications
    await Application.deleteMany({ job: job._id });
    await job.deleteOne();

    res.json({
      success: true,
      message: 'Xóa công việc thành công'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Toggle job featured status
// @route   PUT /api/admin/jobs/:id/toggle-featured
// @access  Private (Admin)
exports.toggleJobFeatured = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    job.isFeatured = !job.isFeatured;
    await job.save();

    res.json({
      success: true,
      message: `Đã ${job.isFeatured ? 'đánh dấu' : 'bỏ đánh dấu'} công việc nổi bật`,
      job
    });

  } catch (error) {
    console.error('Toggle job featured error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// ============================================
// APPLICATION MANAGEMENT
// ============================================

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private (Admin)
exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('user', 'name email')
        .populate('job', 'title')
        .populate({
          path: 'job',
          populate: { path: 'employer', select: 'companyName' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Application.countDocuments(query)
    ]);

    res.json({
      success: true,
      count: applications.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      applications
    });

  } catch (error) {
    console.error('Get all applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// ============================================
// DASHBOARD & STATISTICS
// ============================================

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalEmployers,
      totalJobs,
      totalApplications,
      activeJobs,
      pendingEmployers,
      recentUsers,
      recentEmployers,
      recentJobs,
      recentApplications
    ] = await Promise.all([
      User.countDocuments(),
      Employer.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Employer.countDocuments({ isVerified: false }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Employer.find().sort({ createdAt: -1 }).limit(5).select('companyName email isVerified createdAt'),
      Job.find().sort({ createdAt: -1 }).limit(5).populate('employer', 'companyName'),
      Application.find().sort({ createdAt: -1 }).limit(5)
        .populate('user', 'name')
        .populate('job', 'title')
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
          employers: recentEmployers,
          jobs: recentJobs,
          applications: recentApplications
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get statistics by date range
// @route   GET /api/admin/dashboard/stats-by-date
// @access  Private (Admin)
exports.getStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const [
      newUsers,
      newEmployers,
      newJobs,
      newApplications
    ] = await Promise.all([
      User.countDocuments(dateQuery),
      Employer.countDocuments(dateQuery),
      Job.countDocuments(dateQuery),
      Application.countDocuments(dateQuery)
    ]);

    res.json({
      success: true,
      stats: {
        newUsers,
        newEmployers,
        newJobs,
        newApplications
      }
    });

  } catch (error) {
    console.error('Get stats by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};