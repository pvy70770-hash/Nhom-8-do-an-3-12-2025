import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPen, FaCheckCircle, FaTimes, FaFilter } from 'react-icons/fa';

// Import 6 ảnh mẫu CV (Đảm bảo file ảnh đã có trong thư mục assets)
// Nếu báo lỗi ở đây, hãy kiểm tra lại tên file trong thư mục src/assets/cv-templates/
import cvImg1 from '../../assets/cv-templates/cv_template_01.png';
import cvImg2 from '../../assets/cv-templates/cv_template_02.png';
import cvImg3 from '../../assets/cv-templates/cv_template_03.png';
import cvImg4 from '../../assets/cv-templates/cv_template_04.png';
import cvImg5 from '../../assets/cv-templates/cv_template_05.png';
import cvImg6 from '../../assets/cv-templates/cv_template_06.png';

// Dữ liệu mẫu giả lập
const SAMPLE_CONTENT_DEFAULT = {
  fullName: 'Nguyễn Văn A',
  position: 'Nhân viên kinh doanh',
  contact: { phone: '0901234567', email: 'nguyen.a@topcv.vn', address: 'Hà Nội' },
  summary: 'Mong muốn tìm kiếm cơ hội việc làm trong môi trường chuyên nghiệp.',
  skills: ['Giao tiếp', 'Làm việc nhóm', 'Tiếng Anh'],
  experience: [{ title: 'Nhân viên bán hàng', company: 'Công ty ABC', time: '2021-2023', description: ['Tư vấn bán hàng', 'Chăm sóc khách hàng'] }],
  education: [{ school: 'Đại học Thương Mại', major: 'Quản trị kinh doanh', time: '2017-2021' }]
};

// Cấu hình danh sách 6 Template
const CV_TEMPLATES = [
  // --- NHÓM ĐƠN GIẢN ---
  {
    id: 1,
    name: 'Đơn giản 01',
    category: 'Đơn giản',
    image: cvImg1,
    tags: ['#clean', '#one-column', '#classic'],
    badge: 'Được dùng nhiều',
    colorDot: '#0091ea', // Xanh dương
    defaultContent: SAMPLE_CONTENT_DEFAULT
  },
  {
    id: 2,
    name: 'Đơn giản 02',
    category: 'Đơn giản',
    image: cvImg2,
    tags: ['#modern', '#two-column', '#neat'],
    badge: 'Được dùng nhiều',
    colorDot: '#34495e', // Xám đen
    defaultContent: SAMPLE_CONTENT_DEFAULT
  },

  // --- NHÓM CHUYÊN NGHIỆP ---
  {
    id: 3,
    name: 'Chuyên nghiệp 01',
    category: 'Chuyên nghiệp',
    image: cvImg3,
    tags: ['#professional', '#sectioned', '#bold'],
    badge: 'Được dùng nhiều',
    colorDot: '#2980b9', // Xanh biển đậm
    defaultContent: SAMPLE_CONTENT_DEFAULT
  },
  {
    id: 4,
    name: 'Chuyên nghiệp 02',
    category: 'Chuyên nghiệp',
    image: cvImg4,
    tags: ['#executive', '#polished'],
    badge: null,
    colorDot: '#8e44ad', // Tím
    defaultContent: SAMPLE_CONTENT_DEFAULT
  },

  // --- NHÓM SÁNG TẠO ---
  {
    id: 5,
    name: 'Sáng tạo 01',
    category: 'Sáng tạo',
    image: cvImg5,
    tags: ['#colorful', '#graphic'],
    badge: null,
    colorDot: '#e74c3c', // Đỏ
    defaultContent: SAMPLE_CONTENT_DEFAULT
  },
  {
    id: 6,
    name: 'Sáng tạo 02',
    category: 'Sáng tạo',
    image: cvImg6,
    tags: ['#artistic', '#portfolio'],
    badge: 'Được dùng nhiều',
    colorDot: '#16a085', // Xanh lá
    defaultContent: SAMPLE_CONTENT_DEFAULT
  }
];

const CATEGORIES = ['Tất cả', 'Đơn giản', 'Chuyên nghiệp', 'Sáng tạo'];
const PRIMARY_COLOR = '#007bff';

