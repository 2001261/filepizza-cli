# Delivery Branches

本目录包含两个交付分支（目录分支）：

1. `branches/01-shell-installer`
2. `branches/02-ai-skill`

推荐安装顺序：

1. 先安装 Shell Runtime（分支 1）
2. 再安装 AI Skill（分支 2）

---

## 1) Shell Runtime 安装（必须先做）

目录：`branches/01-shell-installer`

用途：在本机安装 `fp` 命令（上传/下载）。

前置条件：

- 已安装 `node`
- 已安装 `npm`

### Linux / macOS 安装

在仓库根目录执行：

```bash
bash branches/01-shell-installer/install.sh
```

安装后验证：

```bash
fp --help
```

如果提示找不到 `fp`，把 `~/.local/bin` 加入 PATH：

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### Windows PowerShell 安装

在仓库根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1
```

安装后验证：

```powershell
fp --help
```

若当前会话未刷新 PATH，请新开一个终端再试。

### 卸载 Shell Runtime

Linux / macOS:

```bash
bash branches/01-shell-installer/uninstall.sh
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\uninstall.ps1
```

---

## 2) AI Skill 安装（依赖分支 1）

目录：`branches/02-ai-skill`

用途：把 `fp` 封装成 AI 可直接调用的工具流程。

前置条件：

- 分支 1 已安装完成且 `fp --help` 正常

### Linux / macOS 安装

```bash
bash branches/02-ai-skill/install-skill.sh
```

### Windows PowerShell 安装

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1
```

安装位置（默认）：

- `$CODEX_HOME/skills/filepizza-transfer`
- 若未设置 `CODEX_HOME`，则是 `~/.codex/skills/filepizza-transfer`

安装后建议：

- 重启 Codex 会话
- 在会话中触发 skill 使用 `scripts/fp_tool.py`

### Skill 主要能力

- `upload-start`：启动上传并返回链接
- `upload-status`：查询会话状态
- `upload-stop`：停止上传会话
- `download`：按链接下载文件

详细请看：

- `branches/01-shell-installer/README.md`
- `branches/02-ai-skill/README.md`
