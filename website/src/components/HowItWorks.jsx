import React from 'react';
import './HowItWorks.css';

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Install & Initialize',
      description: 'Install Gate Keeper via npm and run the init command to create your configuration file.',
      code: 'npm install @jhderojasUVa/gate-keeper\nnpx gate-keeper-init'
    },
    {
      number: '02',
      title: 'Configure Your Scripts',
      description: 'Define the scripts you want to run in gate-keeper.conf.json. Add linters, tests, or any custom validation.',
      code: '{\n  "scripts": [\n    {"name": "Lint", "command": "npm run lint"},\n    {"name": "Test", "command": "npm test"}\n  ]\n}'
    },
    {
      number: '03',
      title: 'Start the Server',
      description: 'Launch Gate Keeper in the background. It will monitor your code and provide real-time feedback.',
      code: 'npx gate-keeper server --open'
    },
    {
      number: '04',
      title: 'Code with Confidence',
      description: 'Write code and commit as usual. Gate Keeper automatically validates everything before allowing the commit.',
      code: 'git add .\ngit commit -m "feat: amazing feature"\n# ✓ All checks passed!'
    }
  ];

  return (
    <section id="how-it-works" className="how-it-works">
      <div className="section-title">
        <h2>How It Works</h2>
        <p className="section-subtitle">
          Get up and running in minutes with our streamlined workflow
        </p>
      </div>
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step-card">
            <div className="step-number">{step.number}</div>
            <div className="step-content">
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
              <div className="code-block">
                <pre><code>{step.code}</code></pre>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="step-connector"></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
