#!/bin/bash
echo "Resetting PostgreSQL database (safe mode, no superuser needed)..."

# Connection details
DB_HOST="vs453.dei.isep.ipp.pt"
DB_PORT="5432"
DB_NAME="sem5pi_db"
DB_USER="postgres"
DB_PASS="2jyErozGHiZJ"

export PGPASSWORD=$DB_PASS

echo "Cleaning schema 'public' (removing all tables, views, sequences)..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
DO \$\$ 
DECLARE 
    r RECORD; 
BEGIN 
    -- Drop all tables EXCEPT PrivacyPolicies
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename <> 'PrivacyPolicies'
    ) LOOP 
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE'; 
    END LOOP;

    -- Drop all views (se quiseres, podes também excluir views específicas aqui)
    FOR r IN (
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
    ) LOOP 
        EXECUTE 'DROP VIEW IF EXISTS ' || quote_ident(r.viewname) || ' CASCADE'; 
    END LOOP;

    -- Eu removeria o bloco de sequences para não lixares nada relacionado com a PrivacyPolicies
END 
\$\$;
"


echo "Removing old EF Core migrations..."
rm -rf Migrations/

echo "Creating new EF Core migration..."
dotnet ef migrations add Initial

echo "Applying migration to clean database..."
dotnet ef database update --connection "Host=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASS"

echo "Verifying created tables..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "\dt"

echo "Database fully cleaned and rebuilt!"