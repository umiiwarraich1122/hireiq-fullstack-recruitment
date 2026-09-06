import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function CTA() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="section cta-section" id="cta">
      <div className="wrap">
        <motion.div
          className="cta-card"
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2>A full-stack recruitment platform, not a resume filter.</h2>
          <p>HireIQ's multi-agent architecture means every component can be built, tested and shipped independently — an agile path from a single screening agent to a complete hiring platform.</p>
          <div className="cta-actions">
            <button className="btn-glow" onClick={() => scrollTo('features')}>✦ Walk Through The Agents</button>
          </div>
          <div className="cost-float">
            <div className="big">$0</div>
            <div className="sm">total platform cost — open-source only</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
