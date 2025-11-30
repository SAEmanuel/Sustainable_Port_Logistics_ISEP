#!/bin/bash

SERVER="root@10.9.22.226"
REMOTE_DIR="/opt/backend"

WEBAPI_PROJECT="./SEM5-PI-WEBAPI"
PLANNING_PROJECT="./SEM5-PI-PlanningScheduling"

WEBAPI_PUBLISH="$WEBAPI_PROJECT/publish"
PLANNING_PUBLISH="$PLANNING_PROJECT/publish"

WEBAPI_REMOTE="$REMOTE_DIR/webapi_new"
PLANNING_REMOTE="$REMOTE_DIR/planning_new"


echo "BACKEND DEPLOY STARTED"
echo "======================="


# ---- CLEAN OLD PUBLISH ----
echo "Cleaning old publish folders..."

rm -rf "$WEBAPI_PUBLISH"
rm -rf "$PLANNING_PUBLISH"


# ---- BUILD & PUBLISH ----
echo "Publishing WebAPI..."
cd "$WEBAPI_PROJECT" || exit 1

dotnet publish -c Release -o publish || { echo "WEBAPI BUILD FAILED"; exit 1; }

cd - > /dev/null


echo "Publishing PlanningScheduling..."
cd "$PLANNING_PROJECT" || exit 1

dotnet publish -c Release -o publish || { echo "PLANNING BUILD FAILED"; exit 1; }

cd - > /dev/null


# ---- STOP SERVICES ----
echo "Stopping services..."
ssh $SERVER << EOF
systemctl stop webapi
systemctl stop planning
EOF


# ---- PREPARE REMOTE TARGET ----
echo "Cleaning temp folders on server..."
ssh $SERVER << EOF
rm -rf $WEBAPI_REMOTE
rm -rf $PLANNING_REMOTE
mkdir -p $WEBAPI_REMOTE
mkdir -p $PLANNING_REMOTE
EOF


# ---- UPLOAD ----
echo "Uploading builds..."
scp -r "$WEBAPI_PUBLISH"/* $SERVER:$WEBAPI_REMOTE/
scp -r "$PLANNING_PUBLISH"/* $SERVER:$PLANNING_REMOTE/


# ---- ACTIVATE NEW VERSION ----
echo "Replacing live versions..."
ssh $SERVER << EOF

rm -rf $REMOTE_DIR/sem5-pi-webapi
rm -rf $REMOTE_DIR/sem5-pi-planning_scheduling

mv $WEBAPI_REMOTE $REMOTE_DIR/sem5-pi-webapi
mv $PLANNING_REMOTE $REMOTE_DIR/sem5-pi-planning_scheduling

EOF


# ---- START ----
echo "Starting services..."
ssh $SERVER << EOF

systemctl start webapi
systemctl start planning

sleep 2

systemctl status webapi --no-pager
systemctl status planning --no-pager

EOF


echo "======================="
echo "DEPLOY COMPLETED SUCCESSFULLY"