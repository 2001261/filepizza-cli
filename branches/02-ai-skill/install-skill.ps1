[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillSourceDir = Join-Path $ScriptDir "filepizza-transfer"
$SkillsRoot = Join-Path ($(if ($env:CODEX_HOME) { $env:CODEX_HOME } else { "$HOME\.codex" })) "skills"
$SkillTargetDir = Join-Path $SkillsRoot "filepizza-transfer"

New-Item -ItemType Directory -Force -Path $SkillsRoot | Out-Null

if (Test-Path -LiteralPath $SkillTargetDir) {
    Remove-Item -LiteralPath $SkillTargetDir -Recurse -Force
}

Copy-Item -LiteralPath $SkillSourceDir -Destination $SkillTargetDir -Recurse -Force

Write-Host "Installed skill: $SkillTargetDir"
Write-Host "Restart Codex session if the skill list does not refresh automatically."
