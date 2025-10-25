#!/bin/bash
set -e 

PROJECT_NAME="SEM5_PI_WEBAPI"
VM_USER="root"
VM_PATH="/var/www/sem5_api"
RUNTIME="linux-x64"

# Define servers
SERVER_1="10.9.21.87"
SERVER_2="10.9.23.188"
SERVER_3="10.9.23.173"

# Check if argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <server_number|all>"
    echo ""
    echo "Available servers:"
    echo "  1 - $SERVER_1"
    echo "  2 - $SERVER_2"
    echo "  3 - $SERVER_3"
    echo "  all - Deploy to all servers"
    exit 1
fi

# Determine which servers to deploy
DEPLOY_TO=()

if [ "$1" == "all" ]; then
    DEPLOY_TO=("$SERVER_1" "$SERVER_2" "$SERVER_3")
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
else
    echo "Error: Invalid server number. Use 1, 2, 3, or 'all'"
    exit 1
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
    ssh $VM_USER@$VM_HOST "pkill -f $PROJECT_NAME.dll || true; cd $VM_PATH && nohup ./SEM5_PI_WEBAPI > /dev/null 2>&1 &"
    
    echo "✓ Deploy completed on $VM_HOST"
    echo "   Server available at: http://$VM_HOST:5008/api/"
done

echo ""
echo "=========================================="
echo "Deployment completed successfully!"
echo "=========================================="