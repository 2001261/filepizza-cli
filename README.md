# filepizza-cli

基于 [kern/filepizza](https://github.com/kern/filepizza) 的二次开发项目。  
本仓库是 **非官方封装**，重点是将 `file.pizza` 网页流程封装为 CLI，并补充无 GUI 环境安装与 AI Skill 调用能力。

## 重要说明

- 本项目不是 `filepizza` 官方仓库。
- 上游项目与核心协议来源：`https://github.com/kern/filepizza`
- 本项目新增内容主要是 CLI、安装封装、AI Skill 工具化调用。

## 本项目提供什么

1. `fp upload/download` 命令行传输（headless）
2. 上传端默认一次完成即退出（支持 `--keep-alive`）
3. 多平台安装封包（Linux / macOS / PowerShell）
4. 可被 AI 代理直接调用的 Skill（上传、状态检查、停止、下载）

## CLI 快速使用

```bash
pnpm install
node ./bin/fp.js --help
```

上传：

```bash
node ./bin/fp.js upload /path/to/file
```

下载：

```bash
node ./bin/fp.js download "https://file.pizza/download/xxxx"
```

## 交付分支（目录）

见 [branches/README.md](branches/README.md)：

1. `branches/01-shell-installer`  
   Shell 环境安装封装（Linux/macOS/PowerShell）
2. `branches/02-ai-skill`  
   AI Skill 封装（可调用 Branch 1 安装出来的 `fp` 进行传输）

OpenClaw 接入（tools 注册、skill 激活与触发规则）请看：

- `branches/02-ai-skill/README.md`
- `branches/02-ai-skill/filepizza-transfer/SKILL.md`

## 许可与致谢

- 本仓库沿用 BSD-3-Clause（见 `LICENSE`）。
- 感谢上游 `filepizza` 项目作者与贡献者。
