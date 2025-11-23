#!/bin/bash
set -euo pipefail

PROJECT_NAME="$1"
VM_PATH="$2"
TARGET="$3"
SSH_OPTS="${4:-"-o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes"}"
VM_USER="root"
NGINX_SERVER="10.9.23.188"

SERVER_1="10.9.21.87"
SERVER_2="10.9.23.188"
SERVER_3="10.9.23.173"
SERVER_4="10.9.23.147"

if [ $# -lt 3 ]; then
    echo "Usage: $0 <PROJECT_NAME> <VM_PATH> <server_number|all|nginx> [ssh_options]"
    exit 1
fi

DEPLOY_TO=()
case "$TARGET" in
    all)
        DEPLOY_TO=("$SERVER_1" "$SERVER_3" "$SERVER_4" "$SERVER_2")
        echo "Deploying $PROJECT_NAME to all servers..."
        ;;
    1) DEPLOY_TO=("$SERVER_1");;
    2) DEPLOY_TO=("$SERVER_2");;
    3) DEPLOY_TO=("$SERVER_3");;
    4) DEPLOY_TO=("$SERVER_4");;
    nginx) DEPLOY_TO=("$NGINX_SERVER");;
    *) echo "Invalid server target."; exit 1;;
esac

SERVICE_NAME=""
if [[ "$PROJECT_NAME" == "SEM5-PI-WEBAPI" ]]; then
    SERVICE_NAME="api-guardian"
elif [[ "$PROJECT_NAME" == "SEM5-PI-PlanningScheduling" ]]; then
    SERVICE_NAME="scheduling-guardian"
fi

STOP_GUARDIAN=false
for VM_HOST in "${DEPLOY_TO[@]}"; do
    if [ "$VM_HOST" == "$NGINX_SERVER" ]; then
        STOP_GUARDIAN=true
        break
    fi
done

if [ "$STOP_GUARDIAN" = true ] && [ -n "$SERVICE_NAME" ]; then
    echo "Stopping $SERVICE_NAME on Nginx server..."
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl stop $SERVICE_NAME" || true
    echo "$SERVICE_NAME stopped."
fi

PUBLISH_FOLDER="./$PROJECT_NAME/publish"
if [ "$PROJECT_NAME" == "frontend" ]; then
    PUBLISH_FOLDER="./frontend/publish"
fi

if [ ! -d "$PUBLISH_FOLDER" ]; then
    echo "Error: $PUBLISH_FOLDER folder not found!"
    exit 1
fi

echo "Using pre-built publish folder for $PROJECT_NAME."

LOCAL_IP=$(hostname -I | awk '{print $1}')

for VM_HOST in "${DEPLOY_TO[@]}"; do
    echo "Deploying $PROJECT_NAME to: $VM_HOST"

    if [ "$VM_HOST" == "$LOCAL_IP" ] || [ "$VM_HOST" == "10.9.23.188" ]; then
        echo "Local self-deployment detected."

        if [ "$PROJECT_NAME" != "frontend" ]; then
            echo "Stopping running instance ($PROJECT_NAME)..."
            pgrep -f "$PROJECT_NAME" | grep -v $$ | xargs -r kill || true
            sleep 2
            
            echo "Copying files locally..."
            cp -r $PUBLISH_FOLDER/* $VM_PATH/
            
            echo "Restarting local service..."
            bash $VM_PATH/restart.sh || true 
        
        else
            echo "Copying Frontend files locally..."
            rm -rf $VM_PATH/*
            cp -r $PUBLISH_FOLDER/* $VM_PATH/
        fi
        
        echo "Local deployment completed."
        continue
    fi

    if [ "$PROJECT_NAME" != "frontend" ]; then
        echo "Stopping running instance ($PROJECT_NAME)..."
        ssh -T $SSH_OPTS $VM_USER@$VM_HOST "pgrep -f $PROJECT_NAME && pkill -f $PROJECT_NAME || echo 'No running instance found'" || true
        sleep 2

        echo "Transferring files..."
        if ! scp -T $SSH_OPTS -r $PUBLISH_FOLDER/* $VM_USER@$VM_HOST:$VM_PATH/; then
            echo "Error: Failed to transfer files to $VM_HOST"
            exit 1
        fi

        echo "Restarting remote service..."
        ssh -T $SSH_OPTS $VM_USER@$VM_HOST "bash $VM_PATH/restart.sh"
        sleep 3
    fi

    echo "Deploy completed on $VM_HOST"
done

if [ "$STOP_GUARDIAN" = true ] && [ -n "$SERVICE_NAME" ]; then
    echo "Waiting before restarting Guardian..."
    sleep 10
    echo "Restarting $SERVICE_NAME on Nginx server..."
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl start $SERVICE_NAME"
    ssh -T $SSH_OPTS $VM_USER@$NGINX_SERVER "sudo -n systemctl status $SERVICE_NAME --no-pager" || true
    echo "$SERVICE_NAME restarted."
fi

echo "Deployment completed successfully for $PROJECT_NAME."