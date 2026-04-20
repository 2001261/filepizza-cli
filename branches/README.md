# Delivery Branches

本目录包含两个交付分支（目录分支）：

1. `branches/01-shell-installer`
2. `branches/02-ai-skill`

推荐安装顺序：

1. 先安装 Shell Runtime（分支 1）
2. 再安装 AI Skill（分支 2）

---

## 给 AI 的直接执行流程

目标：让 AI 在拿到本 README 后，直接把运行环境安装好并验证成功。

前提：AI 已在本仓库根目录执行命令（包含 `branches/` 子目录）。

### Linux / macOS（AI 执行）

```bash
# 1) 安装 fp runtime
bash branches/01-shell-installer/install.sh

# 2) 如果当前会话还找不到 fp，补 PATH
export PATH="$HOME/.local/bin:$PATH"

# 3) 验证 runtime
fp --help

# 4) 安装 skill
bash branches/02-ai-skill/install-skill.sh

# 5) 验证 skill 运行链路
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

成功判据：

- `fp --help` 正常输出
- `fp_tool.py check` 返回 JSON 且包含 `"ok": true`

### Windows PowerShell（AI 执行）

```powershell
# 1) 安装 fp runtime
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1

# 2) 验证 runtime（若失败先重开终端再试）
fp --help

# 3) 安装 skill
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1

# 4) 验证 skill 运行链路
python .\branches\02-ai-skill\filepizza-transfer\scripts\fp_tool.py check
```

成功判据：

- `fp --help` 正常输出
- `fp_tool.py check` 返回 JSON 且包含 `"ok": true`

### AI 回退策略（必须遵守）

如果 `fp --help` 失败：

1. 重新执行分支 1 安装脚本。
2. Linux/macOS 追加 `export PATH="$HOME/.local/bin:$PATH"` 后再试。
3. Windows 重新打开终端后再试。

如果 `fp_tool.py check` 失败：

1. 先确认 `fp --help` 可用。
2. 重新执行分支 2 安装脚本。
3. 再次运行 `python .../fp_tool.py check`。

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

- 重启 Codex 会话（确保新 skill 被发现）
- 运行 `python .../fp_tool.py check` 确认可调用

### Skill 主要能力

- `upload-start`：启动上传并返回链接
- `upload-status`：查询会话状态
- `upload-stop`：停止上传会话
- `download`：按链接下载文件

详细请看：

- `branches/01-shell-installer/README.md`
- `branches/02-ai-skill/README.md`
