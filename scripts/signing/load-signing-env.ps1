$ErrorActionPreference = 'SilentlyContinue'

# Loads self-signed code-signing configuration into environment variables for electron-builder

try {
    $base = Join-Path $env:APPDATA 'E621Horizon'
    $pfxPath = Join-Path $base 'signing\horizon-selfsigned.pfx'
    $pwdFile = Join-Path $base 'secrets\codesign_pwd.dat'

    if (Test-Path $pfxPath -PathType Leaf -ErrorAction SilentlyContinue) {
        $env:CSC_LINK = $pfxPath
        $env:WIN_CSC_LINK = $pfxPath
    }

    if (Test-Path $pwdFile -PathType Leaf -ErrorAction SilentlyContinue) {
        $secure = Get-Content -Path $pwdFile | ConvertTo-SecureString
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
        )
        if ($plain) {
            # Trim to avoid stray newline issues
            $plain = $plain.Trim()
            $env:CSC_KEY_PASSWORD = $plain
            $env:WIN_CSC_KEY_PASSWORD = $plain
        }
    }
} catch {
    # Best-effort only
}
