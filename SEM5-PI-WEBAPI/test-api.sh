#!/bin/bash

URLS=(
    "http://10.9.21.87:5008"
    "http://10.9.23.188:5008"
    "http://10.9.23.173:5008"
    "http://localhost:5008"
)

ENDPOINT="/api/StaffMembers"
HTTP_DIR="./http"

echo "Testing API endpoints..."

for URL in "${URLS[@]}"; do
    echo -n "Trying $URL$ENDPOINT ... "
    
    if curl -s -o /dev/null -w "%{http_code}" --connect-timeout 3 "$URL$ENDPOINT" | grep -q "200\|404"; then
        echo "✓ Connected!"
        echo "Use this URL: $URL"
        
        # Update all .http files
        if [ -d "$HTTP_DIR" ]; then
            echo "Updating .http files in $HTTP_DIR..."
            
            for file in "$HTTP_DIR"/*.http; do
                if [ -f "$file" ]; then
                    # Check if @portURL already exists
                    if grep -q "^@portURL" "$file"; then
                        # Replace existing @portURL (macOS requires '' after -i)
                        sed -i '' "s|^@portURL.*|@portURL = $URL|" "$file"
                        echo "  ✓ Updated: $(basename "$file")"
                    else
                        # Add @portURL at the beginning
                        echo -e "@portURL = $URL\n$(cat "$file")" > "$file"
                        echo "  ✓ Added to: $(basename "$file")"
                    fi
                fi
            done
            
            echo "All .http files updated successfully!"
        else
            echo "Warning: Directory $HTTP_DIR not found!"
        fi
        
        exit 0
    else
        echo "✗ Failed"
    fi
done

echo "No working endpoint found!"
exit 1