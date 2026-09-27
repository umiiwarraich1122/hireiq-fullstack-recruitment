import re
with open('frontend/src/pages/Candidates.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''{c.match_score === 0 ? (
                          <div className="score-val" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            ? Role Mismatch (0%)
                          </div>
                        ) : (
                          <div className="score-val" style={{ background: 'var(--bg-heavy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            ?? {c.match_score}% Match
                          </div>
                        )}'''

code = re.sub(
    r'<div className="score-val" style={{ background: \'var\(--bg-heavy\)\', padding: \'4px 8px\', borderRadius: \'6px\', fontSize: \'0\.85rem\' }}>.*?\{c\.match_score\}% Match\s*</div>',
    lambda m: replacement,
    code,
    flags=re.DOTALL
)

with open('frontend/src/pages/Candidates.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Updated Candidates.jsx using lambda replacer.")
