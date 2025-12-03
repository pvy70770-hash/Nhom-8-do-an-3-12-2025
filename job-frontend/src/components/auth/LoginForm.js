// LoginForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Lắng nghe message từ popup window
  useEffect(() => {
    const handleMessage = (event) => {
      // Chỉ chấp nhận message từ localhost
      if (event.origin !== 'http://localhost:5000') return;
      
      console.log('📨 Received message from popup:', event.data);
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.token) {
        console.log('✅ Google auth successful, saving token...');
        localStorage.setItem('token', event.data.token);
        
        if (onLogin) {
          onLogin();
        }
        
        alert('🎉 Đăng nhập thành công!');
        navigate('/');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate, onLogin]);

  // Đăng nhập bằng email + password
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

      console.log('✅ Đăng nhập thành công:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('✅ Token đã được lưu!');
      }

      if (onLogin) {
        onLogin();
      }
      
      navigate('/');
    } catch (err) {
      console.error('❌ Lỗi đăng nhập:', err);
      if (err.response) {
        setError(err.response.data.message || 'Email hoặc mật khẩu không đúng');
      } else {
        setError('Không thể kết nối đến server');
      }
    } finally {
      setLoading(false);
    }
  };

  // Đăng nhập bằng Google - Mở popup
  const handleGoogleLogin = () => {
    console.log('🔵 Opening Google login popup...');
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      'http://localhost:5000/auth/google/login',
      'Google Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      alert('⚠️ Popup bị chặn! Vui lòng cho phép popup cho trang web này.');
      return;
    }
    
    console.log('✅ Popup opened');
  };

  // Chuyển sang trang đăng ký
  const handleGoToRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <h2>Đăng Nhập</h2>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">⚠️ {error}</div>}

        {/* Form */}
        <div className="login-form-wrapper">
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <input
              type="password"
              name="password"
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

          {/* Submit Button */}
          <button 
            type="button" 
            className="submit-button"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>

          {/* Divider */}
          <div className="divider">
            <span className="divider-text">Hoặc</span>
          </div>

          {/* Google Login Button */}
          <button 
            type="button" 
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '8px'}}>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
              <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9.001c0 1.452.348 2.827.957 4.041l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
            </svg>
            Đăng nhập bằng tài khoản Google
          </button>

          {/* Register Link */}
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
        </div>
      </div>
    </div>
  );
}

export default LoginForm;