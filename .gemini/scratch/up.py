with open('backend/main.py', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''
    try:
        history_text = "\\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in req.history[-6:]])
        user_prompt = f"Chat History:\\n{history_text}\\n\\nCurrent User Message: {req.message}"
        
        system_prompt = f"""You are Nova, an AI HR Coordinator. You process HR requests and execute actions.
'''

code = code.replace('''    try:
        
        system_prompt = f"""You are Nova, an AI HR Coordinator. You process HR requests and execute actions.''', replacement)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(code)
