#!/bin/bash

HTTP_DIR="./http"
NGINX_URL="http://10.9.23.188"
LOCAL_URL="http://localhost:5008"

# Check if argument provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <nginx|local>"
    echo ""
    echo "Options:"
    echo "  nginx - Use Nginx Load Balancer ($NGINX_URL)"
    echo "  local - Use local development ($LOCAL_URL)"
    exit 1
fi

# Determine which URL to use
if [ "$1" == "nginx" ]; then
    TARGET_URL="$NGINX_URL"
    echo "Updating all .http files to use Nginx Load Balancer..."
elif [ "$1" == "local" ]; then
    TARGET_URL="$LOCAL_URL"
    echo "Updating all .http files to use local development..."
else
    echo "Error: Invalid option. Use 'nginx' or 'local'"
    exit 1
fi

if [ -d "$HTTP_DIR" ]; then
    for file in "$HTTP_DIR"/*.http; do
        if [ -f "$file" ]; then
            if grep -q "^@portURL" "$file"; then
                sed -i '' "s|^@portURL.*|@portURL = $TARGET_URL|" "$file"
                echo "  ✓ Updated: $(basename "$file")"
            else
                echo -e "@portURL = $TARGET_URL\n$(cat "$file")" > "$file"
                echo "  ✓ Added to: $(basename "$file")"
            fi
        fi
    done
    echo "All .http files now point to: $TARGET_URL"
else
    echo "Directory $HTTP_DIR not found!"
fi