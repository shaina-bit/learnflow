import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="ld-root">
      {/* Background Blobs */}
      <div className="ld-blob ld-blob-1"></div>
      <div className="ld-blob ld-blob-2"></div>

      {/* Navigation */}
      <nav className="ld-nav">
        <div className="ld-brand">
          <span>⚡</span> LearnFlow
        </div>
        <div className="ld-nav-links">
          <Link to="/login" className="ld-nav-link">Log in</Link>
          <Link to="/signup" className="ld-btn ld-btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="ld-hero">

        <h1 className="ld-hero-title">AI-Powered Learning Planner</h1>
        <p className="ld-hero-subtitle">
          Gamify your study sessions, track your streaks, and let our Smart AI Coach build a balanced learning schedule just for you.
        </p>
        <div className="ld-cta-group">
          <Link to="/signup" className="ld-btn ld-btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            Get Started Free
          </Link>
          <Link to="/about" className="ld-btn ld-btn-secondary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
            Learn More
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="ld-features">
        <div className="ld-feature-card">
          <div className="ld-feature-icon">🧠</div>
          <h3 className="ld-feature-title">Smart Study Planner</h3>
          <p className="ld-feature-desc">
            Instantly generates your daily tasks. Prioritizes your weakest subjects to ensure a perfectly balanced learning progression.
          </p>
        </div>
        <div className="ld-feature-card">
          <div className="ld-feature-icon">🔥</div>
          <h3 className="ld-feature-title">Consistent Streaks</h3>
          <p className="ld-feature-desc">
            Build discipline with dynamic daily goals. Track your unbroken progress and maintain momentum through seamless charting.
          </p>
        </div>
        <div className="ld-feature-card">
          <div className="ld-feature-icon">📈</div>
          <h3 className="ld-feature-title">Gamified Progress</h3>
          <p className="ld-feature-desc">
            Every step forward counts. Complete tasks, earn XP, crush milestones, and watch your developer level rise.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
