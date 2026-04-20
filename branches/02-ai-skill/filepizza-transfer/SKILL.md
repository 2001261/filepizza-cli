---
name: filepizza-transfer
description: Use this skill when an AI agent needs terminal-based file upload or download through file.pizza, especially on non-GUI environments. This skill wraps the shell-installed fp runtime, supports starting upload sessions, monitoring/stopping sessions, and downloading files through scriptable commands.
---

# FilePizza Transfer

Use this skill only after the shell runtime from `branches/01-shell-installer`
is installed and `fp --help` works.

## Use The Tool Script

Run `scripts/fp_tool.py` for deterministic operations.

### 1) Verify Runtime

```bash
python scripts/fp_tool.py check
```

### 2) Start Upload Session

```bash
python scripts/fp_tool.py upload-start --file /path/to/file
```

Optional flags:

- `--password <value>`
- `--keep-alive`
- `--session <name>`

This command returns JSON with `short_url`, `long_url`, and `session`.

### 3) Check Upload Session

```bash
python scripts/fp_tool.py upload-status --session <name>
```

Use this to read `running` and `completed`.

### 4) Stop Upload Session

```bash
python scripts/fp_tool.py upload-stop --session <name>
```

### 5) Download File

```bash
python scripts/fp_tool.py download --url "https://file.pizza/download/xxxx"
```

Optional flags:

- `--password <value>`
- `--output <path>`

## Operational Rules

- Prefer `upload-start` + `upload-status` for long-running transfers.
- Return JSON results directly to the user.
- If `fp` is missing, tell the user to run the shell installer package first.
