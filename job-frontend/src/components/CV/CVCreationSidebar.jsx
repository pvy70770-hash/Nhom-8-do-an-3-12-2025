import React, { useState } from 'react';
import { FaCloudUploadAlt, FaArrowLeft } from 'react-icons/fa';

export default function CVCreationSidebar({ onBack, onCreate }) {
  const [selected, setSelected] = useState('A');
  const PRIMARY = '#00b14f';

  const OptionCard = ({ id, title, children }) => (
    <div
      onClick={() => setSelected(id)}
      style={{
        border: selected === id ? `2px solid ${PRIMARY}` : '1px solid #e0e0e0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        cursor: 'pointer',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="radio" checked={selected === id} readOnly />
          <div style={{ fontWeight: 700 }}>{title}</div>
        </div>
      </div>
      {selected === id && (
        <div style={{ marginTop: 10 }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <aside style={{ width: 360, padding: 18, background: '#fff', borderRadius: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <h3 style={{ color: '#00b14f', margin: 0 }}>Bạn muốn tạo CV từ?</h3>
      </div>

      <OptionCard id="A" title="Nội dung CV mẫu TopCV gợi ý">
        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 6, fontWeight: 700 }}>Chọn ngôn ngữ</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: '#00b14f', color: '#fff', padding: '6px 10px', borderRadius: 6 }}>Tiếng Việt</button>
            <button style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>Tiếng Anh</button>
            <button style={{ background: '#f1f5f9', padding: '6px 10px', borderRadius: 6 }}>Tiếng Nhật</button>
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 6, fontWeight: 700 }}>Chọn vị trí</div>
          <select style={{ width: '100%', padding: 8, borderRadius: 6 }}>
            <option>Nhân viên kinh doanh</option>
            <option>Nhân viên Marketing</option>
            <option>Kỹ sư phần mềm</option>
          </select>
        </div>
      </OptionCard>

      <OptionCard id="B" title="Nội dung từ máy tính hoặc LinkedIn">
        <div style={{ border: '1px dashed #d1d5db', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          <FaCloudUploadAlt size={28} style={{ color: '#9ca3af' }} />
          <div style={{ fontWeight: 700, marginTop: 8 }}>Tải lên CV từ máy tính, chọn hoặc kéo thả</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Hỗ trợ .doc .docx .pdf - dưới 5MB</div>
          <button style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: '#f3f4f6' }}>Chọn CV</button>
          <div style={{ marginTop: 8 }}><a href="#">Hướng dẫn tạo CV từ LinkedIn Profile</a></div>
        </div>
      </OptionCard>

      <OptionCard id="C" title="Khôi phục bản chưa lưu">
        <div>Tiếp tục chỉnh sửa từ bản CV gần nhất bạn chưa lưu.</div>
      </OptionCard>

      <OptionCard id="D" title="Tạo CV từ đầu">
        <div>Bắt đầu từ một khung CV trắng không có nội dung gợi ý.</div>
      </OptionCard>

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => onCreate && onCreate(selected)} style={{ background: '#00b14f', color: '#fff', padding: '12px 14px', borderRadius: 8, border: 'none', fontWeight: 700 }}>Tạo CV</button>
        <button onClick={() => onBack && onBack()} style={{ background: '#fff', color: '#00b14f', padding: '10px 14px', borderRadius: 8, border: '1px solid #00b14f', fontWeight: 700 }}><FaArrowLeft style={{ marginRight: 8 }} />Quay lại danh sách mẫu</button>
      </div>
    </aside>
  );
}
