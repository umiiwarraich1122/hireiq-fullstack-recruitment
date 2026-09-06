import { useCounterAnimation } from '../hooks/useCounterAnimation';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const statsData = [
  { target: 25, suffix: '', label: 'AI agents across the hiring lifecycle' },
  { target: 7, suffix: '', label: 'Functional categories, screening to compliance' },
  { target: 85, suffix: '%', label: 'Reduction in manual screening time' },
  { target: 0, suffix: '', prefix: '$', label: 'Platform cost — 100% open-source' },
];

function StatCard({ target, suffix = '', prefix = '', label, delay }) {
  const { ref, count } = useCounterAnimation(target);
  const [inViewRef, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      className="stat-card"
      ref={(el) => { ref.current = el; inViewRef(el); }}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.3 } }}
    >
      <div className="stat-num">{prefix}{count}{suffix}</div>
      <div className="stat-label">{label}</div>
    </motion.div>
  );
}

export default function Stats() {
  return (
    <section className="stats-section">
      <div className="wrap">
        <div className="stats-row">
          {statsData.map((s, i) => (
            <StatCard key={s.label} {...s} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
