// ===================== ADMIN MODEL =====================
const pool = require('../config/db');
const bcrypt = require('bcrypt');

class Admin {
  /**
   * Tìm tất cả admins
   * @returns {Promise<Array>}
   */
  static async findAll() {
    try {
      const result = await pool.query(
        'SELECT id, username, full_name, created_at FROM admin ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Admin.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Tìm admin theo ID
   * @param {Number} id - Admin ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, username, full_name, created_at FROM admin WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Admin.findById:', error.message);
      throw error;
    }
  }

  /**
   * Tìm admin theo username
   * @param {String} username - Admin username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT * FROM admin WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Admin.findByUsername:', error.message);
      throw error;
    }
  }

  /**
   * Tạo admin mới
   * @param {Object} adminData - Admin data
   * @returns {Promise<Object>}
   */
  static async create(adminData) {
    try {
      const { username, password, full_name } = adminData;

      // Check if username already exists
      const existing = await this.findByUsername(username);
      if (existing) {
        throw new Error('Username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO admin (username, password, full_name, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING id, username, full_name, created_at`,
        [username, hashedPassword, full_name]
      );

      console.log('✅ Admin created:', username);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Admin.create:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật admin
   * @param {Number} id - Admin ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  static async update(id, updates) {
    try {
      const { full_name } = updates;
      
      const result = await pool.query(
        `UPDATE admin 
         SET full_name = $1
         WHERE id = $2
         RETURNING id, username, full_name, created_at`,
        [full_name, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Admin not found');
      }

      console.log('✅ Admin updated, ID:', id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Admin.update:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật password
   * @param {Number} id - Admin ID
   * @param {String} newPassword - New password
   * @returns {Promise<Boolean>}
   */
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE admin SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );
      
      console.log('✅ Admin password updated, ID:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in Admin.updatePassword:', error.message);
      throw error;
    }
  }

  /**
   * Xóa admin
   * @param {Number} id - Admin ID
   * @returns {Promise<Boolean>}
   */
  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM admin WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Admin not found');
      }
      
      console.log('✅ Admin deleted, ID:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in Admin.delete:', error.message);
      throw error;
    }
  }

  /**
   * Verify password
   * @param {String} plainPassword - Plain text password
   * @param {String} hashedPassword - Hashed password from DB
   * @returns {Promise<Boolean>}
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      // Nếu password chưa được hash (plaintext - cho demo)
      if (!hashedPassword.startsWith('$2b$')) {
        return plainPassword === hashedPassword;
      }
      
      // Nếu đã hash
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error in Admin.verifyPassword:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate admin
   * @param {String} username - Admin username
   * @param {String} password - Admin password
   * @returns {Promise<Object|null>}
   */
  static async authenticate(username, password) {
    try {
      const admin = await this.findByUsername(username);
      
      if (!admin) {
        return null;
      }

      const isValid = await this.verifyPassword(password, admin.password);
      
      if (!isValid) {
        return null;
      }

      // Return admin without password
      const { password: _, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    } catch (error) {
      console.error('❌ Error in Admin.authenticate:', error.message);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<Object>}
   */
  static async getDashboardStats() {
    try {
      // Total users
      const totalUsers = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'user'"
      );
      
      // Total employers
      const totalEmployers = await pool.query(
        "SELECT COUNT(*) FROM users WHERE role = 'employer'"
      );
      
      // Total jobs
      const totalJobs = await pool.query('SELECT COUNT(*) FROM jobs');
      
      // Total applications
      const totalApplications = await pool.query('SELECT COUNT(*) FROM applications');
      
      // Jobs by month (last 6 months)
      const jobsByMonth = await pool.query(
        `SELECT 
          TO_CHAR(posted_at, 'Mon') as month,
          COUNT(*) as count
         FROM jobs
         WHERE posted_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(posted_at, 'Mon'), EXTRACT(MONTH FROM posted_at)
         ORDER BY EXTRACT(MONTH FROM posted_at)`
      );
      
      // Applications by month
      const applicationsByMonth = await pool.query(
        `SELECT 
          TO_CHAR(applied_at, 'Mon') as month,
          COUNT(*) as count
         FROM applications
         WHERE applied_at >= NOW() - INTERVAL '6 months'
         GROUP BY TO_CHAR(applied_at, 'Mon'), EXTRACT(MONTH FROM applied_at)
         ORDER BY EXTRACT(MONTH FROM applied_at)`
      );
      
      // Top categories
      const topCategories = await pool.query(
        `SELECT category, COUNT(*) as count
         FROM jobs
         GROUP BY category
         ORDER BY count DESC
         LIMIT 5`
      );
      
      // Recent jobs
      const recentJobs = await pool.query(
        `SELECT j.id, j.title, j.location, j.posted_at, j.status,
                COALESCE(u.company_name, e.company, j.company) as company_name
         FROM jobs j
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         ORDER BY j.posted_at DESC
         LIMIT 10`
      );
      
      return {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalEmployers: parseInt(totalEmployers.rows[0].count),
        totalJobs: parseInt(totalJobs.rows[0].count),
        totalApplications: parseInt(totalApplications.rows[0].count),
        jobsByMonth: jobsByMonth.rows,
        applicationsByMonth: applicationsByMonth.rows,
        topCategories: topCategories.rows,
        recentJobs: recentJobs.rows
      };
    } catch (error) {
      console.error('❌ Error in Admin.getDashboardStats:', error.message);
      throw error;
    }
  }

  /**
   * Get all users with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getUsers(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', role = '' } = options;
      const offset = (page - 1) * limit;
      
      let query = 'SELECT id, username, email, name, role, created_at, company_name, phone FROM users WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (search) {
        query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR username ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (role) {
        query += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // Count total
      let countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (search) {
        countQuery += ` AND (name ILIKE $${countParamIndex} OR email ILIKE $${countParamIndex} OR username ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (role) {
        countQuery += ` AND role = $${countParamIndex}`;
        countParams.push(role);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      
      return {
        users: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };
    } catch (error) {
      console.error('❌ Error in Admin.getUsers:', error.message);
      throw error;
    }
  }

  /**
   * Get all jobs with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>}
   */
  static async getJobs(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', status = '' } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT j.id, j.title, j.location, j.category, j.status, j.posted_at, j.deadline,
               COALESCE(u.company_name, e.company, j.company) as company_name,
               COUNT(a.id) as application_count
        FROM jobs j
        LEFT JOIN employers e ON j.employer_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE 1=1
      `;
      const params = [];
      let paramIndex = 1;
      
      if (search) {
        query += ` AND (j.title ILIKE $${paramIndex} OR j.location ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      if (status) {
        query += ` AND j.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }
      
      query += ` GROUP BY j.id, u.company_name, e.company
                 ORDER BY j.posted_at DESC 
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      // Count total
      let countQuery = 'SELECT COUNT(*) FROM jobs WHERE 1=1';
      const countParams = [];
      let countParamIndex = 1;
      
      if (search) {
        countQuery += ` AND (title ILIKE $${countParamIndex} OR location ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }
      
      if (status) {
        countQuery += ` AND status = $${countParamIndex}`;
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      
      return {
        jobs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };
    } catch (error) {
      console.error('❌ Error in Admin.getJobs:', error.message);
      throw error;
    }
  }

  /**
   * Count total admins
   * @returns {Promise<Number>}
   */
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM admin');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Admin.count:', error.message);
      throw error;
    }
  }
}

module.exports = Admin;