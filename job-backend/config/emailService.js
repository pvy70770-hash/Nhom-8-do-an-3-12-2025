const nodemailer = require('nodemailer');

// Tạo transporter (dùng Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Email của hệ thống
    pass: process.env.EMAIL_PASS  // App Password của Gmail
  }
});

// Hàm gửi email chào mừng
const sendWelcomeEmail = async (userEmail, userName) => {
  const mailOptions = {
    from: `"Job Portal" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: '🎉 Chào mừng bạn đến với Job Portal!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00B14F;">Xin chào ${userName}!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Job Portal</strong>.</p>
        <p>Bạn có thể bắt đầu tìm kiếm công việc mơ ước của mình ngay bây giờ!</p>
        <a href="http://localhost:3000/login" 
           style="display: inline-block; padding: 12px 24px; background-color: #00B14F; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
          Đăng nhập ngay
        </a>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Email này được gửi tự động, vui lòng không trả lời.
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email đã được gửi đến:', userEmail);
    return true;
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error.message);
    return false;
  }
};

module.exports = { sendWelcomeEmail };
