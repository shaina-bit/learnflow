import React from 'react';
import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-root">
      {/* Background Blobs */}
      <div className="about-blob about-blob-1"></div>
      <div className="about-blob about-blob-2"></div>

      {/* Navigation */}
      <nav className="about-nav">
        <Link to="/" className="about-brand">
          <span>⚡</span> LearnFlow
        </Link>
        <Link to="/" className="about-btn-back">
          Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="about-content">
        <h1>About LearnFlow</h1>
        <p>
          LearnFlow is a comprehensive, gamified learning management system designed to turn your study routine into an engaging and dynamic experience.
        </p>
        <p>
          Keep track of your daily goals, maintain long-running learning streaks, and explore a smart task recommendation engine that adapts to your ongoing category progress. 
        </p>
        <p>
           Whether you are learning a new framework or preparing for exams, complete tasks to earn XP and level up your skills, all within a premium, distraction-free environment that rewards your consistency.
        </p>
      </main>
    </div>
  );
};

export default About;
