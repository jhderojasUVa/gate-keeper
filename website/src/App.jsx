import React, { useState } from 'react';
import './App.css';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import UseCases from './components/UseCases';
import Installation from './components/Installation';
import Footer from './components/Footer';
import Navigation from './components/Navigation';

function App() {
  return (
    <div className="App">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Installation />
      <Footer />
    </div>
  );
}

export default App;
