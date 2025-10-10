# E621 Horizon - Dependencies Installation Script
# PowerShell version with enhanced error handling and logging

param(
    [switch]$Force,
    [switch]$Verbose,
    [switch]$SkipGlobal
)

# Enable strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Colors for output
$colors = @{
    Success = "Green"
    Warning = "Yellow" 
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "============================================" "Header"
    Write-ColorOutput $Title "Header"
    Write-ColorOutput "============================================" "Header"
    Write-Host ""
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Get-PackageVersion {
    param([string]$Package)
    try {
        $version = & $Package --version 2>$null
        return $version
    }
    catch {
        return "Unknown"
    }
}

# Main installation process
try {
    Write-Header "E621 Horizon - Dependencies Installation"
    
    if ($Verbose) {
        Write-ColorOutput "Running in verbose mode" "Info"
        Write-ColorOutput "Parameters: Force=$Force, SkipGlobal=$SkipGlobal" "Info"
    }

    # Step 1: Check Node.js
    Write-ColorOutput "[1/7] Checking Node.js installation..." "Info"
    
    if (-not (Test-Command "node")) {
        Write-ColorOutput "ERROR: Node.js is not installed or not in PATH" "Error"
        Write-ColorOutput "Please install Node.js from https://nodejs.org/" "Error"
        Write-ColorOutput "Minimum required version: 18.x" "Error"
        exit 1
    }
    
    $nodeVersion = Get-PackageVersion "node"
    Write-ColorOutput "✓ Node.js version: $nodeVersion" "Success"
    
    # Validate Node.js version
    $nodeVersionNumber = [regex]::Match($nodeVersion, "v?(\d+)").Groups[1].Value
    if ([int]$nodeVersionNumber -lt 18) {
        Write-ColorOutput "WARNING: Node.js version $nodeVersion detected. Minimum recommended is 18.x" "Warning"
    }

    # Step 2: Check npm
    Write-ColorOutput "`n[2/7] Checking npm availability..." "Info"
    
    if (-not (Test-Command "npm")) {
        Write-ColorOutput "ERROR: npm is not available" "Error"
        Write-ColorOutput "npm should come with Node.js installation" "Error"
        exit 1
    }
    
    $npmVersion = Get-PackageVersion "npm"
    Write-ColorOutput "✓ npm version: $npmVersion" "Success"

    # Step 3: Update npm to latest version
    Write-ColorOutput "`n[3/7] Updating npm to latest version..." "Info"
    try {
        npm install -g npm@latest
        $newNpmVersion = Get-PackageVersion "npm"
        Write-ColorOutput "✓ npm updated to version: $newNpmVersion" "Success"
    }
    catch {
        Write-ColorOutput "WARNING: Could not update npm (may require admin privileges)" "Warning"
    }

    # Step 4: Clear npm cache
    Write-ColorOutput "`n[4/7] Clearing npm cache..." "Info"
    try {
        npm cache clean --force
        Write-ColorOutput "✓ npm cache cleared" "Success"
    }
    catch {
        Write-ColorOutput "WARNING: Failed to clear npm cache, continuing anyway..." "Warning"
    }

    # Step 5: Clean existing installation
    Write-ColorOutput "`n[5/7] Cleaning existing dependencies..." "Info"
    
    if (Test-Path "node_modules") {
        if ($Force -or (Read-Host "Remove existing node_modules? (y/N)") -eq "y") {
            Write-ColorOutput "Removing node_modules..." "Info"
            Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
            Write-ColorOutput "✓ node_modules removed" "Success"
        }
    }
    
    if (Test-Path "package-lock.json") {
        if ($Force -or (Read-Host "Remove existing package-lock.json? (y/N)") -eq "y") {
            Write-ColorOutput "Removing package-lock.json..." "Info"
            Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
            Write-ColorOutput "✓ package-lock.json removed" "Success"
        }
    }

    # Step 6: Install dependencies
    Write-ColorOutput "`n[6/7] Installing all dependencies..." "Info"
    Write-ColorOutput "This may take several minutes depending on your internet connection..." "Info"
    Write-Host ""
    
    $installStart = Get-Date
    npm install --verbose:$Verbose
    $installEnd = Get-Date
    $installDuration = $installEnd - $installStart
    
    Write-ColorOutput "✓ Dependencies installed successfully in $($installDuration.TotalSeconds.ToString('F1')) seconds" "Success"

    # Step 7: Install global tools (optional)
    if (-not $SkipGlobal) {
        Write-ColorOutput "`n[7/7] Installing recommended global development tools..." "Info"
        
        $globalTools = @(
            @{Name = "typescript"; Description = "TypeScript compiler"},
            @{Name = "tsx"; Description = "TypeScript execution engine"},
            @{Name = "@types/node"; Description = "Node.js type definitions"}
        )
        
        foreach ($tool in $globalTools) {
            try {
                Write-ColorOutput "Installing $($tool.Description)..." "Info"
                npm install -g $tool.Name --silent
                Write-ColorOutput "✓ $($tool.Name) installed globally" "Success"
            }
            catch {
                Write-ColorOutput "WARNING: Failed to install $($tool.Name) globally (may require admin privileges)" "Warning"
            }
        }
    } else {
        Write-ColorOutput "`n[7/7] Skipping global tools installation (--SkipGlobal specified)" "Info"
    }

    # Verification
    Write-Header "Verifying Installation"
    
    $criticalDependencies = @(
        "next",
        "react", 
        "react-dom",
        "typescript",
        "electron",
        "tailwindcss",
        "@radix-ui/react-dialog",
        "lucide-react"
    )
    
    $allSuccess = $true
    foreach ($dep in $criticalDependencies) {
        try {
            npm list $dep --depth=0 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-ColorOutput "✓ $dep installed" "Success"
            } else {
                Write-ColorOutput "✗ $dep NOT properly installed" "Error"
                $allSuccess = $false
            }
        }
        catch {
            Write-ColorOutput "✗ $dep verification failed" "Error"
            $allSuccess = $false
        }
    }
    
    if (-not $allSuccess) {
        Write-ColorOutput "`nSome critical dependencies are missing. Please check the errors above." "Error"
        exit 1
    }

    # Success summary
    Write-Header "Installation Complete!"
    
    Write-ColorOutput "All dependencies have been successfully installed and verified." "Success"
    Write-Host ""
    Write-ColorOutput "Available commands:" "Info"
    Write-ColorOutput "  npm run dev          - Start development server" "Info"
    Write-ColorOutput "  npm run build        - Build for production" "Info"
    Write-ColorOutput "  npm run electron-dev - Start Electron development" "Info"
    Write-ColorOutput "  npm run dist         - Build Electron distribution" "Info"
    Write-Host ""
    Write-ColorOutput "You can now run the development server with:" "Success"
    Write-ColorOutput "  npm run dev" "Success"
    Write-Host ""
    
    # Show package.json scripts
    if (Test-Path "package.json") {
        try {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            if ($packageJson.scripts) {
                Write-ColorOutput "Available npm scripts:" "Info"
                $packageJson.scripts.PSObject.Properties | ForEach-Object {
                    Write-ColorOutput "  npm run $($_.Name) - $($_.Value)" "Info"
                }
            }
        }
        catch {
            # Ignore JSON parsing errors
        }
    }

} catch {
    Write-ColorOutput "`nERROR: $($_.Exception.Message)" "Error"
    Write-ColorOutput "Installation failed. Please check the error messages above." "Error"
    exit 1
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")