import React, { useRef, useState, useEffect } from 'react';
import './CVBuilder.css';

// AvatarEditorBlock: supports upload, delete, move, resize (basic implementation)
function AvatarEditorBlock({ initialUrl = null, onChange }) {
  const inputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [width, setWidth] = useState(260);
  const [height, setHeight] = useState(195);
  const draggingRef = useRef(false);
  const resizingRef = useRef(null);

  useEffect(() => setAvatarUrl(initialUrl), [initialUrl]);

  useEffect(() => {
    if (onChange) onChange(avatarUrl);
  }, [avatarUrl]);

  // Move handlers
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      setX(prev => prev + e.movementX);
      setY(prev => prev + e.movementY);
    };
    const onUp = () => { draggingRef.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Resize handlers
  useEffect(() => {
    const onResize = (e) => {
      if (!resizingRef.current) return;
      const dir = resizingRef.current;
      if (dir.includes('right')) setWidth(w => Math.min(400, Math.max(100, w + e.movementX)));
      if (dir.includes('left')) setWidth(w => Math.min(400, Math.max(100, w - e.movementX)));
      if (dir.includes('bottom')) setHeight(h => Math.min(400, Math.max(100, h + e.movementY)));
      if (dir.includes('top')) setHeight(h => Math.min(400, Math.max(100, h - e.movementY)));
    };
    const onUp = () => { resizingRef.current = null; };
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onResize);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  const openFile = () => { if (inputRef.current) inputRef.current.click(); };
  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatarUrl(url);
  };

  const onDelete = () => { setAvatarUrl(null); if (onChange) onChange(null); };

  return (
    <div className="donGian01-avatarEditor" style={{ width, height, transform: `translate(${x}px, ${y}px)` }}>
      <img src={avatarUrl || 'https://via.placeholder.com/260x195/cccccc/000000?text=Avatar'} alt="Avatar" />
      <div className="donGian01-resizeHandle donGian01-top-left" onMouseDown={() => { resizingRef.current = 'top-left'; }} />
      <div className="donGian01-resizeHandle donGian01-top-right" onMouseDown={() => { resizingRef.current = 'top-right'; }} />
      <div className="donGian01-resizeHandle donGian01-bottom-left" onMouseDown={() => { resizingRef.current = 'bottom-left'; }} />
      <div className="donGian01-resizeHandle donGian01-bottom-right" onMouseDown={() => { resizingRef.current = 'bottom-right'; }} />

      <div className="donGian01-topToolbar">
        <button className="donGian01-toolbarBtn donGian01-move" onMouseDown={(e) => { e.preventDefault(); draggingRef.current = true; }}>
          <i className="fas fa-arrows-alt"></i> Move
        </button>
        <button className="donGian01-toolbarBtn donGian01-delete" onClick={onDelete}>Xóa</button>
      </div>

      <button className="donGian01-editOverlay" onClick={openFile}><i className="fas fa-pencil-alt"></i> Sửa ảnh</button>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />
    </div>
  );
}

