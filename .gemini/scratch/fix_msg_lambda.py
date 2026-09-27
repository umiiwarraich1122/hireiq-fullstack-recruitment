import re
with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''
        setScannedCandidates(results);
        let msg = \Scan complete! Processed \ resumes.\;
        if (skippedNoPdf > 0) msg += \ (Skipped \ emails with no .pdf attachment)\;
        if (skippedDuplicate > 0) msg += \ (Skipped \ already scanned candidates)\;
        setScanMessage({ type: 'success', text: msg });
'''

code = re.sub(
    r'setScannedCandidates\(results\);\s*setScanMessage\(\{ type: \'success\', text: Scan complete! Processed \$\{results\.length\} resumes\. \}\);',
    lambda m: replacement,
    code,
    flags=re.DOTALL
)

with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated setScanMessage logic with lambda.")