export default function CVTemplatesPage() {
  const navigate = useNavigate();
  
  // State
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Lọc template
  const filteredTemplates = selectedCategory === 'Tất cả'
    ? CV_TEMPLATES
    : CV_TEMPLATES.filter(t => t.category === selectedCategory);

  // --- HÀM XỬ LÝ CHUYỂN HƯỚNG ---
  const handleUseTemplate = (template) => {
    const payload = {
      createMode: 'sample',
      templateId: template.id,
      templateMeta: { ...template },
      sampleData: template.defaultContent,
      createdAt: new Date().toISOString()
    };

    if (template.category === 'Đơn giản') {
      navigate('/create-cv', { state: { createPayload: payload, defaultContent: template.defaultContent } });
    } else {
      navigate(`/create-cv-advanced/${encodeURIComponent(template.id)}`, { state: { createPayload: payload } });
    }
  };

  const openPreview = (tpl) => setPreviewTemplate(tpl);
  const closePreview = () => setPreviewTemplate(null);

  // --- COMPONENT CON: THẺ CARD ---
  const TemplateCard = ({ template }) => (
    <div
      style={{
        ...styles.card,
        transform: hoveredCard === template.id ? 'translateY(-5px)' : 'none',
        boxShadow: hoveredCard === template.id ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.06)'
      }}
      onMouseEnter={() => setHoveredCard(template.id)}
      onMouseLeave={() => setHoveredCard(null)}
      onClick={() => openPreview(template)}
    >
      <div style={styles.previewArea}>
        {template.badge && <span style={styles.badge}>{template.badge}</span>}
        <img 
          src={template.image} 
          alt={template.name} 
          style={styles.cardImage} 
        />
        {hoveredCard === template.id && (
          <div style={styles.cardOverlay}>
            <button 
              style={styles.overlayBtn}
              onClick={(e) => {
                e.stopPropagation();
                handleUseTemplate(template);
              }}
            >
              <FaPen /> Dùng mẫu này
            </button>
          </div>
        )}
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>{template.name}</h3>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: template.colorDot }} />
        </div>
        <div style={styles.tags}>
          {template.tags.map((tag, i) => (
            <span key={i} style={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>
      
      <div style={styles.cardFooter}>
         <button 
            style={styles.btnUse}
            onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
         >
           <FaPen style={{marginRight: 6}}/> Dùng mẫu
         </button>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tất cả mẫu CV</h1>
        <p style={styles.subtitle}>Các mẫu CV được thiết kế chuẩn theo các ngành nghề.</p>
      </div>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}><FaFilter /> Danh mục</div>
          <ul style={styles.categoryList}>
            {CATEGORIES.map(cat => (
              <li 
                key={cat}
                style={{
                  ...styles.categoryItem,
                  background: selectedCategory === cat ? '#e6f7ff' : 'transparent',
                  color: selectedCategory === cat ? PRIMARY_COLOR : '#333',
                  fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  borderLeft: selectedCategory === cat ? `4px solid ${PRIMARY_COLOR}` : '4px solid transparent'
                }}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </li>
            ))}
          </ul>
        </aside>

        <main style={styles.main}>
          <h2 style={styles.categoryTitle}>{selectedCategory}</h2>
          <div style={styles.grid}>
            {filteredTemplates.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        </main>
      </div>

      {previewTemplate && (
        <div style={styles.modalOverlay} onClick={closePreview}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closePreview}><FaTimes size={20}/></button>
            <div style={styles.modalBody}>
              <div style={styles.modalImageWrapper}>
                <img src={previewTemplate.image} alt="Full Preview" style={styles.modalImage} />
              </div>
              <div style={styles.modalSidebar}>
                <h2 style={{color: PRIMARY_COLOR}}>{previewTemplate.name}</h2>
                <div style={{margin: '10px 0', display: 'flex', gap: 5}}>
                  {previewTemplate.tags.map(t => <span key={t} style={styles.tag}>{t}</span>)}
                </div>
                <p style={{color: '#666', lineHeight: 1.5}}>
                  Mẫu CV <strong>{previewTemplate.name}</strong> phù hợp với các ứng viên thuộc nhóm ngành <strong>{previewTemplate.category}</strong>.
                </p>
                <div style={{marginTop: 'auto'}}>
                  <button 
                    style={{...styles.btnUse, width: '100%', padding: 15, fontSize: 16}}
                    onClick={() => handleUseTemplate(previewTemplate)}
                  >
                    <FaCheckCircle style={{marginRight: 8}}/> Tạo CV ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f4f7fa', minHeight: '100vh' },
  header: { marginBottom: 30 },
  title: { color: '#007bff', fontSize: 28, fontWeight: '700', marginBottom: 5 },
  subtitle: { color: '#666', fontSize: 16 },
  layout: { display: 'flex', gap: 30, alignItems: 'flex-start' },
  sidebar: { width: 260, background: 'white', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' },
  sidebarHeader: { padding: '15px 20px', fontWeight: 'bold', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 },
  categoryList: { listStyle: 'none', padding: 0, margin: 0 },
  categoryItem: { padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9', transition: 'all 0.2s' },
  main: { flex: 1 },
  categoryTitle: { fontSize: 20, marginBottom: 20, color: '#333' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 25 },
  card: { background: 'white', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid transparent', display: 'flex', flexDirection: 'column' },
  previewArea: { position: 'relative', height: 320, background: '#e9ecef', overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', transition: 'transform 0.5s' },
  badge: { position: 'absolute', top: 10, right: 10, background: '#28a745', color: 'white', padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 'bold', zIndex: 2 },
  cardOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  overlayBtn: { padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
  cardBody: { padding: 15, flex: 1 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { margin: 0, fontSize: 16, color: '#333' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  tag: { fontSize: 11, color: '#555', background: '#f1f3f5', padding: '3px 8px', borderRadius: 4 },
  cardFooter: { padding: '0 15px 15px' },
  btnUse: { width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4, fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalContent: { width: '900px', maxWidth: '95vw', height: '85vh', background: 'white', borderRadius: 8, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  closeBtn: { position: 'absolute', top: 15, right: 15, background: 'transparent', border: 'none', cursor: 'pointer', color: '#555', zIndex: 10 },
  modalBody: { display: 'flex', height: '100%' },
  modalImageWrapper: { flex: 2, background: '#ced4da', padding: 30, overflowY: 'auto', display: 'flex', justifyContent: 'center' },
  modalImage: { width: '100%', maxWidth: '600px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)' },
  modalSidebar: { flex: 1, padding: 30, borderLeft: '1px solid #eee', display: 'flex', flexDirection: 'column', background: 'white', zIndex: 5 }
};