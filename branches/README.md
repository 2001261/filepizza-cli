# Delivery Branches

This project is packaged into two delivery branches:

1. `branches/01-shell-installer`
2. `branches/02-ai-skill`

## Branch 1: Shell Installer

`01-shell-installer` packages runtime installation for:

- Linux
- macOS
- PowerShell (Windows)

It installs a standalone `fp` command into user space.

## Branch 2: AI Skill

`02-ai-skill` packages a Codex-compatible skill that calls the installed `fp`
runtime from Branch 1, so an AI agent can:

- start upload sessions
- monitor/stop upload sessions
- download files
