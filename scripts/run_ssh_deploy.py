import paramiko

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)
    
    cmd = """
export PATH="/root/.nvm/versions/node/v22.22.1/bin:$PATH"
echo "--- Docker Containers ---"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -E "nemoclaw|openclaw|openshell|NAMES"

echo "\\n--- Sandbox Status ---"
nemoclaw status || true
"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    out = stdout.read().decode('utf-8', 'ignore').encode('ascii', 'ignore').decode('ascii')
    err = stderr.read().decode('utf-8', 'ignore').encode('ascii', 'ignore').decode('ascii')
    
    print(out)
    if err:
        print("[STDERR]", err)
        
    ssh.close()
    
except Exception as e:
    print(f"Error: {e}")
