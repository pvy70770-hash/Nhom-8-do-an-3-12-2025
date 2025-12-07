import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CVCreationSidebar from '../../components/CV/CVCreationSidebar';

export default function CreateCVCreative() {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cp = location.state && location.state.createPayload;
  const defaultContent = location.state && location.state.defaultContent;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleBack = () => navigate('/cv-templates');
  const handleCreate = (option) => {
    // forward to actual builder; for now, reuse createPayload
    navigate('/create-cv', { state: { createPayload: cp || null, defaultContent } });
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>Quay lại</button>
      <h1>Tạo CV Sáng Tạo</h1>
      <p>Template: <strong>{templateId}</strong></p>

      <div style={{ display: 'flex', gap: 18, marginTop: 18, flexDirection: isMobile ? 'column' : 'row' }}>
        <main style={{ flex: 1 }}>
          <div style={{ background: '#f7fafc', padding: 18, borderRadius: 8 }}>
            <h3>Preview</h3>
            <div style={{ marginTop: 12, background: '#fff', padding: 16, borderRadius: 8 }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(defaultContent || cp || { message: 'No content' }, null, 2)}</pre>
            </div>
          </div>
        </main>

        <div style={{ flex: '0 0 360px' }}>
          <CVCreationSidebar onBack={handleBack} onCreate={handleCreate} />
        </div>
      </div>
    </div>
  );
}
