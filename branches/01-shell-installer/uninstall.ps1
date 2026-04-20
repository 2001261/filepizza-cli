[CmdletBinding()]
param(
    [string]$InstallDir = "$HOME\.filepizza-cli",
    [string]$BinDir = "$HOME\.local\bin"
)

$ErrorActionPreference = 'Stop'

$ps1LauncherPath = Join-Path $BinDir "fp.ps1"
$cmdLauncherPath = Join-Path $BinDir "fp.cmd"

if (Test-Path -LiteralPath $InstallDir) {
    Remove-Item -LiteralPath $InstallDir -Recurse -Force
}

if (Test-Path -LiteralPath $ps1LauncherPath) {
    Remove-Item -LiteralPath $ps1LauncherPath -Force
}

if (Test-Path -LiteralPath $cmdLauncherPath) {
    Remove-Item -LiteralPath $cmdLauncherPath -Force
}

Write-Host "Removed FilePizza CLI runtime."
Write-Host "  Runtime removed: $InstallDir"
Write-Host "  Launchers removed:"
Write-Host "    $ps1LauncherPath"
Write-Host "    $cmdLauncherPath"
