import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EmployerLoginForm.css';

function EmployerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        email,
        password
      });

      console.log(' Đăng nhập thành công:', response.data);
      
      // Kiểm tra role
      if (response.data.user && response.data.user.role !== 'employer') {
        setError('Tài khoản này không phải là tài khoản nhà tuyển dụng');
        setLoading(false);
        return;
      }

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'employer'); // Lưu role
        console.log(' Token đã được lưu!');
      }

      alert(' Đăng nhập thành công!');
      navigate('/employer-dashboard');
    } catch (err) {
      console.error(' Lỗi đăng nhập:', err);
      if (err.response) {
        setError(err.response.data.message || 'Email hoặc mật khẩu không đúng');
      } else {
        setError('Không thể kết nối đến server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    navigate('/employer-register');
  };

  const handleBackToHome = () => {
    navigate('/employer');
  };

  return (
    <div className="employer-login-container">
      <div className="employer-login-box">
        <div className="employer-login-header">
          <h2>Đăng nhập Nhà tuyển dụng</h2>
          <p>Quản lý tin tuyển dụng của bạn</p>
        </div>

        {error && <div className="error-message"> {error}</div>}

        <form className="employer-login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="email@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div className="register-link">
            <span className="register-text">Chưa có tài khoản?</span>
            <button 
              type="button" 
              className="register-button"
              onClick={handleGoToRegister}
              disabled={loading}
            >
              Đăng ký ngay
            </button>
          </div>

          <div className="help-text">
            <p>Bạn là ứng viên? <a href="/login">Đăng nhập tại đây</a></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployerLoginForm;