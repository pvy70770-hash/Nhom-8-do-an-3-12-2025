import React from "react";
import { useNavigate } from "react-router-dom";
// import "./App.css";
import "./ToolsSection.css"

function ToolsSection() {
  const navigate = useNavigate();

  return (
    <section className="tools-section">
      <h2 className="section-title">Công cụ hỗ trợ</h2>
      <div className="tools-grid">
        <div className="tool-card" onClick={() => navigate("/create-cv")}>
          <h3> Tạo CV</h3>
          <p>Tạo CV chuyên nghiệp miễn phí</p>
        </div>
        <div className="tool-card">
          <h3> Tư vấn nghề nghiệp</h3>
          <p>Định hướng con đường sự nghiệp</p>
        </div>
        <div className="tool-card">
          <h3>Tính lương NET</h3>
          <p>Công cụ tính lương thực nhận</p>
        </div>
      </div>
    </section>
  );
}

export default ToolsSection;
