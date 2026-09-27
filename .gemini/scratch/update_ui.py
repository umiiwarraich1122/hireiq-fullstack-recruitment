import re

dashboard_path = 'frontend/src/pages/Dashboard.jsx'
with open(dashboard_path, 'r', encoding='utf-8') as f:
    dashboard_content = f.read()

dashboard_content = dashboard_content.replace(
    'user={user}',
    'user={user}\n        session={session}\n        syncGmail={lambda: syncGmailCVs(session?.provider_token)}'
)
# Wait, lambda syntax in python is wrong. Let's just do a string replacement.
dashboard_content = dashboard_content.replace(
    'user={user}',
    'user={user}\n        session={session}\n        syncGmailCVs={syncGmailCVs}'
)
with open(dashboard_path, 'w', encoding='utf-8') as f:
    f.write(dashboard_content)

print("Dashboard.jsx updated")
