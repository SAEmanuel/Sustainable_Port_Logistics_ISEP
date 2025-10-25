#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Output "=========================================="
Write-Output "Running .NET application with --seed flag"
Write-Output "=========================================="

dotnet run --seed

if ($LASTEXITCODE -ne 0) {
    Write-Output " Error running seed!"
    exit 1
}

Write-Output ""
Write-Output "=========================================="
Write-Output " Seeding completed successfully!"
Write-Output "=========================================="