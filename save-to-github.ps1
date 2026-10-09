# Save your work to GitHub with one command
# Usage: open PowerShell in this folder and run:  .\save-to-github.ps1 "what you changed"

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = Read-Host "What did you change? (short description)"
}

Write-Host ""
Write-Host "Checking what changed..." -ForegroundColor Cyan
git status --short

$confirm = Read-Host "`nSave and push these changes to GitHub? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Cancelled. Nothing was pushed." -ForegroundColor Yellow
    exit
}

git add .
git commit -m "$Message"
git push origin main

Write-Host ""
Write-Host "Done. Your code is now saved on GitHub." -ForegroundColor Green
