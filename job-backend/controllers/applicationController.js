// =============================================
// FILE 5: applicationController.js
// JOB APPLICATIONS MANAGEMENT
// =============================================

const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Apply for a job
// @route   POST /api/applications/apply/:jobId
// @access  Private (User)
exports.applyJob = async (req, res) => {
  try {
    const { coverLetter, resume } = req.body;
    const jobId = req.params.jobId;
    const userId = req.user.id;

    // Check if job exists and is active
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Công việc này không còn nhận hồ sơ'
      });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      user: userId
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã ứng tuyển công việc này rồi'
      });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      user: userId,
      coverLetter,
      resume,
      status: 'pending'
    });

    // Populate application
    await application.populate([
      { path: 'job', select: 'title location salary' },
      { path: 'user', select: 'name email phone' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Ứng tuyển thành công',
      application
    });

  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi ứng tuyển'
    });
  }
};

// @desc    Get my applications (user)
// @route   GET /api/applications/my-applications
// @access  Private (User)
exports.getMyApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user.id };
    if (status) query.status = status;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('job', 'title location salary status deadline')
        .populate({
          path: 'job',
          populate: { path: 'employer', select: 'companyName logo' }
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
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get applications for a job (employer)
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer - job owner only)
exports.getJobApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    const jobId = req.params.jobId;

    // Check if job exists and belongs to employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hồ sơ của công việc này'
      });
    }

    const query = { job: jobId };
    if (status) query.status = status;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('user', 'name email phone avatar bio skills experience')
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
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (User owns or Employer owns job)
exports.getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title location salary employer')
      .populate('user', 'name email phone avatar bio skills experience education');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ ứng tuyển'
      });
    }

    // Check permission
    const isApplicant = application.user._id.toString() === req.user.id;
    const isEmployer = application.job.employer.toString() === req.user.id;

    if (!isApplicant && !isEmployer) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem hồ sơ này'
      });
    }

    res.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Update application status (employer)
// @route   PUT /api/applications/:id/status
// @access  Private (Employer - job owner only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ ứng tuyển'
      });
    }

    // Check if employer owns the job
    if (application.job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật hồ sơ này'
      });
    }

    application.status = status;
    if (note) application.note = note;
    await application.save();

    await application.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      application
    });

  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Withdraw application (user)
// @route   DELETE /api/applications/:id
// @access  Private (User - owner only)
exports.withdrawApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hồ sơ ứng tuyển'
      });
    }

    // Check ownership
    if (application.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền rút hồ sơ này'
      });
    }

    // Cannot withdraw if already accepted/rejected
    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Không thể rút hồ sơ đã được xử lý'
      });
    }

    await application.deleteOne();

    res.json({
      success: true,
      message: 'Đã rút hồ sơ ứng tuyển'
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get application statistics (employer)
// @route   GET /api/applications/stats/employer
// @access  Private (Employer)
exports.getEmployerApplicationStats = async (req, res) => {
  try {
    // Get all job IDs from this employer
    const jobs = await Job.find({ employer: req.user.id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    const [
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications
    ] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'pending' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'accepted' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' })
    ]);

    res.json({
      success: true,
      stats: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications
      }
    });

  } catch (error) {
    console.error('Get employer application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get application statistics (user)
// @route   GET /api/applications/stats/user
// @access  Private (User)
exports.getUserApplicationStats = async (req, res) => {
  try {
    const [
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications
    ] = await Promise.all([
      Application.countDocuments({ user: req.user.id }),
      Application.countDocuments({ user: req.user.id, status: 'pending' }),
      Application.countDocuments({ user: req.user.id, status: 'accepted' }),
      Application.countDocuments({ user: req.user.id, status: 'rejected' })
    ]);

    res.json({
      success: true,
      stats: {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        rejectedApplications
      }
    });

  } catch (error) {
    console.error('Get user application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Bulk update application status
// @route   PUT /api/applications/bulk-update
// @access  Private (Employer)
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { applicationIds, status, note } = req.body;

    if (!applicationIds || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một hồ sơ'
      });
    }

    // Get applications and check permissions
    const applications = await Application.find({
      _id: { $in: applicationIds }
    }).populate('job');

    // Check if employer owns all jobs
    const unauthorized = applications.some(
      app => app.job.employer.toString() !== req.user.id
    );

    if (unauthorized) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật một số hồ sơ'
      });
    }

    // Update all applications
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { status, note }
    );

    res.json({
      success: true,
      message: `Đã cập nhật ${applicationIds.length} hồ sơ thành công`
    });

  } catch (error) {
    console.error('Bulk update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};