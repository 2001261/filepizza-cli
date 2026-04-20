# AI Skill Package

本目录提供 `filepizza-transfer` skill，用于让 AI 通过 `fp` 命令执行上传/下载。

关键点：

- 这个 skill 默认复用 AI 平台已有的 `exec` 工具，不强依赖自定义插件工具。
- skill 实际执行入口是 `filepizza-transfer/scripts/fp_tool.py`。

## 一次性安装（先 runtime，后 skill）

在仓库根目录执行。

### Linux / macOS

```bash
# 1) 安装 fp runtime
bash branches/01-shell-installer/install.sh
export PATH="$HOME/.local/bin:$PATH"
fp --help

# 2) 安装 skill 到 Codex skills 目录
bash branches/02-ai-skill/install-skill.sh
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

### Windows PowerShell

```powershell
# 1) 安装 fp runtime
powershell -ExecutionPolicy Bypass -File .\branches\01-shell-installer\install.ps1
fp --help

# 2) 安装 skill 到 Codex skills 目录
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1
python .\branches\02-ai-skill\filepizza-transfer\scripts\fp_tool.py check
```

成功判据：

- `fp --help` 正常
- `fp_tool.py check` 返回 JSON 且包含 `"ok": true`

## OpenClaw 集成（tools 注册 + skill 激活）

下述步骤是给 OpenClaw 的明确接入流程。

### 1) 放置 skill 目录

推荐直接执行安装脚本：

Linux / macOS：

```bash
bash branches/02-ai-skill/install-openclaw-skill.sh
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-openclaw-skill.ps1
```

脚本会把 `filepizza-transfer` 复制到 OpenClaw skills 目录。默认目录是 `~/.openclaw/skills/filepizza-transfer`（可通过 `OPENCLAW_HOME` 覆盖）。

如需手动放置，可把 `branches/02-ai-skill/filepizza-transfer` 复制到 OpenClaw skill 目录之一：

- 工作区级（推荐，项目隔离）：`<workspace>/skills/filepizza-transfer`
- 全局共享：`~/.openclaw/skills/filepizza-transfer`

Linux / macOS 手动示例：

```bash
mkdir -p ~/.openclaw/skills
cp -R branches/02-ai-skill/filepizza-transfer ~/.openclaw/skills/filepizza-transfer
```

Windows PowerShell 手动示例：

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.openclaw\skills" | Out-Null
Copy-Item -LiteralPath ".\branches\02-ai-skill\filepizza-transfer" -Destination "$HOME\.openclaw\skills\filepizza-transfer" -Recurse -Force
```

### 2) 配置 OpenClaw `tools` 与 `skills` 允许项

编辑 `~/.openclaw/openclaw.json`，至少保证：

- skill allowlist 中包含 `filepizza-transfer`
- tools 策略没有禁用 `exec`（若用了 `tools.allow` 白名单，必须包含 `exec` 或 `group:runtime`）

可直接参考：

- `branches/02-ai-skill/filepizza-transfer/agents/openclaw.json5.example`

### 3) 重新加载 skill

```bash
openclaw skills list
```

然后新开会话触发加载（两种方式任选）：

```bash
/new
```

或：

```bash
openclaw gateway restart
```

### 4) 验证触发

自动触发测试：

```bash
openclaw agent --message "请用 filepizza 上传 ./demo.zip，并返回下载链接"
```

显式触发测试（slash command）：

```bash
/filepizza-transfer 上传 ./demo.zip，密码 123456
```

## Skill 触发规则（给 AI 的硬约束）

以下意图应触发本 skill：

- 用户要求通过 `file.pizza` 传文件
- 用户要求命令行上传并生成链接
- 用户提供 `https://file.pizza/download/...` 链接要求下载
- 用户要求带密码上传/下载

以下意图不应强制触发本 skill：

- 用户明确要求 `scp`/`rsync`/云盘 SDK 等其他传输方案
- 用户只问文件路径整理或本地重命名

## 核心命令（AI 内部调用）

上传：

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-start --file /path/to/file
```

查询上传状态：

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-status --session <session-name>
```

停止上传：

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py upload-stop --session <session-name>
```

下载：

```bash
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py download --url "https://file.pizza/download/xxxx"
```

## 故障排查

如果 `fp` 找不到：

1. 重新执行 `branches/01-shell-installer` 安装脚本。
2. Linux/macOS 确保 `~/.local/bin` 已进 PATH。
3. Windows 重新打开终端后再执行 `fp --help`。

如果 `fp_tool.py check` 失败：

1. 先确认 `fp --help` 正常。
2. 再执行 skill 安装脚本。
3. 重新运行 `python .../fp_tool.py check`。
