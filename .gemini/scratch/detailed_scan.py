import re
with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''        let skippedNoPdf = 0;
        let skippedDuplicate = 0;
        
        for (const email of emails) {
          if (!email.attachments || email.attachments.length === 0) {
            skippedNoPdf++;
            continue; // Skip emails without PDFs
          }
'''

code = code.replace('        for (const email of emails) {\n          if (!email.attachments || email.attachments.length === 0) {\n            continue; // Skip emails without PDFs\n          }', replacement)

code = code.replace('continue; // Skip processing this email', 'skippedDuplicate++;\n            continue; // Skip processing this email')

end_replacement = '''        setScannedCandidates(results);
        let msg = \Scan complete! Processed \ resumes.\;
        if (skippedNoPdf > 0) msg += \ (Skipped \ emails with no .pdf attachment)\;
        if (skippedDuplicate > 0) msg += \ (Skipped \ already scanned candidates)\;
        setScanMessage({ type: 'success', text: msg });'''

code = code.replace("        setScannedCandidates(results);\n        setScanMessage({ type: 'success', text: Scan complete! Processed  resumes. });", end_replacement)

with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Added detailed skip messages.")
