[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillSourceDir = Join-Path $ScriptDir "filepizza-transfer"
$OpenClawHome = if ($env:OPENCLAW_HOME) { $env:OPENCLAW_HOME } else { "$HOME\.openclaw" }
$SkillsRoot = Join-Path $OpenClawHome "skills"
$SkillTargetDir = Join-Path $SkillsRoot "filepizza-transfer"

New-Item -ItemType Directory -Force -Path $SkillsRoot | Out-Null

if (Test-Path -LiteralPath $SkillTargetDir) {
    Remove-Item -LiteralPath $SkillTargetDir -Recurse -Force
}

Copy-Item -LiteralPath $SkillSourceDir -Destination $SkillTargetDir -Recurse -Force

Write-Host "Installed OpenClaw skill: $SkillTargetDir"
Write-Host "Next:"
Write-Host "1) Ensure openclaw.json includes agents.defaults.skills: [""filepizza-transfer""]"
Write-Host "2) Ensure tools policy allows exec (or group:runtime)"
Write-Host "3) Run: openclaw skills list"
