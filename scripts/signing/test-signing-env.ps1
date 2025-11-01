param(
    [switch]$Pause
)

Write-Host ''
Write-Host '=== Testing code signing configuration ===' -ForegroundColor Green

try {
    $base = Join-Path $env:APPDATA 'E621Horizon'
    $pfxPath = Join-Path $base 'signing\horizon-selfsigned.pfx'
    $pwdFile = Join-Path $base 'secrets\codesign_pwd.dat'

    if (-not (Test-Path $pfxPath)) { throw "PFX not found at $pfxPath" }
    if (-not (Test-Path $pwdFile)) { throw "Password file not found at $pwdFile (run create-self-signed-cert.ps1 -SavePassword)" }

    $sec = Get-Content $pwdFile | ConvertTo-SecureString
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    ).Trim()

    # Try to load the cert with the password
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
    $cert.Import($pfxPath, $plain, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::DefaultKeySet)

    if (-not $cert.HasPrivateKey) { throw "PFX loaded but no private key found" }

    Write-Host '  ✓ PFX and password verified' -ForegroundColor Green
    Write-Host ("  Subject: {0}" -f $cert.Subject) -ForegroundColor Cyan
    Write-Host ("  Thumbprint: {0}" -f $cert.Thumbprint) -ForegroundColor Cyan

    # Echo what the loader would set
    Write-Host ''
    Write-Host 'Environment vars to use:' -ForegroundColor Yellow
    Write-Host ("  CSC_LINK={0}" -f $pfxPath) -ForegroundColor DarkGray
    Write-Host '  CSC_KEY_PASSWORD=(hidden)' -ForegroundColor DarkGray
    Write-Host ("  WIN_CSC_LINK={0}" -f $pfxPath) -ForegroundColor DarkGray
    Write-Host '  WIN_CSC_KEY_PASSWORD=(hidden)' -ForegroundColor DarkGray

    Write-Host 'If the build still fails: ensure build/build.ps1 prints Local signing detected (CSC_LINK) before packing.' -ForegroundColor Yellow
}
catch {
    Write-Host ('ERROR: ' + $_) -ForegroundColor Red
            Write-Host 'Fixes:' -ForegroundColor Yellow
            Write-Host '  - Recreate PFX and password: run scripts/signing/create-self-signed-cert.ps1 with -Subject E621 Horizon (Local Dev) -TrustLocal -SavePassword' -ForegroundColor DarkYellow
            Write-Host '  - Or set CSC_KEY_PASSWORD for this session and re-run build' -ForegroundColor DarkYellow
    if ($Pause) { Read-Host "Press Enter to exit" | Out-Null }
    exit 1
}

if ($Pause) { Read-Host 'Done. Press Enter to exit' | Out-Null }
