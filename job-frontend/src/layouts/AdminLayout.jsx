import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { isAdmin, clearAuth, getUser } from '../utils/authUtils';
import './AdminLayout.css';

/**
 * AdminLayout - Layout cho admin dashboard
 * 
 * Usage:
 * <Route element={<AdminLayout />}>
 *   <Route path="/admin-dashboard" element={<AdminDashboard />} />
 *   <Route path="/admin/users" element={<ManageUsers />} />
 * </Route>
 */

function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/admin-login');
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
      path: '/admin-dashboard',
      icon: '📊'
    },
    {
      label: 'Quản lý Users',
      path: '/admin/users',
      icon: '👥'
    },
    {
      label: 'Quản lý Employers',
      path: '/admin/employers',
      icon: '🏢'
    },
    {
      label: 'Quản lý Jobs',
      path: '/admin/jobs',
      icon: '💼'
    },
    {
      label: 'Đơn ứng tuyển',
      path: '/admin/applications',
      icon: '📝'
    },
    {
      label: 'Thống kê',
      path: '/admin/statistics',
      icon: '📈'
    },
    {
      label: 'Cài đặt',
      path: '/admin/settings',
      icon: '⚙️'
    }
  ];

  return (
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">🎯</span>
            {sidebarOpen && <span className="logo-text">Admin Panel</span>}
          </div>
          <button 
            className="sidebar-toggle desktop-only" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Admin'}</div>
              <div className="user-role">Administrator</div>
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
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <button 
            className="mobile-menu-toggle mobile-only" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            ☰
          </button>

          <div className="topbar-left">
            <h2 className="page-title">Admin Dashboard</h2>
          </div>

          <div className="topbar-right">
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
              <span className="notification-badge">3</span>
            </button>

            {/* Profile */}
            <div className="topbar-profile">
              <div className="profile-avatar">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-content">
          {children || <Outlet />}
        </main>
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

export default AdminLayout;