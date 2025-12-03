import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CategoryJobsPage.css";

// ==================== CATEGORIES SECTION ====================
export function CategoriesSection() {
  const navigate = useNavigate();

  const categories = [
    { 
      name: "Công nghệ thông tin", 
      slug: "cong-nghe-thong-tin"
    },
    { 
      name: "Kế toán - Tài chính - Ngân hàng",  
      slug: "ke-toan-tai-chinh"
    },
    { 
      name: "Marketing - Truyền thông", 
      slug: "marketing-truyen-thong"
    },
    { 
      name: "Kinh doanh - Bán hàng", 
      slug: "kinh-doanh-ban-hang"
    },
    { 
      name: "Kỹ thuật - Xây dựng",
      slug: "ky-thuat-xay-dung"
    },
    { 
      name: "Dịch vụ - Khách hàng",
      slug: "dich-vu-khach-hang"
    },
    { 
      name: "Nhân sự - Hành chính", 
      slug: "nhan-su-hanh-chinh"
    },
    { 
      name: "Thiết kế - Đồ hoạ", 
      slug: "thiet-ke-do-hoa"
    },
    { 
      name: "Giáo dục - Đào tạo",
      slug: "giao-duc-dao-tao"
    },
    { 
      name: "Bất động sản", 
      slug: "bat-dong-san"
    },
    { 
      name: "Nhà hàng - Khách sạn",
      slug: "nha-hang-khach-san"
    },
    { 
      name: "Quản lý / Cấp cao",
      slug: "quan-ly-cap-cao"
    }
  ];

  return (
    <section className="categories-section">
      <div className="categories-container">
        <h2 className="section-title nganh-nghe">Ngành nghề nổi bật</h2>
        <div className="categories-grid">
          {categories.map((cat) => (
            <div 
              key={cat.slug}
              className="category-card"
              onClick={() => navigate(`/category/${cat.slug}`)}
            >
              <h3 className="category-name">{cat.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==================== CATEGORY JOBS PAGE ====================
export function CategoryJobsPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  const categoryNames = {
    "cong-nghe-thong-tin": "Công nghệ thông tin",
    "ke-toan-tai-chinh": "Kế toán - Tài chính - Ngân hàng",
    "marketing-truyen-thong": "Marketing - Truyền thông",
    "kinh-doanh-ban-hang": "Kinh doanh - Bán hàng",
    "ky-thuat-xay-dung": "Kỹ thuật - Xây dựng",
    "dich-vu-khach-hang": "Dịch vụ - Khách hàng",
    "nhan-su-hanh-chinh": "Nhân sự - Hành chính",
    "thiet-ke-do-hoa": "Thiết kế - Đồ hoạ",
    "giao-duc-dao-tao": "Giáo dục - Đào tạo",
    "bat-dong-san": "Bất động sản",
    "lao-dong-pho-thong": "Lao động phổ thông",
    "nha-hang-khach-san": "Nhà hàng - Khách sạn",
    "quan-ly-cap-cao": "Quản lý / Cấp cao",
    "khac": "Khác"
  };

  const displayCategoryName = categoryNames[category] || category;

  useEffect(() => {
    fetchJobsByCategory();
  }, [category, currentPage]);

  const fetchJobsByCategory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/jobs/category/${category}`, {
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      console.log("📊 Category response:", response.data);
      
      // ✅ Backend trả về {jobs: [...], total: ...}
      const jobsData = response.data.jobs || [];
      const total = response.data.total || 0;
      
      setJobs(jobsData);
      setTotalJobs(total);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching jobs by category:", err);
      setError("Không thể tải công việc theo ngành nghề");
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  const handleJobClick = (jobId) => {
    navigate(`/job/${jobId}`);
  };

  const totalPages = Math.ceil(totalJobs / itemsPerPage);

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

  if (loading) {
    return (
      <div className="category-jobs-page">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải việc làm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="category-jobs-page">
        <div className="error">
          <p>❌ {error}</p>
          <button onClick={() => navigate('/')} className="back-btn">
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="category-jobs-page">
      {/* Header */}
      <div className="category-header">
        <div className="header-content">
          <h1 className="category-title">{displayCategoryName}</h1>
          <p className="jobs-count">
            Tìm thấy <strong>{totalJobs}</strong> công việc
          </p>
        </div>
      </div>

      {/* Jobs List */}
      <div className="category-jobs-container">
        {jobs.length === 0 ? (
          <div className="no-jobs">
            <div className="no-jobs-icon">📭</div>
            <h3>Chưa có công việc nào trong ngành này</h3>
            <p>Hãy thử tìm kiếm ở các ngành nghề khác</p>
            <button onClick={() => navigate('/')} className="back-home-btn">
              Về trang chủ
            </button>
          </div>
        ) : (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="job-card"
                onClick={() => handleJobClick(job.id)}
              >
                <div className="job-card-header">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="company-name">{job.company_name || job.company}</p>
                </div>

                <div className="job-card-body">
                  <div className="job-info-item">
                    <span className="icon">📍</span>
                    <span className="info-text">{job.location || "Không xác định"}</span>
                  </div>
                  
                  {job.min_salary && job.max_salary && (
                    <div className="job-info-item">
                      <span className="icon">💰</span>
                      <span className="info-text">
                        {(job.min_salary / 1000000).toFixed(0)} - {(job.max_salary / 1000000).toFixed(0)} triệu {job.currency}
                      </span>
                    </div>
                  )}
                  
                  {(!job.min_salary || !job.max_salary) && (
                    <div className="job-info-item">
                      <span className="icon">💰</span>
                      <span className="info-text">Thương lượng</span>
                    </div>
                  )}
                </div>

                <div className="job-card-footer">
                  <span className="category-badge">{job.category}</span>
                  <span className="view-detail">Xem chi tiết →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={goToPrevPage}
              disabled={currentPage === 0}
            >
              ‹ Trước
            </button>
            
            <div className="pagination-info">
              Trang {currentPage + 1} / {totalPages}
            </div>
            
            <button
              className="pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages - 1}
            >
              Sau ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}