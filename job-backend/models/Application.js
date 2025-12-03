// ===================== APPLICATION MODEL =====================
const pool = require('../config/db');

class Application {
  /**
   * Tìm tất cả applications
   * @param {Object} options - Filter options
   * @returns {Promise<Object>}
   */
  static async findAll(options = {}) {
    try {
      const { page = 1, limit = 10, status = '' } = options;
      const offset = (page - 1) * limit;
      
      let whereClause = '';
      const params = [];
      
      if (status) {
        whereClause = 'WHERE a.status = $1';
        params.push(status);
      }
      
      // Count query
      const countQuery = `
        SELECT COUNT(*) 
        FROM applications a 
        ${whereClause}
      `;
      
      // Applications query
      const applicationsQuery = `
        SELECT a.id, a.status, a.applied_at,
               u.name as applicant_name, u.email as applicant_email,
               j.title as job_title,
               COALESCE(emp_user.company_name, e.company) as company_name
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN jobs j ON a.job_id = j.id
        LEFT JOIN employers e ON j.employer_id = e.id
        LEFT JOIN users emp_user ON e.user_id = emp_user.id
        ${whereClause}
        ORDER BY a.applied_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count);
      
      const applicationsParams = [...params, limit, offset];
      const applicationsResult = await pool.query(applicationsQuery, applicationsParams);
      
      return {
        applications: applicationsResult.rows,
        total: total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('❌ Error in Application.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Tìm application theo ID
   * @param {Number} id - Application ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                u.name, u.email, u.phone,
                up.ky_nang, up.kinh_nghiem, up.hoc_van, up.cv_file,
                j.title as job_title, j.location, j.min_salary, j.max_salary, j.currency,
                e.company,
                emp_user.company_name
         FROM applications a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         JOIN jobs j ON a.job_id = j.id
         JOIN employers e ON j.employer_id = e.id
         JOIN users emp_user ON e.user_id = emp_user.id
         WHERE a.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Application.findById:', error.message);
      throw error;
    }
  }

  /**
   * Tìm applications của user
   * @param {Number} userId - User ID
   * @returns {Promise<Array>}
   */
  static async findByUser(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                j.title, j.location, j.min_salary, j.max_salary, j.currency,
                e.company,
                u.company_name
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         JOIN employers e ON j.employer_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE a.user_id = $1
         ORDER BY a.applied_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Application.findByUser:', error.message);
      throw error;
    }
  }

  /**
   * Tìm applications cho một job
   * @param {Number} jobId - Job ID
   * @returns {Promise<Array>}
   */
  static async findByJob(jobId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                u.name, u.email, u.phone,
                up.ky_nang, up.kinh_nghiem, up.hoc_van, up.cv_file
         FROM applications a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE a.job_id = $1
         ORDER BY a.applied_at DESC`,
        [jobId]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Application.findByJob:', error.message);
      throw error;
    }
  }

