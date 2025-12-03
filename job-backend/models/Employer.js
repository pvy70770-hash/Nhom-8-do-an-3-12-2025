// ===================== EMPLOYER MODEL =====================
const pool = require('../config/db');

class Employer {
  /**
   * Tìm tất cả employers
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  static async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, search = '' } = options;
      
      let query = `
        SELECT e.*, 
               u.username, u.email, u.name, u.phone,
               u.company_name, u.contact_person, u.company_size, u.industry,
               COUNT(j.id) as job_count
        FROM employers e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN jobs j ON e.id = j.employer_id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;
      
      if (search && search.trim()) {
        query += ` AND (
          u.company_name ILIKE $${paramIndex} OR 
          u.name ILIKE $${paramIndex} OR
          e.company ILIKE $${paramIndex}
        )`;
        params.push(`%${search.trim()}%`);
        paramIndex++;
      }
      
      query += ` GROUP BY e.id, u.id
                 ORDER BY e.id DESC 
                 LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Employer.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Tìm employer theo ID
   * @param {Number} id - Employer ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT e.*, 
                u.username, u.email, u.name, u.phone,
                u.company_name, u.contact_person, u.company_size, u.industry
         FROM employers e
         JOIN users u ON e.user_id = u.id
         WHERE e.id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Employer.findById:', error.message);
      throw error;
    }
  }

  /**
   * Tìm employer theo User ID
   * @param {Number} userId - User ID
   * @returns {Promise<Object|null>}
   */
  static async findByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT e.*, 
                u.username, u.email, u.name, u.phone,
                u.company_name, u.contact_person, u.company_size, u.industry
         FROM employers e
         JOIN users u ON e.user_id = u.id
         WHERE e.user_id = $1`,
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in Employer.findByUserId:', error.message);
      throw error;
    }
  }

  /**
   * Tạo employer profile
   * @param {Object} employerData - Employer data
   * @returns {Promise<Object>}
   */
  static async create(employerData) {
    try {
      const {
        user_id,
        company = '',
        description = ''
      } = employerData;

      // Kiểm tra user_id đã có employer profile chưa
      const existing = await this.findByUserId(user_id);
      if (existing) {
        throw new Error('Employer profile already exists for this user');
      }

      const result = await pool.query(
        `INSERT INTO employers (user_id, company, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [user_id, company, description]
      );

