# Windows code signing options

This project supports optional local self-signing for your Windows builds.

Important realities:
- Self-signed executables still trigger Windows SmartScreen for other users.
- The Publisher will show as Unknown unless the certificate is trusted on that computer.
- You can trust your self-signed certificate locally so YOUR machine treats it as trusted. Do not ask users to install your self-signed root.

## Quick start: self-sign locally

1) Create a self-signed code signing cert and export a PFX
- This creates a cert in your user store and a PFX at %APPDATA%\E621Horizon\signing\horizon-selfsigned.pfx
- Add `-TrustLocal` to trust it on your machine (optional, dev-only)
- Add `-SavePassword` to store the PFX password securely for automated builds

PowerShell:

```powershell
# In the repo root
./scripts/signing/create-self-signed-cert.ps1 -Subject "E621 Horizon (Local Dev)" -TrustLocal -SavePassword -Pause
```

2) Build as usual
- The build script auto-loads your local signing config if present and signs the portable EXE.

```powershell
./build/build.ps1
# Choose: 2) Production Build (Build + Package)
```

If you prefer manual control, set these env vars before running electron-builder:

```powershell
$env:CSC_LINK = "$env:APPDATA\E621Horizon\signing\horizon-selfsigned.pfx"
$env:CSC_KEY_PASSWORD = "<your password>"
```

## What self-signing gives you
- A valid Authenticode signature added to your EXE
- File Properties → Digital Signatures tab displays your certificate info
- On your own machine (if you used `-TrustLocal`), the signature verifies as trusted

## What it does NOT solve
- SmartScreen reputation warnings for other users
- "Verified Publisher" for other users (they would need to trust your root cert)

For distributors: The industry solution is a paid code-signing certificate (EV recommended) whose chain is trusted by Windows. That is the only way to consistently show a verified publisher to end users without asking them to modify their trust stores.

## Remove/rotate your local signing
- Delete PFX: `%APPDATA%\E621Horizon\signing\horizon-selfsigned.pfx`
- Delete password file: `%APPDATA%\E621Horizon\secrets\codesign_pwd.dat`
- To remove local trust (if you used `-TrustLocal`), open `certmgr.msc` → Trusted Root Certification Authorities → Certificates, find and delete your subject (e.g., E621 Horizon (Local Dev)).

## Troubleshooting
- Verify PFX and stored password match:

```powershell
./scripts/signing/test-signing-env.ps1 -Pause
```

- If the password file is missing, re-run the create script with `-SavePassword`.
