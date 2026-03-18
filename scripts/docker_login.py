import paramiko
import sys

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)
    
    cmd = "docker login nvcr.io -u '$oauthtoken' -p 'aGFzZDR0bHQwdDhmNDhla2k3N3YwbGw0NjQ6YTFmM2RhYzUtMTJlOS00M2MyLTlmMTgtYTNiMmMyZDNmMjhi' && echo 'Docker login successful'"
    
    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=False)
    
    for line in iter(stdout.readline, ""):
        print(line.encode('ascii', 'ignore').decode('ascii'), end="", flush=True)
        
    for line in iter(stderr.readline, ""):
        print("[STDERR] " + line.encode('ascii', 'ignore').decode('ascii'), end="", flush=True)
        
    exit_status = stdout.channel.recv_exit_status()
    print(f"\nFinal Exit Status: {exit_status}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
