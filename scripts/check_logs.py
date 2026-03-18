import paramiko

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)

    cmd = "docker logs traefik-traefik-1 --tail 50"
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode("utf-8", "ignore"))
    print(stderr.read().decode("utf-8", "ignore"))
    ssh.close()

except Exception as e:
    print(f"Error: {e}")
