// ===================== CATEGORY MODEL =====================
const pool = require('../config/db');

class Category {
  /**
   * Category slug mapping
   */
  static SLUG_MAP = {
    "cong-nghe-thong-tin": "Công nghệ thông tin",
    "ke-toan-tai-chinh": "Kế toán - Tài chính - Ngân hàng",
    "kinh-doanh-ban-hang": "Kinh doanh - Bán hàng",
    "marketing-truyen-thong": "Marketing - Truyền thông",
    "nhan-su-hanh-chinh": "Nhân sự - Hành chính",
    "thiet-ke-do-hoa": "Thiết kế - Đồ hoạ",
    "ky-thuat-xay-dung": "Kỹ thuật - Xây dựng",
    "giao-duc-dao-tao": "Giáo dục - Đào tạo",
    "bat-dong-san": "Bất động sản",
    "lao-dong-pho-thong": "Lao động phổ thông",
    "nha-hang-khach-san": "Nhà hàng - Khách sạn",
    "dich-vu-khach-hang": "Dịch vụ - Khách hàng",
    "quan-ly-cap-cao": "Quản lý / Cấp cao",
    "khac": "Khác"
  };

  /**
   * Lấy tất cả categories
   * @returns {Promise<Array>}
   */
  static async findAll() {
    try {
      const categories = Object.entries(this.SLUG_MAP).map(([slug, name]) => ({
        slug,
        name,
        icon: this.getCategoryIcon(name)
      }));
      return categories;
    } catch (error) {
      console.error('❌ Error in Category.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Lấy category theo slug
   * @param {String} slug - Category slug
   * @returns {Object|null}
   */
  static findBySlug(slug) {
    try {
      const name = this.SLUG_MAP[slug];
      if (!name) return null;
      
      return {
        slug,
        name,
        icon: this.getCategoryIcon(name)
      };
    } catch (error) {
      console.error('❌ Error in Category.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Lấy category theo name
   * @param {String} name - Category name
   * @returns {Object|null}
   */
  static findByName(name) {
    try {
      const entry = Object.entries(this.SLUG_MAP).find(([_, catName]) => catName === name);
      if (!entry) return null;
      
      const [slug] = entry;
      return {
        slug,
        name,
        icon: this.getCategoryIcon(name)
      };
    } catch (error) {
      console.error('❌ Error in Category.findByName:', error.message);
      throw error;
    }
  }

  /**
   * Convert slug to name
   * @param {String} slug - Category slug
   * @returns {String}
   */
  static slugToName(slug) {
    return this.SLUG_MAP[slug] || decodeURIComponent(slug);
  }

  /**
   * Convert name to slug
   * @param {String} name - Category name
   * @returns {String|null}
   */
  static nameToSlug(name) {
    const entry = Object.entries(this.SLUG_MAP).find(([_, catName]) => catName === name);
    return entry ? entry[0] : null;
  }

  /**
   * Get category icon
   * @param {String} categoryName - Category name
   * @returns {String}
   */
  static getCategoryIcon(categoryName) {
    const iconMap = {
      "Công nghệ thông tin": "💻",
      "Kế toán - Tài chính - Ngân hàng": "💰",
      "Kinh doanh - Bán hàng": "📊",
      "Marketing - Truyền thông": "📢",
      "Nhân sự - Hành chính": "👥",
      "Thiết kế - Đồ hoạ": "🎨",
      "Kỹ thuật - Xây dựng": "🏗️",
      "Giáo dục - Đào tạo": "📚",
      "Bất động sản": "🏠",
      "Lao động phổ thông": "🔧",
      "Nhà hàng - Khách sạn": "🍽️",
      "Dịch vụ - Khách hàng": "🤝",
      "Quản lý / Cấp cao": "👔",
      "Khác": "📌"
    };
    return iconMap[categoryName] || "📌";
  }

  /**
   * Đếm số jobs theo category
   * @param {String} categoryName - Category name
   * @returns {Promise<Number>}
   */
  static async countJobs(categoryName) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM jobs WHERE category = $1',
        [categoryName]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Category.countJobs:', error.message);
      throw error;
    }
  }

  /**
   * Lấy tất cả categories với job count
   * @returns {Promise<Array>}
   */
  static async getAllWithJobCount() {
    try {
      const result = await pool.query(
        `SELECT category, COUNT(*) as job_count
         FROM jobs
         GROUP BY category
         ORDER BY job_count DESC`
      );
      
      // Merge với danh sách categories có sẵn
      const categories = await this.findAll();
      
      const categoriesWithCount = categories.map(cat => {
        const jobData = result.rows.find(row => row.category === cat.name);
        return {
          ...cat,
          jobCount: jobData ? parseInt(jobData.job_count) : 0
        };
      });
      
      return categoriesWithCount;
    } catch (error) {
      console.error('❌ Error in Category.getAllWithJobCount:', error.message);
      throw error;
    }
  }

  /**
   * Lấy top categories (nhiều jobs nhất)
   * @param {Number} limit - Number of categories
   * @returns {Promise<Array>}
   */
  static async getTopCategories(limit = 5) {
    try {
      const result = await pool.query(
        `SELECT category, COUNT(*) as job_count
         FROM jobs
         WHERE status = 'open'
         GROUP BY category
         ORDER BY job_count DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map(row => {
        const categoryInfo = this.findByName(row.category);
        return {
          ...categoryInfo,
          jobCount: parseInt(row.job_count)
        };
      });
    } catch (error) {
      console.error('❌ Error in Category.getTopCategories:', error.message);
      throw error;
    }
  }

  /**
   * Validate category name
   * @param {String} name - Category name
   * @returns {Boolean}
   */
  static isValidCategory(name) {
    return Object.values(this.SLUG_MAP).includes(name);
  }

  /**
   * Validate category slug
   * @param {String} slug - Category slug
   * @returns {Boolean}
   */
  static isValidSlug(slug) {
    return Object.keys(this.SLUG_MAP).includes(slug);
  }

  /**
   * Get categories with statistics
   * @returns {Promise<Array>}
   */
  static async getStatistics() {
    try {
      const result = await pool.query(
        `SELECT 
          category,
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN status = 'open' THEN 1 END) as open_jobs,
          COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_jobs,
          AVG(min_salary) as avg_min_salary,
          AVG(max_salary) as avg_max_salary
         FROM jobs
         GROUP BY category
         ORDER BY total_jobs DESC`
      );
      
      return result.rows.map(row => {
        const categoryInfo = this.findByName(row.category);
        return {
          ...categoryInfo,
          totalJobs: parseInt(row.total_jobs),
          openJobs: parseInt(row.open_jobs),
          closedJobs: parseInt(row.closed_jobs),
          avgMinSalary: parseFloat(row.avg_min_salary) || 0,
          avgMaxSalary: parseFloat(row.avg_max_salary) || 0
        };
      });
    } catch (error) {
      console.error('❌ Error in Category.getStatistics:', error.message);
      throw error;
    }
  }

  /**
   * Search categories
   * @param {String} searchTerm - Search term
   * @returns {Array}
   */
  static search(searchTerm) {
    try {
      const term = searchTerm.toLowerCase();
      const categories = this.findAll();
      
      return categories.filter(cat => 
        cat.name.toLowerCase().includes(term) || 
        cat.slug.includes(term)
      );
    } catch (error) {
      console.error('❌ Error in Category.search:', error.message);
      throw error;
    }
  }

  /**
   * Get trending categories (by recent job postings)
   * @param {Number} limit - Number of categories
   * @param {Number} days - Number of days to look back
   * @returns {Promise<Array>}
   */
  static async getTrendingCategories(limit = 5, days = 30) {
    try {
      const result = await pool.query(
        `SELECT category, COUNT(*) as recent_jobs
         FROM jobs
         WHERE posted_at >= NOW() - INTERVAL '${days} days'
           AND status = 'open'
         GROUP BY category
         ORDER BY recent_jobs DESC
         LIMIT $1`,
        [limit]
      );
      
      return result.rows.map(row => {
        const categoryInfo = this.findByName(row.category);
        return {
          ...categoryInfo,
          recentJobs: parseInt(row.recent_jobs)
        };
      });
    } catch (error) {
      console.error('❌ Error in Category.getTrendingCategories:', error.message);
      throw error;
    }
  }
}

module.exports = Category;