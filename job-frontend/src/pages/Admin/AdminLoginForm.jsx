import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLoginForm.css';

function AdminLoginForm() {
  const [formData, setFormData] = useState({
    username: '', // ✅ ĐỔI từ email sang username
    password: ''
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

    try {
      console.log('📤 Đang gửi login request...');
      
      // ✅ GỬI đúng format: username + password
      const response = await axios.post('http://localhost:5000/api/admin/login', {
        username: formData.username,  // ✅ ĐÚNG field
        password: formData.password
      });

      console.log('✅ Login thành công:', response.data);

      // Lưu token và admin info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));

      // Chuyển sang admin dashboard
      navigate('/admin-dashboard');
      
    } catch (err) {
      console.error('❌ Login lỗi:', err.response?.data || err.message);
      
      if (err.response?.status === 403) {
        setError('Bạn không có quyền admin!');
      } else if (err.response?.status === 401) {
        setError(err.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng!');
      } else {
        setError(err.response?.data?.message || 'Đăng nhập thất bại! Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-form">
        <div className="admin-login-header">
          <h1>🔐 Admin Login</h1>
          <p>Đăng nhập vào trang quản trị</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">👤 Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="admin"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Mật khẩu</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
          </button>
        </form>

        <div className="footer-text">
          <p>
            Không phải admin? <a href="/">Về trang chủ</a>
          </p>
        </div>

        {/* Debug Info */}
        <div className="debug-box">
          <h4>🔍 Debug Info:</h4>
          <pre>
Backend: http://localhost:5000/api/admin/login
Method: POST
Body: {`{ username, password }`}
Token location: localStorage.token
          </pre>
        </div>
      </div>
    </div>
  );
}

export default AdminLoginForm;