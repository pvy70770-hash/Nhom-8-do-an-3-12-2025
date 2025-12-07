import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import TEMPLATE_SAMPLE_DATA from '../../data/cvTemplateSampleData';

const DEFAULT_POSITIONS = [
  'Nhân viên kinh doanh',
  'Kỹ sư phần mềm',
  'Chuyên viên Marketing',
  'Quản lý dự án',
  'Thiết kế đồ họa',
];

export default function CreateCV() {
  const navigate = useNavigate();
  const { templateId } = useParams();
  const location = useLocation();

  // Nếu được điều hướng từ trang mẫu với payload, giữ payload để dùng khi bấm "Tạo CV".
  // IMPORTANT: Do NOT auto-forward here (avoids navigation loops). Create action will navigate.
  useEffect(() => {
    // noop: existence of createPayload is handled in effect below where template is resolved
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [template, setTemplate] = useState(null);
  const [source, setSource] = useState('template'); // template | import | blank
  const [language, setLanguage] = useState('Tiếng Việt');
  const [position, setPosition] = useState(DEFAULT_POSITIONS[0]);
  const [sampleData, setSampleData] = useState(null);
  const PRIMARY_COLOR = '#007bff';

  // Map known slugs to sample data keys from TEMPLATE_SAMPLE_DATA
  const TEMPLATE_SLUG_MAP = {
    'simple-01': '1',
    'professional-it': '2',
    'creative-marketing': '3',
    'elegant-01': '4'
  };

  useEffect(() => {
    // Determine final template id (URL param > location.state > localStorage)
    const cp = location.state && location.state.createPayload;
    const fromStateId = cp && cp.templateId ? cp.templateId : null;
    const storedId = (() => {
      try { const s = localStorage.getItem('selectedTemplateId'); return s; } catch(e){return null}
    })();

    const finalId = templateId || fromStateId || storedId || 'custom';

    // Build a minimal template meta object. If createPayload carried templateMeta use it.
    const meta = (cp && cp.templateMeta) ? cp.templateMeta : { id: finalId, name: finalId };

    // Resolve sampleData:
    // prefer createPayload.sampleData, then location.state.defaultContent (provided by templates page),
    // then map via templateId into TEMPLATE_SAMPLE_DATA
    const state = location.state || {};
    let resolvedSample = null;
    if (state.createPayload && state.createPayload.sampleData) {
      resolvedSample = state.createPayload.sampleData;
    } else if (state.defaultContent) {
      resolvedSample = state.defaultContent;
    } else {
      const idFromState = state.createPayload?.templateId || state.templateId || null;
      const lookupId = templateId || idFromState || null;
      if (lookupId && TEMPLATE_SAMPLE_DATA[String(lookupId)]) {
        resolvedSample = TEMPLATE_SAMPLE_DATA[String(lookupId)];
      }
    }

    // also pull previewImage from createPayload.templateMeta.previewImage if present
    const previewImage = (cp && cp.templateMeta && cp.templateMeta.previewImage) ? cp.templateMeta.previewImage : (meta.previewImage || null);
    setTemplate({ id: finalId, title: meta.name || meta.id, category: meta.category || 'Tùy chọn', image: meta.image || previewImage || null, color: meta.color || '#ffffff' });
    setSampleData(resolvedSample);
    if (resolvedSample) {
      setSource((cp && cp.createMode) || 'template');
      setPosition((cp && cp.position) || resolvedSample.position || DEFAULT_POSITIONS[0]);
      // store selected sample into localStorage for compatibility
      try { localStorage.setItem('selectedTemplateId', finalId); localStorage.setItem('selectedTemplateData', JSON.stringify({ id: finalId, ...meta })); } catch(e){}
    }

    // store sampleData in location state (do not navigate). This keeps behavior predictable.
    // Note: we intentionally do not navigate away here; user must click Create CV to continue to builder.
  }, [location.state, templateId]);

  const handleCreate = () => {
    const payload = {
      createMode: source === 'template' ? 'sample' : source,
      templateId: template?.id || null,
      templateMeta: { id: template?.id, name: template?.title, category: template?.category },
      sampleData: source === 'template' ? (location.state?.createPayload?.sampleData || TEMPLATE_SAMPLE_DATA?.[TEMPLATE_SLUG_MAP[template?.id] || template?.id] || null) : null,
      language,
      position,
      createdAt: new Date().toISOString()
    };

    console.log('📄 Create CV payload:', payload);

    // Persist selection
    if (template && template.id) {
      try { localStorage.setItem('selectedTemplateId', template.id); localStorage.setItem('selectedTemplateData', JSON.stringify(template)); } catch (e) {}
    }

    // Navigate to the real builder route and pass createPayload
    navigate('/create-cv', { state: { createPayload: payload } });
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Tạo CV từ mẫu</h1>
        <p style={styles.subtitle}>Bắt đầu nhanh chóng bằng mẫu hoặc tạo CV từ đầu</p>
      </div>

      <div style={{...styles.contentGrid, flexDirection: isMobile ? 'column' : 'row'}}>
        <main style={{...(isMobile ? {flex: '0 0 auto'} : styles.leftColumn)}}>
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <strong>{template?.title || 'CV Preview'}</strong>
            </div>
            <div style={{...styles.previewBody}}>
              <div style={{...styles.a4, background: template?.color || '#fff'}}>
                {sampleData ? (
                  <div style={styles.a4Placeholder}>
                    <h2 style={{margin: '0 0 6px 0'}}>{sampleData.fullName}</h2>
                    <div style={{color: '#666', marginBottom: 12}}>{sampleData.position}</div>
                    {sampleData.summary && <div style={{marginBottom: 12}}><strong>Mục tiêu</strong><div style={{color: '#444'}}>{sampleData.summary}</div></div>}
                    {sampleData.experience && sampleData.experience.length > 0 && (
                      <div style={{marginBottom: 12}}>
                        <strong>Kinh nghiệm</strong>
                        <div style={{marginTop: 8}}>
                          {sampleData.experience.map((e, i) => (
                            <div key={i} style={{marginBottom: 8}}>
                              <div style={{fontWeight: 700}}>{e.title} <span style={{fontWeight: 400, color: '#666'}}>— {e.company}</span></div>
                              <div style={{color: '#888', fontSize: 12}}>{e.time}</div>
                              {
                                (() => {
                                  const d = e.description;
                                  const descArray = Array.isArray(d) ? d : (d ? [d] : []);
                                  if (descArray.length > 1) {
                                    return <ul style={{ marginTop: 6, paddingLeft: 18, color: '#333' }}>{descArray.map((dd, idx) => <li key={idx} style={{ marginBottom: 6 }}>{dd}</li>)}</ul>;
                                  }
                                  if (descArray.length === 1) return <div>{descArray[0]}</div>;
                                  return null;
                                })()
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sampleData.skills && sampleData.skills.length > 0 && (
                      <div>
                        <strong>Kỹ năng</strong>
                        <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8}}>
                          {sampleData.skills.map((s, idx) => <span key={idx} style={{background: '#eef7ff', padding: '6px 10px', borderRadius: 6}}>{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={styles.a4Placeholder}>
                    <h3 style={{margin: 0}}>{template?.title}</h3>
                    <p style={{color: '#666'}}>A4 preview — sample content rendered here.</p>
                    <div style={{marginTop: 20, color: '#444'}}>
                      <p style={{margin: '6px 0'}}>Nguyễn Văn A</p>
                      <p style={{margin: '6px 0'}}>Kỹ sư phần mềm</p>
                      <p style={{margin: '6px 0'}}>Mô tả tóm tắt: Có kinh nghiệm ...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside style={{...(isMobile ? {width: '100%', marginTop: 18} : styles.rightColumn)}}>
          <div style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Bạn muốn tạo CV từ?</h3>

            <div style={{marginTop: 12}}>
              <OptionRow
                label="Sử dụng nội dung mẫu gợi ý"
                description="Sử dụng nội dung mặc định từ mẫu"
                checked={source === 'template'}
                onClick={() => setSource('template')}
              />

              <OptionRow
                label="Nhập / Import (File hoặc LinkedIn)"
                description="Tải file hoặc nhập từ LinkedIn"
                checked={source === 'import'}
                onClick={() => setSource('import')}
              />

              <OptionRow
                label="Tạo CV từ đầu"
                description="Bắt đầu với trang trắng"
                checked={source === 'blank'}
                onClick={() => setSource('blank')}
              />
            </div>

            <div style={{marginTop: 18}}>
              <label style={styles.fieldLabel}>Chọn ngôn ngữ</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} style={styles.select}>
                <option>Tiếng Việt</option>
                <option>Tiếng Anh</option>
                <option>Tiếng Nhật</option>
                <option>Tiếng Trung</option>
              </select>
            </div>

            <div style={{marginTop: 12}}>
              <label style={styles.fieldLabel}>Chọn vị trí</label>
              <select value={position} onChange={e => setPosition(e.target.value)} style={styles.select}>
                {DEFAULT_POSITIONS.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div style={{marginTop: 18}}>
              <button style={styles.createBtn} onClick={handleCreate}>Tạo CV</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OptionRow({ label, description, checked, onClick }) {
  return (
    <div onClick={onClick} style={{...styles.optionRow, borderColor: checked ? '#00c16a' : '#e6eef5'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <input type="radio" checked={checked} readOnly />
        <div>
          <div style={{fontWeight: 700}}>{label}</div>
          <div style={{fontSize: 13, color: '#666'}}>{description}</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    padding: 20,
    backgroundColor: '#f5f7fb',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
  },
  headerRow: { textAlign: 'left', marginBottom: 18 },
  title: { color: '#007bff', margin: 0 },
  subtitle: { color: '#666', marginTop: 6 },
  contentGrid: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  leftColumn: { flex: '0 0 70%' },
  rightColumn: { flex: '0 0 30%' },
  previewCard: { background: '#fff', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.08)', overflow: 'hidden' },
  previewHeader: { padding: '16px 20px', borderBottom: '1px solid #f0f3f7' },
  previewBody: { padding: 24, display: 'flex', justifyContent: 'center' },
  a4: { width: '100%', maxWidth: 760, minHeight: 880, background: '#fff', borderRadius: 8, padding: 28, boxSizing: 'border-box', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' },
  a4Placeholder: { textAlign: 'left', maxWidth: 680, margin: '0 auto' },
  sidebarCard: { position: 'sticky', top: 20, background: '#fff', padding: 18, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.06)' },
  sidebarTitle: { margin: 0, fontSize: 16, fontWeight: 700 },
  optionRow: { padding: 14, borderRadius: 8, border: '2px solid #e6eef5', marginBottom: 10, cursor: 'pointer', transition: 'all 0.15s' },
  fieldLabel: { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 },
  select: { width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #e6eef5', background: '#fff' },
  createBtn: { width: '100%', padding: 12, background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
};

