import re
with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace analyzeResumeText with currentTargetRole
code = code.replace('analyzeResumeText(pdfText, selectedJobRole || "Software Developer");', 'analyzeResumeText(pdfText, currentTargetRole);')
code = code.replace("targetRole: selectedJobRole || \"Software Developer\"", "targetRole: currentTargetRole")
code = code.replace("Evaluating skills against ''", "Evaluating skills against ''")
code = code.replace("Analyzing CV with Local AI ()", "Analyzing CV with Local AI ()")

# Add debug logging for skipping
replacement_attachments = '''          if (!email.attachments || email.attachments.length === 0) {
            console.warn(Skipping  because it has no PDF attachments.);
            continue;
          }'''
code = code.replace('          if (!email.attachments || email.attachments.length === 0) {\n            continue; // Skip emails without PDFs\n          }', replacement_attachments)

with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Added debug logs and fixed currentTargetRole usage.")
