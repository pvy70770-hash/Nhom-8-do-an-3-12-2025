import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

export default function CreateCVAdvanced() {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cp = location.state && location.state.createPayload;

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>Quay lại</button>
      <h1>Tạo CV Nâng Cao</h1>
      <p>Template ID: <strong>{templateId}</strong></p>

      <div style={{ marginTop: 16, background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.04)' }}>
        <h3>Received createPayload (for debug)</h3>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{JSON.stringify(cp || { message: 'No payload' }, null, 2)}</pre>
      </div>

      <p style={{ marginTop: 12, color: '#666' }}>Scaffold page - implement advanced builder UI here.</p>
    </div>
  );
}
