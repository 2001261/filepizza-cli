# AI Skill Package

This package provides a Codex skill that wraps the shell-installed `fp`
runtime from `branches/01-shell-installer`.

## AI-Ready Install (Copy/Paste)

Use these exact commands from repository root.

### Linux / macOS

```bash
# runtime first
bash branches/01-shell-installer/install.sh
export PATH="$HOME/.local/bin:$PATH"
fp --help

# skill install
bash branches/02-ai-skill/install-skill.sh
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

### Windows PowerShell

```powershell
# runtime first
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1
fp --help

# skill install
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1
python .\branches\02-ai-skill\filepizza-transfer\scripts\fp_tool.py check
```

Expected success:

- `fp --help` works
- `fp_tool.py check` prints JSON containing `"ok": true`

## Prerequisites

- Shell runtime is installed from `branches/01-shell-installer`
- `fp --help` works in terminal

## Install Skill (Linux/macOS)

```bash
bash branches/02-ai-skill/install-skill.sh
```

## Install Skill (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1
```

## Skill Folder

`branches/02-ai-skill/filepizza-transfer`

The skill includes:

- `SKILL.md`
- `agents/openai.yaml`
- `scripts/fp_tool.py`

## Verify Runtime From Skill Tool

From this repo root:

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

Expected: JSON with `"ok": true`.

## Troubleshooting For AI Agents

If `fp` is not found:

1. Re-run runtime installer (`branches/01-shell-installer`).
2. Linux/macOS: ensure `~/.local/bin` is in PATH.
3. Windows: reopen terminal session and run `fp --help` again.

If `fp_tool.py check` fails:

1. Confirm `fp --help` passes first.
2. Re-run skill installer.
3. Re-run `python .../fp_tool.py check`.

## Core Tool Commands

Start upload:

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-start --file /path/to/file
```

Query upload:

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-status --session <session-name>
```

Stop upload:

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-stop --session <session-name>
```

Download:

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py download --url "https://file.pizza/download/xxxx"
```
