# E621 Horizon - Clean Build Files Script
# PowerShell version

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "   E621 Horizon - Clean Build Files" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "This script will remove all build artifacts:" -ForegroundColor Yellow
Write-Host "  - dist/ (Electron build output)" -ForegroundColor Yellow
Write-Host "  - .next/ (Next.js build cache)" -ForegroundColor Yellow
Write-Host "  - out/ (Next.js static export)" -ForegroundColor Yellow
Write-Host "  - node_modules/.cache/ (Build caches)" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Do you want to continue? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host ""
    Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host ""
Write-Host "Starting cleanup..." -ForegroundColor Cyan
Write-Host ""

$foldersRemoved = 0
$foldersSkipped = 0
$totalSize = 0

# Function to get folder size
function Get-FolderSize {
    param([string]$Path)
    if (Test-Path $Path) {
        return (Get-ChildItem -Path $Path -Recurse -Force -ErrorAction SilentlyContinue | 
                Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
    }
    return 0
}

# Function to format bytes
function Format-Bytes {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) {
        return "{0:N2} GB" -f ($Bytes / 1GB)
    } elseif ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    } elseif ($Bytes -ge 1KB) {
        return "{0:N2} KB" -f ($Bytes / 1KB)
    } else {
        return "$Bytes bytes"
    }
}

# Folders to clean
$foldersToClean = @(
    @{Path = "dist"; Description = "Electron build output"},
    @{Path = ".next"; Description = "Next.js build cache"},
    @{Path = "out"; Description = "Next.js static export"},
    @{Path = "node_modules\.cache"; Description = "Node modules cache"}
)

foreach ($folder in $foldersToClean) {
    $path = $folder.Path
    $description = $folder.Description
    
    if (Test-Path $path) {
        Write-Host "Removing: $path ($description)" -ForegroundColor Yellow
        
        # Get size before removing
        $size = Get-FolderSize -Path $path
        $totalSize += $size
        
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            
            if (Test-Path $path) {
                Write-Host "  ⚠ Warning: Could not remove completely" -ForegroundColor Yellow
                $foldersSkipped++
            } else {
                Write-Host "  ✓ Removed successfully (freed $(Format-Bytes $size))" -ForegroundColor Green
                $foldersRemoved++
            }
        }
        catch {
            Write-Host "  ✗ Error: $_" -ForegroundColor Red
            $foldersSkipped++
        }
    } else {
        Write-Host "Skipping: $path (doesn't exist)" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# Summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "         Cleanup Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Folders removed: $foldersRemoved" -ForegroundColor Green
Write-Host "Folders skipped: $foldersSkipped" -ForegroundColor Yellow
Write-Host "Total space freed: $(Format-Bytes $totalSize)" -ForegroundColor Cyan
Write-Host ""

if ($foldersSkipped -gt 0) {
    Write-Host "Note: Some folders could not be removed." -ForegroundColor Yellow
    Write-Host "This may be because:" -ForegroundColor Yellow
    Write-Host "  - Files are in use by another process" -ForegroundColor Yellow
    Write-Host "  - Insufficient permissions" -ForegroundColor Yellow
    Write-Host "  - Files are locked" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Try closing all related applications and run this script again." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
pause
