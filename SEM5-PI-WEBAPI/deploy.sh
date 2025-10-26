#!/bin/bash
set -e 

PROJECT_NAME="SEM5-PI-WEBAPI"
VM_USER="root"
VM_PATH="/var/www/sem5_api"
RUNTIME="linux-x64"
NGINX_SERVER="10.9.23.188"

# Define servers
SERVER_1="10.9.21.87"
SERVER_2="10.9.23.188"
SERVER_3="10.9.23.173"
SERVER_4="10.9.23.147" 

# Check if argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <server_number|all>"
    echo ""
    echo "Available servers:"
    echo "  1 - $SERVER_1"
    echo "  2 - $SERVER_2"
    echo "  3 - $SERVER_3"
    echo "  4 - $SERVER_4"  
    echo "  all - Deploy to all servers"
    exit 1
fi

# Determine which servers to deploy
DEPLOY_TO=()

if [ "$1" == "all" ]; then
    DEPLOY_TO=("$SERVER_1" "$SERVER_2" "$SERVER_3" "$SERVER_4")  # ← ADICIONA $SERVER_4
    echo "Deploying to ALL servers..."
elif [ "$1" == "1" ]; then
    DEPLOY_TO=("$SERVER_1")
    echo "Deploying to server 1 ($SERVER_1)..."
elif [ "$1" == "2" ]; then
    DEPLOY_TO=("$SERVER_2")
    echo "Deploying to server 2 ($SERVER_2)..."
elif [ "$1" == "3" ]; then
    DEPLOY_TO=("$SERVER_3")
    echo "Deploying to server 3 ($SERVER_3)..."
elif [ "$1" == "4" ]; then 
    DEPLOY_TO=("$SERVER_4")
    echo "Deploying to server 4 ($SERVER_4)..."
else
    echo "Error: Invalid server number. Use 1, 2, 3, 4, or 'all'"  # ← ATUALIZA
    exit 1
fi

# Check if deploying to Nginx server - need to stop Guardian
STOP_GUARDIAN=false
for VM_HOST in "${DEPLOY_TO[@]}"; do
    if [ "$VM_HOST" == "$NGINX_SERVER" ]; then
        STOP_GUARDIAN=true
        break
    fi
done

# Stop Guardian if deploying to Nginx server
if [ "$STOP_GUARDIAN" = true ]; then
    echo ""
    echo "Stopping API Guardian on Nginx server..."
    ssh $VM_USER@$NGINX_SERVER "sudo systemctl stop api-guardian" || true
    echo "Guardian stopped"
fi

# Remove old publish folder
echo "Removing old publish folder..."
rm -rf ./publish

echo "Publishing .NET project ($PROJECT_NAME)..."
dotnet publish -c Release -r $RUNTIME --self-contained true -o ./publish

echo "Publication completed! Preparing transfer..."

# Deploy to selected server(s)
for VM_HOST in "${DEPLOY_TO[@]}"; do
    echo ""
    echo "=========================================="
    echo "Deploying to: $VM_HOST"
    echo "=========================================="
    
    echo "   -> Local directory: ./publish"
    echo "   -> Remote destination: $VM_USER@$VM_HOST:$VM_PATH"
    
    # Copy files to VM via SCP
    echo "Transferring files..."
    scp -r ./publish/* $VM_USER@$VM_HOST:$VM_PATH/
    
    # Restart remote server
    echo "Restarting remote server..."
    ssh $VM_USER@$VM_HOST "pkill -f $PROJECT_NAME || true; cd $VM_PATH && nohup ./$PROJECT_NAME --urls http://0.0.0.0:5008 > /dev/null 2>&1 &"
    
    echo "Deploy completed on $VM_HOST"
    echo "   Server available at: http://$VM_HOST:5008/api/"
done

# Restart Guardian if it was stopped
if [ "$STOP_GUARDIAN" = true ]; then
    echo ""
    echo "Waiting for API to stabilize before restarting Guardian..."
    sleep 10  # Give API time to fully start
    
    echo "Restarting API Guardian on Nginx server..."
    ssh $VM_USER@$NGINX_SERVER "sudo systemctl start api-guardian"
    
    echo "Verifying Guardian status..."
    sleep 2
    ssh $VM_USER@$NGINX_SERVER "sudo systemctl status api-guardian --no-pager" || true
    
    echo "Guardian restarted successfully"
fi

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="