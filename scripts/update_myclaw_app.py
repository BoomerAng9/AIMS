import paramiko
import os

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"
site_dir = r"c:\Users\rishj\OneDrive\Desktop\A.I.M.S\scripts\myclaw-site"

foai_compose = """services:
  foai-proxy:
    image: traefik/whoami
    restart: unless-stopped
    labels:
      - traefik.enable=true
      
      # foai.cloud root (keeps whatever this was pointing to)
      - traefik.http.routers.foai-root.rule=Host(`foai.cloud`) || Host(`www.foai.cloud`)
      - traefik.http.routers.foai-root.entrypoints=websecure
      - traefik.http.routers.foai-root.tls.certresolver=letsencrypt
      - traefik.http.routers.foai-root.service=openclaw-svc
      
      # app.myclaw.foai.cloud -> true SSO into OpenClaw interface
      - traefik.http.routers.myclaw-app.rule=Host(`app.myclaw.foai.cloud`)
      - traefik.http.routers.myclaw-app.entrypoints=websecure
      - traefik.http.routers.myclaw-app.tls.certresolver=letsencrypt
      - traefik.http.routers.myclaw-app.service=openclaw-svc

      # Services
      - traefik.http.services.openclaw-svc.loadbalancer.server.url=http://127.0.0.1:49920
    network_mode: host
"""

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)

    sftp = ssh.open_sftp()
    
    # Upload updated landing page to the landing page container
    sftp.put(os.path.join(site_dir, "index.html"), "/docker/myclaw/index.html")
    sftp.put(os.path.join(site_dir, "hero-image.jpg"), "/docker/myclaw/hero-image.jpg")
    
    new_dockerfile = """FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY hero-image.jpg /usr/share/nginx/html/hero-image.jpg
EXPOSE 80
"""
    with sftp.open('/docker/myclaw/Dockerfile', 'w') as f:
        f.write(new_dockerfile)
    print("Updated Dockerfile")
    
    # Update foai-proxy docker-compose
    with sftp.open('/docker/foai-proxy/docker-compose.yml', 'w') as f:
        f.write(foai_compose)
    print("Updated Traefik proxy compose")

    cmd = """
# Update the site container
cd /docker/myclaw
docker compose build --no-cache
docker compose up -d

# Restart the proxy to mount app.myclaw domain
cd /docker/foai-proxy
docker compose down
docker compose up -d

echo "All updated!"
"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode("utf-8", "ignore"))
    err = stderr.read().decode("utf-8", "ignore")
    if err:
        print("[STDERR]", err[-400:])
    ssh.close()
    print("Done! Ready to test.")

except Exception as e:
    print(f"Error: {e}")
