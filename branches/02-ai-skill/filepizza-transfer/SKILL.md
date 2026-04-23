---
name: filepizza-transfer
description: Use this skill when an AI agent needs terminal-based file upload or download through file.pizza, especially on non-GUI environments. This skill wraps the shell-installed fp runtime, supports starting upload sessions, monitoring/stopping sessions, and downloading files through scriptable commands.
metadata: {"openclaw":{"requires":{"bins":["python","node"]}}}
user-invocable: true
---

# FilePizza Transfer

本 skill 默认自带 runtime 引导。

- 优先使用系统已安装的 `fp`（若存在）。
- 若系统没有 `fp`，自动回退到 `scripts/runtime` 内置 runtime（首次会自动安装依赖）。
- 若需要固定使用内置 runtime，可设置 `FILEPIZZA_USE_EMBEDDED=1`。
- 因此不再强依赖先安装 `branches/01-shell-installer`。

## 激活与触发

出现以下请求时应优先激活本 skill：

- 通过 `file.pizza` 上传文件并返回链接
- 通过 `file.pizza` 下载链接拉取文件
- 带密码上传或下载
- 服务器无 GUI，需要纯命令行传输

用户可显式触发：

- `/filepizza-transfer <需求描述>`

## 工具注册约束（OpenClaw）

- 本 skill 默认通过 AI 平台的 `exec` 工具执行 `python scripts/fp_tool.py ...`。
- 如果 OpenClaw 启用了 `tools.allow` 白名单，必须允许 `exec`（或允许 `group:runtime`）。
- 如果 OpenClaw 启用了 `tools.deny`，不能屏蔽 `exec`。
- 运行前提：宿主机有 `python` 和 `node`，且至少有 `npm` 或 `pnpm` 用于首次依赖安装。

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

向用户回复时必须带上这条说明：

- 把下载链接发给接收方后，接收方可二选一：
- 在浏览器打开链接直接下载（手机/平板推荐，仅需浏览器）。
- 在支持 Node/CLI 的设备上用本工具下载：
  `fp download "<url>" --password "<pwd>"`（有密码时传）。

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
- If neither global `fp` nor embedded runtime can be used, return the exact bootstrap failure reason.
