import React, { useState, useEffect } from 'react';
import './UserProfile.css';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('jobs');
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);

  useEffect(() => {
    fetchUserData();
    loadJobStats();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found, redirecting to login...');
        window.location.href = '/login';
        return;
      }

      console.log('🔍 Fetching user data from API...');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User data received:', data);
        
        setUser({
          id: data.id,
          name: data.name || data.username || data.email.split('@')[0],
          email: data.email,
          avatar: data.avatar_url || 'https://www.topcv.vn/images/avatar-default.jpg',
          verified: true,
          isPro: false,
          cvCount: 2
        });
      } else if (response.status === 401 || response.status === 403) {
        console.log('❌ Token invalid, clearing and redirecting...');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
    }
  };

  const loadJobStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/jobs/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSavedJobsCount(data.saved);
        setAppliedJobsCount(data.applied);
        console.log('📊 Job stats loaded from API:', data);
      }
    } catch (error) {
      console.error('❌ Error loading job stats:', error);
    }
  };

  const handleLogout = () => {
    console.log(' Logging out...');
    localStorage.removeItem('token');
    localStorage.clear();
    window.location.href = '/login';
  };

  if (!user) return <div className="loading">Đang tải...</div>;

  return (
    <div className="profile-container">
      <aside className="profile-sidebar">
        <div className="user-card">
          <div className="avatar">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <span className="avatar-icon">👤</span>
            )}
          </div>
          <h2>{user.name}</h2>
          <p className="user-status">Tài khoản đã xác thực</p>
          <p className="user-id">ID {user.id}</p>
          <p className="user-email">{user.email}</p>
        </div>

        <nav className="profile-menu">
          <button
            className={`menu-item ${activeSection === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveSection('jobs')}
          >
            
            <span>Quản lý tìm việc</span>
            <span className="arrow">›</span>
          </button>

          <button
            className={`menu-item ${activeSection === 'cv' ? 'active' : ''}`}
            onClick={() => setActiveSection('cv')}
          >
            
            <span>Quản lý CV & Cover letter</span>
            <span className="arrow">›</span>
          </button>

          <button
            className={`menu-item ${activeSection === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSection('email')}
          >
           
            <span>Cài đặt email & thông báo</span>
            <span className="arrow">›</span>
          </button>

          <button
            className={`menu-item ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSection('security')}
          >
           
            <span>Cá nhân & Bảo mật</span>
            <span className="arrow">›</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
         
          Đăng xuất
        </button>
      </aside>

      <main className="profile-content">
        {activeSection === 'jobs' && (
          <JobsSection 
            savedJobsCount={savedJobsCount} 
            appliedJobsCount={appliedJobsCount}
            onRefresh={loadJobStats}
          />
        )}
        {activeSection === 'cv' && <CVSection user={user} />}
        {activeSection === 'email' && <EmailSection />}
        {activeSection === 'security' && <SecuritySection user={user} />}
      </main>
    </div>
  );
}

// JobsSection Component
function JobsSection({ savedJobsCount, appliedJobsCount, onRefresh }) {
  const [activeTab, setActiveTab] = useState('saved');
  const [savedJobs, setSavedJobs] = useState([]);
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [activeTab]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const endpoint = activeTab === 'saved' ? '/api/jobs/saved' : '/api/jobs/applied';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Loaded ${activeTab} jobs:`, data);
        
        if (activeTab === 'saved') {
          setSavedJobs(data);
        } else {
          setAppliedJobs(data);
        }
      } else {
        console.error(`❌ Error loading ${activeTab} jobs:`, response.status);
      }
    } catch (error) {
      console.error(`❌ Error loading ${activeTab} jobs:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/jobs/unsave/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSavedJobs(savedJobs.filter(job => job.job_id !== jobId));
        onRefresh();
        alert('✅ Đã bỏ lưu công việc!');
      }
    } catch (error) {
      console.error('❌ Error unsaving job:', error);
      alert('❌ Có lỗi xảy ra!');
    }
  };

  const handleApplyFromSaved = async (job) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/jobs/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          job_id: job.job_id,
          job_title: job.job_title,
          company_name: job.company_name,
          company_logo: job.company_logo,
          location: job.location,
          salary: job.salary,
          cv_used: null
        })
      });

      if (response.ok) {
        onRefresh();
        loadJobs();
        alert(' Đã thêm vào danh sách ứng tuyển!');
      } else {
        const error = await response.json();
        alert(error.error || '❌ Có lỗi xảy ra!');
      }
    } catch (error) {
      console.error('❌ Error applying:', error);
      alert('❌ Có lỗi xảy ra!');
    }
  };

  const filterAndSortJobs = (jobs) => {
    let filtered = jobs.filter(job => 
      job.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.saved_date || b.applied_date) - new Date(a.saved_date || a.applied_date));
    } else {
      filtered.sort((a, b) => new Date(a.saved_date || a.applied_date) - new Date(b.saved_date || b.applied_date));
    }

    return filtered;
  };

  const currentJobs = activeTab === 'saved' ? savedJobs : appliedJobs;
  const displayJobs = filterAndSortJobs(currentJobs);

  return (
    <div className="section">
      <h1 className="section-title">Quản lý tìm việc</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          
          <div>
            <h3>{savedJobsCount}</h3>
            <p>Việc làm đã lưu</p>
          </div>
        </div>
        
        <div className="stat-card">
      
          <div>
            <h3>{appliedJobsCount}</h3>
            <p>Việc làm đã ứng tuyển</p>
          </div>
        </div>
        
        <div className="stat-card">
          
          <div>
            <h3>12</h3>
            <p>Việc làm phù hợp với bạn</p>
          </div>
        </div>
      </div>

      <div className="jobs-tabs">
        <button 
          className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
           Việc làm đã lưu ({savedJobsCount})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'applied' ? 'active' : ''}`}
          onClick={() => setActiveTab('applied')}
        >
           Việc làm đã ứng tuyển ({appliedJobsCount})
        </button>
      </div>

      <div className="jobs-controls">
        <input
          type="text"
          placeholder=" Tìm kiếm công việc, công ty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-select"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
        </select>
        <button className="refresh-btn" onClick={() => { loadJobs(); onRefresh(); }}>
        Làm mới
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      ) : (
        <div className="jobs-table">
          {displayJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Chưa có công việc nào</h3>
              <p>{activeTab === 'saved' ? 'Hãy lưu các công việc yêu thích để xem lại sau' : 'Bạn chưa ứng tuyển công việc nào'}</p>
            </div>
          ) : (
            displayJobs.map(job => (
              <div key={job.id} className="job-card">
                <div className="job-logo">
                  {job.company_logo ? (
                    <img src={job.company_logo} alt={job.company_name} />
                  ) : (
                    <span className="logo-placeholder">🏢</span>
                  )}
                </div>
                
                <div className="job-info">
                  <h3 className="job-title">{job.job_title || 'Tên công việc'}</h3>
                  <p className="job-company">{job.company_name || 'Tên công ty'}</p>
                  <div className="job-details">
                    <span>📍 {job.location || 'Hồ Chí Minh'}</span>
                    <span> {job.salary || 'Thỏa thuận'}</span>
                    <span> {new Date(job.saved_date || job.applied_date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {activeTab === 'applied' && (
                    <span className={`status-badge ${job.status || 'pending'}`}>
                      {job.status === 'pending' ? ' Đang chờ' : job.status === 'reviewing' ? ' Đang xem xét' : ' Đã phản hồi'}
                    </span>
                  )}
                </div>

                <div className="job-actions">
                  {activeTab === 'saved' ? (
                    <>
                      <button className="btn-apply" onClick={() => handleApplyFromSaved(job)}>
                         Ứng tuyển ngay
                      </button>
                      <button className="btn-unsave" onClick={() => handleUnsaveJob(job.job_id)}>
                         Bỏ lưu
                      </button>
                    </>
                  ) : (
                    <button className="btn-view" onClick={() => window.open(`/jobs/${job.job_id}`, '_blank')}>
                       Xem chi tiết
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Other sections...
function CVSection({ user }) {
  return (
    <div className="section">
      <h1 className="section-title">Quản lý CV & Cover letter</h1>
      <p>Coming soon...</p>
    </div>
  );
}

function EmailSection() {
  return (
    <div className="section">
      <h1 className="section-title">Cài đặt email & thông báo</h1>
      <p>Coming soon...</p>
    </div>
  );
}

function SecuritySection({ user }) {
  return (
    <div className="section">
      <h1 className="section-title">Cá nhân & Bảo mật</h1>
      <div className="info-row">
        <span>Email:</span>
        <strong>{user.email}</strong>
      </div>
    </div>
  );
}

export default UserProfile;