#!/usr/bin/env pwsh
Write-Output " Resetting PostgreSQL database (safe mode, no superuser needed)..."

# Connection details
$DB_HOST = "vs453.dei.isep.ipp.pt"
$DB_PORT = "5432"
$DB_NAME = "sem5pi_db"
$DB_USER = "postgres"
$DB_PASS = "2jyErozGHiZJ"


$env:PGPASSWORD = $DB_PASS

Write-Output " Cleaning schema 'public' (removing all tables, views, sequences)..."

$SQL = @'
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; 
    END LOOP;
    
    -- Drop all views
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP 
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE'; 
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP 
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequencename) || ' CASCADE'; 
    END LOOP;
END 
$$;
'@

psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c $SQL

if ($LASTEXITCODE -ne 0) {
    Write-Output " Error cleaning database schema!"
    exit 1
}

Write-Output "🧹 Removing old EF Core migrations..."
if (Test-Path "./Migrations") {
    Remove-Item -Recurse -Force ./Migrations
}

Write-Output " Creating new EF Core migration..."
dotnet ef migrations add Initial

if ($LASTEXITCODE -ne 0) {
    Write-Output " Error creating migration!"
    exit 1
}

Write-Output "🛠️ Applying migration to clean database..."
dotnet ef database update --connection "Host=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASS"

if ($LASTEXITCODE -ne 0) {
    Write-Output " Error applying migration!"
    exit 1
}

Write-Output " Verifying created tables..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

Write-Output " Database fully cleaned and rebuilt!"