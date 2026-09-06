import logo from './logo.jpg';

export default function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <span className="footer-brand">
          <img src={logo} alt="HireIQ Logo" className="logo-img-footer" />
          HireIQ — Intelligent Recruitment Platform
        </span>
        <span>Feature report · September 2026</span>
      </div>
    </footer>
  );
}
