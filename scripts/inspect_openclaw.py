import paramiko

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)

    cmd = """
echo "=== Check OpenClaw Env ==="
docker exec openclaw-sop5-openclaw-1 env | grep -i url

echo ""
echo "=== Check OpenClaw Javascript for Hardcoded URLs ==="
curl -s http://127.0.0.1:49920/ | grep -o -E 'src="[^"]+"' | while read -r line; do
  path=$(echo "$line" | cut -d '"' -f 2)
  echo "Checking $path..."
  curl -s "http://127.0.0.1:49920$path" | grep -i "hstgr" | head -c 200
done
"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode("utf-8", "ignore"))
    ssh.close()

except Exception as e:
    print(f"Error: {e}")
