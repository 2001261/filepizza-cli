# Shell Installer Package

This package installs `fp` for shell environments:

- Linux
- macOS
- PowerShell (Windows)

## Linux / macOS

```bash
bash branches/01-shell-installer/install.sh
```

Uninstall:

```bash
bash branches/01-shell-installer/uninstall.sh
```

## PowerShell (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1
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
