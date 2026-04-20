# Shell Installer Package

This package installs `fp` for shell environments:

- Linux
- macOS
- PowerShell (Windows)

## Prerequisites

- `node` is installed
- `npm` is installed

## Linux / macOS

```bash
bash branches/01-shell-installer/install.sh
```

Verify:

```bash
fp --help
```

Uninstall:

```bash
bash branches/01-shell-installer/uninstall.sh
```

## PowerShell (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1
```

Verify:

```powershell
fp --help
```

Uninstall:

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\uninstall.ps1
```

## Install Layout

- Runtime dir: `~/.filepizza-cli` (Linux/macOS) or `%USERPROFILE%\.filepizza-cli`
- Launcher dir: `~/.local/bin` (Linux/macOS) or `%USERPROFILE%\.local\bin`

Override dirs with:

- `FILEPIZZA_INSTALL_DIR`
- `FILEPIZZA_BIN_DIR`

## PATH Notes

If `fp` is not found after install:

- Linux/macOS: add `~/.local/bin` to PATH
- Windows: reopen terminal so user PATH refreshes
