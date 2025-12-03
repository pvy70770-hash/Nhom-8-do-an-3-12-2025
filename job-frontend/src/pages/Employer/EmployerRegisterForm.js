import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EmployerRegisterForm.css';

function EmployerRegisterForm() {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    companySize: '',
    industry: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate
    if (!formData.companyName.trim() || !formData.email.trim() || 
        !formData.password.trim() || !formData.confirmPassword.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      setLoading(false);
      return;
    }

    try {
      // ✅ FIX: Gửi đúng format cho backend
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name: formData.contactPerson || formData.companyName, // Tên người liên hệ hoặc tên công ty
        email: formData.email,
        password: formData.password,
        role: 'employer',
        companyName: formData.companyName, // Tên công ty
        contactPerson: formData.contactPerson, // Người liên hệ
        phone: formData.phone,
        companySize: formData.companySize,
        industry: formData.industry
      });

      console.log(' Đăng ký thành công:', response.data);
      
      // Lưu token nếu backend trả về
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      alert(' Đăng ký thành công! Chuyển đến trang đăng nhập...');
      navigate('/employer-login');
    } catch (err) {
      console.error(' Lỗi đăng ký:', err);
      if (err.response) {
        setError(err.response.data.message || 'Email đã được sử dụng');
      } else if (err.request) {
        setError('Không thể kết nối đến server');
      } else {
        setError('Có lỗi xảy ra: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/employer-login');
  };

  return (
    <div className="employer-register-container">
      <div className="employer-register-box">
        <div className="employer-register-header">
          <h2>Đăng ký Nhà tuyển dụng</h2>
          <p>Tạo tài khoản để đăng tin tuyển dụng</p>
        </div>

        {error && (
          <div className="error-message">
             {error}
          </div>
        )}

        <form className="employer-register-form" onSubmit={handleSubmit}>
          {/* Thông tin công ty */}
          <div className="form-section">
            <h3 className="section-title">Thông tin công ty</h3>
            
            <div className="form-group">
              <label className="form-label">Tên công ty <span className="required">*</span></label>
              <input
                type="text"
                name="companyName"
                className="form-input"
                placeholder="Ví dụ: Công ty TNHH ABC"
                value={formData.companyName}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quy mô công ty</label>
                <select
                  name="companySize"
                  className="form-select"
                  value={formData.companySize}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Chọn quy mô</option>
                  <option value="1-50">1-50 nhân viên</option>
                  <option value="51-200">51-200 nhân viên</option>
                  <option value="201-500">201-500 nhân viên</option>
                  <option value="501-1000">501-1000 nhân viên</option>
                  <option value="1000+">Trên 1000 nhân viên</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ngành nghề</label>
                <select
                  name="industry"
                  className="form-select"
                  value={formData.industry}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Chọn ngành nghề</option>
                  <option value="Công nghệ thông tin">Công nghệ thông tin</option>
                  <option value="Tài chính - Ngân hàng">Tài chính - Ngân hàng</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Kinh doanh">Kinh doanh</option>
                  <option value="Sản xuất">Sản xuất</option>
                  <option value="Dịch vụ">Dịch vụ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="form-section">
            <h3 className="section-title">Thông tin liên hệ</h3>
            
            <div className="form-group">
              <label className="form-label">Người liên hệ</label>
              <input
                type="text"
                name="contactPerson"
                className="form-input"
                placeholder="Họ và tên người phụ trách"
                value={formData.contactPerson}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="email@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="0123456789"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Mật khẩu */}
          <div className="form-section">
            <h3 className="section-title">Bảo mật</h3>
            
            <div className="form-group">
              <label className="form-label">Mật khẩu <span className="required">*</span></label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nhập lại mật khẩu <span className="required">*</span></label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký tài khoản'}
          </button>

          <div className="login-link">
            <span className="login-text">Đã có tài khoản?</span>
            <button 
              type="button" 
              className="login-button"
              onClick={handleGoToLogin}
              disabled={loading}
            >
              Đăng nhập ngay
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployerRegisterForm;