import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './MainLayout.css';

/**
 * MainLayout - Layout chính cho user pages
 * 
 * Usage:
 * <Route element={<MainLayout />}>
 *   <Route path="/" element={<HomePage />} />
 *   <Route path="/jobs" element={<JobsPage />} />
 * </Route>
 */

function MainLayout({ children }) {
  const location = useLocation();

  // Pages không hiển thị hero section
  const pagesWithoutHero = ['/profile', '/saved-jobs', '/create-cv'];
  const showHero = location.pathname === '/' && !pagesWithoutHero.includes(location.pathname);

  // Pages full width (không có max-width container)
  const fullWidthPages = ['/'];
  const isFullWidth = fullWidthPages.includes(location.pathname);

  return (
    <div className="main-layout">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className={`main-content ${isFullWidth ? 'full-width' : ''}`}>
        {/* Hero section chỉ hiển thị ở homepage */}
        {showHero && (
          <section className="hero-section">
            <div className="hero-container">
              <h1 className="hero-title">
                Tìm công việc <span className="highlight">mơ ước</span> của bạn
              </h1>
              <p className="hero-subtitle">
                Hơn 10,000+ việc làm đang chờ đón bạn
              </p>
              
              {/* Search bar */}
              <div className="hero-search">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Vị trí, công ty, kỹ năng..."
                    className="search-input"
                  />
                </div>
                <div className="search-input-wrapper">
                  <span className="search-icon">📍</span>
                  <input
                    type="text"
                    placeholder="Địa điểm"
                    className="search-input"
                  />
                </div>
                <button className="search-button">
                  Tìm kiếm
                </button>
              </div>

              {/* Popular searches */}
              <div className="popular-searches">
                <span className="popular-label">Phổ biến:</span>
                <button className="popular-tag">Frontend Developer</button>
                <button className="popular-tag">Marketing</button>
                <button className="popular-tag">Data Analyst</button>
                <button className="popular-tag">UI/UX Designer</button>
              </div>
            </div>
          </section>
        )}

        {/* Page Content */}
        <div className={`content-wrapper ${showHero ? 'with-hero' : ''}`}>
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Scroll to top button */}
      <ScrollToTopButton />
    </div>
  );
}

/**
 * Scroll to top button component
 */
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="scroll-to-top"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}

export default MainLayout;