import React from 'react';
import './UseCases.css';

interface UseCase {
  icon: string;
  title: string;
  subtitle: string;
  benefits: string[];
  gradient: string;
}

interface Advantage {
  icon: string;
  title: string;
  description: string;
}

function UseCases(): JSX.Element {
  const useCases: UseCase[] = [
    {
      icon: '👥',
      title: 'Small Teams',
      subtitle: 'Move Fast, Stay Safe',
      benefits: [
        'Quick setup with zero overhead',
        'Prevent broken code from entering main branch',
        'Maintain quality without slowing down velocity',
        'Catch issues before PR reviews'
      ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '🏢',
      title: 'Enterprise Teams',
      subtitle: 'Scale with Confidence',
      benefits: [
        'Enforce company-wide coding standards',
        'Reduce manual code review overhead',
        'Integrate with existing CI/CD pipelines',
        'Custom scripts for security and compliance checks'
      ],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '🚀',
      title: 'Open Source Projects',
      subtitle: 'Quality at Scale',
      benefits: [
        'Maintain consistent quality across contributors',
        'Automated validation for external PRs',
        'Reduce maintainer burden',
        'Clear contribution guidelines enforcement'
      ],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    }
  ];

  return (
    <section id="use-cases" className="use-cases">
      <div className="section-title">
        <h2>Built for Teams of All Sizes</h2>
        <p className="section-subtitle">
          Whether you're a solo developer or managing hundreds of engineers, Gate Keeper scales with you
        </p>
      </div>
      <div className="use-cases-grid">
        {useCases.map((useCase: UseCase, index: number) => (
          <div key={index} className="use-case-card card">
            <div className="use-case-header" style={{background: useCase.gradient}}>
              <div className="use-case-icon">{useCase.icon}</div>
            </div>
            <div className="use-case-content">
              <h3 className="use-case-title">{useCase.title}</h3>
              <p className="use-case-subtitle">{useCase.subtitle}</p>
              <ul className="benefits-list">
                {useCase.benefits.map((benefit: string, idx: number) => (
                  <li key={idx} className="benefit-item">
                    <span className="benefit-icon">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="advantages-section">
        <h3 className="advantages-title">Why Choose Gate Keeper?</h3>
        <div className="advantages-grid">
          <div className="advantage-item">
            <div className="advantage-icon">⚡</div>
            <h4>Instant Feedback</h4>
            <p>Know within seconds if your code meets quality standards</p>
          </div>
          <div className="advantage-item">
            <div className="advantage-icon">🎯</div>
            <h4>Developer Focused</h4>
            <p>Built by developers, for developers. Minimal friction, maximum value</p>
          </div>
          <div className="advantage-item">
            <div className="advantage-icon">🔒</div>
            <h4>Fail Fast</h4>
            <p>Catch issues locally before they reach CI/CD or production</p>
          </div>
          <div className="advantage-item">
            <div className="advantage-icon">🛠️</div>
            <h4>Flexible</h4>
            <p>Works with any language, framework, or tooling ecosystem</p>
          </div>
          <div className="advantage-item">
            <div className="advantage-icon">📈</div>
            <h4>Improved Quality</h4>
            <p>Reduce bugs, improve code consistency, ship with confidence</p>
          </div>
          <div className="advantage-item">
            <div className="advantage-icon">⏱️</div>
            <h4>Time Saver</h4>
            <p>Eliminate wasted time on failed CI builds and fix-up commits</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UseCases;
