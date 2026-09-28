import re

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    code = code.replace('"http://127.0.0.1:8000', '${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}')
    # Because of string template replacement, we need to make sure we don't double quote:
    # 'await fetch("http://127.0.0.1:8000/api/..."' -> 'await fetch(${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/...'
    
    # Actually regex is safer:
    code = re.sub(r'\"http://127\.0\.0\.1:8000([^\"]+)\"', r'${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}\1', code)
    code = re.sub(r'\"http://localhost:8000([^\"]+)\"', r'${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}\1', code)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

update_file('d:/Internship/HR Project/hireiq/frontend/src/components/NovaChatbot.jsx')
update_file('d:/Internship/HR Project/hireiq/frontend/src/pages/Dashboard.jsx')
