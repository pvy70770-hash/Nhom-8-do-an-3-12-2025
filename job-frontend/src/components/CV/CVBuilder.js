import React, { useState, useEffect } from 'react';

function CVBuilder() {
  const [cvData, setCvData] = useState({
    fullName: '',
    position: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    birthDate: '',
    objective: '',
    avatar: '',
    experience: [{ company: '', position: '', period: '', description: '' }],
    education: [{ school: '', degree: '', period: '' }],
    skills: [''],
    hobbies: ''
  });

  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    loadCVData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (cvData.fullName || cvData.email) {
        saveCVData();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [cvData]);

  const loadCVData = async () => {
    try {
      const result = await window.storage.get('cv-data');
      if (result && result.value) {
        setCvData(JSON.parse(result.value));
        setSaveStatus('✓ Đã tải dữ liệu');
        setTimeout(() => setSaveStatus(''), 2000);
      }
    } catch (error) {
      console.log('No saved data');
    }
  };

  const saveCVData = async () => {
    try {
      await window.storage.set('cv-data', JSON.stringify(cvData));
      setSaveStatus('✓ Đã lưu');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      setSaveStatus('⚠ Lưu thất bại');
    }
  };

  const clearCVData = async () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ dữ liệu CV?')) {
      try {
        await window.storage.delete('cv-data');
        setCvData({
          fullName: '', position: '', phone: '', email: '', address: '', website: '',
          birthDate: '', objective: '', avatar: '',
          experience: [{ company: '', position: '', period: '', description: '' }],
          education: [{ school: '', degree: '', period: '' }],
          skills: [''], hobbies: ''
        });
        setSaveStatus('✓ Đã xóa');
      } catch (error) {
        console.error('Delete failed');
      }
    }
  };

  const handleInputChange = (field, value) => {
    setCvData({ ...cvData, [field]: value });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCvData({ ...cvData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addExperience = () => {
    setCvData({ ...cvData, experience: [...cvData.experience, { company: '', position: '', period: '', description: '' }] });
  };

  const updateExperience = (index, field, value) => {
    const newExp = [...cvData.experience];
    newExp[index][field] = value;
    setCvData({ ...cvData, experience: newExp });
  };

  const removeExperience = (index) => {
    if (cvData.experience.length > 1) {
      setCvData({ ...cvData, experience: cvData.experience.filter((_, i) => i !== index) });
    }
  };

  const addEducation = () => {
    setCvData({ ...cvData, education: [...cvData.education, { school: '', degree: '', period: '' }] });
  };

  const updateEducation = (index, field, value) => {
    const newEdu = [...cvData.education];
    newEdu[index][field] = value;
    setCvData({ ...cvData, education: newEdu });
  };

  const removeEducation = (index) => {
    if (cvData.education.length > 1) {
      setCvData({ ...cvData, education: cvData.education.filter((_, i) => i !== index) });
    }
  };

  const addSkill = () => {
    setCvData({ ...cvData, skills: [...cvData.skills, ''] });
  };

  const updateSkill = (index, value) => {
    const newSkills = [...cvData.skills];
    newSkills[index] = value;
    setCvData({ ...cvData, skills: newSkills });
  };

  const removeSkill = (index) => {
    if (cvData.skills.length > 1) {
      setCvData({ ...cvData, skills: cvData.skills.filter((_, i) => i !== index) });
    }
  };

  const downloadPDF = () => {
    alert('Nhấn Ctrl+P hoặc Cmd+P để in CV');
    window.print();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}> Tạo CV Chuyên Nghiệp</h1>
        <p style={styles.subtitle}>Tạo CV ấn tượng - Tự động lưu</p>
        {saveStatus && <div style={styles.saveStatus}>{saveStatus}</div>}
      </div>

      <div style={styles.mainContent}>
        <div style={styles.column}>
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Thông tin cá nhân</h2>
            
            <div style={styles.avatarUploadSection}>
              <div style={styles.avatarPreview}>
                {cvData.avatar ? (
                  <img src={cvData.avatar} alt="Avatar" style={styles.avatarImage} />
                ) : (
                  <div style={styles.avatarPlaceholderBig}>📷</div>
                )}
              </div>
              <div>
                <label style={styles.uploadButton}>
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={styles.fileInput} />
                   Tải ảnh lên
                </label>
                {cvData.avatar && (
                  <button style={styles.removeAvatarButton} onClick={() => setCvData({...cvData, avatar: ''})}>
                     Xóa ảnh
                  </button>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Họ và tên *</label>
              <input type="text" style={styles.input} placeholder="Nguyễn Văn A" value={cvData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Vị trí ứng tuyển *</label>
              <input type="text" style={styles.input} placeholder="Senior Digital Marketing" value={cvData.position} onChange={(e) => handleInputChange('position', e.target.value)} />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Số điện thoại</label>
                <input type="tel" style={styles.input} placeholder="0123456789" value={cvData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input type="email" style={styles.input} placeholder="email@example.com" value={cvData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Địa chỉ</label>
              <input type="text" style={styles.input} placeholder="Ba Đình, Hà Nội" value={cvData.address} onChange={(e) => handleInputChange('address', e.target.value)} />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Website</label>
                <input type="text" style={styles.input} placeholder="portfolio.com" value={cvData.website} onChange={(e) => handleInputChange('website', e.target.value)} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ngày sinh</label>
                <input type="date" style={styles.input} value={cvData.birthDate} onChange={(e) => handleInputChange('birthDate', e.target.value)} />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Mục tiêu nghề nghiệp</h2>
            <textarea style={styles.textarea} placeholder="Mô tả mục tiêu nghề nghiệp..." rows="4" value={cvData.objective} onChange={(e) => handleInputChange('objective', e.target.value)} />
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Kinh nghiệm làm việc</h2>
            {cvData.experience.map((exp, index) => (
              <div key={index} style={styles.experienceItem}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemNumber}>Kinh nghiệm #{index + 1}</span>
                  {cvData.experience.length > 1 && (
                    <button style={styles.removeButton} onClick={() => removeExperience(index)}>✕</button>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Công ty</label>
                  <input type="text" style={styles.input} placeholder="Công ty ABC" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Vị trí</label>
                    <input type="text" style={styles.input} placeholder="Marketing Manager" value={exp.position} onChange={(e) => updateExperience(index, 'position', e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Thời gian</label>
                    <input type="text" style={styles.input} placeholder="01/2021 - 06/2023" value={exp.period} onChange={(e) => updateExperience(index, 'period', e.target.value)} />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mô tả công việc</label>
                  <textarea style={styles.textarea} placeholder="Mô tả công việc..." rows="3" value={exp.description} onChange={(e) => updateExperience(index, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button style={styles.addButton} onClick={addExperience}>+ Thêm kinh nghiệm</button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Học vấn</h2>
            {cvData.education.map((edu, index) => (
              <div key={index} style={styles.experienceItem}>
                <div style={styles.itemHeader}>
                  <span style={styles.itemNumber}>Học vấn #{index + 1}</span>
                  {cvData.education.length > 1 && (
                    <button style={styles.removeButton} onClick={() => removeEducation(index)}>✕</button>
                  )}
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Trường</label>
                  <input type="text" style={styles.input} placeholder="Đại học Bách Khoa" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} />
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Bằng cấp</label>
                    <input type="text" style={styles.input} placeholder="Cử nhân CNTT" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Thời gian</label>
                    <input type="text" style={styles.input} placeholder="2015 - 2019" value={edu.period} onChange={(e) => updateEducation(index, 'period', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <button style={styles.addButton} onClick={addEducation}>+ Thêm học vấn</button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Kỹ năng</h2>
            {cvData.skills.map((skill, index) => (
              <div key={index} style={styles.skillItem}>
                <input type="text" style={styles.input} placeholder="Kỹ năng..." value={skill} onChange={(e) => updateSkill(index, e.target.value)} />
                {cvData.skills.length > 1 && (
                  <button style={styles.removeButtonSmall} onClick={() => removeSkill(index)}>✕</button>
                )}
              </div>
            ))}
            <button style={styles.addButton} onClick={addSkill}>+ Thêm kỹ năng</button>
          </div>

          <div style={styles.card}>
            <h2 style={styles.sectionTitle}> Sở thích</h2>
            <textarea style={styles.textarea} placeholder="Sở thích..." rows="2" value={cvData.hobbies} onChange={(e) => handleInputChange('hobbies', e.target.value)} />
          </div>

          <div style={styles.actionButtons}>
            <button style={styles.clearButton} onClick={clearCVData}> Xóa</button>
            <button style={styles.downloadButton} onClick={downloadPDF}> In CV</button>
          </div>
        </div>

        <div style={styles.column}>
          <div style={styles.previewCard}>
            <h3 style={styles.previewTitle}>Xem trước CV</h3>
            <div style={styles.cvPreview}>
              <div style={styles.cvLeft}>
                <div style={styles.cvAvatarSection}>
                  {cvData.avatar ? (
                    <img src={cvData.avatar} alt="Avatar" style={styles.cvAvatarImage} />
                  ) : (
                    <div style={styles.cvAvatarPlaceholder}></div>
                  )}
                </div>
                
                <div style={styles.cvSection}>
                  <h4 style={styles.cvSectionTitle}>THÔNG TIN</h4>
                  {cvData.phone && <div style={styles.cvInfoItem}> {cvData.phone}</div>}
                  {cvData.email && <div style={styles.cvInfoItem}> {cvData.email}</div>}
                  {cvData.address && <div style={styles.cvInfoItem}> {cvData.address}</div>}
                  {cvData.website && <div style={styles.cvInfoItem}> {cvData.website}</div>}
                  {cvData.birthDate && <div style={styles.cvInfoItem}> {cvData.birthDate}</div>}
                </div>

                {cvData.skills.filter(s => s).length > 0 && (
                  <div style={styles.cvSection}>
                    <h4 style={styles.cvSectionTitle}>KỸ NĂNG</h4>
                    {cvData.skills.filter(s => s).map((skill, i) => (
                      <div key={i} style={styles.cvSkillItem}>• {skill}</div>
                    ))}
                  </div>
                )}

                {cvData.hobbies && (
                  <div style={styles.cvSection}>
                    <h4 style={styles.cvSectionTitle}>SỞ THÍCH</h4>
                    <p style={styles.cvText}>{cvData.hobbies}</p>
                  </div>
                )}
              </div>

              <div style={styles.cvRight}>
                <div style={styles.cvHeader}>
                  <h2 style={styles.cvName}>{cvData.fullName || 'HỌ VÀ TÊN'}</h2>
                  <p style={styles.cvPosition}>{cvData.position || 'Vị trí ứng tuyển'}</p>
                </div>

                {cvData.objective && (
                  <div style={styles.cvSection}>
                    <h4 style={styles.cvSectionTitleRight}>MỤC TIÊU</h4>
                    <p style={styles.cvText}>{cvData.objective}</p>
                  </div>
                )}

                {cvData.experience.filter(e => e.company).length > 0 && (
                  <div style={styles.cvSection}>
                    <h4 style={styles.cvSectionTitleRight}>KINH NGHIỆM</h4>
                    {cvData.experience.filter(e => e.company).map((exp, i) => (
                      <div key={i} style={styles.cvExpItem}>
                        <div style={styles.cvExpHeader}>
                          <strong>{exp.position}</strong>
                          <span style={styles.cvExpPeriod}>{exp.period}</span>
                        </div>
                        <div style={styles.cvExpCompany}>{exp.company}</div>
                        {exp.description && <p style={styles.cvExpDesc}>{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                )}

                {cvData.education.filter(e => e.school).length > 0 && (
                  <div style={styles.cvSection}>
                    <h4 style={styles.cvSectionTitleRight}>HỌC VẤN</h4>
                    {cvData.education.filter(e => e.school).map((edu, i) => (
                      <div key={i} style={styles.cvExpItem}>
                        <div style={styles.cvExpHeader}>
                          <strong>{edu.degree}</strong>
                          <span style={styles.cvExpPeriod}>{edu.period}</span>
                        </div>
                        <div style={styles.cvExpCompany}>{edu.school}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'system-ui, sans-serif',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    color: 'white',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    margin: '0 0 10px 0',
    opacity: 0.9,
  },
  saveStatus: {
    marginTop: '10px',
    padding: '8px 20px',
    background: 'white',
    color: '#00B14F',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    alignItems: 'start',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#667eea',
    marginBottom: '20px',
  },
  avatarUploadSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
  },
  avatarPreview: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #667eea',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholderBig: {
    width: '100%',
    height: '100%',
    background: '#f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
  },
  uploadButton: {
    display: 'inline-block',
    background: '#667eea',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginRight: '10px',
  },
  fileInput: {
    display: 'none',
  },
  removeAvatarButton: {
    background: '#ffebee',
    color: '#d32f2f',
    border: '1px solid #d32f2f',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: '16px',
    flex: '1',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  experienceItem: {
    marginBottom: '20px',
    paddingBottom: '20px',
    borderBottom: '2px dashed #e0e0e0',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  itemNumber: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#667eea',
  },
  removeButton: {
    background: '#ffebee',
    color: '#d32f2f',
    border: 'none',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '14px',
  },
  skillItem: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  removeButtonSmall: {
    background: '#ffebee',
    color: '#d32f2f',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    flexShrink: 0,
  },
  addButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
  },
  clearButton: {
    flex: '1',
    background: '#ffebee',
    color: '#d32f2f',
    border: '2px solid #d32f2f',
    padding: '14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
  },
  downloadButton: {
    flex: '1',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
  },
  previewCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  previewTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '20px',
  },
  cvPreview: {
    display: 'flex',
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    minHeight: '1100px',
    fontSize: '11px',
    border: '1px solid #e0e0e0',
  },
  cvLeft: {
    width: '200px',
    background: '#2c3e50',
    padding: '25px 15px',
    color: 'white',
  },
  cvRight: {
    flex: '1',
    background: '#f8f9fa',
    padding: '25px',
  },
  cvAvatarSection: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  cvAvatarImage: {
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid white',
  },
  cvAvatarPlaceholder: {
    width: '90px',
    height: '90px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    margin: '0 auto',
    border: '3px solid white',
  },
  cvSection: {
    marginBottom: '20px',
  },
  cvSectionTitle: {
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '2px solid rgba(255,255,255,0.3)',
  },
  cvSectionTitleRight: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '10px',
    paddingBottom: '6px',
    borderBottom: '2px solid #667eea',
  },
  cvInfoItem: {
    fontSize: '10px',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  cvSkillItem: {
    fontSize: '10px',
    marginBottom: '6px',
  },
  cvText: {
    fontSize: '10px',
    lineHeight: '1.6',
    margin: 0,
  },
  cvHeader: {
    marginBottom: '20px',
  },
  cvName: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 8px 0',
    textTransform: 'uppercase',
  },
  cvPosition: {
    fontSize: '14px',
    color: '#667eea',
    margin: 0,
    fontWeight: '600',
  },
  cvExpItem: {
    marginBottom: '15px',
  },
  cvExpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '11px',
  },
  cvExpPeriod: {
    fontSize: '10px',
    color: '#666',
    fontStyle: 'italic',
  },
  cvExpCompany: {
    fontSize: '10px',
    color: '#667eea',
    marginBottom: '6px',
    fontWeight: '600',
  },
  cvExpDesc: {
    fontSize: '10px',
    lineHeight: '1.5',
    margin: 0,
    color: '#555',
  },
};

export default CVBuilder;