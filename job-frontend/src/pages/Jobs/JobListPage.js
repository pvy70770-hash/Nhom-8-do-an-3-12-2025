import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./JobListPage.css";

function JobListPage({ showHero = true }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [activeSearchKeyword, setActiveSearchKeyword] = useState("");
  const [activeSearchLocation, setActiveSearchLocation] = useState("");
  
  const navigate = useNavigate();
  const { category } = useParams();
  const itemsPerPage = 6;

  useEffect(() => {
    fetchJobs();
  }, [category, currentPage, activeSearchKeyword, activeSearchLocation]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      let response;
      
      // Nếu có category trong URL, gọi route category
      if (category) {
        response = await axios.get(`http://localhost:5000/api/jobs/category/${category}`, {
          params: { 
            page: currentPage,
            limit: itemsPerPage
          }
        });
      } else {
        // Không có category, gọi route jobs chính với search
        response = await axios.get("http://localhost:5000/api/jobs", {
          params: { 
            page: currentPage,
            limit: itemsPerPage,
            search: activeSearchKeyword || undefined,
            location: activeSearchLocation || undefined
          }
        });
      }
      
      console.log("📊 Response:", response.data);
      
      // Backend trả về {jobs: [...], total: ...}
      const jobsData = response.data.jobs || [];
      const total = response.data.total || 0;
      
      console.log(`📊 Loaded ${jobsData.length} jobs, Total: ${total}`);
      
      setJobs(jobsData);
      setTotalJobs(total);
      setError(null);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err.message);
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    console.log("🔍 Search:", { keyword: searchKeyword, location: searchLocation });
    setActiveSearchKeyword(searchKeyword);
    setActiveSearchLocation(searchLocation);
    setCurrentPage(0);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const totalPages = Math.ceil(totalJobs / itemsPerPage);
  const currentJobs = jobs;

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) return <p className="loading">Đang tải việc làm...</p>;
  if (error) return <p className="error">Lỗi: {error}</p>;

  return (
    <div className="job-list-page">
      {/* HERO BANNER */}
      {showHero && (
        <section className="hero-banner">
          <div className="hero-content">
            <h1>Tìm việc làm, Tuyển dụng hiệu quả</h1>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Vị trí tuyển dụng, tên công ty"
                className="search-input"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="divider"></div>
              <input 
                type="text" 
                placeholder="Địa điểm"
                className="location-input"
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button className="search-btn" onClick={handleSearch}>
                🔍 Tìm kiếm
              </button>
            </div>
            <div className="promo-card">
              <h2>Việc làm hôm nay - kiến tạo tương lai</h2>
            </div>
          </div>
        </section>
      )}

      {/* Header cho trang category */}
      {!showHero && category && (
        <div className="listing-header">
          <h2 className="category-title">{category}</h2>
        </div>
      )}


      {/* DANH SÁCH JOBS */}
      <section className="jobs-section">
        <div className="jobs-wrapper">
          <div className="jobs-grid">
            {currentJobs.length > 0 ? (
              currentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="job-card"
                  onClick={() => handleJobClick(job.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <h3 className="job-title">{job.title || 'Không có tiêu đề'}</h3>
                  <p className="company-name">{job.company_name || 'Không rõ công ty'}</p>
                  <div className="job-info">
                    <span className="location">📍 {job.location || 'Không rõ địa điểm'}</span>
                  </div>
                  <div className="job-tags">
                    <span className="tag salary">{job.salary || 'Thỏa thuận'}</span>
                    {job.type && <span className="tag type">{job.type}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '18px', color: '#666' }}>
                  ❌ Không tìm thấy công việc phù hợp. Hãy thử tìm kiếm với từ khóa khác!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="pagination-info">
            <button
              className="pagination-arrow"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
            >
              ‹
            </button>
            <span className="page-number">
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button
              className="pagination-arrow"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              ›
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default JobListPage;