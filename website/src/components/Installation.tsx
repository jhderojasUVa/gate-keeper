import React, { useState } from 'react';
import './Installation.css';

interface InstallStep {
  title: string;
  command: string;
  description: string;
}

interface Command {
  title: string;
  command: string;
  description: string;
}

function Installation(): JSX.Element {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number): void => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const installSteps: InstallStep[] = [
    {
      title: 'Install via npm',
      command: 'npm install @jhderojasUVa/gate-keeper --save-dev',
      description: 'Add Gate Keeper to your project dependencies'
    },
    {
      title: 'Initialize configuration',
      command: 'npx gate-keeper-init',
      description: 'Creates gate-keeper.conf.json with default settings'
    },
    {
      title: 'Customize your scripts',
      command: '{\n  "port": 9000,\n  "host": "localhost",\n  "scripts": [\n    {"name": "Lint", "command": "npm run lint"},\n    {"name": "Test", "command": "npm test"},\n    {"name": "Type Check", "command": "tsc --noEmit"}\n  ]\n}',
      description: 'Edit gate-keeper.conf.json to add your quality checks'
    },
    {
      title: 'Start the server',
      command: 'npx gate-keeper server --open',
      description: 'Launch Gate Keeper with web interface'
    }
  ];

  const commands = [
    {
      title: 'Start Server',
      command: 'gate-keeper server',
      description: 'Start the Gate Keeper background service'
    },
    {
      title: 'Start with Web UI',
      command: 'gate-keeper server --open',
      description: 'Start server and open web interface'
    },
    {
      title: 'Open Web Client',
      command: 'gate-keeper client',
      description: 'Open the graphical web interface'
    },
    {
      title: 'Open Terminal Client',
      command: 'gate-keeper client-terminal',
      description: 'Open the terminal-based interface'
    }
  ];

  return (
    <section id="installation" className="installation">
      <div className="section-title">
        <h2>Get Started in Minutes</h2>
        <p className="section-subtitle">
          Simple installation and configuration. Start protecting your codebase today.
        </p>
      </div>

      <div className="installation-steps">
        {installSteps.map((step: InstallStep, index: number) => (
          <div key={index} className="install-step">
            <div className="install-step-header">
              <span className="install-step-number">{index + 1}</span>
              <h3 className="install-step-title">{step.title}</h3>
            </div>
            <p className="install-step-description">{step.description}</p>
            <div className="code-block">
              <pre><code>{step.command}</code></pre>
              <button 
                className={`copy-button ${copiedIndex === index ? 'copied' : ''}`}
                onClick={() => copyToClipboard(step.command, index)}
              >
                {copiedIndex === index ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="commands-section">
        <h3 className="commands-title">Available Commands</h3>
        <div className="commands-grid">
          {commands.map((cmd: Command, index: number) => (
            <div key={index} className="command-card card">
              <h4 className="command-title">{cmd.title}</h4>
              <p className="command-description">{cmd.description}</p>
              <div className="command-code">
                <code>{cmd.command}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="env-vars-section">
        <h3 className="env-vars-title">Environment Variables</h3>
        <p className="env-vars-subtitle">Configure Gate Keeper behavior with these optional environment variables:</p>
        <div className="env-vars-grid">
          <div className="env-var-item">
            <code className="env-var-name">GATE_KEEPER_PORT</code>
            <p className="env-var-description">HTTP/HTTPS server port (default: 9000)</p>
          </div>
          <div className="env-var-item">
            <code className="env-var-name">GATE_KEEPER_WS_PORT</code>
            <p className="env-var-description">WebSocket server port (default: 9001)</p>
          </div>
          <div className="env-var-item">
            <code className="env-var-name">GATE_KEEPER_MCP_PORT</code>
            <p className="env-var-description">MCP endpoint port for AI agents (default: 9002)</p>
          </div>
          <div className="env-var-item">
            <code className="env-var-name">GATE_KEEPER_HTTPS</code>
            <p className="env-var-description">Enable HTTPS (default: true)</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h3 className="cta-title">Ready to Protect Your Codebase?</h3>
        <p className="cta-description">Join teams who trust Gate Keeper to maintain code quality</p>
        <div className="cta-buttons">
          <a href="https://github.com/jhderojasUVa/gate-keeper" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            View on GitHub
          </a>
          <a href="https://www.npmjs.com/package/@jhderojasUVa/gate-keeper" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            View on npm
          </a>
        </div>
      </div>
    </section>
  );
}

export default Installation;
