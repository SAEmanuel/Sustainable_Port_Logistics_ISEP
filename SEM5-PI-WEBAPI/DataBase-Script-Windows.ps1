Write-Host "Deleting database and migrations..." -ForegroundColor Red

Remove-Item -Path "SEM5-PI-WEBAPI.db" -ErrorAction SilentlyContinue
Remove-Item -Path "Migrations" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Creating initial migration..." -ForegroundColor Yellow
dotnet ef migrations add Initial

Write-Host "Applying migration..." -ForegroundColor Cyan
dotnet ef database update

Write-Host " Database cleaned and recreated!" -ForegroundColor Green