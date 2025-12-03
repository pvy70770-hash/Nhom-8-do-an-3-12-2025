// =============================================
// FILE 7: employerController.js
// EMPLOYER OPERATIONS
// =============================================

const Employer = require('../models/Employer');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all employers (with filters and pagination)
// @route   GET /api/employers
// @access  Public
exports.getAllEmployers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      industry,
      companySize,
      location,
      isVerified = true
    } = req.query;

    const query = { isActive: true };

    // Only show verified employers to public
    if (isVerified !== 'all') {
      query.isVerified = isVerified === 'true';
    }

    // Search by company name
    if (search) {
      query.companyName = { $regex: search, $options: 'i' };
    }

    // Filter by industry
    if (industry) {
      query.industry = industry;
    }

    // Filter by company size
    if (companySize) {
      query.companySize = companySize;
    }

    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [employers, total] = await Promise.all([
      Employer.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Employer.countDocuments(query)
    ]);

    // Get job count for each employer
    const employersWithJobCount = await Promise.all(
      employers.map(async (employer) => ({
        ...employer,
        jobCount: await Job.countDocuments({ 
          employer: employer._id, 
          status: 'active' 
        })
      }))
    );

    res.json({
      success: true,
      count: employersWithJobCount.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      employers: employersWithJobCount
    });

  } catch (error) {
    console.error('Get all employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhà tuyển dụng'
    });
  }
};

// @desc    Get employer by ID (public profile)
// @route   GET /api/employers/:id
// @access  Public
exports.getEmployerById = async (req, res) => {
  try {
    const employer = await Employer.findById(req.params.id)
      .select('-password')
      .lean();

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    // Get active jobs
    const jobs = await Job.find({ 
      employer: employer._id, 
      status: 'active' 
    })
      .select('title location salary jobType createdAt')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      employer: {
        ...employer,
        activeJobs: jobs.length,
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

// @desc    Get employer dashboard statistics
// @route   GET /api/employers/me/dashboard
// @access  Private (Employer)
exports.getDashboardStats = async (req, res) => {
  try {
    const employerId = req.user.id;

    // Get all jobs by this employer
    const jobs = await Job.find({ employer: employerId });
    const jobIds = jobs.map(job => job._id);

    const [
      totalJobs,
      activeJobs,
      closedJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      totalViews,
      recentApplications
    ] = await Promise.all([
      Job.countDocuments({ employer: employerId }),
      Job.countDocuments({ employer: employerId, status: 'active' }),
      Job.countDocuments({ employer: employerId, status: 'closed' }),
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'pending' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'accepted' }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'rejected' }),
      Job.aggregate([
        { $match: { employer: req.user.id } },
        { $group: { _id: null, totalViews: { $sum: '$views' } } }
      ]).then(result => result[0]?.totalViews || 0),
      Application.find({ job: { $in: jobIds } })
        .populate('user', 'name avatar')
        .populate('job', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      stats: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: closedJobs
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          accepted: acceptedApplications,
          rejected: rejectedApplications
        },
        views: totalViews,
        recentApplications
      }
    });

  } catch (error) {
    console.error('Get employer dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Update employer profile
// @route   PUT /api/employers/me/profile
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
      foundedYear,
      socialLinks,
      benefits
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
        foundedYear,
        socialLinks,
        benefits
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin công ty thành công',
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

// @desc    Get employer profile (self)
// @route   GET /api/employers/me/profile
// @access  Private (Employer)
exports.getMyProfile = async (req, res) => {
  try {
    const employer = await Employer.findById(req.user.id)
      .select('-password');

    if (!employer) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà tuyển dụng'
      });
    }

    // Get additional stats
    const [jobCount, applicationCount] = await Promise.all([
      Job.countDocuments({ employer: req.user.id }),
      Application.countDocuments({ 
        job: { $in: await Job.find({ employer: req.user.id }).select('_id') }
      })
    ]);

    res.json({
      success: true,
      employer: {
        ...employer.toObject(),
        stats: {
          totalJobs: jobCount,
          totalApplications: applicationCount
        }
      }
    });

  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get all jobs by employer
// @route   GET /api/employers/me/jobs
// @access  Private (Employer)
exports.getMyJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const query = { employer: req.user.id };
    
    if (status) query.status = status;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Job.countDocuments(query)
    ]);

    // Get application count for each job
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => ({
        ...job.toObject(),
        applicationCount: await Application.countDocuments({ job: job._id }),
        pendingCount: await Application.countDocuments({ 
          job: job._id, 
          status: 'pending' 
        })
      }))
    );

    res.json({
      success: true,
      count: jobsWithStats.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      jobs: jobsWithStats
    });

  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get applications for all employer's jobs
// @route   GET /api/employers/me/applications
// @access  Private (Employer)
exports.getMyApplications = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, jobId } = req.query;
    const skip = (page - 1) * limit;

    // Get all job IDs from this employer
    const jobs = await Job.find({ employer: req.user.id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    const query = { job: { $in: jobIds } };
    
    if (status) query.status = status;
    if (jobId) query.job = jobId;

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('user', 'name email phone avatar')
        .populate('job', 'title location salary')
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

// @desc    Upload company logo
// @route   POST /api/employers/me/upload-logo
// @access  Private (Employer)
exports.uploadLogo = async (req, res) => {
  try {
    const { logoUrl } = req.body;

    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp URL logo'
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      req.user.id,
      { logo: logoUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Upload logo thành công',
      employer
    });

  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get featured employers
// @route   GET /api/employers/featured
// @access  Public
exports.getFeaturedEmployers = async (req, res) => {
  try {
    const employers = await Employer.find({
      isVerified: true,
      isActive: true,
      isFeatured: true
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(8);

    // Get job count for each employer
    const employersWithJobCount = await Promise.all(
      employers.map(async (employer) => ({
        ...employer.toObject(),
        jobCount: await Job.countDocuments({ 
          employer: employer._id, 
          status: 'active' 
        })
      }))
    );

    res.json({
      success: true,
      count: employersWithJobCount.length,
      employers: employersWithJobCount
    });

  } catch (error) {
    console.error('Get featured employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Search employers
// @route   GET /api/employers/search
// @access  Public
exports.searchEmployers = async (req, res) => {
  try {
    const { query, industry, location, companySize } = req.query;

    const searchQuery = {
      isVerified: true,
      isActive: true
    };

    if (query) {
      searchQuery.$or = [
        { companyName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (industry) searchQuery.industry = industry;
    if (location) searchQuery.location = { $regex: location, $options: 'i' };
    if (companySize) searchQuery.companySize = companySize;

    const employers = await Employer.find(searchQuery)
      .select('-password')
      .limit(20);

    res.json({
      success: true,
      count: employers.length,
      employers
    });

  } catch (error) {
    console.error('Search employers error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};