import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

export default function CreateCVProfessional() {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cp = location.state && location.state.createPayload;
  const defaultContent = location.state && location.state.defaultContent;

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>Quay lại</button>
      <h1>Tạo CV Chuyên Nghiệp</h1>
      <p>Template: <strong>{templateId}</strong></p>

      <div style={{ marginTop: 16, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
        <h3>Received createPayload</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(cp || { message: 'No payload' }, null, 2)}</pre>
      </div>

      <div style={{ marginTop: 12 }}>
        <h4>Default Content (for preview)</h4>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(defaultContent || { message: 'No defaultContent' }, null, 2)}</pre>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>Scaffold for professional builder — implement advanced UI here.</p>
    </div>
  );
}
