# AI Skill Package

This package provides a Codex skill that wraps the shell-installed `fp`
runtime from `branches/01-shell-installer`.

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
