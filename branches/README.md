# Delivery Branches

本目录包含两个交付分支（目录分支）：

1. `branches/01-shell-installer`
2. `branches/02-ai-skill`

推荐使用方式：

1. 仅给 AI 用：直接安装分支 2（自带 runtime 引导）
2. 人工命令行也要全局 `fp`：再安装分支 1

---

## 给 AI 的直接执行流程

目标：让 AI 在拿到本 README 后，直接把运行环境安装好并验证成功。

前提：AI 已在本仓库根目录执行命令（包含 `branches/` 子目录）。

### Linux / macOS（AI 执行）

```bash
# 1) 安装 skill
bash branches/02-ai-skill/install-skill.sh

# 2) 验证 skill 运行链路
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

成功判据：

- `fp_tool.py check` 返回 JSON 且包含 `"ok": true`

### Windows PowerShell（AI 执行）

```powershell
# 1) 安装 skill
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1

# 2) 验证 skill 运行链路
python .\branches\02-ai-skill\filepizza-transfer\scripts\fp_tool.py check
```

成功判据：

- `fp_tool.py check` 返回 JSON 且包含 `"ok": true`

### AI 回退策略（必须遵守）

如果 `fp_tool.py check` 失败：

1. 先确认 `python`、`node` 可用。
2. 确认 `npm` 或 `pnpm` 至少一个可用。
3. 重新执行分支 2 安装脚本。
4. 再次运行 `python .../fp_tool.py check`。

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

## 2) AI Skill 安装（可独立使用）

目录：`branches/02-ai-skill`

用途：把 `fp` 封装成 AI 可直接调用的工具流程。

前置条件：

- 已安装 `python`
- 已安装 `node`
- 已安装 `npm` 或 `pnpm`

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

### OpenClaw 注册要点

如果要在 OpenClaw 中使用本 skill，还需要两步：

1. 安装 OpenClaw skill：
   - Linux/macOS：`bash branches/02-ai-skill/install-openclaw-skill.sh`
   - PowerShell：`powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-openclaw-skill.ps1`
2. 在 OpenClaw 配置中同时满足：
   - `agents.defaults.skills` 包含 `filepizza-transfer`
   - `tools` 策略未禁用 `exec`（若用白名单，包含 `exec` 或 `group:runtime`）

可直接参考示例：

- `branches/02-ai-skill/filepizza-transfer/agents/openclaw.json5.example`

### Skill 主要能力

- `upload-start`：启动上传并返回链接
- `upload-status`：查询会话状态
- `upload-stop`：停止上传会话
- `download`：按链接下载文件

详细请看：

- `branches/01-shell-installer/README.md`
- `branches/02-ai-skill/README.md`
