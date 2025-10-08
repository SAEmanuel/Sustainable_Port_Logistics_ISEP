#!/bin/bash
echo "🗑️ Deleting database and migrations..."

rm -f SEM5-PI-WEBAPI.db
rm -rf Migrations/

echo "📦 Creating initial migration..."
dotnet ef migrations add Initial

echo "🛠️ Applying migration..."
dotnet ef database update

echo "✅ Database cleaned and recreated!"
