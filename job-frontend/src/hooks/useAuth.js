import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * Custom Hook để quản lý Authentication
 * 
 * Usage:
 * const { user, isLoggedIn, login, logout, register, loading, error } = useAuth();
 */

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Kiểm tra token khi component mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Kiểm tra xem user đã đăng nhập chưa
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      // Verify token với backend
      const response = await axios.get('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.user) {
        setUser(response.data.user);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      // Token không hợp lệ, xóa đi
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng nhập
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data;

      // Lưu token vào localStorage
      localStorage.setItem('token', token);
      
      // Set user state
      setUser(userData);
      setIsLoggedIn(true);

      console.log('✅ Login successful:', userData);
      return { success: true, user: userData };

    } catch (err) {
      console.error('❌ Login failed:', err);
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng ký
  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('http://localhost:5000/api/auth/register', userData);

      const { token, user: newUser } = response.data;

      // Tự động đăng nhập sau khi đăng ký thành công
      localStorage.setItem('token', token);
      setUser(newUser);
      setIsLoggedIn(true);

      console.log('✅ Register successful:', newUser);
      return { success: true, user: newUser };

    } catch (err) {
      console.error('❌ Register failed:', err);
      const errorMessage = err.response?.data?.message || 'Đăng ký thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đăng xuất
  const logout = useCallback(() => {
    // Xóa token
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    
    // Clear state
    setUser(null);
    setIsLoggedIn(false);
    setError(null);

    console.log('✅ Logout successful');
    
    // Chuyển về trang chủ
    navigate('/');
  }, [navigate]);

  // Cập nhật thông tin user
  const updateUser = useCallback(async (updatedData) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/auth/profile',
        updatedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setUser(response.data.user);
      return { success: true, user: response.data.user };

    } catch (err) {
      console.error('❌ Update failed:', err);
      const errorMessage = err.response?.data?.message || 'Cập nhật thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Đổi mật khẩu
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/auth/change-password',
        { oldPassword, newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return { success: true, message: response.data.message };

    } catch (err) {
      console.error('❌ Change password failed:', err);
      const errorMessage = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,                  // Thông tin user hiện tại
    isLoggedIn,           // Trạng thái đăng nhập
    loading,              // Loading state
    error,                // Error message
    login,                // Function đăng nhập
    logout,               // Function đăng xuất
    register,             // Function đăng ký
    updateUser,           // Function cập nhật thông tin
    changePassword,       // Function đổi mật khẩu
    checkAuth,            // Function kiểm tra auth
    clearError            // Function xóa error
  };
};

export default useAuth;