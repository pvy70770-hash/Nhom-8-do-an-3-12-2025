// =============================================
// FILE 4: jobController.js
// JOB CRUD OPERATIONS
// =============================================

const Job = require('../models/Job');
const Employer = require('../models/Employer');

// @desc    Get all jobs (with filters and pagination)
// @route   GET /api/jobs
// @access  Public
exports.getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      location,
      category,
      jobType,
      salaryMin,
      salaryMax,
      experience,
      status = 'active',
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build query
    const query = { status };

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by job type
    if (jobType) {
      query.jobType = jobType;
    }

    // Filter by salary range
    if (salaryMin || salaryMax) {
      query.salary = {};
      if (salaryMin) query.salary.$gte = Number(salaryMin);
      if (salaryMax) query.salary.$lte = Number(salaryMax);
    }

    // Filter by experience
    if (experience) {
      query.experience = experience;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOrder = order === 'desc' ? -1 : 1;

    // Execute query
    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('employer', 'companyName logo location')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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
      message: 'Lỗi server khi lấy danh sách việc làm'
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'companyName logo description location website phone email')
      .populate('applications', 'user status createdAt');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Increment views
    job.views += 1;
    await job.save();

    res.json({
      success: true,
      job
    });

  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin công việc'
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer)
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      benefits,
      salary,
      location,
      category,
      jobType,
      experience,
      education,
      numberOfPositions,
      deadline,
      skills
    } = req.body;

    // Check if employer is verified
    const employer = await Employer.findById(req.user.id);
    if (!employer.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản chưa được xác minh. Không thể đăng tin tuyển dụng.'
      });
    }

    const job = await Job.create({
      title,
      description,
      requirements,
      benefits,
      salary,
      location,
      category,
      jobType,
      experience,
      education,
      numberOfPositions,
      deadline,
      skills,
      employer: req.user.id,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Đăng tin tuyển dụng thành công',
      job
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo công việc'
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer - owner only)
exports.updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật công việc này'
      });
    }

    const {
      title,
      description,
      requirements,
      benefits,
      salary,
      location,
      category,
      jobType,
      experience,
      education,
      numberOfPositions,
      deadline,
      skills,
      status
    } = req.body;

    job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        requirements,
        benefits,
        salary,
        location,
        category,
        jobType,
        experience,
        education,
        numberOfPositions,
        deadline,
        skills,
        status
      },
      { new: true, runValidators: true }
    ).populate('employer', 'companyName logo');

    res.json({
      success: true,
      message: 'Cập nhật công việc thành công',
      job
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật công việc'
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer - owner only)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa công việc này'
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Xóa công việc thành công'
    });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa công việc'
    });
  }
};

// @desc    Get jobs by employer
// @route   GET /api/jobs/employer/:employerId
// @access  Public
exports.getJobsByEmployer = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { employer: req.params.employerId };
    if (status) query.status = status;

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
    console.error('Get jobs by employer error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get my jobs (current employer)
// @route   GET /api/jobs/my-jobs
// @access  Private (Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { employer: req.user.id };
    if (status) query.status = status;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('applications')
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
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Change job status
// @route   PUT /api/jobs/:id/status
// @access  Private (Employer - owner only)
exports.changeJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check ownership
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thay đổi trạng thái công việc này'
      });
    }

    job.status = status;
    await job.save();

    res.json({
      success: true,
      message: `Đã ${status === 'active' ? 'kích hoạt' : 'đóng'} tin tuyển dụng`,
      job
    });

  } catch (error) {
    console.error('Change job status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
exports.getFeaturedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ 
      status: 'active',
      isFeatured: true 
    })
      .populate('employer', 'companyName logo')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      count: jobs.length,
      jobs
    });

  } catch (error) {
    console.error('Get featured jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get related jobs
// @route   GET /api/jobs/:id/related
// @access  Public
exports.getRelatedJobs = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    const relatedJobs = await Job.find({
      _id: { $ne: job._id },
      status: 'active',
      $or: [
        { category: job.category },
        { location: job.location }
      ]
    })
      .populate('employer', 'companyName logo')
      .limit(5);

    res.json({
      success: true,
      count: relatedJobs.length,
      jobs: relatedJobs
    });

  } catch (error) {
    console.error('Get related jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};