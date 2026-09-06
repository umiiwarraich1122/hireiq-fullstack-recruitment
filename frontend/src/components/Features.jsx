import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import featuresData from '../data/featuresData';

export default function Features() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const activeCategory = featuresData[activeIdx];

  return (
    <section className="section" id="features">
      <div className="wrap">
        <motion.div
          className="section-header"
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-tag">✦ Feature Explorer</div>
          <h2>Twenty-five agents, seven categories.</h2>
          <p>Every feature solves one specific failure in traditional hiring — from CVs never read carefully, to references no one calls.</p>
        </motion.div>

        <motion.div
          className="feat-layout"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <div className="feat-tabs">
            {featuresData.map((cat, i) => (
              <button
                key={cat.letter}
                className={`feat-tab ${i === activeIdx ? 'active' : ''}`}
                onClick={() => setActiveIdx(i)}
              >
                <span className="letter">{cat.letter}</span>
                <span className="tab-info">
                  <div className="tab-name">{cat.name}</div>
                  <div className="tab-count">{cat.features.length} agent{cat.features.length > 1 ? 's' : ''}</div>
                </span>
              </button>
            ))}
          </div>

          <div className="feat-panel">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIdx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="feat-panel-head">
                  <h3>{activeCategory.letter}. {activeCategory.name}</h3>
                  <p>{activeCategory.desc}</p>
                </div>
                {activeCategory.features.map((f, fi) => (
                  <motion.div
                    key={f.n}
                    className="feature-item"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: fi * 0.06, duration: 0.4 }}
                  >
                    <div className="feat-head">
                      <span className="feat-num">{String(f.n).padStart(2, '0')}</span>
                      <span className="feat-title">{f.t}</span>
                    </div>
                    <p className="feat-problem">{f.p}</p>
                    <ul>
                      {f.b.map((bullet, bi) => <li key={bi}>{bullet}</li>)}
                    </ul>
                    <p className="feat-value">{f.v}</p>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
