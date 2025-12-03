import React, { useState, useEffect } from "react";
import "./Jobs.css";
const Jobs = ({ jobs }) => {
const [filteredJobs, setFilteredJobs] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("all");
const [searchTerm, setSearchTerm] = useState("");
// Khởi tạo filteredJobs khi nhận props
useEffect(() => {
setFilteredJobs(jobs);
}, [jobs]);
// Lấy danh sách categories duy nhất từ jobs
const categories = [
"all",
...new Set(jobs.map((job) => job.category).filter(Boolean))
];
// Lọc jobs theo category và search
useEffect(() => {
let result = jobs;
// Lọc theo category
if (selectedCategory !== "all") {
  result = result.filter((job) => job.category === selectedCategory);
}

// Lọc theo search term
if (searchTerm) {
  result = result.filter(
    (job) =>
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

setFilteredJobs(result);
}, [selectedCategory, searchTerm, jobs]);
return (
<div className="job-container">
<h1 className="job-title">💼 Danh sách việc làm</h1>
{/* Bộ lọc */}
  <div className="filter-section">
    {/* Tìm kiếm */}
    <input
      type="text"
      placeholder="🔍 Tìm theo tên công việc, công ty, địa điểm..."
      className="search-input"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />

    {/* Lọc theo category */}
    <div className="category-filter">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-btn ${
            selectedCategory === cat ? "active" : ""
          }`}
          onClick={() => setSelectedCategory(cat)}
        >
          {cat === "all" ? "Tất cả" : cat}
        </button>
      ))}
    </div>
  </div>

  {/* Hiển thị số lượng kết quả */}
  <p className="result-count">
    Tìm thấy <strong>{filteredJobs.length}</strong> công việc
  </p>

  {/* Danh sách jobs */}
  {filteredJobs.length === 0 ? (
    <p className="job-empty">⏳ Không tìm thấy công việc phù hợp</p>
  ) : (
    <div className="job-grid">
      {filteredJobs.map((job) => (
        <div key={job.id} className="job-card">
          <h3>{job.title}</h3>
          <p className="company">{job.company}</p>
          <p className="info">
            📍 {job.location} {job.salary ? `| 💰 ${job.salary}` : ""}
          </p>

          {job.category && <span className="category">{job.category}</span>}

          {job.description && (
            <a
              href={job.description}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 Xem chi tiết
            </a>
          )}
        </div>
      ))}
    </div>
  )}
</div>
);
};
export default Jobs;