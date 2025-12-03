import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { isEmployer, clearAuth, getUser } from '../utils/authUtils';
import './EmployerLayout.css';

/**
 * EmployerLayout - Layout cho employer dashboard
 * 
 * Usage:
 * <Route element={<EmployerLayout />}>
 *   <Route path="/employer-dashboard" element={<EmployerDashboard />} />
 *   <Route path="/post-job" element={<PostJob />} />
 * </Route>
 */

function EmployerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/employer-login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Navigation items
  const navItems = [
    {
      label: 'Dashboard',
      path: '/employer-dashboard',
      icon: '📊',
      badge: null
    },
    {
      label: 'Đăng tin tuyển dụng',
      path: '/post-job',
      icon: '➕',
      badge: null
    },
    {
      label: 'Quản lý tin đăng',
      path: '/manage-jobs',
      icon: '💼',
      badge: 5
    },
    {
      label: 'Ứng viên',
      path: '/employer/applications',
      icon: '👥',
      badge: 12
    },
    {
      label: 'Tin nhắn',
      path: '/employer/messages',
      icon: '💬',
      badge: 3
    },
    {
      label: 'Thống kê',
      path: '/employer/statistics',
      icon: '📈',
      badge: null
    },
    {
      label: 'Thông tin công ty',
      path: '/employer/company-profile',
      icon: '🏢',
      badge: null
    },
    {
      label: 'Gói dịch vụ',
      path: '/employer/pricing',
      icon: '💳',
      badge: null
    },
    {
      label: 'Cài đặt',
      path: '/employer/settings',
      icon: '⚙️',
      badge: null
    }
  ];

  return (
    <div className={`employer-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`employer-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🏢</span>
            {sidebarOpen && <span className="logo-text">Employer Panel</span>}
          </div>
          <button 
            className="sidebar-toggle desktop-only" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Company Info */}
        {sidebarOpen && (
          <div className="sidebar-company">
            <div className="company-avatar">
              {user?.companyName?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div className="company-info">
              <div className="company-name">{user?.companyName || 'Công ty'}</div>
              <div className="company-plan">
                <span className="plan-badge">⭐ Premium</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && (
                <>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </>
              )}
              {!sidebarOpen && item.badge && (
                <span className="nav-badge-dot"></span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Quick Actions */}
        {sidebarOpen && (
          <div className="sidebar-quick-actions">
            <button className="quick-action-btn primary">
              ➕ Đăng tin nhanh
            </button>
            <button className="quick-action-btn secondary">
              📤 Xuất báo cáo
            </button>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="employer-main">
        {/* Top Bar */}
        <header className="employer-topbar">
          <button 
            className="mobile-menu-toggle mobile-only" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div className="topbar-left">
            <h2 className="page-title">Employer Dashboard</h2>
          </div>

          <div className="topbar-right">
            {/* Credits */}
            <div className="credits-indicator">
              <span className="credits-icon">💎</span>
              <span className="credits-count">250 Credits</span>
            </div>

            {/* Search */}
            <div className="topbar-search">
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="search-input"
              />
            </div>

            {/* Notifications */}
            <button className="topbar-btn notification-btn">
              🔔
              <span className="notification-badge">8</span>
            </button>

            {/* Help */}
            <button className="topbar-btn help-btn" title="Trợ giúp">
              ❓
            </button>

            {/* Profile */}
            <div className="topbar-profile">
              <div className="profile-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'E'}
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name || 'Employer'}</div>
                <div className="profile-email">{user?.email || 'employer@example.com'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="employer-content">
          {children || <Outlet />}
        </main>

        {/* Footer */}
        <footer className="employer-footer">
          <div className="footer-content">
            <p>&copy; 2024 Job Portal. All rights reserved.</p>
            <div className="footer-links">
              <a href="/terms">Điều khoản</a>
              <a href="/privacy">Bảo mật</a>
              <a href="/support">Hỗ trợ</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default EmployerLayout;