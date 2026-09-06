import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import logo from './logo.jpg';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-logo">
        <img src={logo} alt="HireIQ Logo" className="logo-img" />
        HireIQ
      </div>
      <div className="nav-links">
        <a href="#features" onClick={(e) => { e.preventDefault(); scrollTo('features'); }}>Agents</a>
        <a href="#pipeline" onClick={(e) => { e.preventDefault(); scrollTo('pipeline'); }}>Pipeline</a>
        <a href="#stack" onClick={(e) => { e.preventDefault(); scrollTo('stack'); }}>Stack</a>
        <a href="#creator" onClick={(e) => { e.preventDefault(); scrollTo('creator'); }}>Creator</a>
        <a href="#cta" onClick={(e) => { e.preventDefault(); scrollTo('cta'); }}>Get Started</a>
      </div>
      <div className="nav-right">
        <ThemeToggle />
        <button className="nav-cta" onClick={() => scrollTo('features')}>Explore Platform</button>
      </div>
    </nav>
  );
}
