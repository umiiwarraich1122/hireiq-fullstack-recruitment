with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Insert the missing variables at the beginning of runAIScreening
code = code.replace('const results = [];\n        const processedEmails = new Set();', 'const results = [];\n        const processedEmails = new Set();\n        let skippedNoPdf = 0;\n        let skippedDuplicate = 0;')

# Now update the final scan message to include them!
old_msg = "setScanMessage({ type: 'success', text: \Scan complete! Processed \ resumes.\ });"
new_msg = "setScanMessage({ type: 'success', text: \Scan complete! Processed \ resumes. (Skipped \ non-PDF, \ duplicates)\ });"

code = code.replace(old_msg, new_msg)

with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed skippedDuplicate undefined error.")
