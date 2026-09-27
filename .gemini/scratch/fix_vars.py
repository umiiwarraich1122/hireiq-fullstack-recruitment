import re
with open('frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(
    r'const processedEmails = new Set\(\);',
    'const processedEmails = new Set();\n        let skippedNoPdf = 0;\n        let skippedDuplicate = 0;',
    code
)

with open('frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Added variables.")
