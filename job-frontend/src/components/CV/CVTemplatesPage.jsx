import React, { useState } from 'react';

export default function CVTemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const categories = [
    { id: 'all', name: 'Tất cả mẫu CV', count: 156 },
    { id: 'simple', name: 'CV Đơn giản', count: 45 },
    { id: 'professional', name: 'CV Chuyên nghiệp', count: 38 },
    { id: 'creative', name: 'CV Sáng tạo', count: 28 },
    { id: 'modern', name: 'CV Hiện đại', count: 25 },
    { id: 'executive', name: 'CV Quản lý', count: 20 }
  ];

  const templates = [
    {
      id: 1,
      name: 'CV Đơn giản 01',
      category: 'simple',
      thumbnail: '/api/placeholder/300/400',
      isPremium: false,
      color: '#3498db'
    },
    {
      id: 2,
      name: 'CV Chuyên nghiệp 01',
      category: 'professional',
      thumbnail: '/api/placeholder/300/400',
      isPremium: false,
      color: '#2c3e50'
    },
    {
      id: 3,
      name: 'CV Sáng tạo 01',
      category: 'creative',
      thumbnail: '/api/placeholder/300/400',
      isPremium: true,
      color: '#e74c3c'
    },
    {
      id: 4,
      name: 'CV Hiện đại 01',
      category: 'modern',
      thumbnail: '/api/placeholder/300/400',
      isPremium: true,
      color: '#27ae60'
    },
    {
      id: 5,
      name: 'CV Đơn giản 02',
      category: 'simple',
      thumbnail: '/api/placeholder/300/400',
      isPremium: false,
      color: '#9b59b6'
    },
    {
      id: 6,
      name: 'CV Chuyên nghiệp 02',
      category: 'professional',
      thumbnail: '/api/placeholder/300/400',
      isPremium: false,
      color: '#34495e'
    },
    {
      id: 7,
      name: 'CV Sáng tạo 02',
      category: 'creative',
      thumbnail: '/api/placeholder/300/400',
      isPremium: true,
      color: '#f39c12'
    },
    {
      id: 8,
      name: 'CV Hiện đại 02',
      category: 'modern',
      thumbnail: '/api/placeholder/300/400',
      isPremium: true,
      color: '#1abc9c'
    },
    {
      id: 9,
      name: 'CV Quản lý 01',
      category: 'executive',
      thumbnail: '/api/placeholder/300/400',
      isPremium: true,
      color: '#2980b9'
    }
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Mẫu CV </h1>
          <p style={styles.subtitle}>Chọn từ hơn 150+ mẫu CV chuyên nghiệp, hiện đại và ấn tượng</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Sidebar Categories */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Danh mục mẫu CV</h3>
            <div style={styles.categoryList}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.categoryItem,
                    ...(selectedCategory === cat.id ? styles.categoryItemActive : {})
                  }}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span style={styles.categoryName}>{cat.name}</span>
                  <span style={styles.categoryCount}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Premium Banner */}
          <div style={styles.premiumBanner}>
            <div style={styles.premiumBadge}> PREMIUM</div>
            <h4 style={styles.premiumTitle}>Nâng cấp tài khoản</h4>
            <p style={styles.premiumText}>Truy cập không giới hạn tất cả mẫu CV cao cấp</p>
            <button style={styles.premiumButton}>Nâng cấp ngay</button>
          </div>
        </aside>

        {/* Templates Grid */}
        <div style={styles.templatesSection}>
          <div style={styles.templatesHeader}>
            <h2 style={styles.templatesTitle}>
              {categories.find(c => c.id === selectedCategory)?.name || 'Tất cả mẫu CV'}
            </h2>
            <p style={styles.templatesCount}>{filteredTemplates.length} mẫu CV</p>
          </div>

          <div style={styles.templatesGrid}>
            {filteredTemplates.map(template => (
              <div 
                key={template.id} 
                style={styles.templateCard}
                onClick={() => setSelectedTemplate(template)}
              >
                {template.isPremium && (
                  <div style={styles.premiumTag}> PREMIUM</div>
                )}
                
                {/* CV Preview */}
                <div style={{ ...styles.templatePreview, background: template.color }}>
                  <div style={styles.cvMockup}>
                    {/* CV Header Section */}
                    <div style={styles.cvHeaderSection}>
                      <div style={styles.cvAvatar}></div>
                      <div style={styles.cvNameBlock}>
                        <div style={styles.cvNameLine}></div>
                        <div style={styles.cvTitleLine}></div>
                      </div>
                    </div>
                    
                    {/* CV Contact Info */}
                    <div style={styles.cvContactRow}>
                      <div style={styles.cvContactItem}></div>
                      <div style={styles.cvContactItem}></div>
                      <div style={styles.cvContactItem}></div>
                    </div>
                    
                    {/* CV Sections */}
                    <div style={styles.cvSection}>
                      <div style={styles.cvSectionTitle}></div>
                      <div style={styles.cvLine}></div>
                      <div style={styles.cvLine}></div>
                      <div style={styles.cvLine}></div>
                    </div>
                    
                    <div style={styles.cvSection}>
                      <div style={styles.cvSectionTitle}></div>
                      <div style={styles.cvLine}></div>
                      <div style={styles.cvLine}></div>
                    </div>
                  </div>
                </div>

                <div style={styles.templateInfo}>
                  <h3 style={styles.templateName}>{template.name}</h3>
                  <div style={styles.templateActions}>
                    <button style={styles.btnPreview}>
                       Xem trước
                    </button>
                    <button style={styles.btnUse}>
                       Sử dụng
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedTemplate && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTemplate(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setSelectedTemplate(null)}>
              ×
            </button>
            
            <div style={styles.modalContent}>
              <div style={styles.modalLeft}>
                <div style={{ ...styles.templatePreview, background: selectedTemplate.color, height: '600px' }}>
                  <div style={{...styles.cvMockup, height: '550px', width: '380px'}}>
                    {/* CV Header Section */}
                    <div style={styles.cvHeaderSection}>
                      <div style={{...styles.cvAvatar, width: '60px', height: '60px'}}></div>
                      <div style={styles.cvNameBlock}>
                        <div style={{...styles.cvNameLine, width: '180px', height: '14px'}}></div>
                        <div style={{...styles.cvTitleLine, width: '140px', height: '10px', marginTop: '8px'}}></div>
                      </div>
                    </div>
                    
                    {/* CV Contact Info */}
                    <div style={{...styles.cvContactRow, marginTop: '20px'}}>
                      <div style={{...styles.cvContactItem, width: '100px'}}></div>
                      <div style={{...styles.cvContactItem, width: '100px'}}></div>
                      <div style={{...styles.cvContactItem, width: '100px'}}></div>
                    </div>
                    
                    {/* CV Sections */}
                    <div style={{...styles.cvSection, marginTop: '24px'}}>
                      <div style={{...styles.cvSectionTitle, width: '120px', height: '12px'}}></div>
                      <div style={{...styles.cvLine, marginTop: '12px'}}></div>
                      <div style={styles.cvLine}></div>
                      <div style={styles.cvLine}></div>
                      <div style={{...styles.cvLine, width: '60%'}}></div>
                    </div>
                    
                    <div style={{...styles.cvSection, marginTop: '20px'}}>
                      <div style={{...styles.cvSectionTitle, width: '100px', height: '12px'}}></div>
                      <div style={{...styles.cvLine, marginTop: '12px'}}></div>
                      <div style={styles.cvLine}></div>
                      <div style={{...styles.cvLine, width: '80%'}}></div>
                    </div>
                    
                    <div style={{...styles.cvSection, marginTop: '20px'}}>
                      <div style={{...styles.cvSectionTitle, width: '80px', height: '12px'}}></div>
                      <div style={{...styles.cvLine, marginTop: '12px', width: '50%'}}></div>
                      <div style={{...styles.cvLine, width: '60%'}}></div>
                      <div style={{...styles.cvLine, width: '55%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalRight}>
                <h2 style={styles.modalTitle}>{selectedTemplate.name}</h2>
                {selectedTemplate.isPremium && (
                  <span style={styles.premiumBadgeSmall}> PREMIUM</span>
                )}
                
                <div style={styles.modalDescription}>
                  <h4>Về mẫu CV này</h4>
                  <p>Mẫu CV {selectedTemplate.name} với thiết kế hiện đại, chuyên nghiệp, phù hợp cho mọi ngành nghề. Dễ dàng tùy chỉnh và in ấn.</p>
                </div>

                <div style={styles.modalFeatures}>
                  <h4>Tính năng</h4>
                  <ul style={styles.featureList}>
                    <li>✓ Dễ dàng chỉnh sửa</li>
                    <li>✓ Định dạng chuẩn ATS</li>
                    <li>✓ Xuất PDF chất lượng cao</li>
                    <li>✓ Phù hợp mọi ngành nghề</li>
                  </ul>
                </div>

                <div style={styles.modalActions}>
                  <button style={styles.btnUseLarge}>
                    Sử dụng mẫu này
                  </button>
                  <button style={styles.btnDownload}>
                    Tải xuống mẫu
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

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: 'Inter, sans-serif',
  },
  header: {
    background: 'linear-gradient(135deg, #0043f7 0%, #0066ff 100%)',
    padding: '60px 24px',
    color: 'white',
  },
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '42px',
    fontWeight: '800',
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.95,
    margin: 0,
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '40px 24px',
    display: 'flex',
    gap: '32px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
  },
  sidebarCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#212F3F',
    marginBottom: '16px',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'left',
  },
  categoryItemActive: {
    background: '#E6F7ED',
    color: '#00B14F',
  },
  categoryName: {
    fontSize: '15px',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: '13px',
    opacity: 0.7,
    background: '#f5f7fa',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  premiumBanner: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
  },
  premiumBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.2)',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '12px',
  },
  premiumTitle: {
    fontSize: '18px',
    fontWeight: '700',
    margin: '0 0 8px 0',
  },
  premiumText: {
    fontSize: '14px',
    opacity: 0.9,
    margin: '0 0 16px 0',
  },
  premiumButton: {
    width: '100%',
    padding: '12px',
    background: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  templatesSection: {
    flex: 1,
  },
  templatesHeader: {
    marginBottom: '24px',
  },
  templatesTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#212F3F',
    margin: '0 0 8px 0',
  },
  templatesCount: {
    fontSize: '15px',
    color: '#666',
    margin: 0,
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
  templateCard: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    position: 'relative',
  },
  premiumTag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  templatePreview: {
    height: '350px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  cvMockup: {
    width: '220px',
    height: '310px',
    background: 'white',
    borderRadius: '4px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  cvHeaderSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  cvAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#e5e7eb',
    flexShrink: 0,
  },
  cvNameBlock: {
    flex: 1,
  },
  cvNameLine: {
    width: '120px',
    height: '10px',
    background: '#1f2937',
    borderRadius: '2px',
  },
  cvTitleLine: {
    width: '90px',
    height: '7px',
    background: '#9ca3af',
    borderRadius: '2px',
    marginTop: '6px',
  },
  cvContactRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  cvContactItem: {
    width: '60px',
    height: '6px',
    background: '#d1d5db',
    borderRadius: '2px',
  },
  cvSection: {
    marginBottom: '16px',
  },
  cvSectionTitle: {
    width: '80px',
    height: '10px',
    background: '#374151',
    borderRadius: '2px',
    marginBottom: '10px',
  },
  cvHeader: {
    height: '40px',
    background: '#e5e7eb',
    borderRadius: '4px',
    marginBottom: '12px',
  },
  cvBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cvLine: {
    width: '100%',
    height: '6px',
    background: '#f3f4f6',
    borderRadius: '2px',
    marginBottom: '6px',
  },
  templateInfo: {
    padding: '16px',
  },
  templateName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212F3F',
    margin: '0 0 12px 0',
  },
  templateActions: {
    display: 'flex',
    gap: '8px',
  },
  btnPreview: {
    flex: 1,
    padding: '10px',
    background: '#f5f7fa',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    color: '#212F3F',
  },
  btnUse: {
    flex: 1,
    padding: '10px',
    background: '#0043f7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    maxWidth: '1000px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    fontSize: '28px',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  modalContent: {
    display: 'flex',
    gap: '32px',
    padding: '40px',
  },
  modalLeft: {
    flex: 1,
  },
  modalRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#212F3F',
    margin: '0 0 12px 0',
  },
  premiumBadgeSmall: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '24px',
  },
  modalDescription: {
    marginBottom: '24px',
  },
  modalFeatures: {
    marginBottom: '32px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '12px 0 0 0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    marginTop: 'auto',
  },
  btnUseLarge: {
    flex: 1,
    padding: '16px',
    background: '#0043f7',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  btnDownload: {
    flex: 1,
    padding: '16px',
    background: 'white',
    color: '#0043f7',
    border: '2px solid #0043f7',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
  }
};