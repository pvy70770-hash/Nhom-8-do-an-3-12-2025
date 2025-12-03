import React, { useState, useEffect } from 'react';

export default function EmployerDashboard() {
  const [user, setUser] = useState(null);
  const [employer, setEmployer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/employer-login';
        return;
      }

      // Lấy thông tin user
      const userResponse = await fetch('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = await userResponse.json();

      if (userData.role !== 'employer') {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = '/';
        return;
      }

      setUser(userData);
      setEmployer(userData.profile);

      // Lấy danh sách jobs của employer
      const jobsResponse = await fetch('http://localhost:5000/api/employer/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobsData = await jobsResponse.json();

      setJobs(jobsData);

      // Tính toán stats
      const totalJobs = jobsData.length;
      const activeJobs = jobsData.filter(job => job.status === 'open').length;
      const totalApplications = jobsData.reduce((sum, job) => sum + (parseInt(job.application_count) || 0), 0);

      setStats({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications: totalApplications
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/employer-landing';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2563eb' }}>
            Job Portal - Nhà tuyển dụng
          </h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            {employer?.company || user?.company_name || 'Công ty'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: '600', color: '#1f2937' }}>{user?.name}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            
            title="Tổng số tin tuyển dụng"
            value={stats.totalJobs}
            color="#2563eb"
          />
          <StatCard
            
            title="Tin đang tuyển"
            value={stats.activeJobs}
            color="#10b981"
          />
          <StatCard
            
            title="Tổng ứng viên"
            value={stats.totalApplications}
            color="#f59e0b"
          />
          <StatCard
            
            title="Chờ xét duyệt"
            value={stats.pendingApplications}
            color="#8b5cf6"
          />
        </div>

        {/* Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            borderBottom: '2px solid #e5e7eb',
            padding: '0 1rem'
          }}>
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
               Tổng quan
            </TabButton>
            <TabButton
              active={activeTab === 'jobs'}
              onClick={() => setActiveTab('jobs')}
            >
               Công việc đã đăng
            </TabButton>
            <TabButton
              active={activeTab === 'company'}
              onClick={() => setActiveTab('company')}
            >
               Thông tin công ty
            </TabButton>
          </div>

          <div style={{ padding: '2rem' }}>
            {activeTab === 'overview' && (
              <OverviewTab jobs={jobs} stats={stats} />
            )}
            {activeTab === 'jobs' && (
              <JobsTab jobs={jobs} onRefresh={fetchDashboardData} />
            )}
            {activeTab === 'company' && (
              <CompanyTab user={user} employer={employer} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color }}>{value}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '1rem 1.5rem',
        background: 'none',
        border: 'none',
        borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
        color: active ? '#2563eb' : '#6b7280',
        fontWeight: active ? '700' : '500',
        cursor: 'pointer',
        fontSize: '1rem',
        transition: '0.2s'
      }}
    >
      {children}
    </button>
  );
}

function OverviewTab({ jobs, stats }) {
  const recentJobs = jobs.slice(0, 5);

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Tổng quan hoạt động</h2>
      
      <div style={{
        background: '#f9fafb',
        padding: '1.5rem',
        borderRadius: '10px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ marginBottom: '1rem' }}> Thống kê nhanh</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div>
            <span style={{ color: '#6b7280' }}>Tỷ lệ tin đang tuyển:</span>
            <strong style={{ marginLeft: '0.5rem', color: '#10b981' }}>
              {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}%
            </strong>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>TB ứng viên/tin:</span>
            <strong style={{ marginLeft: '0.5rem', color: '#f59e0b' }}>
              {stats.totalJobs > 0 ? Math.round(stats.totalApplications / stats.totalJobs) : 0}
            </strong>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}> Tin tuyển dụng gần đây</h3>
      {recentJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <p>Chưa có tin tuyển dụng nào</p>
          <button style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>
            Đăng tin ngay
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {recentJobs.map(job => (
            <JobCard key={job.id} job={job} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function JobsTab({ jobs, onRefresh }) {
  const [filter, setFilter] = useState('all');

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#1f2937' }}>Quản lý tin tuyển dụng</h2>
        <button style={{
          padding: '0.75rem 1.5rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600'
        }}>
          + Đăng tin mới
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Tất cả ({jobs.length})
        </FilterButton>
        <FilterButton active={filter === 'open'} onClick={() => setFilter('open')}>
          Đang tuyển ({jobs.filter(j => j.status === 'open').length})
        </FilterButton>
        <FilterButton active={filter === 'closed'} onClick={() => setFilter('closed')}>
          Đã đóng ({jobs.filter(j => j.status === 'closed').length})
        </FilterButton>
      </div>

      {filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          Không có tin tuyển dụng nào
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredJobs.map(job => (
            <JobCard key={job.id} job={job} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({ job, compact, onRefresh }) {
  return (
    <div style={{
      background: '#f9fafb',
      padding: '1.5rem',
      borderRadius: '10px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.5rem', color: '#1f2937' }}>{job.title}</h3>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.75rem' }}>
            <span>📍 {job.location}</span>
            <span> {job.min_salary && job.max_salary ? `${job.min_salary}-${job.max_salary} ${job.currency}` : 'Thỏa thuận'}</span>
            <span> {job.application_count || 0} ứng viên</span>
          </div>
          {!compact && job.category && (
            <span style={{
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              background: '#e0e7ff',
              color: '#3730a3',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500'
            }}>
              {job.category}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{
            padding: '0.5rem 1rem',
            background: job.status === 'open' ? '#d1fae5' : '#fee2e2',
            color: job.status === 'open' ? '#065f46' : '#991b1b',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            {job.status === 'open' ? ' Đang tuyển' : ' Đã đóng'}
          </span>
        </div>
      </div>
      {!compact && (
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <button style={{
            padding: '0.5rem 1rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
            Xem ứng viên
          </button>
          <button style={{
            padding: '0.5rem 1rem',
            background: 'white',
            color: '#2563eb',
            border: '1px solid #2563eb',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}>
            Chỉnh sửa
          </button>
        </div>
      )}
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        background: active ? '#2563eb' : 'white',
        color: active ? 'white' : '#6b7280',
        border: `1px solid ${active ? '#2563eb' : '#e5e7eb'}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: active ? '600' : '500',
        transition: '0.2s'
      }}
    >
      {children}
    </button>
  );
}

function CompanyTab({ user, employer }) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Thông tin công ty</h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        <InfoField label="Tên công ty" value={employer?.company || user?.company_name} />
        <InfoField label="Người liên hệ" value={user?.contact_person} />
        <InfoField label="Email" value={user?.email} />
        <InfoField label="Số điện thoại" value={user?.phone} />
        <InfoField label="Quy mô" value={user?.company_size} />
        <InfoField label="Ngành nghề" value={user?.industry} />
      </div>

      {employer?.description && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem', color: '#1f2937' }}>Mô tả công ty</h3>
          <div style={{
            background: '#f9fafb',
            padding: '1rem',
            borderRadius: '8px',
            color: '#4b5563'
          }}>
            {employer.description}
          </div>
        </div>
      )}

      <button style={{
        marginTop: '2rem',
        padding: '0.75rem 1.5rem',
        background: '#2563eb',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '600'
      }}>
        Chỉnh sửa thông tin
      </button>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{
        padding: '0.75rem',
        background: '#f9fafb',
        borderRadius: '6px',
        fontWeight: '500',
        color: '#1f2937'
      }}>
        {value || '-'}
      </div>
    </div>
  );
}