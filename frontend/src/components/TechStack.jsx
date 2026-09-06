import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const stackGroups = [
  { title: 'Parsing & NLP', chips: ['PyMuPDF', 'PaddleOCR', 'spaCy NER', 'Sentence-BERT'] },
  { title: 'Generation & Reasoning', chips: ['Llama-3-8B', 'Ollama', 'Perplexity Scoring'] },
  { title: 'Verification APIs', chips: ['GitHub API', 'Stack Overflow API', 'LeetCode'] },
  { title: 'Data & Storage', chips: ['PostgreSQL', 'S3 Storage', 'AES-256', 'TLS 1.3'] },
  { title: 'Access & Delivery', chips: ['JWT Auth', 'REST API', 'Webhooks', 'OAuth 2.0'] },
  { title: 'Interface', chips: ['WebSockets', 'Kanban Board', 'PDF / Excel Export'] },
];

export default function TechStack() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="section stack-section" id="stack">
      <div className="wrap">
        <motion.div
          className="section-header"
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-tag">🛠 Technology</div>
          <h2>Built on a zero-cost, open-source stack</h2>
          <p>Every model and library is free and self-hostable — the platform's entire cost is compute, not licensing.</p>
        </motion.div>
        <div className="stack-grid">
          {stackGroups.map((group, i) => (
            <motion.div
              key={group.title}
              className="stack-card"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <h4>{group.title}</h4>
              <div className="chips">
                {group.chips.map(chip => (
                  <span key={chip} className="chip">{chip}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
