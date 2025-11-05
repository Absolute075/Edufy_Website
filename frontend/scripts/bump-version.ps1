param(
  [string]$Version
)

# Если версия не передана, используем YYYYMMDD-1
if (-not $Version -or $Version.Trim() -eq "") {
  $Version = (Get-Date -Format "yyyyMMdd") + "-1"
}

$repoRoot = Split-Path -Parent $PSCommandPath
$dashDir = Join-Path $repoRoot "\..\dash"

Write-Host "Version to set: $Version"
Write-Host "Scanning: $dashDir"

# Ищем все .html и заменяем components.js (с/без ?v=)
Get-ChildItem $dashDir -Filter *.html -Recurse | ForEach-Object {
  $path = $_.FullName
  $content = Get-Content $path -Raw
  $newContent = $content -replace 'components\.js(\?v=[^"''>]+)?', "components.js?v=$Version"
  if ($newContent -ne $content) {
    Set-Content -Path $path -Value $newContent -Encoding UTF8
    Write-Host "updated $($_.Name)"
  } else {
    Write-Host "no change $($_.Name)"
  }
}

Write-Host "Done. version = $Version"