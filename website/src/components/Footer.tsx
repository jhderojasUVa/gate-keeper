import React from 'react';
import './Footer.css';

function Footer(): JSX.Element {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="logo-icon">🛡️</span>
            <span className="logo-text">Gate Keeper</span>
          </div>
          <p className="footer-tagline">
            Your first line of defense in trunk development
          </p>
          <div className="footer-social">
            <a href="https://github.com/jhderojasUVa/gate-keeper" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </a>
            <a href="https://www.npmjs.com/package/@jhderojas/gate-keeper" target="_blank" rel="noopener noreferrer" className="social-link">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 0v16h16v-16h-16zm13 13h-2v-8h-3v8h-5v-10h10v10z"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Product</h4>
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#use-cases">Use Cases</a></li>
            <li><a href="#installation">Installation</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Resources</h4>
          <ul className="footer-links">
            <li><a href="https://github.com/jhderojasUVa/gate-keeper#readme" target="_blank" rel="noopener noreferrer">Documentation</a></li>
            <li><a href="https://github.com/jhderojasUVa/gate-keeper/blob/main/CONTRIBUTE.md" target="_blank" rel="noopener noreferrer">Contributing</a></li>
            <li><a href="https://github.com/jhderojasUVa/gate-keeper/issues" target="_blank" rel="noopener noreferrer">Issues</a></li>
            <li><a href="https://github.com/jhderojasUVa/gate-keeper/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">Changelog</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">Legal</h4>
          <ul className="footer-links">
            <li><a href="https://github.com/jhderojasUVa/gate-keeper/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">License</a></li>
            <li><a href="https://github.com/jhderojasUVa" target="_blank" rel="noopener noreferrer">Author</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Gate Keeper. Licensed under Apache-2.0. Built with ❤️ for developers.
        </p>
        <p className="footer-author">
          Created by <a href="https://github.com/jhderojasUVa" target="_blank" rel="noopener noreferrer">Jesus Angel Hernandez de Rojas</a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