export default function CVPreview({ templateId = 'don-gian-01', name, position, objective, avatarUrl: avatarProp, onAvatarChange }) {
  if (templateId !== 'don-gian-01') return <div>Template chưa hỗ trợ</div>;

  const displayName = name || 'Lê Chiến';
  const displayPosition = position || 'Chức Danh Của Bạn';
  const displayObjective = objective || 'Tôi là một lập trình viên đam mê với 5 năm kinh nghiệm trong phát triển ứng dụng web và mobile...';

  return (
    <div className="donGian01-page">
      <div className="donGian01-cv-container">
        <div className="donGian01-sidebar">
          <AvatarEditorBlock initialUrl={avatarProp} onChange={onAvatarChange} />

          <h1 className="donGian01-name">{displayName}</h1>
          <p className="donGian01-title">{displayPosition}</p>

          <div className="donGian01-contact-list">
            <h3 className="donGian01-section-title">Liên Hệ</h3>
            <div className="donGian01-contact-item">
              <i className="fas fa-phone donGian01-contact-icon"></i>
              <span className="donGian01-contact-text">0123-456-789</span>
            </div>
            <div className="donGian01-contact-item">
              <i className="fas fa-envelope donGian01-contact-icon"></i>
              <span className="donGian01-contact-text">your.email@example.com</span>
            </div>
            <div className="donGian01-contact-item">
              <i className="fas fa-map-marker-alt donGian01-contact-icon"></i>
              <span className="donGian01-contact-text">Thành phố, Quốc gia</span>
            </div>
            <div className="donGian01-contact-item">
              <i className="fas fa-birthday-cake donGian01-contact-icon"></i>
              <span className="donGian01-contact-text">01/01/1990</span>
            </div>
            <div className="donGian01-contact-item">
              <i className="fas fa-venus-mars donGian01-contact-icon"></i>
              <span className="donGian01-contact-text">Nam</span>
            </div>
          </div>

          <div>
            <h3 className="donGian01-section-title">Mục Tiêu Nghề Nghiệp</h3>
            <p className="donGian01-objective">{displayObjective}</p>
          </div>

          <div className="donGian01-skills-section">
            <h3 className="donGian01-section-title">Kỹ Năng</h3>
            <div className="donGian01-skill-item">
              <div className="donGian01-skill-name">Kỹ năng giao tiếp</div>
              <div className="donGian01-skill-bar"><div className="donGian01-skill-fill" style={{ width: '70%' }} /></div>
            </div>
            <div className="donGian01-skill-item">
              <div className="donGian01-skill-name">Kỹ năng đàm phán</div>
              <div className="donGian01-skill-bar"><div className="donGian01-skill-fill" style={{ width: '60%' }} /></div>
            </div>
            <div className="donGian01-skill-item">
              <div className="donGian01-skill-name">Kỹ năng thuyết trình</div>
              <div className="donGian01-skill-bar"><div className="donGian01-skill-fill" style={{ width: '80%' }} /></div>
            </div>
          </div>

          <div>
            <h3 className="donGian01-section-title">Sở Thích</h3>
            <ul className="donGian01-hobbies-list">
              <li>Đọc sách</li>
              <li>Nấu ăn</li>
            </ul>
          </div>
        </div>

        <div className="donGian01-main-content">
          <div className="donGian01-main-section">
            <h3 className="donGian01-main-section-title">
              <div className="donGian01-main-section-icon"></div>
              Học Vấn
            </h3>
            <div className="donGian01-education-item">
              <div className="donGian01-education-header">
                <span className="donGian01-education-school">Công nghệ thông tin</span>
                <span className="donGian01-education-year">2014 – 2017</span>
              </div>
              <ul className="donGian01-bullet-list">
                <li>Tốt nghiệp loại Giỏi</li>
                <li>Đạt học bổng 2016 và 2017</li>
                <li>Đạt giải nhì nghiên cứu khoa học công nghệ</li>
              </ul>
            </div>
          </div>

          <div className="donGian01-main-section">
            <h3 className="donGian01-main-section-title">
              <div className="donGian01-main-section-icon"></div>
              Kinh Nghiệm Làm Việc
            </h3>

            <div className="donGian01-experience-item">
              <div className="donGian01-experience-header">
                <span className="donGian01-experience-role">Front End Developer</span>
                <span className="donGian01-experience-year">2021 – 2024</span>
              </div>
              <div className="donGian01-experience-company">Công ty TNHH MTV SVT</div>
              <ul className="donGian01-bullet-list">
                <li>Quản lý đề cương trang web</li>
                <li>Tham gia tối ưu front-end</li>
                <li>Hợp tác với team backend</li>
                <li>Phát triển tính năng mới</li>
                <li>Xây dựng giao diện tối ưu</li>
                <li>Tham gia code review</li>
                <li>Tối ưu hiệu suất ứng dụng</li>
                <li>Hỗ trợ đào tạo junior</li>
              </ul>
            </div>

            <div className="donGian01-experience-item">
              <div className="donGian01-experience-header">
                <span className="donGian01-experience-role">Flutter Developer</span>
                <span className="donGian01-experience-year">2019 – 2021</span>
              </div>
              <div className="donGian01-experience-company">Công ty CP Công nghệ NDS</div>
              <ul className="donGian01-bullet-list">
                <li>Phát triển ứng dụng mobile</li>
                <li>Tối ưu hiệu suất</li>
                <li>Hợp tác với designer</li>
                <li>Tham gia testing</li>
                <li>Đóng góp vào open source</li>
              </ul>
            </div>

            <div className="donGian01-experience-item">
              <div className="donGian01-experience-header">
                <span className="donGian01-experience-role">Web Developer</span>
                <span className="donGian01-experience-year">2017 – 2019</span>
              </div>
              <div className="donGian01-experience-company">Công ty CP TopCV</div>
              <ul className="donGian01-bullet-list">
                <li>Xây dựng website responsive</li>
                <li>Tích hợp API</li>
                <li>Bảo trì hệ thống</li>
                <li>Hỗ trợ khách hàng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
