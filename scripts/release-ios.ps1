param(
  [switch]$Build
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "KotoClip iOS release preflight" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""
Write-Host "Before building, confirm this in Apple Developer Portal:" -ForegroundColor Yellow
Write-Host "  App ID:          jp.kotoclip.app"
Write-Host "  Share Extension: jp.kotoclip.app.share"
Write-Host "  App Group:       group.jp.kotoclip.app"
Write-Host ""
Write-Host "The App Group must be attached to the main app ID."
Write-Host "If the Share Extension ID appears separately, attach the same App Group there too."
Write-Host ""

Write-Host "Checking Expo iOS config..." -ForegroundColor Cyan
npx.cmd expo config --type introspect

Write-Host ""
Write-Host "Running lint..." -ForegroundColor Cyan
npm.cmd run lint

Write-Host ""
Write-Host "Preflight passed." -ForegroundColor Green

if ($Build) {
  Write-Host ""
  Write-Host "Starting EAS production iOS build..." -ForegroundColor Cyan
  eas build --platform ios --profile production
} else {
  Write-Host ""
  Write-Host "Ready to build. Run either command:" -ForegroundColor Green
  Write-Host "  npm.cmd run release:ios:build"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\release-ios.ps1 -Build"
}
