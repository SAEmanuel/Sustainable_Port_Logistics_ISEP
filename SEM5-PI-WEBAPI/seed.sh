#!/bin/bash
set -e

echo "=========================================="
echo "Running .NET application with --seed flag"
echo "=========================================="

dotnet run --seed

echo ""
echo "=========================================="
echo "Seeding completed successfully!"
echo "=========================================="