import paramiko
import os
import re

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"
site_dir = r"c:\Users\rishj\OneDrive\Desktop\A.I.M.S\scripts\myclaw-site"

# 1. Update text locally
index_path = os.path.join(site_dir, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    html = f.read()

html = html.replace("OpenClaw", "NemoClaw")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(html)

# 2. Upload changes including new logo
logo_path = r"C:\Users\rishj\.gemini\antigravity\brain\655ca329-32e2-4d25-9c96-d9e3b7414121\myclaw_logo_v2_1773829102438.png"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)

    sftp = ssh.open_sftp()
     
    # Upload updated html
    sftp.put(index_path, "/docker/myclaw/index.html")
    # Upload new logo
    sftp.put(logo_path, "/docker/myclaw/logo.png")
    sftp.close()

    cmd = """
cd /docker/myclaw
# Update the Dockerfile to include logo again if it wasn't
cat > Dockerfile << 'EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY logo.png /usr/share/nginx/html/logo.png
EXPOSE 80
EOF

docker compose build --no-cache
docker compose up -d

# Restart Traefik to clear the rate limit block and grant SSL
docker restart traefik-traefik-1
"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode("utf-8", "ignore"))

    ssh.close()
    print("Done uploading logo & changing to NemoClaw!")

except Exception as e:
    print(f"Error: {e}")
