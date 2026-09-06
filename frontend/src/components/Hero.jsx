import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import AuthModal from './AuthModal';

const candidates = [
  { name: 'Ayesha K.', score: 94, tags: [{ text: '✓ Verified · 12 Python repos', type: 'green' }, { text: 'No red flags', type: 'blue' }] },
  { name: 'Bilal H.', score: 81, warn: true, tags: [{ text: '⚠ 9-month gap', type: 'yellow' }, { text: 'Node.js matched', type: 'blue' }] },
  { name: 'Hamza T.', score: 78, warn: true, tags: [{ text: '✗ Claims React, 0 repos', type: 'red' }] },
];

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }),
};

const cardSlide = {
  hidden: { opacity: 0, x: -30 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: 0.8 + i * 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Hero() {
  const barsRef = useRef([]);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      barsRef.current.forEach((bar, i) => {
        if (bar) bar.style.width = candidates[i].score + '%';
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div>
          <motion.div className="hero-badge" variants={fadeUp} initial="hidden" animate="visible" custom={0}>
            <span className="dot" /> AI-Powered Recruitment Intelligence
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            Hiring that <em>verifies</em>, not just filters.
          </motion.h1>
          <motion.p className="hero-sub" variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            HireIQ reads a resume like a senior engineer reviews a pull request — checking claims against GitHub, timelines, and references — then ranks everyone with plain-English reasoning.
          </motion.p>
          <motion.div className="hero-actions" variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <button className="btn-glow" onClick={() => setShowAuth(true)}>✦ Login / Sign Up</button>
            <a className="btn-outline" href="#pipeline" onClick={(e) => { e.preventDefault(); scrollTo('pipeline'); }}>How It Works →</a>
          </motion.div>
        </div>

        <motion.div className="hero-card" initial={{ opacity: 0, y: 30, rotateY: -5 }} animate={{ opacity: 1, y: 0, rotateY: -3 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <div className="card-header">
            <span className="role-label">Senior Backend Engineer · Remote</span>
            <span className="meta-label"><span className="live-dot" /> 150 CVs · 28s</span>
          </div>
          <div className="card-body">
            {candidates.map((c, i) => (
              <motion.div key={c.name} className="cand" variants={cardSlide} initial="hidden" animate="visible" custom={i}>
                <div className="cand-top">
                  <span className="cand-name">{c.name}</span>
                  <span className="cand-score">{c.score}%</span>
                </div>
                <div className="score-bar">
                  <div ref={el => barsRef.current[i] = el} className={`score-fill ${c.warn ? 'warn' : ''}`} />
                </div>
                <div className="tags">
                  {c.tags.map((tag) => (
                    <span key={tag.text} className={`tag tag-${tag.type}`}>{tag.text}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </section>
  );
}
