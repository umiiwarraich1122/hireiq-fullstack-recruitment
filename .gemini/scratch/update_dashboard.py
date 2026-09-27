with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update runAIScreening definition
old_def = 'const runAIScreening = async () => {'
new_def = 'const runAIScreening = async (overrideRole) => {'
code = code.replace(old_def, new_def)

# 2. Update currentTargetRole logic inside runAIScreening
old_role_logic = 'const currentTargetRole = selectedJobRole || "Software Developer";'
new_role_logic = 'const currentTargetRole = (typeof overrideRole === "string" ? overrideRole : selectedJobRole) || "Software Developer";'
code = code.replace(old_role_logic, new_role_logic)

# 3. Update onChange of the select
old_onchange = 'onChange={(e) => setSelectedJobRole(e.target.value)}'
new_onchange = '''onChange={(e) => {
                    const newRole = e.target.value;
                    setSelectedJobRole(newRole);
                    setScanMessage(null);
                    setScannedCandidates([]);
                    if (emails.length > 0) {
                      setTimeout(() => runAIScreening(newRole), 0);
                    }
                  }}'''
code = code.replace(old_onchange, new_onchange)

with open('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated runAIScreening and dropdown behavior.")
