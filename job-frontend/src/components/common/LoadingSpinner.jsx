import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * 
 * Usage:
 * <LoadingSpinner />                                    // Default
 * <LoadingSpinner size="small" />                       // Small size
 * <LoadingSpinner size="large" />                       // Large size
 * <LoadingSpinner text="Đang tải..." />                 // With text
 * <LoadingSpinner fullScreen />                         // Full screen overlay
 * <LoadingSpinner color="#4a90e2" />                    // Custom color
 * <LoadingSpinner type="dots" />                        // Different animation
 */

function LoadingSpinner({ 
  size = 'medium',        // 'small' | 'medium' | 'large'
  text = '',              // Text hiển thị dưới spinner
  fullScreen = false,     // Hiển thị full screen overlay
  color = '#4a90e2',      // Màu spinner
  type = 'spinner'        // 'spinner' | 'dots' | 'pulse' | 'bars'
}) {
  
  // Size mapping
  const sizeMap = {
    small: 30,
    medium: 50,
    large: 70
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  // Render different types of loaders
  const renderLoader = () => {
    switch (type) {
      case 'dots':
        return (
          <div className="loading-dots">
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
            <div className="dot" style={{ backgroundColor: color }}></div>
          </div>
        );

      case 'pulse':
        return (
          <div 
            className="loading-pulse" 
            style={{ 
              width: spinnerSize, 
              height: spinnerSize,
              backgroundColor: color 
            }}
          />
        );

      case 'bars':
        return (
          <div className="loading-bars">
            <div className="bar" style={{ backgroundColor: color }}></div>
            <div className="bar" style={{ backgroundColor: color }}></div>
            <div className="bar" style={{ backgroundColor: color }}></div>
            <div className="bar" style={{ backgroundColor: color }}></div>
          </div>
        );

      case 'spinner':
      default:
        return (
          <div 
            className="loading-spinner"
            style={{ 
              width: spinnerSize, 
              height: spinnerSize,
              borderColor: `${color}20`,
              borderTopColor: color
            }}
          />
        );
    }
  };

  const content = (
    <div className={`loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="loading-content">
        {renderLoader()}
        {text && <p className="loading-text">{text}</p>}
      </div>
    </div>
  );

  return content;
}

// Export variants để sử dụng nhanh
export const SmallSpinner = (props) => <LoadingSpinner size="small" {...props} />;
export const LargeSpinner = (props) => <LoadingSpinner size="large" {...props} />;
export const FullScreenSpinner = (props) => <LoadingSpinner fullScreen {...props} />;
export const DotsLoader = (props) => <LoadingSpinner type="dots" {...props} />;
export const PulseLoader = (props) => <LoadingSpinner type="pulse" {...props} />;
export const BarsLoader = (props) => <LoadingSpinner type="bars" {...props} />;

// Skeleton Loading Component
export function SkeletonLoader({ 
  count = 1, 
  height = 20, 
  width = '100%',
  borderRadius = 4,
  className = ''
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton ${className}`}
          style={{
            height: `${height}px`,
            width: width,
            borderRadius: `${borderRadius}px`,
            marginBottom: index < count - 1 ? '10px' : '0'
          }}
        />
      ))}
    </>
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="card-skeleton">
      <SkeletonLoader height={200} borderRadius={8} />
      <div style={{ padding: '16px' }}>
        <SkeletonLoader height={24} width="80%" />
        <SkeletonLoader height={16} width="60%" />
        <SkeletonLoader height={16} width="90%" count={2} />
      </div>
    </div>
  );
}

// Job Card Skeleton
export function JobCardSkeleton() {
  return (
    <div className="job-card-skeleton">
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <SkeletonLoader height={60} width={60} borderRadius={8} />
        <div style={{ flex: 1 }}>
          <SkeletonLoader height={20} width="70%" />
          <SkeletonLoader height={16} width="50%" />
        </div>
      </div>
      <SkeletonLoader height={14} width="80%" count={3} />
    </div>
  );
}

export default LoadingSpinner;