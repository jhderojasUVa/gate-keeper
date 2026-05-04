import React from 'react';
import './Hero.css';

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-icon">🛡️</span>
          <span>Your First Line of Defense</span>
        </div>
        <h1 className="hero-title fade-in-up">
          Stop Bad Code<br />
          <span className="gradient-text">Before It Commits</span>
        </h1>
        <p className="hero-description fade-in-up">
          Gate Keeper is a powerful background service for trunk development teams that automatically validates your code quality before every commit. Run linters, tests, and custom scripts in real-time with instant feedback.
        </p>
        <div className="hero-actions fade-in-up">
          <a href="#installation" className="btn btn-primary">
            Get Started →
          </a>
          <a href="#how-it-works" className="btn btn-secondary">
            See How It Works
          </a>
        </div>
        <div className="hero-stats fade-in-up">
          <div className="stat">
            <div className="stat-value">⚡ Real-time</div>
            <div className="stat-label">Instant Feedback</div>
          </div>
          <div className="stat">
            <div className="stat-value">🔌 WebSocket</div>
            <div className="stat-label">Live Updates</div>
          </div>
          <div className="stat">
            <div className="stat-value">🎯 Zero Config</div>
            <div className="stat-label">Works Out of Box</div>
          </div>
        </div>
      </div>
      <div className="hero-visual">
        <div className="terminal-window float">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="btn-red"></span>
              <span className="btn-yellow"></span>
              <span className="btn-green"></span>
            </div>
            <div className="terminal-title">gate-keeper@1.2.0</div>
          </div>
          <div className="terminal-body">
            <div className="terminal-line">
              <span className="prompt">$</span> gate-keeper server --open
            </div>
            <div className="terminal-line success">
              <span className="icon">✓</span> Gate Keeper server started
            </div>
            <div className="terminal-line">
              <span className="icon">🌐</span> Web UI: https://localhost:9000
            </div>
            <div className="terminal-line">
              <span className="icon">⚡</span> WebSocket: ws://localhost:9001
            </div>
            <div className="terminal-line mt-2">
              <span className="prompt">$</span> git commit -m "feat: add new feature"
            </div>
            <div className="terminal-line running">
              <span className="icon spinning">⟳</span> Running pre-commit checks...
            </div>
            <div className="terminal-line success">
              <span className="icon">✓</span> ESLint passed
            </div>
            <div className="terminal-line success">
              <span className="icon">✓</span> Tests passed (247 tests)
            </div>
            <div className="terminal-line success">
              <span className="icon">✓</span> Type checking passed
            </div>
            <div className="terminal-line success bold mt-2">
              <span className="icon">🎉</span> All checks passed! Ready to commit.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
