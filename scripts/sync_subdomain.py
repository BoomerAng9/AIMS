import paramiko
import os

host = "31.97.133.29"
username = "root"
password = "2F)a'1o?&))UZm#H#fCw"
site_dir = r"c:\Users\rishj\OneDrive\Desktop\A.I.M.S\scripts\myclaw-site"

def upload_dir(sftp, local_dir, remote_dir):
    """Recursively upload a directory."""
    try:
        sftp.mkdir(remote_dir)
    except:
        pass
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = f"{remote_dir}/{item}"
        if os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)
        else:
            sftp.put(local_path, remote_path)
            print(f"  Uploaded: {remote_path}")

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=username, password=password)

    sftp = ssh.open_sftp()
    upload_dir(sftp, site_dir, "/docker/myclaw")
    sftp.close()

    cmd = """
cd /docker/myclaw
docker compose down
docker compose build --no-cache
docker compose up -d
echo "--- Status ---"
docker ps | grep myclaw
"""
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode("utf-8", "ignore"))
    err = stderr.read().decode("utf-8", "ignore")
    if err:
        print("[STDERR]", err[-400:])
    ssh.close()
    print("Done!")

except Exception as e:
    print(f"Error: {e}")
