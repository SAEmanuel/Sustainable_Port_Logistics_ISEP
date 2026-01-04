
#!/bin/bash

set -e

# ===== Ensure PATH works inside GitHub Runner =====
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$DOTNET_ROOT:$HOME/node/bin:$PATH"

# ===== Ensure SSH works non-interactive =====
export SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR"
alias ssh="ssh $SSH_OPTS"
alias scp="scp $SSH_OPTS"

SERVER="root@10.9.22.226"
GUARDIAN="root@10.9.23.2"
REMOTE_DIR="/opt/backend"

# ==== PROJECT PATHS ====
WEBAPI_PROJECT="./SEM5-PI-WEBAPI"
PLANNING_PROJECT="./SEM5-PI-PlanningScheduling"
OPERATIONS_PROJECT="./sem5-pi-operations_execution"

# ==== LOCAL PUBLISH PATHS ====
WEBAPI_PUBLISH="$WEBAPI_PROJECT/publish"
PLANNING_PUBLISH="$PLANNING_PROJECT/publish"
OPERATIONS_PUBLISH="$OPERATIONS_PROJECT/publish"

# ==== REMOTE TEMP PATHS ====
WEBAPI_REMOTE="$REMOTE_DIR/webapi_new"
PLANNING_REMOTE="$REMOTE_DIR/planning_new"
OPERATIONS_REMOTE="$REMOTE_DIR/operations_new"

echo "======================="
echo "BACKEND DEPLOY STARTED"
echo "======================="

# ---------------------------------------------------------
echo "Disabling monitoring to avoid alert spam..."
# ---------------------------------------------------------
ssh $GUARDIAN << EOF
systemctl stop backend-monitor
systemctl stop nginx-monitor 2>/dev/null
systemctl stop frontend1-monitor 2>/dev/null
systemctl stop frontend2-monitor 2>/dev/null
EOF

# ---------------------------------------------------------
echo "Cleaning previous local publish folders..."
# ---------------------------------------------------------
rm -rf "$WEBAPI_PUBLISH" "$PLANNING_PUBLISH" "$OPERATIONS_PUBLISH"

# ---------------------------------------------------------
echo "Publishing WebAPI..."
# ---------------------------------------------------------
cd "$WEBAPI_PROJECT" || exit 1
dotnet publish -c Release -o publish || { echo "❌ WEBAPI BUILD FAILED"; exit 1; }
cd - > /dev/null

# ---------------------------------------------------------
echo "Publishing PlanningScheduling..."
# ---------------------------------------------------------
cd "$PLANNING_PROJECT" || exit 1
dotnet publish -c Release -o publish || { echo "❌ PLANNING BUILD FAILED"; exit 1; }
cd - > /dev/null

# ---------------------------------------------------------
echo "Building OperationsExecution..."
# ---------------------------------------------------------
cd "$OPERATIONS_PROJECT" || exit 1

rm -rf publish dist
mkdir publish

npm install || { echo "❌ NPM INSTALL FAILED"; exit 1; }
npm run build || { echo "❌ TYPESCRIPT BUILD FAILED"; exit 1; }

cp package*.json publish/
cp -r dist publish/

cd - > /dev/null

# ---------------------------------------------------------
echo "Stopping backend services on server..."
# ---------------------------------------------------------
ssh $SERVER << EOF
systemctl stop webapi
systemctl stop planning
systemctl stop operations
EOF

# ---------------------------------------------------------
echo "Preparing temporary folders on server..."
# ---------------------------------------------------------
ssh $SERVER << EOF
rm -rf $WEBAPI_REMOTE $PLANNING_REMOTE $OPERATIONS_REMOTE
mkdir -p $WEBAPI_REMOTE $PLANNING_REMOTE $OPERATIONS_REMOTE
EOF

# ---------------------------------------------------------
echo "Uploading builds to server..."
# ---------------------------------------------------------
scp -r "$WEBAPI_PUBLISH"/*      $SERVER:$WEBAPI_REMOTE/
scp -r "$PLANNING_PUBLISH"/*    $SERVER:$PLANNING_REMOTE/
scp -r "$OPERATIONS_PUBLISH"/*  $SERVER:$OPERATIONS_REMOTE/

# ---------------------------------------------------------
echo "Replacing backend live folders..."
# ---------------------------------------------------------
ssh $SERVER << EOF
rm -rf $REMOTE_DIR/sem5-pi-webapi
rm -rf $REMOTE_DIR/sem5-pi-planning_scheduling
rm -rf $REMOTE_DIR/sem5-pi-operations_execution

mv $WEBAPI_REMOTE       $REMOTE_DIR/sem5-pi-webapi
mv $PLANNING_REMOTE     $REMOTE_DIR/sem5-pi-planning_scheduling
mv $OPERATIONS_REMOTE   $REMOTE_DIR/sem5-pi-operations_execution
EOF

# ---------------------------------------------------------
echo "Uploading .env.production..."
# ---------------------------------------------------------
LOCAL_ENV="$OPERATIONS_PROJECT/.env.production"
REMOTE_ENV="$REMOTE_DIR/sem5-pi-operations_execution/.env.production"

ssh $SERVER "rm -f $REMOTE_ENV"
scp "$LOCAL_ENV" "$SERVER:$REMOTE_ENV"
ssh $SERVER "chmod 600 $REMOTE_ENV"

# ---------------------------------------------------------
echo "Installing Node.js production dependencies..."
# ---------------------------------------------------------
ssh $SERVER << EOF
cd $REMOTE_DIR/sem5-pi-operations_execution
npm install --production
EOF

# ---------------------------------------------------------
echo "Starting backend services..."
# ---------------------------------------------------------
ssh $SERVER << EOF
systemctl start webapi
systemctl start planning
systemctl start operations
sleep 2
echo "---- SERVICE STATUS ----"
systemctl status webapi --no-pager
systemctl status planning --no-pager
systemctl status operations --no-pager
EOF

# ---------------------------------------------------------
echo "Re-enabling monitoring..."
# ---------------------------------------------------------
ssh $GUARDIAN << EOF
systemctl start backend-monitor
systemctl start nginx-monitor 2>/dev/null
systemctl start frontend1-monitor 2>/dev/null
systemctl start frontend2-monitor 2>/dev/null
EOF

echo "=============================="
echo "DEPLOY COMPLETED SUCCESSFULLY"
echo "=============================="