# AI Skill Package

本目录提供 `filepizza-transfer` skill。  
目标是：**把 skill 目录交给 AI 后，AI 可直接调用上传/下载，不依赖先 git clone 全仓库再手工装 runtime**。

## 设计说明（已收敛）

- skill 调用入口：`filepizza-transfer/scripts/fp_tool.py`
- 运行时策略：
  1. 优先使用系统全局 `fp`（若存在）
  2. 若不存在，自动回退到 skill 内置 runtime：`filepizza-transfer/scripts/runtime`
  3. 内置 runtime 首次会自动安装依赖（`playwright`），随后直接可用
- 可选：设置 `FILEPIZZA_USE_EMBEDDED=1` 可强制走 skill 内置 runtime
- 因此，skill 不再强依赖 `branches/01-shell-installer`

前置条件（最小）：

- `python`
- `node`
- `npm` 或 `pnpm`（用于首次依赖安装）

## 直接给 AI 的最短流程

在仓库根目录执行：

### Linux / macOS

```bash
bash branches/02-ai-skill/install-skill.sh
python branches/02-ai-skill/filepizza-transfer/scripts/fp_tool.py check
```

### Windows PowerShell

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-skill.ps1
python .\branches\02-ai-skill\filepizza-transfer\scripts\fp_tool.py check
```

成功判据：

- `fp_tool.py check` 返回 JSON 且 `ok=true`

## OpenClaw 集成（tools 注册 + skill 激活）

### 1) 安装 skill 到 OpenClaw skills 目录

Linux / macOS：

```bash
bash branches/02-ai-skill/install-openclaw-skill.sh
```

Windows PowerShell：

```powershell
powershell -ExecutionPolicy Bypass -File .\branches\02-ai-skill\install-openclaw-skill.ps1
```

### 2) 配置 OpenClaw 允许项

编辑 `~/.openclaw/openclaw.json`，确保：

- `agents.defaults.skills` 包含 `filepizza-transfer`
- `tools` 未禁用 `exec`（若是 allowlist，至少允许 `exec` 或 `group:runtime`）

参考模板：

- `branches/02-ai-skill/filepizza-transfer/agents/openclaw.json5.example`

### 3) 重新加载

```bash
openclaw skills list
```

新开会话后可显式触发：

```bash
/filepizza-transfer 上传 ./demo.zip，密码 123456
```

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

如果 `fp_tool.py check` 失败：

1. 先确认 `python --version`、`node --version` 正常。
2. 确认至少一个包管理器可用：`npm -v` 或 `pnpm -v`。
3. 重试 `python .../fp_tool.py check`，查看返回的 JSON `error/details`。
