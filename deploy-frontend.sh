#!/bin/bash

set -e
set -o pipefail

# ===== Ensure PATH works inside GitHub Runner =====
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$HOME/node/bin:$PATH"

# ===== SSH non-interactive & safe =====
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR -o RequestTTY=no"
SSH="ssh $SSH_OPTS"
SCP="scp $SSH_OPTS"

SERVERS=(
  "root@10.9.22.90"
  "root@10.9.21.87"
)

WEB_DIR="/var/www/spa"
FRONTEND_DIR="./client-ui"
GUARDIAN="root@10.9.23.2"

echo "=========================="
echo " FRONTEND DEPLOY STARTED"
echo "=========================="

# ---------------------------------------------------------
echo "Disabling monitoring on Guardian VM..."
# ---------------------------------------------------------
$SSH "$GUARDIAN" << EOF
systemctl stop frontend1-monitor 2>/dev/null
systemctl stop frontend2-monitor 2>/dev/null
systemctl stop nginx-monitor 2>/dev/null
EOF

# ---------------------------------------------------------
echo "Building frontend..."
# ---------------------------------------------------------
cd "$FRONTEND_DIR"

npm install
npm run build

cd - > /dev/null

# ---------------------------------------------------------
echo "Deploying to frontend servers..."
# ---------------------------------------------------------
for SERVER in "${SERVERS[@]}"; do
  echo "-----------------------------------------"
  echo " Deploying to $SERVER"
  echo "-----------------------------------------"

  $SSH "$SERVER" "rm -rf $WEB_DIR/* && mkdir -p $WEB_DIR"

  $SCP -r client-ui/dist/* "$SERVER:$WEB_DIR/"

  $SSH "$SERVER" "nginx -t && systemctl reload nginx"

  echo "Deployment finished on $SERVER"
done

# ---------------------------------------------------------
echo "Re-enabling monitoring on Guardian VM..."
# ---------------------------------------------------------
$SSH "$GUARDIAN" << EOF
systemctl start frontend1-monitor 2>/dev/null
systemctl start frontend2-monitor 2>/dev/null
systemctl start nginx-monitor 2>/dev/null
EOF

echo "==============================="
echo " FRONTEND DEPLOY SUCCESSFUL"
echo "==============================="