@echo off
echo 🧨 Resetting PostgreSQL database (safe mode, no superuser needed)...

:: Connection details
set DB_HOST=10.9.21.87
set DB_PORT=5432
set DB_NAME=ThPA
set DB_USER=makeitsimple_user
set DB_PASS=3dj03

:: Export password for psql
set PGPASSWORD=%DB_PASS%

echo 🗑️ Cleaning schema 'public' (removing all tables, views, sequences)...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c ^
"DO $$ 
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
$$;"

echo 🧹 Removing old EF Core migrations...
if exist "Migrations" (
    rmdir /s /q "Migrations"
)

echo 📦 Creating new EF Core migration...
dotnet ef migrations add Initial

echo 🛠️ Applying migration to clean database...
dotnet ef database update --connection "Host=%DB_HOST%;Port=%DB_PORT%;Database=%DB_NAME%;Username=%DB_USER%;Password=%DB_PASS%"

echo 🔍 Verifying created tables...
psql -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -c "\dt"

echo ✅ Database fully cleaned and rebuilt!

pause
