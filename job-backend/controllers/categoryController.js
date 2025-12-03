// =============================================
// FILE 9: categoryController.js
// CATEGORY MANAGEMENT
// =============================================

const Category = require('../models/Category');
const Job = require('../models/Job');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const query = {};
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    // Get job count for each category
    const categoriesWithJobCount = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        jobCount: await Job.countDocuments({ 
          category: category._id,
          status: 'active'
        })
      }))
    );

    res.json({
      success: true,
      count: categoriesWithJobCount.length,
      categories: categoriesWithJobCount
    });

  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách danh mục'
    });
  }
};

// @desc    Get category by ID
// @route   GET /api/categories/:id
// @access  Public
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Get jobs in this category
    const jobs = await Job.find({ 
      category: category._id,
      status: 'active'
    })
      .populate('employer', 'companyName logo')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        jobCount: jobs.length,
        jobs
      }
    });

  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get category by slug
// @route   GET /api/categories/slug/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Get jobs in this category
    const jobs = await Job.find({ 
      category: category._id,
      status: 'active'
    })
      .populate('employer', 'companyName logo')
      .limit(10)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      category: {
        ...category.toObject(),
        jobCount: jobs.length,
        jobs
      }
    });

  } catch (error) {
    console.error('Get category by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, order } = req.body;

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại'
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      order,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo danh mục'
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, icon, order, isActive } = req.body;

    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if new slug conflicts with existing
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại'
        });
      }
    }

    category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, slug, description, icon, order, isActive },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật danh mục'
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if category has jobs
    const jobCount = await Job.countDocuments({ category: category._id });
    if (jobCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục có ${jobCount} công việc. Vui lòng xóa hoặc chuyển công việc sang danh mục khác trước.`
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa danh mục'
    });
  }
};

// @desc    Toggle category active status
// @route   PUT /api/categories/:id/toggle-status
// @access  Private (Admin)
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      success: true,
      message: `Đã ${category.isActive ? 'kích hoạt' : 'ẩn'} danh mục`,
      category
    });

  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get popular categories (most jobs)
// @route   GET /api/categories/popular
// @access  Public
exports.getPopularCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();

    // Get job count for each category
    const categoriesWithJobCount = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        jobCount: await Job.countDocuments({ 
          category: category._id,
          status: 'active'
        })
      }))
    );

    // Sort by job count and take top 8
    const popularCategories = categoriesWithJobCount
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, 8);

    res.json({
      success: true,
      count: popularCategories.length,
      categories: popularCategories
    });

  } catch (error) {
    console.error('Get popular categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Reorder categories
// @route   PUT /api/categories/reorder
// @access  Private (Admin)
exports.reorderCategories = async (req, res) => {
  try {
    const { categoryOrders } = req.body;
    // categoryOrders = [{ id, order }, { id, order }, ...]

    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        message: 'categoryOrders phải là một mảng'
      });
    }

    // Update order for each category
    const updatePromises = categoryOrders.map(({ id, order }) =>
      Category.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Sắp xếp danh mục thành công'
    });

  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Search categories
// @route   GET /api/categories/search
// @access  Public
exports.searchCategories = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập từ khóa tìm kiếm'
      });
    }

    const categories = await Category.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    res.json({
      success: true,
      count: categories.length,
      categories
    });

  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};

// @desc    Get category statistics
// @route   GET /api/categories/stats
// @access  Public
exports.getCategoryStats = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).lean();

    const stats = await Promise.all(
      categories.map(async (category) => {
        const [totalJobs, activeJobs, totalApplications] = await Promise.all([
          Job.countDocuments({ category: category._id }),
          Job.countDocuments({ category: category._id, status: 'active' }),
          Job.find({ category: category._id })
            .then(jobs => {
              const jobIds = jobs.map(job => job._id);
              return Application.countDocuments({ job: { $in: jobIds } });
            })
        ]);

        return {
          categoryId: category._id,
          categoryName: category.name,
          totalJobs,
          activeJobs,
          totalApplications
        };
      })
    );

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
};