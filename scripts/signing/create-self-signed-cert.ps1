param(
    [string]$Subject = "E621 Horizon (Local Dev)",
    [string]$PfxOutPath,
    [switch]$TrustLocal,
    [switch]$SavePassword,
    [switch]$Pause
)

# Creates a self-signed code signing certificate, exports it to a PFX, and optionally trusts it locally.
# Notes:
# - Self-signed signatures will still show Windows SmartScreen warnings for other users.
# - If you enable -TrustLocal, the cert is added to your CurrentUser Trusted Root store so YOUR machine trusts it.
# - Do NOT distribute your self-signed cert or ask users to install it — it's unsafe.

Write-Host "" # newline
Write-Host "=== Create self-signed Code Signing certificate ===" -ForegroundColor Green

try {
    if (-not $PfxOutPath) {
        $baseDir = Join-Path $env:APPDATA "E621Horizon\signing"
        if (-not (Test-Path $baseDir)) { New-Item -ItemType Directory -Force -Path $baseDir | Out-Null }
        $PfxOutPath = Join-Path $baseDir "horizon-selfsigned.pfx"
    }

    # Prompt for a PFX password
    $pfxPassword = Read-Host -AsSecureString "Enter a password to protect the PFX (will be required to sign builds)"

    # Create a self-signed code signing certificate in CurrentUser\My
    $subjectCN = "CN=$Subject"
    Write-Host "Creating certificate: $subjectCN" -ForegroundColor Cyan
    $cert = New-SelfSignedCertificate -Type CodeSigningCert `
        -Subject $subjectCN `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -KeyExportPolicy Exportable `
        -KeyLength 2048 `
        -HashAlgorithm sha256 `
        -NotAfter (Get-Date).AddYears(2)

    if (-not $cert) { throw "Certificate creation failed" }

    # Export to PFX
    Write-Host "Exporting PFX to: $PfxOutPath" -ForegroundColor Cyan
    Export-PfxCertificate -Cert $cert -FilePath $PfxOutPath -Password $pfxPassword | Out-Null

    # Optionally trust this cert locally (so signatures appear trusted on THIS machine)
    if ($TrustLocal.IsPresent) {
        Write-Host "Trusting this certificate locally (CurrentUser\\Root)" -ForegroundColor Yellow
        Write-Host "Only do this on your own dev machine. Don't ship this to users." -ForegroundColor DarkYellow
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","CurrentUser")
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $store.Add($cert)
        $store.Close()
        Write-Host "  [OK] Certificate added to CurrentUser\\Root" -ForegroundColor Green
    }

    # Optionally save password to local DPAPI-protected store for automated builds
    if ($SavePassword.IsPresent) {
        $secretsDir = Join-Path $env:APPDATA "E621Horizon\secrets"
        if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Force -Path $secretsDir | Out-Null }
        $pwdFile = Join-Path $secretsDir "codesign_pwd.dat"
        (ConvertFrom-SecureString $pfxPassword) | Set-Content -Path $pwdFile -Force -Encoding Ascii
        if (Test-Path $pwdFile) {
            Write-Host ("  [OK] Saved signing password to {0} (DPAPI-protected)" -f $pwdFile) -ForegroundColor Green
        } else {
            Write-Host ("  [WARN] Expected to save password to {0} but file not found" -f $pwdFile) -ForegroundColor Yellow
        }
    }

    Write-Host "" -ForegroundColor Green
    Write-Host "Success!" -ForegroundColor Green
    Write-Host ("PFX: {0}" -f $PfxOutPath) -ForegroundColor Green
    Write-Host ("Subject: {0}" -f $subjectCN) -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  - The build script can auto-load this cert if you run Production Build." -ForegroundColor Cyan
    Write-Host "  - Or set env vars yourself before building:" -ForegroundColor Cyan
    Write-Host ("      $env:CSC_LINK = '{0}' ; $env:CSC_KEY_PASSWORD = '<your password>'" -f $PfxOutPath) -ForegroundColor DarkGray
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    if ($Pause) { Read-Host "Press Enter to exit" | Out-Null }
    exit 1
}
finally {
    if ($?) {
        if ($Pause) { Read-Host "Done. Press Enter to exit" | Out-Null }
    }
}
