import React from 'react';

// CVPreview: renders an unscaled A4-like CV page for given layout and sample data
// This component intentionally renders full-size typography and spacing (A4 ~794px width).
// The caller (thumbnail) is expected to scale this container via CSS transform: scale(...)
export default function CVPreview({ layout = 'simple-1', sample = null }) {
  // Provide strict dummy data for the two templates required by the user
  const simple1 = {
    fullName: 'Phạm Thị Thảo Vy',
    position: 'Senior Marketing Executive',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
    contact: { phone: '0908 123 456', email: 'vythao@example.com', address: 'Hà Nội, Việt Nam' },
    summary: 'Kinh nghiệm 6 năm trong marketing, chuyên về content và performance.\nThực thi chiến dịch đa kênh, tối ưu hóa funnel và nâng cao chuyển đổi.\nMong muốn phát triển vị trí quản lý, dẫn dắt đội nhóm marketing.',
    experience: [
      { title: 'Senior Marketing Executive', company: 'ABC Tech', time: '2021 - Hiện tại', description: ['Xây dựng chiến lược content và performance, tăng 30% organic traffic.', 'Triển khai campaign đa kênh, tăng 25% lead chất lượng.'] },
      { title: 'Marketing Specialist', company: 'Bright Media', time: '2018 - 2021', description: ['Quản lý nội dung social, tăng tương tác 40%.', 'Phối hợp với sales để tối ưu lead và quy trình chốt.'] }
    ],
    education: [{ school: 'Đại học Ngoại Thương', major: 'Quản trị Kinh doanh', time: '2014 - 2018' }],
    skills: ['Content Strategy', 'PPC', 'SEO', 'Analytics']
  };

  const simple2 = {
    fullName: 'Trần Thị Thu Trang',
    position: 'Senior Marketing Executive',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
    contact: { phone: '0908 123 456', email: 'trangtt@example.com', address: 'Hà Nội, Việt Nam' },
    summary: 'Chuyên gia marketing tập trung vào growth & performance. Có kinh nghiệm phân tích dữ liệu để tối ưu kênh và tăng trưởng người dùng.',
    experience: [
      { title: 'Senior Marketing Executive', company: 'ABC Tech', time: '2021 - Hiện tại', description: ['Tối ưu chiến dịch quảng cáo, nâng CPA hiệu quả.', 'Triển khai A/B testing và tối ưu landing page.'] },
      { title: 'Marketing Executive', company: 'Bright Media', time: '2019 - 2021', description: ['Quản lý nội dung social, tăng followers 50%.', 'Thiết kế quy trình nurture leads.'] }
    ],
    education: [{ school: 'Đại học Kinh tế Quốc dân', major: 'Marketing', time: '2014 - 2018' }],
    skills: ['Analytics', 'Content', 'SEO', 'Campaign']
  };

  const s = sample || (layout === 'simple-2' ? simple2 : simple1);

  // A4 container (unscaled) - caller must scale
  const a4 = {
    width: 794,
    minHeight: 1123,
    background: '#ffffff',
    boxSizing: 'border-box',
    padding: 28,
    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
    color: '#111827'
  };

  const sectionTitle = { fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', margin: '14px 0 8px' };
  const smallText = { fontSize: 15, color: '#374151', lineHeight: 1.5 };

  if (layout === 'simple-2') {
    // two-column layout
    return (
      <div style={a4}>
        <div style={{ display: 'flex', gap: 18, minHeight: 200 }}>
          <aside style={{ width: '30%', background: '#f3f8ff', padding: 18, boxSizing: 'border-box', borderRadius: 6 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', marginBottom: 12 }}>
              <img src={s.avatar} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{s.fullName}</div>
            <div style={{ color: '#475569', marginBottom: 8 }}>{s.position}</div>
            <div style={{ marginTop: 8, ...smallText }}>📞 {s.contact.phone}</div>
            <div style={{ ...smallText }}>✉️ {s.contact.email}</div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Kỹ năng</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.skills.map((sk, i) => <div key={i} style={{ fontSize: 15 }}>{sk}</div>)}
              </div>
            </div>
          </aside>

          <main style={{ width: '70%', padding: '0 4px', boxSizing: 'border-box' }}>
            <div style={{ borderBottom: `4px solid #e6f7ff`, paddingBottom: 8, marginBottom: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{s.fullName}</div>
              <div style={{ color: '#475569', marginTop: 6 }}>{s.position}</div>
            </div>

            <section>
              <div style={sectionTitle}>Mục tiêu nghề nghiệp</div>
              <div style={smallText}>{s.summary}</div>
            </section>

            <section>
              <div style={sectionTitle}>Kinh nghiệm làm việc</div>
              {s.experience.map((e, idx) => (
                <div key={idx} style={{ marginTop: 8 }}>
                  <div style={{ fontWeight: 700 }}>{e.title} — <span style={{ fontWeight: 400 }}>{e.company}</span></div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{e.time}</div>
                  <ul style={{ marginTop: 6 }}>
                    {(Array.isArray(e.description) ? e.description : [e.description]).map((d,i)=>(<li key={i} style={{ marginBottom: 6 }}>{d}</li>))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <div style={sectionTitle}>Học vấn</div>
              <div style={smallText}>{s.education?.[0]?.school} — {s.education?.[0]?.major} ({s.education?.[0]?.time})</div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  // default: simple-1 (one column)
  return (
    <div style={a4}>
      <header style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 6 }}>
        <div style={{ width: 120, height: 120, background: '#f3f4f6', overflow: 'hidden' }}>
          <img src={s.avatar} alt={s.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{s.fullName}</div>
          <div style={{ color: '#475569', marginTop: 6 }}>{s.position}</div>
          <div style={{ marginTop: 8, color: '#374151' }}>{s.contact.phone} · {s.contact.email} · {s.contact.address}</div>
        </div>
      </header>

      <section>
        <div style={sectionTitle}>Mục tiêu nghề nghiệp</div>
        <div style={smallText}>{(s.summary || '').split('\n').map((line, i) => <p key={i} style={{ margin: '6px 0' }}>{line}</p>)}</div>
      </section>

      <section>
        <div style={sectionTitle}>Kinh nghiệm làm việc</div>
        {s.experience.map((e, idx) => (
          <div key={idx} style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 700 }}>{e.title} — <span style={{ fontWeight: 400 }}>{e.company}</span></div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{e.time}</div>
            <ul style={{ marginTop: 6 }}>
              {(Array.isArray(e.description) ? e.description : [e.description]).map((d,i)=>(<li key={i} style={{ marginBottom: 6 }}>{d}</li>))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <div style={sectionTitle}>Học vấn</div>
        <div style={smallText}>{s.education?.[0]?.school} — {s.education?.[0]?.major} ({s.education?.[0]?.time})</div>
      </section>

      <section>
        <div style={sectionTitle}>Kỹ năng</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
          {s.skills.map((sk, i) => <div key={i} style={{ background: '#f3f4f6', padding: '6px 10px', borderRadius: 6 }}>{sk}</div>)}
        </div>
      </section>
    </div>
  );
}
