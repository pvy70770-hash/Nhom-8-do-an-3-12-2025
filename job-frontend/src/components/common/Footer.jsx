import React from 'react';
import './Footer.css';

function Footer() {
  const quickLinks = [
    'tìm việc làm', 'tuyển dụng', 'thần số học', 'cv xin việc', 'mẫu cv',
    'việc làm bắc giang', 'việc làm hưng yên', 'việc làm bà rịa vũng tàu', 'việc làm quảng ngãi', 'việc làm nam định',
    'việc làm huế', 'việc làm thái bình', 'việc làm ninh bình', 'việc làm hà tĩnh', 'việc làm tphcm',
    'việc làm đà nẵng', 'việc làm hải phòng', 'việc làm cần thơ', 'việc làm bình dương', 'tìm việc làm tại hà nội'
  ];

  const jobCategories = [
    'việc làm nhân viên kinh doanh', 'tuyển dụng kế toán trưởng', 'việc làm sales', 'tuyển dụng marketing',
    'tuyển dụng content marketing', 'tuyển dụng nhân sự', 'tuyển dụng kế toán tổng hợp', 'tuyển dụng kiểm toán',
    'tuyển dụng truyền thông', 'việc làm qa qc', 'tuyển dụng brand marketing', 'tuyển dụng hr manager',
    'việc làm ngành may', 'tuyển dụng marketing manager', 'việc làm giáo dục', 'việc làm partime',
    'tuyển dụng nhân viên thiết kế', 'tuyển dụng tài chính', 'việc làm tư động hóa', 'việc làm báo chí',
    'tuyển dụng kiểm toán ngân hàng', 'việc làm in ấn', 'data analyst'
  ];

  const locations = [
    'Hồ Chí Minh',
    'Hà Nội',
    'Hải Phòng',
    'Đà Nẵng',
    'Cần Thơ'
  ];

  const industries = [
    'Kế toán',
    'Ngân hàng',
    'Phần mềm máy tính',
    'IT Support / Help Desk',
    'Xây dựng'
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        {/* Quick Links Section */}
        <div className="footer-section footer-links">
          <div className="quick-links">
            {quickLinks.map((link, index) => (
              <a key={index} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
          <div className="quick-links">
            {jobCategories.map((link, index) => (
              <a key={index} href="#" className="footer-link">
                {link}
              </a>
            ))}
          </div>
        </div>

        {/* Main Footer Sections */}
        <div className="footer-main">
          <div className="footer-column">
            <h3 className="footer-heading">Job Portal</h3>
            <ul className="footer-list">
              <li><a href="/about">Về Job Portal</a></li>
              <li><a href="/contact">Liên Hệ</a></li>
              <li><a href="/faq">Hỏi Đáp</a></li>
              <li><a href="/terms">Thỏa Thuận Sử Dụng</a></li>
              <li><a href="/privacy">Quy Định Bảo Mật</a></li>
              <li><a href="/policy">Quy Chế Hoạt Động</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Dành cho Nhà tuyển dụng</h3>
            <ul className="footer-list">
              <li><a href="/employer">Đăng tuyển dụng</a></li>
              <li><a href="/employer/search">Tìm kiếm hồ sơ</a></li>
              <li><a href="/employer/products">Sản phẩm Dịch vụ khác</a></li>
              <li><a href="/employer/contact">Liên hệ</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Việc làm theo khu vực</h3>
            <ul className="footer-list">
              {locations.map((location, index) => (
                <li key={index}>
                  <a href={`/jobs/location/${location.toLowerCase().replace(/\s+/g, '-')}`}>
                    {location}
                  </a>
                </li>
              ))}
            </ul>
            <a href="/locations" className="footer-link-more">
              Xem tất cả khu vực →
            </a>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Việc làm theo ngành nghề</h3>
            <ul className="footer-list">
              {industries.map((industry, index) => (
                <li key={index}>
                  <a href={`/jobs/industry/${industry.toLowerCase().replace(/\s+/g, '-')}`}>
                    {industry}
                  </a>
                </li>
              ))}
            </ul>
            <a href="/industries" className="footer-link-more">
              Tìm việc làm →
            </a>
          </div>
        </div>

        {/* Company Info */}
        <div className="footer-bottom">
          <div className="company-info">
            <p>
              <strong>Công ty Cổ phần Job Portal Việt Nam.</strong> Địa chỉ: Tầng 20, Tòa nhà Central, 11 Đoàn Văn Bơ, Phường 13, Quận 4, TP. HCM.
            </p>
            <p>
              Giấy CNĐKKD số 0304836029 do Sở Kế Hoạch và Đầu Tư Thành phố Hồ Chí Minh cấp lần đầu ngày 11/12/2006
            </p>
          </div>
          <div className="copyright">
            <p>© Copyright Công Ty Cổ Phần Job Portal Việt Nam</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;