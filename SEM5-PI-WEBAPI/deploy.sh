#!/bin/bash
set -euo pipefail

PROJECT_NAME="SEM5-PI-WEBAPI"
VM_USER="root"
VM_PATH="/var/www/sem5_api"
RUNTIME="linux-x64"
NGINX_SERVER="10.9.23.188"

SERVER_1="10.9.21.87"
SERVER_2="10.9.23.188"
SERVER_3="10.9.23.173"
SERVER_4="10.9.23.147"

if [ $# -lt 1 ]; then
    echo "Usage: $0 <server_number|all> [ssh_options]"
    exit 1
fi

TARGET="$1"
SSH_OPTS="${2:-"-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes"}"

DEPLOY_TO=()
case "$TARGET" in
    all)
        DEPLOY_TO=("$SERVER_1" "$SERVER_3" "$SERVER_4" "$SERVER_2")
        echo "Deploying to all servers (runner last)..."
        ;;
    1) DEPLOY_TO=("$SERVER_1");;
    2) DEPLOY_TO=("$SERVER_2");;
    3) DEPLOY_TO=("$SERVER_3");;
    4) DEPLOY_TO=("$SERVER_4");;
    *) echo "Invalid server number."; exit 1;;
esac

STOP_GUARDIAN=false
for VM_HOST in "${DEPLOY_TO[@]}"; do
    if [ "$VM_HOST" == "$NGINX_SERVER" ]; then
        STOP_GUARDIAN=true
        break
    fi
done

if [ "$STOP_GUARDIAN" = true ]; then
    echo "Stopping API Guardian on Nginx server..."
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl stop api-guardian" || true
    echo "Guardian stopped."
fi

if [ ! -d "./publish" ]; then
    echo "Error: ./publish folder not found!"
    exit 1
fi

echo "Using pre-built publish folder from GitHub Actions."

LOCAL_IP=$(hostname -I | awk '{print $1}')

for VM_HOST in "${DEPLOY_TO[@]}"; do
    echo "Deploying to: $VM_HOST"

    if [ "$VM_HOST" == "$LOCAL_IP" ] || [ "$VM_HOST" == "10.9.23.188" ]; then
        echo "Local self-deployment detected."

        echo "Stopping running instance..."
        pgrep -f "$PROJECT_NAME" | grep -v $$ | xargs -r kill || true
        sleep 2

        echo "Copying files locally..."
        cp -r ./publish/* $VM_PATH/

        echo "Restarting local service..."
        bash $VM_PATH/restart.sh || true

        echo "Restarting API Guardian locally..."
        systemctl stop api-guardian || true
        systemctl start api-guardian || true
        systemctl status api-guardian --no-pager || true

        echo "Local deployment completed."
        continue
    fi

    echo "Stopping running instance..."
    ssh -T $SSH_OPTS $VM_USER@$VM_HOST "pgrep -f $PROJECT_NAME && pkill -f $PROJECT_NAME || echo 'No running instance found'" || true
    sleep 2

    echo "Transferring files..."
    if ! scp -T $SSH_OPTS -r ./publish/* $VM_USER@$VM_HOST:$VM_PATH/; then
        echo "Error: Failed to transfer files to $VM_HOST"
        exit 1
    fi

    echo "Restarting remote service..."
    ssh -T $SSH_OPTS $VM_USER@$VM_HOST "bash $VM_PATH/restart.sh"
    sleep 3

    echo "Deploy completed on $VM_HOST"
done

if [ "$STOP_GUARDIAN" = true ]; then
    echo "Waiting before restarting Guardian..."
    sleep 10
    echo "Restarting API Guardian on Nginx server..."
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl start api-guardian"
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl status api-guardian --no-pager" || true
    echo "Guardian restarted."
fi

echo "Deployment completed successfully."