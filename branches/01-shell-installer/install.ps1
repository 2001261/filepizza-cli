[CmdletBinding()]
param(
    [string]$InstallDir = "$HOME\.filepizza-cli",
    [string]$BinDir = "$HOME\.local\bin"
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "node is required but was not found."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw "npm is required but was not found."
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir "..\..")).Path

$pkgPath = Join-Path $RepoRoot "package.json"
$pkg = Get-Content -LiteralPath $pkgPath -Raw | ConvertFrom-Json
$playwrightVersion = $pkg.devDependencies.playwright
if (-not $playwrightVersion) {
    $playwrightVersion = $pkg.dependencies.playwright
}
if (-not $playwrightVersion) {
    throw "playwright version not found in package.json"
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InstallDir "bin") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $InstallDir "src\cli") | Out-Null
New-Item -ItemType Directory -Force -Path $BinDir | Out-Null

Copy-Item -LiteralPath (Join-Path $RepoRoot "bin\fp.js") -Destination (Join-Path $InstallDir "bin\fp.js") -Force
Copy-Item -Path (Join-Path $RepoRoot "src\cli\*.js") -Destination (Join-Path $InstallDir "src\cli\") -Force

$runtimePackage = @{
    name = "filepizza-cli-runtime"
    private = $true
    version = "1.0.0"
    license = "UNLICENSED"
    description = "Runtime package for FilePizza CLI"
    dependencies = @{
        playwright = $playwrightVersion
    }
} | ConvertTo-Json -Depth 10

Set-Content -LiteralPath (Join-Path $InstallDir "package.json") -Value $runtimePackage -Encoding UTF8

Push-Location $InstallDir
npm install --omit=dev
Pop-Location

$ps1LauncherPath = Join-Path $BinDir "fp.ps1"
$cmdLauncherPath = Join-Path $BinDir "fp.cmd"

$ps1Launcher = @"
param([Parameter(ValueFromRemainingArguments = `$true)][string[]]`$ArgsFromCaller)
& node "$InstallDir\bin\fp.js" @ArgsFromCaller
exit `$LASTEXITCODE
"@

$cmdLauncher = "@echo off`r`nnode `"$InstallDir\bin\fp.js`" %*`r`n"

Set-Content -LiteralPath $ps1LauncherPath -Value $ps1Launcher -Encoding UTF8
Set-Content -LiteralPath $cmdLauncherPath -Value $cmdLauncher -Encoding ASCII

& $ps1LauncherPath --help | Out-Null

Write-Host "Installed FilePizza CLI runtime."
Write-Host "  Runtime: $InstallDir"
Write-Host "  Launchers:"
Write-Host "    $ps1LauncherPath"
Write-Host "    $cmdLauncherPath"
Write-Host ""
Write-Host "If '$BinDir' is not in PATH, add it to your user PATH."
