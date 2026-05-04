import React from 'react';
import './Features.css';

function Features() {
  const features = [
    {
      icon: '⚡',
      title: 'Real-Time Validation',
      description: 'Get instant feedback on your code quality through WebSocket-powered live updates. Know immediately if your code is ready to commit.',
      color: '#f59e0b'
    },
    {
      icon: '🎯',
      title: 'Customizable Scripts',
      description: 'Configure any scripts you want—linters, tests, type checkers, formatters. Gate Keeper runs them all before allowing commits.',
      color: '#8b5cf6'
    },
    {
      icon: '🌐',
      title: 'Dual Interface',
      description: 'Choose between a beautiful web UI or a terminal-based interface. Both provide real-time monitoring and status updates.',
      color: '#3b82f6'
    },
    {
      icon: '🔌',
      title: 'Pre-Commit Integration',
      description: 'Seamlessly integrates with Git hooks via Husky. Automatically validates code before every commit without manual intervention.',
      color: '#10b981'
    },
    {
      icon: '📊',
      title: 'Detailed Reporting',
      description: 'See comprehensive results for each script execution with clear pass/fail indicators and detailed error messages.',
      color: '#ec4899'
    },
    {
      icon: '⚙️',
      title: 'Zero Config Start',
      description: 'Works out of the box with sensible defaults. Just run gate-keeper-init and you\'re ready to go in seconds.',
      color: '#06b6d4'
    }
  ];

  return (
    <section id="features" className="features">
      <div className="section-title">
        <h2>Why Developers Love Gate Keeper</h2>
        <p className="section-subtitle">
          Built for trunk development teams who value code quality and fast feedback loops
        </p>
      </div>
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card card" style={{'--accent-color': feature.color}}>
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Features;
