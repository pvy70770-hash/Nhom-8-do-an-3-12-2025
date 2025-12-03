// ===================== JOB MODEL =====================
const pool = require('../config/db');

class Job {
  /**
   * Tìm tất cả jobs
   * @param {Object} options - Filter options
   * @returns {Promise<Object>}
   */
  static async findAll(options = {}) {
    try {
      const { 
        page = 0, 
        limit = 6, 
        search = '', 
        location = '', 
        category = '',
        status = 'open'
      } = options;
      
      const offset = parseInt(page) * parseInt(limit);
      
      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;
      
      // Search filter
      if (search && search.trim()) {
        whereConditions.push(`(
          j.title ILIKE $${paramIndex} OR 
          j.category ILIKE $${paramIndex} OR
          j.description ILIKE $${paramIndex} OR
          COALESCE(j.company, '') ILIKE $${paramIndex} OR
          COALESCE(e.company, '') ILIKE $${paramIndex} OR 
          COALESCE(u.company_name, '') ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }
      
      // Location filter
      if (location && location.trim()) {
        whereConditions.push(`j.location ILIKE $${paramIndex}`);
        queryParams.push(`%${location.trim()}%`);
        paramIndex++;
      }
      
      // Category filter
      if (category && category.trim()) {
        whereConditions.push(`j.category = $${paramIndex}`);
        queryParams.push(category.trim());
        paramIndex++;
      }
      
      // Status filter
      if (status) {
        whereConditions.push(`j.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';
      
      // Count query
      const countQuery = `
        SELECT COUNT(*) 
        FROM jobs j
        LEFT JOIN employers e ON j.employer_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        ${whereClause}
      `;
      
      // Jobs query
      const jobsQuery = `
        SELECT j.*, 
               COALESCE(u.company_name, e.company, j.company) as company_name,
               u.email as employer_email,
               u.phone as employer_phone
        FROM jobs j
        LEFT JOIN employers e ON j.employer_id = e.id
        LEFT JOIN users u ON e.user_id = u.id
        ${whereClause}
        ORDER BY j.posted_at DESC 
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      const countResult = await pool.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].count);
      
      const jobsParams = [...queryParams, parseInt(limit), offset];
      const jobsResult = await pool.query(jobsQuery, jobsParams);
      
      return {
        jobs: jobsResult.rows,
        total: total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      };
    } catch (error) {
      console.error('❌ Error in Job.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Tìm job theo ID
   * @param {Number} id - Job ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT j.*, 
                COALESCE(u.company_name, e.company, j.company) as company_name,
                u.email as employer_email, 
                u.phone as employer_phone,
                e.user_id as employer_user_id
         FROM jobs j
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE j.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Job.findById:', error.message);
      throw error;
    }
  }

  /**
   * Tìm jobs theo category
   * @param {String} category - Category name
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  static async findByCategory(category, options = {}) {
    try {
      const { page = 0, limit = 6 } = options;
      const offset = parseInt(page) * parseInt(limit);
      
      // Count total
      const countResult = await pool.query(
        'SELECT COUNT(*) FROM jobs WHERE category = $1',
        [category]
      );
      const total = parseInt(countResult.rows[0].count);
      
      // Get jobs
      const result = await pool.query(
        `SELECT j.*, 
                COALESCE(u.company_name, e.company, j.company) as company_name
         FROM jobs j
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE j.category = $1
         ORDER BY j.posted_at DESC
         LIMIT $2 OFFSET $3`,
        [category, parseInt(limit), offset]
      );
      
      return {
        jobs: result.rows,
        total: total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      };
    } catch (error) {
      console.error('❌ Error in Job.findByCategory:', error.message);
      throw error;
    }
  }

  /**
   * Tạo job mới
   * @param {Object} jobData - Job data
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Object>}
   */
  static async create(jobData, employerId) {
    try {
      const {
        title,
        description,
        requirements,
        benefits,
        location,
        salary,
        category,
        deadline,
        experience,
        status = 'open'
      } = jobData;

      // Parse salary
      let minSalary = null, maxSalary = null, currency = 'VND';
      if (salary) {
        const salaryMatch = salary.match(/(\d+)\s*-\s*(\d+)/);
        if (salaryMatch) {
          minSalary = parseInt(salaryMatch[1]);
          maxSalary = parseInt(salaryMatch[2]);
        }
      }

      const result = await pool.query(
        `INSERT INTO jobs (
          employer_id, title, description, requirements, benefits, location, 
          min_salary, max_salary, currency, category, posted_at, deadline, status, experience
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11, $12, $13)
        RETURNING *`,
        [
          employerId, title, description, requirements, benefits, location, 
          minSalary, maxSalary, currency, category, deadline, status, experience
        ]
      );

      console.log('✅ Job created:', result.rows[0].title);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Job.create:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật job
   * @param {Number} id - Job ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  static async update(id, updates) {
    try {
      const {
        title,
        description,
        requirements,
        benefits,
        location,
        salary,
        category,
        deadline,
        status,
        experience
      } = updates;

      // Parse salary
      let minSalary = null, maxSalary = null, currency = 'VND';
      if (salary) {
        const salaryMatch = salary.match(/(\d+)\s*-\s*(\d+)/);
        if (salaryMatch) {
          minSalary = parseInt(salaryMatch[1]);
          maxSalary = parseInt(salaryMatch[2]);
        }
      }

      const result = await pool.query(
        `UPDATE jobs
         SET title = $1, description = $2, requirements = $3, benefits = $4, 
             location = $5, min_salary = $6, max_salary = $7, currency = $8,
             category = $9, deadline = $10, status = $11, experience = $12
         WHERE id = $13
         RETURNING *`,
        [
          title, description, requirements, benefits, location, 
          minSalary, maxSalary, currency, category, deadline, status, experience, id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }

      console.log('✅ Job updated:', result.rows[0].title);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Job.update:', error.message);
      throw error;
    }
  }

  /**
   * Xóa job
   * @param {Number} id - Job ID
   * @returns {Promise<Boolean>}
   */
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Xóa applications của job này
      await client.query('DELETE FROM applications WHERE job_id = $1', [id]);
      
      // Xóa job
      const result = await client.query(
        'DELETE FROM jobs WHERE id = $1 RETURNING *',
        [id]
      );
      
      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }
      
      console.log('✅ Job deleted:', result.rows[0].title);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in Job.delete:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Tìm jobs của employer
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Array>}
   */
  static async findByEmployer(employerId) {
    try {
      const result = await pool.query(
        `SELECT j.*, 
                COUNT(a.id) as application_count
         FROM jobs j
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.employer_id = $1
         GROUP BY j.id
         ORDER BY j.posted_at DESC`,
        [employerId]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Job.findByEmployer:', error.message);
      throw error;
    }
  }

  /**
   * Count jobs by status
   * @param {String} status - Job status
   * @returns {Promise<Number>}
   */
  static async countByStatus(status) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM jobs WHERE status = $1',
        [status]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Job.countByStatus:', error.message);
      throw error;
    }
  }

  /**
   * Get trending jobs (most applications)
   * @param {Number} limit - Number of jobs
   * @returns {Promise<Array>}
   */
  static async getTrending(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT j.*, 
                COALESCE(u.company_name, e.company, j.company) as company_name,
                COUNT(a.id) as application_count
         FROM jobs j
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         LEFT JOIN applications a ON j.id = a.job_id
         WHERE j.status = 'open'
         GROUP BY j.id, u.company_name, e.company
         ORDER BY application_count DESC, j.posted_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Job.getTrending:', error.message);
      throw error;
    }
  }

  /**
   * Get recent jobs
   * @param {Number} limit - Number of jobs
   * @returns {Promise<Array>}
   */
  static async getRecent(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT j.*, 
                COALESCE(u.company_name, e.company, j.company) as company_name
         FROM jobs j
         LEFT JOIN employers e ON j.employer_id = e.id
         LEFT JOIN users u ON e.user_id = u.id
         WHERE j.status = 'open'
         ORDER BY j.posted_at DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Job.getRecent:', error.message);
      throw error;
    }
  }

  /**
   * Update job status
   * @param {Number} id - Job ID
   * @param {String} status - New status
   * @returns {Promise<Object>}
   */
  static async updateStatus(id, status) {
    try {
      const result = await pool.query(
        'UPDATE jobs SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Job not found');
      }
      
      console.log('✅ Job status updated:', status);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Job.updateStatus:', error.message);
      throw error;
    }
  }

  /**
   * Get jobs statistics
   * @returns {Promise<Object>}
   */
  static async getStatistics() {
    try {
      const totalJobs = await pool.query('SELECT COUNT(*) FROM jobs');
      const openJobs = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['open']);
      const closedJobs = await pool.query('SELECT COUNT(*) FROM jobs WHERE status = $1', ['closed']);
      
      const topCategories = await pool.query(
        `SELECT category, COUNT(*) as count
         FROM jobs
         GROUP BY category
         ORDER BY count DESC
         LIMIT 5`
      );
      
      return {
        total: parseInt(totalJobs.rows[0].count),
        open: parseInt(openJobs.rows[0].count),
        closed: parseInt(closedJobs.rows[0].count),
        topCategories: topCategories.rows
      };
    } catch (error) {
      console.error('❌ Error in Job.getStatistics:', error.message);
      throw error;
    }
  }
}

module.exports = Job;