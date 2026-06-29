#!/usr/bin/env python3
import paramiko
import sys

host = "148.230.79.103"
user = "root"
password = ",9D0YFv7T8fuuWu9KAnf"

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=10)
    
    # Check for logo/uploads directory
    stdin, stdout, stderr = ssh.exec_command("ls -la /var/www/osmech.com.br/ | grep -i 'logo\|upload\|assets'")
    print("=== /var/www/osmech.com.br directory ===")
    print(stdout.read().decode())
    
    # Check uploads directory
    stdin, stdout, stderr = ssh.exec_command("find /app/uploads -name '*.png' -o -name '*.jpg' -o -name '*.webp' 2>/dev/null | head -20")
    print("\n=== Found logos/uploads ===")
    print(stdout.read().decode())
    
    # Check nginx error logs for 401/404 on uploads
    stdin, stdout, stderr = ssh.exec_command("docker exec osmech-nginx tail -100 /var/log/nginx/error.log | grep -i 'uploads\|logo' || echo 'No errors found'")
    print("\n=== Nginx errors on uploads/logo ===")
    print(stdout.read().decode())
    
    # Check backend logs for 401 errors
    stdin, stdout, stderr = ssh.exec_command("docker logs osmech-backend 2>&1 | tail -50 | grep -i '401\|unauthorized\|uploads' || echo 'No auth errors found'")
    print("\n=== Backend auth/uploads errors ===")
    print(stdout.read().decode())
    
    ssh.close()
    print("\n✅ Connection successful!")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    sys.exit(1)
