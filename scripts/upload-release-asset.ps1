param(
  [Parameter(Mandatory = $true)][string]$Owner = "oreoorin6",
  [Parameter(Mandatory = $true)][string]$Repo = "horizion-",
  [Parameter(Mandatory = $true)][string]$Tag,
  [Parameter(Mandatory = $true)][string]$FilePath,
  [string]$Token = $env:GH_TOKEN,
  [string]$Label
)

# Simple helper to upload a local file as an asset to an existing GitHub Release (by tag)
# Requirements:
# - A GitHub token with repo permissions in GH_TOKEN env var (or pass -Token)
# - PowerShell 5.1+

if (-not (Test-Path -Path $FilePath)) {
  Write-Error "File not found: $FilePath"
  exit 1
}

# Resolve token from env/param or local secure store under %APPDATA%\E621Horizon\secrets
if (-not $Token) {
  try {
    $secretPath = Join-Path $env:APPDATA "E621Horizon\secrets\gh_token.dat"
    if (Test-Path -Path $secretPath) {
      $enc = Get-Content -Raw -Path $secretPath
      $sec = ConvertTo-SecureString $enc
      $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
      try { $Token = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    }
  } catch {
    Write-Error ("Failed to resolve token from secure store: {0}" -f $_)
  }
}

if (-not $Token) {
  Write-Error "Missing GitHub token. Set GH_TOKEN, pass -Token, or store it via scripts/secrets/store-gh-token.ps1."
  exit 1
}

$Headers = @{
  Authorization = "Bearer $Token"
  Accept        = "application/vnd.github+json"
  "User-Agent"  = "E621Horizon-ReleaseUploader"
}

function Get-ReleaseByTag {
  param([string]$Owner, [string]$Repo, [string]$Tag)
  $url = "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag"
  return Invoke-RestMethod -Method GET -Uri $url -Headers $Headers -ErrorAction Stop
}

function New-Release {
  param([string]$Owner, [string]$Repo, [string]$Tag)
  $url = "https://api.github.com/repos/$Owner/$Repo/releases"
  $body = @{ tag_name = $Tag; name = $Tag; draft = $false; prerelease = $false; generate_release_notes = $true } | ConvertTo-Json
  return Invoke-RestMethod -Method POST -Uri $url -Headers $Headers -ContentType 'application/json' -Body $body -ErrorAction Stop
}

function Remove-ReleaseAssetIfExists {
  param($Release, [string]$AssetName)
  if ($Release.assets) {
    foreach ($a in $Release.assets) {
      if ($a.name -eq $AssetName) {
        Write-Host "Deleting existing asset: $AssetName (id=$($a.id))" -ForegroundColor Yellow
        $delUrl = "https://api.github.com/repos/$Owner/$Repo/releases/assets/$($a.id)"
        Invoke-RestMethod -Method DELETE -Uri $delUrl -Headers $Headers -ErrorAction Stop | Out-Null
      }
    }
  }
}

function Add-ReleaseAsset {
  param($Release, [string]$FilePath, [string]$Label)
  $assetName = [System.IO.Path]::GetFileName($FilePath)
  $uploadUrl = $Release.upload_url -replace "\{\?name,label\}", ("?name=" + [uri]::EscapeDataString($assetName) + ($(if ($Label) {"&label=" + [uri]::EscapeDataString($Label)} else {""})))
  $bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $FilePath))
  $uploadHeaders = $Headers.Clone()
  $uploadHeaders["Content-Type"] = "application/octet-stream"

  Write-Host "Uploading $assetName to $($Release.tag_name) ..." -ForegroundColor Cyan
  $resp = Invoke-RestMethod -Method POST -Uri $uploadUrl -Headers $uploadHeaders -Body $bytes -ErrorAction Stop
  return $resp
}

try {
  $release = Get-ReleaseByTag -Owner $Owner -Repo $Repo -Tag $Tag
} catch {
  Write-Warning "No release found for tag '$Tag' (or insufficient perms). Attempting to create one..."
  try {
    $release = New-Release -Owner $Owner -Repo $Repo -Tag $Tag
  } catch {
    Write-Error "Failed to create release for tag '$Tag'. $_"
    exit 1
  }
}

$assetName = [System.IO.Path]::GetFileName($FilePath)
Remove-ReleaseAssetIfExists -Release $release -AssetName $assetName

try {
  $result = Add-ReleaseAsset -Release $release -FilePath $FilePath -Label $Label
  Write-Host "Uploaded asset: $($result.name) (size=$($result.size))" -ForegroundColor Green
} catch {
  Write-Error "Upload failed: $_"
  exit 1
}
