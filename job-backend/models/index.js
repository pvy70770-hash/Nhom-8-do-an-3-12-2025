// ===================== MODELS INDEX =====================
// Export tất cả models để dễ import

const User = require('./User');
const Job = require('./Job');
const Application = require('./Application');
const Employer = require('./Employer');
const Admin = require('./Admin');
const Category = require('./Category');

module.exports = {
  User,
  Job,
  Application,
  Employer,
  Admin,
  Category
};