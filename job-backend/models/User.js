// ===================== USER MODEL =====================
const pool = require('../config/db');
const bcrypt = require('bcrypt');

class User {
  /**
   * Tìm tất cả users
   * @param {Object} options - Filter options
   * @returns {Promise<Array>}
   */
  static async findAll(options = {}) {
    try {
      const { role, limit = 100, offset = 0 } = options;
      
      let query = 'SELECT * FROM users WHERE 1=1';
      const params = [];
      let paramIndex = 1;
      
      if (role) {
        query += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error in User.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Tìm user theo ID
   * @param {Number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in User.findById:', error.message);
      throw error;
    }
  }

  /**
   * Tìm user theo email
   * @param {String} email - User email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in User.findByEmail:', error.message);
      throw error;
    }
  }

  /**
   * Tìm user theo Google ID
   * @param {String} googleId - Google ID
   * @returns {Promise<Object|null>}
   */
  static async findByGoogleId(googleId) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE google_id = $1',
        [googleId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in User.findByGoogleId:', error.message);
      throw error;
    }
  }

  /**
   * Tìm user theo username
   * @param {String} username - Username
   * @returns {Promise<Object|null>}
   */
  static async findByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error in User.findByUsername:', error.message);
      throw error;
    }
  }

  /**
   * Tạo user mới
   * @param {Object} userData - User data
   * @returns {Promise<Object>}
   */
  static async create(userData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const {
        username,
        password,
        email,
        name,
        role = 'user',
        google_id = null,
        company_name = null,
        contact_person = null,
        phone = null,
        company_size = null,
        industry = null
      } = userData;

      // Hash password nếu có
      let hashedPassword = password;
      if (password && !password.startsWith('GOOGLE_USER_')) {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      // Insert user
      const result = await client.query(
        `INSERT INTO users 
         (username, password, email, name, role, google_id, 
          company_name, contact_person, phone, company_size, industry, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING id, username, email, name, role, google_id, 
                   company_name, contact_person, phone, company_size, industry, created_at`,
        [username, hashedPassword, email, name, role, google_id,
         company_name, contact_person, phone, company_size, industry]
      );

      const user = result.rows[0];

      // Tạo profile tương ứng với role
      if (role === 'user') {
        await client.query(
          `INSERT INTO user_profiles (user_id, ky_nang, kinh_nghiem, hoc_van, cv_file)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, '', '', '', null]
        );
      } else if (role === 'employer') {
        await client.query(
          `INSERT INTO employers (user_id, company, description)
           VALUES ($1, $2, $3)`,
          [user.id, company_name || '', '']
        );
      }

      await client.query('COMMIT');
      console.log('✅ User created:', user.email);
      
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in User.create:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Cập nhật user
   * @param {Number} id - User ID
   * @param {Object} updates - Data to update
   * @returns {Promise<Object>}
   */
  static async update(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      // Chỉ update các field được cho phép
      const allowedFields = [
        'name', 'email', 'username', 'phone', 
        'company_name', 'contact_person', 'company_size', 'industry',
        'avatar_url', 'google_id'
      ];

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(updates[key]);
          paramIndex++;
        }
      });

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      values.push(id);
      
      const query = `
        UPDATE users 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      console.log('✅ User updated:', result.rows[0].email);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error in User.update:', error.message);
      throw error;
    }
  }

  /**
   * Cập nhật password
   * @param {Number} id - User ID
   * @param {String} newPassword - New password
   * @returns {Promise<Boolean>}
   */
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );
      
      console.log('✅ Password updated for user ID:', id);
      return true;
    } catch (error) {
      console.error('❌ Error in User.updatePassword:', error.message);
      throw error;
    }
  }

  /**
   * Xóa user
   * @param {Number} id - User ID
   * @returns {Promise<Boolean>}
   */
  static async delete(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Xóa related data
      await client.query('DELETE FROM user_profiles WHERE user_id = $1', [id]);
      await client.query('DELETE FROM employers WHERE user_id = $1', [id]);
      await client.query('DELETE FROM applications WHERE user_id = $1', [id]);
      await client.query('DELETE FROM saved_jobs WHERE user_id = $1', [id]);
      await client.query('DELETE FROM applied_jobs WHERE user_id = $1', [id]);
      
      // Xóa jobs của employer (nếu có)
      const employerResult = await client.query(
        'SELECT id FROM employers WHERE user_id = $1',
        [id]
      );
      if (employerResult.rows.length > 0) {
        const employerId = employerResult.rows[0].id;
        await client.query('DELETE FROM jobs WHERE employer_id = $1', [employerId]);
      }
      
      // Xóa user
      await client.query('DELETE FROM users WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      console.log('✅ User deleted, ID:', id);
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error in User.delete:', error.message);
      throw error;
    } finally {
      client.release();
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
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error in User.verifyPassword:', error.message);
      throw error;
    }
  }

  /**
   * Get user with profile
   * @param {Number} id - User ID
   * @returns {Promise<Object|null>}
   */
  static async findByIdWithProfile(id) {
    try {
      const user = await this.findById(id);
      if (!user) return null;

      let profile = null;
      
      if (user.role === 'user') {
        const result = await pool.query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [id]
        );
        profile = result.rows[0] || null;
      } else if (user.role === 'employer') {
        const result = await pool.query(
          'SELECT * FROM employers WHERE user_id = $1',
          [id]
        );
        profile = result.rows[0] || null;
      }

      return {
        ...user,
        profile
      };
    } catch (error) {
      console.error('❌ Error in User.findByIdWithProfile:', error.message);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Number} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<Object>}
   */
  static async updateProfile(userId, profileData) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      if (user.role === 'user') {
        const { ky_nang, kinh_nghiem, hoc_van, cv_file } = profileData;
        
        const result = await pool.query(
          `UPDATE user_profiles 
           SET ky_nang = $1, kinh_nghiem = $2, hoc_van = $3, cv_file = $4
           WHERE user_id = $5
           RETURNING *`,
          [ky_nang, kinh_nghiem, hoc_van, cv_file, userId]
        );
        
        return result.rows[0];
      } else if (user.role === 'employer') {
        const { company, description } = profileData;
        
        const result = await pool.query(
          `UPDATE employers 
           SET company = $1, description = $2
           WHERE user_id = $3
           RETURNING *`,
          [company, description, userId]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      console.error('❌ Error in User.updateProfile:', error.message);
      throw error;
    }
  }

  /**
   * Count users by role
   * @param {String} role - User role
   * @returns {Promise<Number>}
   */
  static async countByRole(role) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM users WHERE role = $1',
        [role]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error in User.countByRole:', error.message);
      throw error;
    }
  }

  /**
   * Search users
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>}
   */
  static async search(searchTerm) {
    try {
      const result = await pool.query(
        `SELECT id, username, email, name, role, company_name 
         FROM users 
         WHERE name ILIKE $1 OR email ILIKE $1 OR username ILIKE $1
         ORDER BY created_at DESC
         LIMIT 20`,
        [`%${searchTerm}%`]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Error in User.search:', error.message);
      throw error;
    }
  }
}

module.exports = User;