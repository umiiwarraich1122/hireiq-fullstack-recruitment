import re

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Fix the broken fetch lines
    code = code.replace('\/api/send-whatsapp",', '\\/api/send-whatsapp\,')
    
    code = code.replace('\/api/chat-agent",', '\\/api/chat-agent\,')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

update_file('d:/Internship/HR Project/hireiq/frontend/src/components/NovaChatbot.jsx')
