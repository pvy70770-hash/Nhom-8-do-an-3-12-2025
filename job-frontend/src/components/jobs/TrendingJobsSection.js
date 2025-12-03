import React, { useState } from 'react';

const TrendingJobsSection = ({ jobs = [], onJobClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const categories = [
    'Tất cả',
    'Xây dựng',
    'Thiết kế',
    'Luật',
    'Giáo Dục',
    'Kế toán',
    'Kinh doanh'
  ];

  // Filter jobs by category
  const filteredJobs = selectedCategory === 'Tất cả' 
    ? jobs 
    : jobs.filter(job => job.category === selectedCategory);

  // Handler for job card clicks
  const handleJobClick = (job) => {
    if (onJobClick) {
      onJobClick(job);
    } else {
      console.log('Job clicked:', job);
      // Default behavior: open in new tab if job has URL
      if (job.url) {
        window.open(job.url, '_blank');
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      gap: '24px',
      width: '100%',
      minHeight: '790px',
      background: '#F5F5F5',
      boxSizing: 'border-box'
    }}>

      {/* Section Title */}
      <h2 style={{
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: 700,
        fontSize: '32px',
        lineHeight: '40px',
        textAlign: 'center',
        color: '#263A4D',
        margin: '0 0 20px 0'
      }}>
        Việc làm xu hướng hiện nay
      </h2>

      {/* Jobs Grid Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1400px',
        minHeight: '496px',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 40px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          width: '100%',
          alignContent: 'start'
        }}>
          {filteredJobs.length > 0 ? (
            filteredJobs.slice(0, 9).map((job, index) => (
              <div
                key={job.id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '13px',
                    gap: '6px',
                    width: '100%',
                    minHeight: '100px',
                    background: '#FFFFFF',
                    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.3s ease'
                  }}
                  onClick={() => handleJobClick(job)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0px 2px 6px rgba(0, 0, 0, 0.04)';
                  }}
                >
                  {/* Job Content Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    padding: '0px',
                    gap: '10px',
                    width: '100%'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0px',
                      gap: '4px',
                      width: '100%',
                      minHeight: '44px'
                    }}>
                      {/* Job Title */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '0px',
                        width: '100%',
                        height: '20px'
                      }}>
                        <h3 style={{
                          width: '100%',
                          height: '20px',
                          fontFamily: 'Inter',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#212F3F',
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {job.title}
                        </h3>
                      </div>

                      {/* Company Name */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px',
                        gap: '6px',
                        width: '100%',
                        height: '16px'
                      }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '0px',
                          maxWidth: '100%'
                        }}>
                          <span style={{
                            height: '16px',
                            fontFamily: 'Inter',
                            fontStyle: 'normal',
                            fontWeight: job.company && job.company.length > 30 ? 500 : 600,
                            fontSize: '12px',
                            lineHeight: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            letterSpacing: job.company && job.company.length > 30 ? '0px' : '0.15px',
                            color: job.company && job.company.length > 30 ? '#6F7882' : '#B3B8BD',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {job.company}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary and Location Container */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '0px',
                    gap: '4px',
                    width: '100%',
                    height: '24px'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      padding: '0px',
                      gap: '3.94px',
                      width: '100%'
                    }}>
                      {/* Salary Badge */}
                      {job.salary && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '4px 10px',
                          background: '#EDEFF0',
                          borderRadius: '34px',
                          height: '24px'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '0px'
                          }}>
                            <span style={{
                              height: '16px',
                              fontFamily: 'Inter',
                              fontStyle: 'normal',
                              fontWeight: 500,
                              fontSize: '12px',
                              lineHeight: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#263A4D',
                              whiteSpace: 'nowrap'
                            }}>
                              {job.salary}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Location Badge */}
                      {job.location && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '4px 10px',
                          background: '#EDEFF0',
                          borderRadius: '34px',
                          height: '24px'
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            padding: '0px'
                          }}>
                            <span style={{
                              height: '16px',
                              fontFamily: 'Inter',
                              fontStyle: 'normal',
                              fontWeight: 500,
                              fontSize: '12px',
                              lineHeight: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              color: '#263A4D',
                              whiteSpace: 'nowrap'
                            }}>
                              {job.location}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '40px 20px',
              color: '#6F7882',
              fontFamily: 'Inter',
              fontSize: '16px',
              fontWeight: 500
            }}>
              {jobs.length === 0 ? 'Đang tải dữ liệu...' : 'Không có công việc nào trong danh mục này'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrendingJobsSection;