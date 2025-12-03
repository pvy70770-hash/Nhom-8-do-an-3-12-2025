// ===================== SEEDERS INDEX =====================
// Chạy tất cả seeders cùng lúc

require('dotenv').config();
const { seedCategories, displayCategories } = require('./categorySeeder');
const { seedAdmins } = require('./adminSeeder');
const { seedJobs, countJobs } = require('./jobSeeder');

/**
 * Run all seeders in order
 */
async function seedAll() {
  console.log('\n🌱 ==================== STARTING SEED PROCESS ====================\n');
  
  try {
    // 1. Display categories (không cần seed vào DB)
    console.log('📋 Step 1/3: Categories');
    displayCategories();
    
    // 2. Seed admins
    console.log('\n👤 Step 2/3: Admin accounts');
    await seedAdmins();
    
    // 3. Seed jobs
    console.log('\n💼 Step 3/3: Sample jobs');
    await seedJobs();
    
    // Summary
    console.log('\n📊 ==================== SEED SUMMARY ====================');
    await countJobs();
    
    console.log('\n🎉 ==================== ALL SEEDERS COMPLETED ====================');
    console.log('✅ Database is now populated with sample data!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the server: npm start');
    console.log('   2. Login as admin:');
    console.log('      Username: admin | Password: admin123');
    console.log('   3. Create employers and users via API');
    console.log('\n⚠️ IMPORTANT: Change default passwords in production!\n');
    
  } catch (error) {
    console.error('\n❌ ==================== SEED FAILED ====================');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check if database is running');
    console.error('   2. Verify .env configuration');
    console.error('   3. Make sure tables are created');
    console.error('   4. Check if employers exist (for job seeding)');
    throw error;
  }
}

/**
 * Reset database (clear all data)
 */
async function resetDatabase() {
  console.log('\n🗑️ ==================== RESETTING DATABASE ====================\n');
  console.log('⚠️ WARNING: This will delete ALL data!');
  console.log('Press Ctrl+C to cancel or wait 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { clearJobs } = require('./jobSeeder');
  const pool = require('../../config/db');
  
  try {
    // Clear jobs first
    await clearJobs();
    
    // Clear other data
    await pool.query('DELETE FROM applications');
    console.log('✅ Cleared applications');
    
    await pool.query('DELETE FROM user_profiles');
    console.log('✅ Cleared user profiles');
    
    await pool.query('DELETE FROM employers');
    console.log('✅ Cleared employers');
    
    await pool.query('DELETE FROM users WHERE role != $1', ['admin']);
    console.log('✅ Cleared users (kept admins)');
    
    console.log('\n🎉 Database reset completed!');
    console.log('📌 Note: Admin accounts were preserved');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    throw error;
  }
}

/**
 * Check database status
 */
async function checkDatabase() {
  const pool = require('../../config/db');
  
  console.log('\n🔍 ==================== DATABASE STATUS ====================\n');
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection: OK');
    
    // Count records
    const tables = ['users', 'employers', 'jobs', 'applications', 'admin'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`📊 ${table.padEnd(20)} : ${count} records`);
    }
    
    console.log('\n=========================================================\n');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('💡 Make sure:');
    console.error('   1. PostgreSQL is running');
    console.error('   2. Database exists');
    console.error('   3. Tables are created');
    throw error;
  }
}

// Export
module.exports = {
  seedAll,
  resetDatabase,
  checkDatabase
};

// Run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'all':
    case 'seed':
      seedAll()
        .then(() => {
          console.log('\n✅ Seeding completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Seeding failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'reset':
      resetDatabase()
        .then(() => {
          console.log('\n✅ Reset completed successfully!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Reset failed:', error.message);
          process.exit(1);
        });
      break;
      
    case 'check':
    case 'status':
      checkDatabase()
        .then(() => {
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Check failed:', error.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log('\n📝 ==================== SEEDER COMMANDS ====================\n');
      console.log('Run all seeders:');
      console.log('   node database/seeders/index.js all');
      console.log('   npm run seed:all\n');
      console.log('Individual seeders:');
      console.log('   node database/seeders/adminSeeder.js seed');
      console.log('   node database/seeders/jobSeeder.js seed\n');
      console.log('Other commands:');
      console.log('   node database/seeders/index.js check    - Check database status');
      console.log('   node database/seeders/index.js reset    - Reset database (⚠️ deletes all data)');
      console.log('\n=========================================================\n');
      process.exit(0);
  }
}