  /**
   * Tạo application mới
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>}
   */
  static async create(applicationData) {
    try {
      const { user_id, job_id, status = 'pending' } = applicationData;

      // Kiểm tra đã ứng tuyển chưa
      const existingApplication = await pool.query(
        'SELECT * FROM applications WHERE user_id = $1 AND job_id = $2',
        [user_id, job_id]
      );

      if (existingApplication.rows.length > 0) {
        throw new Error('Already applied to this job');
      }

      const result = await pool.query(
        `INSERT INTO applications (user_id, job_id, status, applied_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [user_id, job_id, status]
      );

      console.log('✅ Application created for job ID:', job_id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Application.create:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật application status
   * @param {Number} id - Application ID
   * @param {String} status - New status
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, status) {
    try {
      const result = await pool.query(
        'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Application not found');
      }

      console.log('✅ Application status updated:', status);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Application.updateStatus:', error.message);
      throw error;
    }
  }

  /**
   * Xóa application (withdraw)
   * @param {Number} id - Application ID
   * @param {Number} userId - User ID (for verification)
   * @returns {Promise<Boolean>}
   */
  static async delete(id, userId) {
    try {
      // Verify ownership
      const application = await pool.query(
        'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (application.rows.length === 0) {
        throw new Error('Application not found or not yours');
      }

      await pool.query('DELETE FROM applications WHERE id = $1', [id]);
      
      console.log('✅ Application withdrawn, ID:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in Application.delete:', error.message);
      throw error;
    }
  }

  /**
   * Kiểm tra user đã apply job chưa
   * @param {Number} userId - User ID
   * @param {Number} jobId - Job ID
   * @returns {Promise<Boolean>}
   */
  static async hasApplied(userId, jobId) {
    try {
      const result = await pool.query(
        'SELECT * FROM applications WHERE user_id = $1 AND job_id = $2',
        [userId, jobId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('❌ Error in Application.hasApplied:', error.message);
      throw error;
    }
  }

  /**
   * Count applications by status
   * @param {String} status - Application status
   * @returns {Promise<Number>}
   */
  static async countByStatus(status) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM applications WHERE status = $1',
        [status]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Application.countByStatus:', error.message);
      throw error;
    }
  }

  /**
   * Count applications by user
   * @param {Number} userId - User ID
   * @returns {Promise<Number>}
   */
  static async countByUser(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM applications WHERE user_id = $1',
        [userId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Application.countByUser:', error.message);
      throw error;
    }
  }

  /**
   * Count applications by job
   * @param {Number} jobId - Job ID
   * @returns {Promise<Number>}
   */
  static async countByJob(jobId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM applications WHERE job_id = $1',
        [jobId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Application.countByJob:', error.message);
      throw error;
    }
  }

  /**
   * Tìm applications của employer
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Array>}
   */
  static async findByEmployer(employerId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                u.name as applicant_name, u.email as applicant_email,
                j.title as job_title,
                up.ky_nang, up.kinh_nghiem, up.hoc_van, up.cv_file
         FROM applications a
         JOIN users u ON a.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = $1
         ORDER BY a.applied_at DESC`,
        [employerId]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Application.findByEmployer:', error.message);
      throw error;
    }
  }

  /**
   * Get recent applications
   * @param {Number} limit - Number of applications
   * @returns {Promise<Array>}
   */
  static async getRecent(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT a.id, a.status, a.applied_at,
                u.name as applicant_name,
                j.title as job_title,
                COALESCE(emp_user.company_name, e.company) as company_name
         FROM applications a
         JOIN users u ON a.user_id = u.id
         JOIN jobs j ON a.job_id = j.id
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users emp_user ON e.user_id = emp_user.id
         ORDER BY a.applied_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Application.getRecent:', error.message);
      throw error;
    }
  }

  /**
   * Get application statistics
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      const total = await pool.query('SELECT COUNT(*) FROM applications');
      const pending = await this.countByStatus('pending');
      const accepted = await this.countByStatus('accepted');
      const rejected = await this.countByStatus('rejected');
      
      return {
        total: parseInt(total.rows[0].count),
        pending,
        accepted,
        rejected
      };
    } catch (error) {
      console.error('❌ Error in Application.getStatistics:', error.message);
      throw error;
    }
  }

  /**
   * Bulk update application status
   * @param {Array} ids - Array of application IDs
   * @param {String} status - New status
   * @returns {Promise<Number>}
   */
  static async bulkUpdateStatus(ids, status) {
    try {
      const result = await pool.query(
        'UPDATE applications SET status = $1 WHERE id = ANY($2) RETURNING *',
        [status, ids]
      );
      
      console.log(`✅ Updated ${result.rows.length} applications to ${status}`);
      return result.rows.length;
    } catch (error) {
      console.error('❌ Error in Application.bulkUpdateStatus:', error.message);
      throw error;
    }
  }
}

module.exports = Application;