      console.log('✅ Employer profile created for user ID:', user_id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Employer.create:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật employer profile
   * @param {Number} id - Employer ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  static async update(id, updates) {
    try {
      const { company, description } = updates;
      
      const result = await pool.query(
        `UPDATE employers 
         SET company = $1, description = $2
         WHERE id = $3
         RETURNING *`,
        [company, description, id]
      );

      if (result.rows.length === 0) {
        throw new Error('Employer not found');
      }

      console.log('✅ Employer profile updated, ID:', id);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in Employer.update:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật employer profile theo user_id
   * @param {Number} userId - User ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  static async updateByUserId(userId, updates) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { 
        company, 
        description,
        company_name,
        contact_person,
        phone,
        company_size,
        industry
      } = updates;
      
      // Update employers table
      const employerResult = await client.query(
        `UPDATE employers 
         SET company = COALESCE($1, company), 
             description = COALESCE($2, description)
         WHERE user_id = $3
         RETURNING *`,
        [company, description, userId]
      );

      // Update users table với company info
      if (company_name || contact_person || phone || company_size || industry) {
        await client.query(
          `UPDATE users 
           SET company_name = COALESCE($1, company_name),
               contact_person = COALESCE($2, contact_person),
               phone = COALESCE($3, phone),
               company_size = COALESCE($4, company_size),
               industry = COALESCE($5, industry)
           WHERE id = $6`,
          [company_name, contact_person, phone, company_size, industry, userId]
        );
      }

      await client.query('COMMIT');
      console.log('✅ Employer profile updated for user ID:', userId);
      return employerResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in Employer.updateByUserId:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Xóa employer profile
   * @param {Number} id - Employer ID
   * @returns {Promise<Boolean>}
   */
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Xóa tất cả jobs của employer này
      await client.query('DELETE FROM jobs WHERE employer_id = $1', [id]);
      
      // Xóa employer profile
      const result = await client.query(
        'DELETE FROM employers WHERE id = $1 RETURNING *',
        [id]
      );
      
      await client.query('COMMIT');
      
      if (result.rows.length === 0) {
        throw new Error('Employer not found');
      }
      
      console.log('✅ Employer profile deleted, ID:', id);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in Employer.delete:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Lấy jobs của employer
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Array>}
   */
  static async getJobs(employerId) {
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
      console.error('❌ Error in Employer.getJobs:', error.message);
      throw error;
    }
  }

  /**
   * Lấy jobs của employer theo user_id
   * @param {Number} userId - User ID
   * @returns {Promise<Array>}
   */
  static async getJobsByUserId(userId) {
    try {
      const employer = await this.findByUserId(userId);
      if (!employer) {
        throw new Error('Employer profile not found');
      }
      return await this.getJobs(employer.id);
    } catch (error) {
      console.error('❌ Error in Employer.getJobsByUserId:', error.message);
      throw error;
    }
  }

  /**
   * Lấy applications cho employer
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Array>}
   */
  static async getApplications(employerId) {
    try {
      const result = await pool.query(
        `SELECT a.*, 
                u.name as applicant_name, u.email as applicant_email, u.phone as applicant_phone,
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
      console.error('❌ Error in Employer.getApplications:', error.message);
      throw error;
    }
  }

  /**
   * Lấy statistics của employer
   * @param {Number} employerId - Employer ID
   * @returns {Promise<Object>}
   */
  static async getStatistics(employerId) {
    try {
      // Total jobs
      const jobsResult = await pool.query(
        'SELECT COUNT(*) FROM jobs WHERE employer_id = $1',
        [employerId]
      );
      
      // Open jobs
      const openJobsResult = await pool.query(
        'SELECT COUNT(*) FROM jobs WHERE employer_id = $1 AND status = $2',
        [employerId, 'open']
      );
      
      // Total applications
      const applicationsResult = await pool.query(
        `SELECT COUNT(*) 
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = $1`,
        [employerId]
      );
      
      // Pending applications
      const pendingResult = await pool.query(
        `SELECT COUNT(*) 
         FROM applications a
         JOIN jobs j ON a.job_id = j.id
         WHERE j.employer_id = $1 AND a.status = $2`,
        [employerId, 'pending']
      );
      
      return {
        totalJobs: parseInt(jobsResult.rows[0].count),
        openJobs: parseInt(openJobsResult.rows[0].count),
        totalApplications: parseInt(applicationsResult.rows[0].count),
        pendingApplications: parseInt(pendingResult.rows[0].count)
      };
    } catch (error) {
      console.error('❌ Error in Employer.getStatistics:', error.message);
      throw error;
    }
  }

  /**
   * Search employers
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  static async search(searchTerm) {
    try {
      const result = await pool.query(
        `SELECT e.id, e.company, e.description,
                u.company_name, u.name, u.email,
                COUNT(j.id) as job_count
         FROM employers e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN jobs j ON e.id = j.employer_id
         WHERE u.company_name ILIKE $1 OR e.company ILIKE $1 OR u.name ILIKE $1
         GROUP BY e.id, u.id
         ORDER BY job_count DESC
         LIMIT 20`,
        [`%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Employer.search:', error.message);
      throw error;
    }
  }

  /**
   * Count total employers
   * @returns {Promise<Number>}
   */
  static async count() {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM employers');
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in Employer.count:', error.message);
      throw error;
    }
  }

  /**
   * Get top employers by job count
   * @param {Number} limit - Number of employers
   * @returns {Promise<Array>}
   */
  static async getTopEmployers(limit = 10) {
    try {
      const result = await pool.query(
        `SELECT e.*, 
                u.company_name, u.name,
                COUNT(j.id) as job_count
         FROM employers e
         JOIN users u ON e.user_id = u.id
         LEFT JOIN jobs j ON e.id = j.employer_id
         GROUP BY e.id, u.id
         ORDER BY job_count DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in Employer.getTopEmployers:', error.message);
      throw error;
    }
  }
}

module.exports = Employer;