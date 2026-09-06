import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

export default function Creator() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="section creator-section" id="creator">
      <div className="wrap">
        <motion.div
          className="section-header"
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-tag">👤 The Mind Behind HireIQ</div>
          <h2>Built with passion, powered by AI</h2>
        </motion.div>
        <motion.div
          className="creator-card"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          <div className="creator-photo-wrap">
            <img src="/images/umair.jpg" alt="Muhammad Umair Ashraf" loading="lazy" />
          </div>
          <div className="creator-info">
            <h3>Muhammad Umair Ashraf</h3>
            <div className="creator-role">AI Engineer & Full-Stack Developer</div>
            <p className="creator-bio">Designed and architected the entire HireIQ platform — from semantic NLP engines and multi-agent AI pipelines to the glassmorphic dashboard you're viewing right now. Every line of code, every algorithm, every pixel — crafted to perfection.</p>
            <div className="creator-quote">
              "I believe hiring should be data-driven, transparent, and fair. HireIQ isn't just a tool — it's a complete reimagining of how companies discover talent."
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
