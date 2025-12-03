const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/categories - Lấy danh sách categories với số lượng jobs
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as job_count
      FROM jobs
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY job_count DESC
      LIMIT 6
    `);
    
    console.log('📊 Categories:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching categories:', err.message);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;