// Dữ liệu CV mẫu cho từng template (sample data)
// Keyed by template id (number as string) for simplicity
const TEMPLATE_SAMPLE_DATA = {
  "1": {
    fullName: 'Phạm Thị Thảo Vy',
    position: 'Nhân viên Kinh doanh',
    contact: {
      phone: '0987 654 321',
      email: 'nguyenvana@example.com',
      address: 'Hà Nội, Việt Nam',
      birthDate: '1993-05-10'
    },
    summary: 'Chuyên viên kinh doanh với 3 năm kinh nghiệm trong mảng B2B, tập trung vào phát triển khách hàng và chăm sóc đối tác.',
    experience: [
      { company: 'Công ty ABC', title: 'Nhân viên Kinh doanh', time: '01/2021 - 06/2023', description: 'Phát triển khách hàng mới, đạt chỉ tiêu doanh số 120%.' },
      { company: 'Công ty XYZ', title: 'Chuyên viên Kinh doanh', time: '07/2019 - 12/2020', description: 'Hỗ trợ khách hàng, xây dựng quan hệ lâu dài.' }
    ],
    education: [
      { school: 'Đại học Kinh tế Quốc dân', major: 'Quản trị Kinh doanh', time: '2015 - 2019' }
    ],
    skills: ['Sales', 'Negotiation', 'Customer Relationship', 'MS Excel'],
    activities: ['Tham gia CLB Kinh doanh 2017-2018']
  },
  "2": {
    fullName: 'Trần Bình Phước',
    position: 'Software Engineer',
    contact: { phone: '0912 345 678', email: 'lethib@example.com', address: 'Hồ Chí Minh, Việt Nam', birthDate: '1994-03-22' },
    summary: 'Kỹ sư phần mềm chuyên về React và Node.js, có kinh nghiệm xây dựng ứng dụng web quy mô vừa và nhỏ.',
    experience: [
      { company: 'TechCorp', title: 'Frontend Engineer', time: '03/2020 - Present', description: ['Phát triển giao diện với React, tối ưu hiệu năng.'] },
      { company: 'StartUp', title: 'Fullstack Developer', time: '06/2018 - 02/2020', description: ['Xây dựng API, triển khai CI/CD.'] }
    ],
    education: [ { school: 'Đại học Bách Khoa', major: 'Công nghệ thông tin', time: '2014 - 2018' } ],
    skills: ['React', 'Node.js', 'TypeScript', 'REST APIs', 'Git'],
    activities: ['Contributor Open Source', 'Thực tập tại TechCorp']
  },
  "3": {
    fullName: 'Phạm Minh Khôi',
    position: 'Chuyên viên Marketing',
    contact: { phone: '0909 123 456', email: 'phamvanc@example.com', address: 'Đà Nẵng, Việt Nam', birthDate: '1992-11-02' },
    summary: 'Chuyên viên Marketing sáng tạo, am hiểu content và chạy chiến dịch social.',
    experience: [ { company: 'AgencyX', title: 'Marketing Executive', time: '01/2019 - Present', description: ['Triển khai chiến dịch digital, tăng traffic 40%.'] } ],
    education: [ { school: 'Đại học Kinh tế', major: 'Marketing', time: '2010 - 2014' } ],
    skills: ['Content', 'SEO', 'Facebook Ads', 'Google Analytics'],
    activities: ['Tổ chức workshops marketing']
  },
  "4": {
    fullName: 'Trần Thị Tuyết Ly',
    position: 'Giám đốc Dự án',
    contact: { phone: '0977 777 777', email: 'trand@example.com', address: 'Hải Phòng, Việt Nam', birthDate: '1988-08-15' },
    summary: 'Quản lý dự án CNTT, điều phối team 20 người, đảm bảo tiến độ và chất lượng.',
    experience: [ { company: 'Enterprise Co', title: 'Project Manager', time: '2016 - Present', description: 'Quản lý dự án ERP, tối ưu quy trình.' } ],
    education: [ { school: 'Đại học Hàng Hải', major: 'Quản trị Kinh doanh', time: '2006 - 2010' } ],
    skills: ['Project Management', 'Agile', 'Stakeholder Management'],
    activities: []
  },
  "5": {
    fullName: 'Võ Mạnh Tiến',
    position: 'Designer',
    contact: { phone: '0933 333 333', email: 'vve@example.com', address: 'Hà Nội, Việt Nam', birthDate: '1990-01-01' },
    summary: 'Designer chuyên về UI/UX, thiết kế sản phẩm và hệ thống nhận diện thương hiệu.',
    experience: [ { company: 'DesignStudio', title: 'Senior Designer', time: '2017 - Present', description: 'Thiết kế sản phẩm và brand.' } ],
    education: [ { school: 'ĐH Mỹ thuật', major: 'Thiết kế đồ họa', time: '2008 - 2012' } ],
    skills: ['Figma', 'Sketch', 'Adobe XD', 'Branding'],
    activities: []
  },
  "6": {
    fullName: 'Cao Bá Quát',
    position: 'Research Analyst',
    contact: { phone: '0900 000 000', email: 'nhf@example.com', address: 'Hà Nội', birthDate: '1991-04-10' },
    summary: 'Mẫu Harvard style dành cho hồ sơ học thuật, tập trung thành tích và nghiên cứu.',
    experience: [],
    education: [ { school: 'Harvard University', major: 'MSc Economics', time: '2016 - 2018', description: 'Research on macroeconomics.' } ],
    skills: ['Research', 'Data Analysis'],
    activities: ['Publications']
  },

  "7": {
    fullName: 'Nguyễn Hồng Kiều',
    position: 'ATS Friendly CV',
    contact: { phone: '', email: '', address: '', birthDate: '' },
    summary: 'Mẫu tối giản, thân thiện với hệ thống ATS.',
    experience: [],
    education: [],
    skills: ['Keyword Optimized'],
    activities: []
  }
};

export default TEMPLATE_SAMPLE_DATA;
