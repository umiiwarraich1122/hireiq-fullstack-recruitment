with open('frontend/src/pages/Candidates.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target = '''<div className="score-val" style={{ background: 'var(--bg-heavy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                          ?? {c.match_score}% Match
                        </div>'''

replacement = '''{c.match_score === 0 ? (
                          <div className="score-val" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            ? Role Mismatch (0%)
                          </div>
                        ) : (
                          <div className="score-val" style={{ background: 'var(--bg-heavy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            ?? {c.match_score}% Match
                          </div>
                        )}'''

if target in code:
    code = code.replace(target, replacement)
    with open('frontend/src/pages/Candidates.jsx', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated Candidates.jsx successfully.")
else:
    print("Target string not found in Candidates.jsx.")
