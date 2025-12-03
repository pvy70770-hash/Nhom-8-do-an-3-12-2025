import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './JobDetailPage.css';

function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  useEffect(() => {
    const fetchJobDetail = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/jobs/${id}`);
        setJob(response.data);
        setError(null);
        
        // Check if job is saved
        await checkIfJobSaved(id);
      } catch (error) {
        console.error('Error fetching job detail:', error);
        setError('Không thể tải thông tin công việc');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [id]);

  const checkIfJobSaved = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('http://localhost:5000/api/jobs/saved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 200) {
        const savedJobs = response.data;
        const isJobSaved = savedJobs.some(job => job.job_id === parseInt(jobId));
        setIsSaved(isJobSaved);
        console.log('Job saved status:', isJobSaved);
      }
    } catch (error) {
      console.error(' Error checking saved status:', error);
    }
  };

  const handleSaveJob = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      if (window.confirm(' Vui lòng đăng nhập để lưu việc làm ')) {
        navigate('/login');
      }
      return;
    }

    try {
      setSavingJob(true);
      
      if (isSaved) {
        // Bỏ lưu
        const response = await axios.delete(`http://localhost:5000/api/jobs/unsave/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 200) {
          setIsSaved(false);
          alert('Đã bỏ lưu việc làm');
        }
      } else {
        // Lưu việc
        const response = await axios.post('http://localhost:5000/api/jobs/save', 
          { 
            job_id: id,
            job_title: job.title,
            company_name: job.company,
            company_logo: job.logo || null,
            location: job.location,
            salary: job.salary
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.status === 200) {
          setIsSaved(true);
          setShowSavedModal(true);
          console.log(' Job saved successfully!');
        }
      }
    } catch (error) {
      console.error('Error saving job:', error);
      if (error.response?.data?.error === 'Job already saved') {
        alert(' Bạn đã lưu công việc này rồi');
        setIsSaved(true);
      } else {
        alert(' Có lỗi xảy ra khi lưu việc làm');
      }
    } finally {
      setSavingJob(false);
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      if (window.confirm(' Vui lòng đăng nhập để ứng tuyển')) {
        navigate('/login');
      }
      return;
    }

    const applyUrl = job.url || job.original_url;
    
    if (applyUrl) {
      window.open(applyUrl, '_blank');
      
      // Track application in database
      try {
        await axios.post('http://localhost:5000/api/jobs/apply', 
          {
            job_id: id,
            job_title: job.title,
            company_name: job.company,
            company_logo: job.logo || null,
            location: job.location,
            salary: job.salary,
            cv_used: null
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('✅ Application tracked successfully');
      } catch (err) {
        console.log('Failed to track application:', err);
      }
    } else {
      alert('⚠️ Link ứng tuyển không khả dụng. Vui lòng liên hệ trực tiếp với nhà tuyển dụng.');
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  if (error || !job) {
    return (
      <div className="error-container">
        <p>{error || 'Không tìm thấy công việc'}</p>
        <button onClick={() => navigate('/')} className="back-button">
          Quay lại trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        <div className="job-header">
          <div className="job-header-content">
            <h1 className="job-title">{job.title}</h1>
            <div className="company-info">
              <h2 className="company-name">{job.company}</h2>
            </div>
            
            <div className="quick-info">
              <span className="info-tag salary">{job.salary}</span>
              <span className="info-tag location">📍 {job.location}</span>
              {job.experience && (
                <span className="info-tag experience">
                  💼 {job.experience}
                </span>
              )}
              {job.deadline && (
                <span className="info-tag deadline">
                   Hạn nộp: {job.deadline}
                </span>
              )}
            </div>
          </div>

          <div className="apply-section">
            <button 
              className={`save-button ${isSaved ? 'saved' : ''}`}
              onClick={handleSaveJob}
              disabled={savingJob}
            >
              {savingJob ? '...' : isSaved ? ' Đã lưu' : ' Lưu việc'}
            </button>
            <button className="apply-button" onClick={handleApply}>
               Ứng tuyển ngay
            </button>
          </div>
        </div>

        <div className="job-content">
          <section className="content-section">
            <h3 className="section-title">Mô tả công việc</h3>
            {job.description ? (
              <div 
                className="section-content"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            ) : (
              <div className="section-content">
                <p>Thông tin chi tiết về công việc sẽ được cập nhật sớm.</p>
              </div>
            )}
          </section>

          <section className="content-section">
            <h3 className="section-title">Yêu cầu ứng viên</h3>
            {job.requirements ? (
              <div 
                className="section-content"
                dangerouslySetInnerHTML={{ __html: job.requirements }}
              />
            ) : (
              <div className="section-content">
                <p>Yêu cầu chi tiết sẽ được cập nhật sớm.</p>
              </div>
            )}
          </section>

          <section className="content-section">
            <h3 className="section-title">Quyền lợi</h3>
            {job.benefits ? (
              <div 
                className="section-content"
                dangerouslySetInnerHTML={{ __html: job.benefits }}
              />
            ) : (
              <div className="section-content">
                <p>Quyền lợi sẽ được thảo luận khi phỏng vấn.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showSavedModal && (
        <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          
            <h2>Đã lưu việc làm!</h2>
            <p>Bạn có thể xem lại việc làm đã lưu trong trang quản lý</p>
            <div className="modal-buttons">
              <button 
                className="btn-profile"
                onClick={() => navigate('/profile')}
              >
                 Đi đến trang quản lý
              </button>
              <button 
                className="btn-continue"
                onClick={() => setShowSavedModal(false)}
              >
                ← Tiếp tục xem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetailPage;