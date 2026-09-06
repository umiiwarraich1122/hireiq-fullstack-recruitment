import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const steps = [
  { idx: '01', title: 'Parse', desc: 'PDF, DOCX or scanned resumes become structured JSON — skills, roles, dates, education.' },
  { idx: '02', title: 'Flag', desc: 'Gaps, job-hopping and overlapping dates are surfaced with plain-English severity.' },
  { idx: '03', title: 'Match', desc: 'Sentence-BERT compares meaning, not keywords, against the job description.' },
  { idx: '04', title: 'Verify', desc: 'GitHub, Stack Overflow and LeetCode activity confirm or contradict technical claims.' },
  { idx: '05', title: 'Prep', desc: 'Personalized interview questions generated per candidate, with model answers.' },
  { idx: '06', title: 'Rank', desc: 'A weighted score combines every signal into one ordered, explainable shortlist.' },
];

export default function Pipeline() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="pipeline-section" id="pipeline">
      <div className="wrap">
        <motion.div
          className="section-header"
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <div className="section-tag">⚡ Processing Flow</div>
          <h2>How a batch moves through the core agents</h2>
          <p>The six Category A agents run in sequence for every batch of resumes, turning a folder of CVs into a ranked, explained shortlist.</p>
        </motion.div>
        <div className="pipe-grid">
          {steps.map((step, i) => (
            <motion.div
              key={step.idx}
              className="pipe-step"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="pipe-idx">{step.idx}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
