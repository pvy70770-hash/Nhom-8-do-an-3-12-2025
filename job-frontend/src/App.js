import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/common/Navbar";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import { CategoriesSection, CategoryJobsPage } from "./pages/Jobs/CategoryJobsPage";
import ToolsSection from "./pages/Tools/ToolsSection";
import TrendingJobsSection from "./components/jobs/TrendingJobsSection";
import CVBuilder from "./components/CV/CVBuilder";
import UserProfile from "./components/profile/UserProfile";
import JobDetailPage from "./pages/Jobs/JobDetailPage";
import JobListPage from "./pages/Jobs/JobListPage";
import EmployerLanding from "./pages/Employer/EmployerLanding";
import EmployerLoginForm from "./pages/Employer/EmployerLoginForm";
import EmployerRegisterForm from "./pages/Employer/EmployerRegisterForm";
import EmployerDashboard from "./pages/Employer/EmployerDashboard";
import Footer from "./components/common/Footer";
import CVTemplatesPage from "./components/CV/CVTemplatesPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminLoginForm from "./pages/Admin/AdminLoginForm";
import LoginPage from './pages/User/LoginPage';
import RegisterPage from './pages/User/RegisterPage';
import ProfilePage from './pages/User/ProfilePage';


function AppContent() {
  const [jobs, setJobs] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Kiểm tra token khi mount và khi location thay đổi
  useEffect(() => {
    const token = localStorage.getItem('token');
    const shouldBeLoggedIn = !!token;
    
    console.log('🔍 Checking auth state:', {
      hasToken: shouldBeLoggedIn,
      currentPath: location.pathname,
      currentIsLoggedIn: isLoggedIn
    });

    // Chỉ update state nếu khác biệt - Tránh infinite loop
    if (shouldBeLoggedIn !== isLoggedIn) {
      console.log(`🔄 Updating isLoggedIn from ${isLoggedIn} to ${shouldBeLoggedIn}`);
      setIsLoggedIn(shouldBeLoggedIn);
    }
  }, [location.pathname, isLoggedIn]);

  // Xử lý thông báo login/register success
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const loginSuccess = searchParams.get('login');
    const registerSuccess = searchParams.get('register');
    
    if (loginSuccess === 'success') {
      console.log('✅ Login successful!');
      alert('Đăng nhập thành công!');
      window.history.replaceState({}, document.title, '/');
      const token = localStorage.getItem('token');
      if (token) setIsLoggedIn(true);
    }
    
    if (registerSuccess === 'success') {
      console.log('✅ Register successful!');
      alert('✅ Đăng ký thành công!');
      window.history.replaceState({}, document.title, '/');
      const token = localStorage.getItem('token');
      if (token) setIsLoggedIn(true);
    }
  }, [location]);

  // Fetch jobs - chỉ chạy 1 lần khi mount
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/jobs");
      if (Array.isArray(res.data)) {
        setJobs(res.data);
      } else if (Array.isArray(res.data.jobs)) {
        setJobs(res.data.jobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error('❌ Error fetching jobs:', err);
      setError("Không thể tải dữ liệu công việc");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
    navigate('/');
    console.log('✅ Logged out successfully');
  };

  const handleLoginSuccess = () => {
    console.log('✅ Login success handler called');
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      console.log('✅ isLoggedIn set to true');
      setTimeout(() => navigate('/'), 100);
    }
  };

  useEffect(() => {
    console.log('🎨 App rendered with isLoggedIn:', isLoggedIn);
  }, [isLoggedIn]);

  const hideNavbarRoutes = [
    '/employer-dashboard', 
    '/employer-login', 
    '/employer-register', 
    '/admin-dashboard',
    '/admin-login'
  ];
  
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);
  const shouldShowFooter = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />}
      
      <Routes>
        {/* Trang chủ */}
        <Route
          path="/"
          element={
            <>
              <JobListPage showHero={true} />
              <TrendingJobsSection jobs={jobs} />
              <CategoriesSection />
              <ToolsSection />
            </>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLoginForm />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Trang Nhà tuyển dụng */}
        <Route path="/employer" element={<EmployerLanding />} />
        <Route path="/employer-register" element={<EmployerRegisterForm />} />
        <Route path="/employer-login" element={<EmployerLoginForm />} />
        <Route path="/employer-dashboard" element={<EmployerDashboard />} />

        {/* Route category */}
        <Route path="/category/:category" element={<CategoryJobsPage />} />

        {/* Chi tiết job */}
        <Route path="/job/:id" element={<JobDetailPage />} />

        {/* Authentication Routes */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <LoginForm onLogin={handleLoginSuccess} />
            )
          }
        />
<Route
  path="/login"
  element={
    isLoggedIn ? (
      <Navigate to="/" replace />
    ) : (
      <LoginPage />
    )
  }
/>

<Route
  path="/register"
  element={
    isLoggedIn ? (
      <Navigate to="/" replace />
    ) : (
      <RegisterPage />
    )
  }
/>

<Route
  path="/profile"
  element={
    isLoggedIn ? (
      <ProfilePage />
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
        <Route
          path="/register"
          element={
            isLoggedIn ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterForm onRegisterSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Other routes */}
        <Route path="/create-cv" element={<CVBuilder />} />
        <Route path="/cv-templates" element={<CVTemplatesPage />} />
        
        {/* User Profile - Protected Route */}
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <UserProfile />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>

      {/* Footer */}
      {shouldShowFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;