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

if (-not $Token) {
  Write-Error "Missing GitHub token. Set GH_TOKEN environment variable or pass -Token."
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
  Write-Error "Failed to get release for tag '$Tag'. Ensure the release exists. $_"
  exit 1
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
