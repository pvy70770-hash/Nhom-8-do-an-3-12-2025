// =============================================
// FILE 6: userController.js
// USER PROFILE MANAGEMENT
// =============================================

const User = require('../models/User');
const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Get user profile (public view)
// @route   GET /api/users/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email'); // Hide sensitive info for public view

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get my profile (full info)
// @route   GET /api/users/me/profile
// @access  Private (User)
exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Update profile
// @route   PUT /api/users/me/profile
// @access  Private (User)
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      avatar,
      bio,
      address,
      dateOfBirth,
      gender,
      website,
      socialLinks
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        avatar,
        bio,
        address,
        dateOfBirth,
        gender,
        website,
        socialLinks
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật'
    });
  }
};

// @desc    Update skills
// @route   PUT /api/users/me/skills
// @access  Private (User)
exports.updateSkills = async (req, res) => {
  try {
    const { skills } = req.body;

    if (!Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: 'Skills phải là một mảng'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { skills },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Cập nhật kỹ năng thành công',
      user
    });

  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Add experience
// @route   POST /api/users/me/experience
// @access  Private (User)
exports.addExperience = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      startDate,
      endDate,
      current,
      description
    } = req.body;

    const user = await User.findById(req.user.id);

    user.experience.unshift({
      title,
      company,
      location,
      startDate,
      endDate,
      current,
      description
    });

    await user.save();

    res.json({
      success: true,
      message: 'Thêm kinh nghiệm làm việc thành công',
      experience: user.experience
    });

  } catch (error) {
    console.error('Add experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Update experience
// @route   PUT /api/users/me/experience/:expId
// @access  Private (User)
exports.updateExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const experience = user.experience.id(req.params.expId);

    if (!experience) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy kinh nghiệm'
      });
    }

    const {
      title,
      company,
      location,
      startDate,
      endDate,
      current,
      description
    } = req.body;

    experience.title = title || experience.title;
    experience.company = company || experience.company;
    experience.location = location || experience.location;
    experience.startDate = startDate || experience.startDate;
    experience.endDate = endDate || experience.endDate;
    experience.current = current !== undefined ? current : experience.current;
    experience.description = description || experience.description;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật kinh nghiệm thành công',
      experience: user.experience
    });

  } catch (error) {
    console.error('Update experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Delete experience
// @route   DELETE /api/users/me/experience/:expId
// @access  Private (User)
exports.deleteExperience = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.experience = user.experience.filter(
      exp => exp._id.toString() !== req.params.expId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Xóa kinh nghiệm thành công',
      experience: user.experience
    });

  } catch (error) {
    console.error('Delete experience error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Add education
// @route   POST /api/users/me/education
// @access  Private (User)
exports.addEducation = async (req, res) => {
  try {
    const {
      school,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      current,
      description
    } = req.body;

    const user = await User.findById(req.user.id);

    user.education.unshift({
      school,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      current,
      description
    });

    await user.save();

    res.json({
      success: true,
      message: 'Thêm học vấn thành công',
      education: user.education
    });

  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Update education
// @route   PUT /api/users/me/education/:eduId
// @access  Private (User)
exports.updateEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const education = user.education.id(req.params.eduId);

    if (!education) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học vấn'
      });
    }

    const {
      school,
      degree,
      fieldOfStudy,
      startDate,
      endDate,
      current,
      description
    } = req.body;

    education.school = school || education.school;
    education.degree = degree || education.degree;
    education.fieldOfStudy = fieldOfStudy || education.fieldOfStudy;
    education.startDate = startDate || education.startDate;
    education.endDate = endDate || education.endDate;
    education.current = current !== undefined ? current : education.current;
    education.description = description || education.description;

    await user.save();

    res.json({
      success: true,
      message: 'Cập nhật học vấn thành công',
      education: user.education
    });

  } catch (error) {
    console.error('Update education error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Delete education
// @route   DELETE /api/users/me/education/:eduId
// @access  Private (User)
exports.deleteEducation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.education = user.education.filter(
      edu => edu._id.toString() !== req.params.eduId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Xóa học vấn thành công',
      education: user.education
    });

  } catch (error) {
    console.error('Delete education error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Upload resume/CV
// @route   POST /api/users/me/resume
// @access  Private (User)
exports.uploadResume = async (req, res) => {
  try {
    const { resumeUrl } = req.body;

    if (!resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp URL CV'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { resume: resumeUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Upload CV thành công',
      user
    });

  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Save job
// @route   POST /api/users/me/saved-jobs/:jobId
// @access  Private (User)
exports.saveJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const user = await User.findById(req.user.id);

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy công việc'
      });
    }

    // Check if already saved
    if (user.savedJobs.includes(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Công việc đã được lưu'
      });
    }

    user.savedJobs.push(jobId);
    await user.save();

    res.json({
      success: true,
      message: 'Lưu công việc thành công'
    });

  } catch (error) {
    console.error('Save job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Unsave job
// @route   DELETE /api/users/me/saved-jobs/:jobId
// @access  Private (User)
exports.unsaveJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const user = await User.findById(req.user.id);

    user.savedJobs = user.savedJobs.filter(
      id => id.toString() !== jobId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Bỏ lưu công việc thành công'
    });

  } catch (error) {
    console.error('Unsave job error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get saved jobs
// @route   GET /api/users/me/saved-jobs
// @access  Private (User)
exports.getSavedJobs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedJobs',
        populate: { path: 'employer', select: 'companyName logo' }
      });

    res.json({
      success: true,
      count: user.savedJobs.length,
      jobs: user.savedJobs
    });

  } catch (error) {
    console.error('Get saved jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get user dashboard stats
// @route   GET /api/users/me/dashboard-stats
// @access  Private (User)
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalApplications,
      savedJobsCount,
      pendingApplications,
      acceptedApplications
    ] = await Promise.all([
      Application.countDocuments({ user: req.user.id }),
      User.findById(req.user.id).then(user => user.savedJobs.length),
      Application.countDocuments({ user: req.user.id, status: 'pending' }),
      Application.countDocuments({ user: req.user.id, status: 'accepted' })
    ]);

    res.json({
      success: true,
      stats: {
        totalApplications,
        savedJobsCount,
        pendingApplications,
        acceptedApplications
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