#!/bin/bash

SERVERS=(
  "root@10.9.22.90"
  "root@10.9.21.87"
)

WEB_DIR="/var/www/spa"
FRONTEND_DIR="./client-ui"

echo "FRONTEND DEPLOY STARTED"


cd "$FRONTEND_DIR" || { 
  echo "Frontend directory not found: $FRONTEND_DIR"
  exit 1
}

if [ ! -f package.json ]; then
  echo "package.json not found. Are you inside the frontend folder?"
  exit 1
fi

echo "Building frontend..."
npm run build || { 
  echo "BUILD FAILED"
  exit 1
}

echo "Build completed successfully."

for SERVER in "${SERVERS[@]}"; do
  echo "Uploading files to $SERVER..."

  ssh $SERVER "mkdir -p $WEB_DIR"

  scp -r dist/* "$SERVER:$WEB_DIR/" || {
    echo "UPLOAD FAILED on $SERVER"
    exit 1
  }

  echo "Reloading nginx on $SERVER..."
  ssh $SERVER "nginx -t && systemctl reload nginx" || {
    echo "NGINX RELOAD FAILED on $SERVER"
    exit 1
  }

  echo "Deploy completed on $SERVER"
  echo "--------------------------------"
done

echo "FRONTEND DEPLOY COMPLETED SUCCESSFULLY ON ALL SERVERS"