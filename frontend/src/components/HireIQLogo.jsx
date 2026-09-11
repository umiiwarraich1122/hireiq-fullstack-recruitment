export default function HireIQLogo({ size = 'default' }) {
  const isSmall = size === 'small';
  const iconSize = isSmall ? 28 : 36;
  const fontSize = isSmall ? '1rem' : '1.3rem';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '8px' : '12px' }}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e7ff" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
        <path d="M11 12h4v16h-4zM25 12h4v16h-4zM15 18h10v4H15z" fill="url(#letterGrad)" />
        <circle cx="33" cy="8" r="4" fill="#10b981" stroke="#050816" strokeWidth="1.5" />
      </svg>
      <span style={{
        fontWeight: 800,
        fontSize,
        letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, var(--text-highlight), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        HireIQ
      </span>
    </div>
  );
}
