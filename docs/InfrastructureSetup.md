# Infrastructure Setup Report - Load Balancer and High Availability

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Components](#components)
4. [Implementation Details](#implementation-details)
5. [Automation Scripts](#automation-scripts)
6. [Essential Commands](#essential-commands)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This document describes the infrastructure implemented to ensure **high availability** and **automatic failover** for
the SEM5-PI-WEBAPI application through:

- **Load Balancer (Nginx)** - Distributes traffic across multiple backend servers
- **API Guardian** - Self-healing system that starts the API locally in case of total backend failure
- **Automated Deployment** - Scripts for rapid deployment across multiple servers

### Benefits

**High Availability** - If one server fails, others automatically take over  
**Automatic Failover** - No manual intervention required  
**Self-Healing** - Emergency backup API starts automatically  
**Zero Configuration for Clients** - Single endpoint for all requests  
**Scalability** - Easy to add more backend servers

---

## System Architecture

### Current Infrastructure

```
Client Applications
        |
        v
Nginx Load Balancer (10.9.23.188:80)
        |
        +---> Backend 1 (10.9.21.87:5008)
        |
        +---> Backend 2 (10.9.23.173:5008) [backup]
        |
        +---> Backend 3 (10.9.23.147:5008) [backup]
        |
        +---> Backend 4 (10.9.23.188:5008) [backup]
```

### Traffic Flow

1. Client makes HTTP request to `http://10.9.23.188/api/*`
2. Nginx receives request on port 80
3. Nginx forwards to primary backend (10.9.21.87:5008)
4. If primary fails, Nginx automatically tries backup servers
5. If all backends fail, API Guardian starts local instance

---

## Components

### 1. Nginx Load Balancer

**Server:** 10.9.23.188  
**Port:** 80  
**Configuration:** `/etc/nginx/conf.d/api-loadbalancer.conf`

**Features:**

- Health checks every request
- Automatic failover to backup servers
- Connection timeout: 5 seconds
- Max failures before marking server down: 2
- Failure timeout: 10 seconds

### 2. API Guardian Service

**Server:** 10.9.23.188  
**Script:** `/usr/local/bin/api-guardian.sh`  
**Service:** `api-guardian.service`  
**Log:** `/var/log/api-guardian.log`

**Features:**

- Monitors all backends every 30 seconds
- Automatically starts local API if all backends are down
- Logs all actions for audit
- Runs as systemd service (auto-start on boot)

### 3. Backend Servers

| Server   | IP          | Port | Role                |
|----------|-------------|------|---------------------|
| Server 1 | 10.9.21.87  | 5008 | Primary             |
| Server 2 | 10.9.23.173 | 5008 | Backup              |
| Server 3 | 10.9.23.147 | 5008 | Backup              |
| Server 2 | 10.9.23.188 | 5008 | Backup + Nginx host |

---

## Implementation Details

### Nginx Configuration

**File:** `/etc/nginx/conf.d/api-loadbalancer.conf`

```nginx
upstream sem5_backend {
    server 10.9.21.87:5008 max_fails=2 fail_timeout=10s;
    server 10.9.23.173:5008 max_fails=2 fail_timeout=10s backup;
    server 10.9.23.147:5008 max_fails=2 fail_timeout=10s backup;
    server 10.9.23.188:5008 max_fails=2 fail_timeout=10s backup;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://sem5_backend;
        proxy_next_upstream error timeout http_500 http_502 http_503 http_504;
        proxy_connect_timeout 5s;


        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

```

### API Guardian Script

**File:** `/usr/local/bin/api-guardian.sh`

Key functionality:

- Checks all backends via HTTP health check
- If all backends are down, starts local API
- Logs all actions to `/var/log/api-guardian.log`
- Runs continuously as systemd service

### Systemd Service Configuration

**File:** `/etc/systemd/system/api-guardian.service`

```ini
[Unit]
Description=API Guardian - Auto-recovery service
After=network.target nginx.service

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/api-guardian.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## Automation Scripts

### 1. Deployment Script (`deploy.sh`)

Automates deployment to one or all servers.

**Usage:**

```bash
./deploy.sh 1      # Deploy to server 1 only
./deploy.sh 2      # Deploy to server 2 only
./deploy.sh 3      # Deploy to server 3 only
./deploy.sh 4      # Deploy to server 3 only
./deploy.sh all    # Deploy to all servers
```

**What it does:**

1. Removes old publish folder
2. Publishes .NET project for linux-x64
3. Transfers files via SCP to selected server(s)
4. Restarts the API on remote server(s)

### 2. Environment Switcher (`switch-env.sh`)

Updates all `.http` files to point to either Nginx or localhost.

**Usage:**

```bash
./switch-env.sh nginx   # Point to Nginx load balancer (production)
./switch-env.sh local   # Point to localhost (development)
```

**What it does:**

- Scans all `.http` files in `./http` directory
- Updates `@portURL` variable to selected environment
- Maintains consistent API endpoint across all request files

---

## Essential Commands

### Nginx Management

```bash
# Check Nginx status
sudo systemctl status nginx

# Start Nginx
sudo systemctl start nginx

# Stop Nginx
sudo systemctl stop nginx

# Restart Nginx
sudo systemctl restart nginx

# Test configuration without restarting
sudo nginx -t

# View full configuration
sudo nginx -T

# View configuration for load balancer
sudo nginx -T | grep -A 20 'upstream sem5_backend'
```

### API Guardian Management

```bash
# Check API Guardian status
sudo systemctl status api-guardian

# Start API Guardian
sudo systemctl start api-guardian

# Stop API Guardian
sudo systemctl stop api-guardian

# Restart API Guardian
sudo systemctl restart api-guardian

# View real-time logs
tail -f /var/log/api-guardian.log

# View last 50 log entries
tail -50 /var/log/api-guardian.log

# Enable auto-start on boot
sudo systemctl enable api-guardian

# Disable auto-start on boot
sudo systemctl disable api-guardian
```

### Backend API Management

```bash
# Check if API is running on a server
ssh root@10.9.21.87 "ps aux | grep SEM5-PI-WEBAPI"

# Start API manually on a server
ssh root@10.9.21.87 "cd /var/www/sem5_api && nohup ./SEM5-PI-WEBAPI --urls http://0.0.0.0:5008 > /dev/null 2>&1 &"

# Stop API on a server
ssh root@10.9.21.87 "pkill -f SEM5-PI-WEBAPI"

# Stop API on all servers
ssh root@10.9.21.87 "pkill -f SEM5-PI-WEBAPI"
ssh root@10.9.23.188 "pkill -f SEM5-PI-WEBAPI"
ssh root@10.9.23.173 "pkill -f SEM5-PI-WEBAPI"
ssh root@10.9.23.147 "pkill -f SEM5-PI-WEBAPI"
```

### Deployment Commands

```bash
# Deploy to specific server
./deploy.sh 1

# Deploy to all servers
./deploy.sh all

# Switch HTTP files to production (Nginx)
./switch-env.sh nginx

# Switch HTTP files to local development
./switch-env.sh local
```

### Testing Commands

```bash
# Test API directly on backend (bypassing Nginx)
curl http://10.9.21.87:5008/api/StaffMembers
curl http://10.9.23.188:5008/api/StaffMembers
curl http://10.9.23.173:5008/api/StaffMembers
curl http://10.9.23.147:5008/api/StaffMembers

# Test API through Nginx (production endpoint)
curl http://10.9.23.188/api/StaffMembers

# Test with verbose output
curl -v http://10.9.23.188/api/StaffMembers

# Check response time
curl -w "@-" -o /dev/null -s http://10.9.23.188/api/StaffMembers <<'EOF'
    time_namelookup:  %{time_namelookup}\n
       time_connect:  %{time_connect}\n
    time_appconnect:  %{time_appconnect}\n
      time_redirect:  %{time_redirect}\n
   time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
         time_total:  %{time_total}\n
EOF
```

---

## Troubleshooting

### Issue: "502 Bad Gateway" from Nginx

**Symptom:** Nginx returns 502 error.

**Possible Causes:**

1. All backend servers are down
2. Backend servers are not responding on port 5008
3. Firewall blocking connections

**Solution:**

```bash
# Check if any backend is running
ssh root@10.9.21.87 "ps aux | grep SEM5-PI-WEBAPI"
ssh root@10.9.23.188 "ps aux | grep SEM5-PI-WEBAPI"
ssh root@10.9.23.173 "ps aux | grep SEM5-PI-WEBAPI"

# Test backends directly
curl http://10.9.21.87:5008/api/StaffMembers
curl http://10.9.23.188:5008/api/StaffMembers
curl http://10.9.23.173:5008/api/StaffMembers

# If none respond, deploy
./deploy.sh all
```

### Issue: "404 Not Found" from Nginx

**Symptom:** Nginx returns 404 error.

**Possible Causes:**

1. Multiple server blocks conflicting
2. Wrong Nginx configuration

**Solution:**

```bash
# Check for conflicting configurations
ssh root@10.9.23.188 "sudo nginx -T | grep 'listen 80'"

# Should only show one entry
# If multiple, remove default config
ssh root@10.9.23.188 "sudo rm /etc/nginx/sites-enabled/default"
ssh root@10.9.23.188 "sudo systemctl restart nginx"
```

### Issue: API Guardian Not Starting API

**Symptom:** Guardian logs show "Failed to start local API".

**Possible Causes:**

1. Binary not found at expected path
2. Missing dependencies (libicu)
3. Permission issues

**Solution:**

```bash
# Verify binary exists
ssh root@10.9.23.188 "ls -la /var/www/sem5_api/SEM5-PI-WEBAPI"

# Install dependencies
ssh root@10.9.23.188 "sudo apt install -y libicu-dev"

# Check permissions
ssh root@10.9.23.188 "chmod +x /var/www/sem5_api/SEM5-PI-WEBAPI"

# Test manual start
ssh root@10.9.23.188 "cd /var/www/sem5_api && ./SEM5-PI-WEBAPI --urls http://0.0.0.0:5008"

# Check API logs
ssh root@10.9.23.188 "cat /var/log/sem5-api.log"
```

### Issue: Cannot SSH to Servers

**Symptom:** SSH connection refused or timeout.

**Solution:**

```bash
# Verify server is reachable
ping 10.9.21.87

# Check SSH service
ssh root@10.9.21.87 "systemctl status sshd"

# Check SSH port (default 22)
telnet 10.9.21.87 22
```

### Issue: Deployment Script Fails

**Symptom:** `deploy.sh` exits with error.

**Solution:**

```bash
# Verify dotnet is installed
dotnet --version

# Verify SSH keys are configured
ssh root@10.9.21.87 "echo 'SSH works'"

# Check SCP permissions
scp test.txt root@10.9.21.87:/tmp/

# Run deployment with verbose mode
bash -x ./deploy.sh 1
```

---

## Monitoring and Logs

### Log Locations

| Component       | Log Location                | Purpose           |
|-----------------|-----------------------------|-------------------|
| Nginx Access    | `/var/log/nginx/access.log` | All HTTP requests |
| Nginx Error     | `/var/log/nginx/error.log`  | Nginx errors      |
| API Guardian    | `/var/log/api-guardian.log` | Guardian activity |
| API Application | `/var/log/sem5-api.log`     | Application logs  |

### Monitoring Commands

```bash
# Monitor Nginx access in real-time
ssh root@10.9.23.188 "tail -f /var/log/nginx/access.log"

# Monitor Nginx errors
ssh root@10.9.23.188 "tail -f /var/log/nginx/error.log"

# Monitor API Guardian
ssh root@10.9.23.188 "tail -f /var/log/api-guardian.log"

# Check system resources on Nginx server
ssh root@10.9.23.188 "htop"

# Check disk space
ssh root@10.9.23.188 "df -h"

# Check memory usage
ssh root@10.9.23.188 "free -h"
```

---

## References

### Documentation

- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Nginx Upstream Module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

### Tools

- **Nginx:** Web server and reverse proxy
- **Systemd:** Service management
- **Bash:** Automation scripting
- **.NET 9:** Application runtime

---

## Summary

### Current Setup

- Load balancer distributing traffic across 3 backend servers
- Automatic failover between backends
- Self-healing with API Guardian
- Automated deployment scripts
- Environment switching for development/production

### Known Limitations

> - ️Nginx server is a Single Point of Failure
> - No centralized logging or monitoring
> - ️No rate limiting or caching

### Recommended Next Steps

1. **Short-term:** Monitor logs and validate system stability
2. **Medium-term:** Implement Keepalived for Nginx HA
3. **Long-term:** Add monitoring, alerting, and consider Kubernetes migration

