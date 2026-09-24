---
title: mise 使用教程：一个工具管好所有语言的版本
date: 2026-09-24
description: mise（原名 rtx）是 Rust 写的多语言版本管理器，能替代 nvm、pyenv、rbenv、goenv，还顺便管理环境变量和项目任务。这篇讲清安装激活、mise.toml 配置、常用命令与 asdf 迁移。
tags:
  - mise
  - 版本管理
  - 工具
---

# mise：一个工具管好所有语言的版本

装 Node 用 nvm、装 Python 用 pyenv、装 Ruby 用 rbenv、装 Go 用 goenv —— 每碰一个语言就得学一套命令，环境变量还得另外找办法。**mise** 把这些统一成了一个工具。

mise（读作 "meez"，取自法语的 mise en place，"各就各位"）是一个用 **Rust** 写的多语言版本管理器，早期的名字叫 rtx。仓库在 [github.com/jdx/mise](https://github.com/jdx/mise)，**MIT** 许可，当前版本 **v2026.9.12**（2026-09-20 发布，采用 `年.月.补丁` 的版本号方案）。

它管的不只是版本：

- **版本管理** —— 一条命令管住 Node、Python、Go、Java、Ruby、Terraform 等几百种工具，`cd` 进目录就能自动切版本
- **环境变量** —— 在 `mise.toml` 的 `[env]` 里声明，进目录自动生效，还能直接加载 `.env`
- **任务脚本** —— `[tasks]` 可以替代 npm scripts、Makefile、just，且自动带上项目的工具链

## 和 asdf / nvm / pyenv 是什么关系

mise 最初就是 **asdf 的 Rust 重写**，所以它兼容 asdf 生态：能读 `.tool-versions`，也能用 asdf 插件，从 asdf 迁过来基本不用改配置。

| | mise | asdf | nvm / pyenv |
|---|---|---|---|
| 实现 | Rust 二进制 | Shell 脚本 | Shell 脚本 |
| 管理范围 | 版本 + 环境变量 + 任务 | 仅版本 | 仅单语言 |
| 配置文件 | `mise.toml`、`.tool-versions` | `.tool-versions` | `.nvmrc`、`.python-version` |
| 版本切换 | 进目录即生效 | 进目录即生效 | 需要手动 `use` |
| 工具来源 | core / asdf / npm / cargo / go / GitHub Releases 等 | asdf 插件 | 自带 |

和 nvm 这类单语言工具比，最大的差别是**切换版本不用手动敲命令**：`cd` 进项目目录，用哪个版本由 `mise.toml` 决定。

## 安装

### Windows

**Scoop（推荐）**：

```powershell
scoop install mise
```

Scoop 本身的安装可以看 [Windows 安装 Scoop 教程](/posts/scoop-install)。

**winget**：

```powershell
winget install jdx.mise
```

> 注意：Scoop 安装的 mise 只会把 `mise` 命令本身放进 PATH，**工具的 shims 目录不会自动加进去**（默认 `%LOCALAPPDATA%\mise\shims`）。所以装完必须做下面的 shell 激活。

### macOS / Linux

```bash
# macOS
brew install mise

# macOS / Linux 通用（官方脚本，推荐）
curl https://mise.run | sh
```

官方脚本会把单个二进制装到 `~/.local/bin/mise`。

> Homebrew 装起来方便，但官方文档明确说**它不是首选**：formula 是单独编译的，性能和体积都不如官方发布的二进制，新版本也到得更慢。

### Shell 激活（必做）

想让交互式 shell 自动切换版本，要在 rc 文件里加一行激活命令：

```bash
# Bash
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc

# Zsh
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> ~/.zshrc

# Fish
echo '~/.local/bin/mise activate fish | source' >> ~/.config/fish/config.fish
```

PowerShell 把激活命令写进 profile：

```powershell
(&mise activate pwsh) | Out-String | Invoke-Expression
```

> 激活行**只需要加一次**，重复追加会产生多个 hook。启动新 shell 后用 `mise doctor` 体检。

**`activate` 和 shims 的区别**：

| 方式 | 机制 | 适合 |
|---|---|---|
| `mise activate` | 每次提示符渲染时更新 PATH 和环境变量 | **交互式 shell，推荐** |
| shims | 命令入口垫片，按需选用对应版本 | 编辑器等不读 shell 配置的程序 |
| 都不用 | 显式调用 `mise exec` / `mise run` | CI、脚本 |

## 配置：三层，就近覆盖

mise 从当前目录往上逐级查找配置，叠加全局配置，**越具体越优先**：

| 位置 | 作用范围 |
|---|---|
| `mise.toml` | 项目 / 目录级，一般提交进 git 与团队共享 |
| `.tool-versions` | asdf 格式，mise 直接读，迁移期可以和上面共存 |
| 全局 `~/.config/mise/config.toml` | 个人默认版本 |

不确定哪个文件生效时，用 `mise config ls` 看。

> `.nvmrc`、`.python-version` 这类单语言文件默认**不读**，需要在配置里开启 idiomatic version files 才会被识别。

## 常用命令

### 装工具并记录版本：mise use

最常用的是 `mise use`，它一次性完成「下载安装 + 写进配置」：

```bash
mise use node@24          # 写入当前目录的 mise.toml
mise use --global node@24 # 写入全局配置，作为个人默认版本
```

生成的配置长这样：

```toml
[tools]
node = "24"
```

`"24"` 是**版本请求**而不是精确版本，表示 24 系列的最新版。想锁死具体版本号就用 `mise use --pin node@24`。

### 只安装不记录：mise install

```bash
mise install node@20.0.0   # 装一个具体版本
mise install node@20       # 装 20 系列最新的
mise install node          # 装 mise.toml 里写着的版本
mise install               # 把配置里所有工具都装齐
```

团队协作时，克隆完仓库只要跑一句 `mise install` 就能把环境备好 —— 这是它替代 `nvm use` 加一堆 README 说明的核心价值。

### 查看

```bash
mise ls               # 已安装的工具
mise ls --current     # 当前生效的版本
mise ls-remote node   # 有哪些版本可装
mise outdated         # 哪些该升级
mise registry         # 支持哪些工具（简写名 → backend）
mise where node       # 工具装在哪个目录
mise which node       # node 命令实际解析到哪个可执行文件
```

### 临时试用，不留痕

```bash
mise exec node@24 -- node --version
```

`mise exec`（简写 `mise x`）会按需下载工具，然后执行 `--` 之后的命令，**不写配置、也不改当前 shell**。嫌长可以加个别名：

```bash
alias mx="mise x --"
```

### 升级与清理

```bash
mise upgrade node     # 在版本请求范围内升到最新（"24" → 24.x 最新）
mise upgrade          # 升级全部
mise uninstall node@20
mise prune            # 删掉没在用的版本
mise self-update      # 更新 mise 自己
```

## 环境变量：[env]

`[env]` 让环境变量跟着目录走，不必再写 `.env` 然后手动 source：

```toml
[env]
NODE_ENV = 'development'
API_BASE = 'https://api.example.com'
```

几个实用写法：

| 需求 | 写法 |
|---|---|
| 已有的不动，没有时给默认值 | `NODE_ENV = { default = "development" }` |
| 显式取消某个变量 | `NODE_ENV = false` |
| 必填，缺失就报错 | `{ required = true }`，也可带提示文案 `required = "说明文字"` |
| 输出里脱敏 | `{ value = "...", redact = true }` |

**加载 `.env` 文件**：

```toml
[env]
_.file = '.env'
```

支持 `dotenv`、`json`、`yaml`、`toml` 四种格式，也可以一次给多个：

```toml
[env]
_.file = [
  '.env.json',
  { path = ".secrets.yaml", redact = true }
]
```

**往 PATH 里加目录**：

```toml
[env]
_.path = [
  "{{ config_root }}/node_modules/.bin",
  "tools/bin"
]
```

**变量引用**：支持 Tera 模板（`{{ config_root }}` 就是配置所在的项目根目录）和 shell 式展开：

```toml
[env]
MY_PROJ_LIB = "{{ config_root }}/lib"
NODE_ENV = "${NODE_ENV:-development}"
```

> 上面那句 `${NODE_ENV:-development}` 的意思是：原来设过就用原来的，没设过就用 `development`。

改配置也可以不手写文件：

```bash
mise set NODE_ENV=development
mise set NODE_ENV          # 读出来
mise unset NODE_ENV
```

## 任务：[tasks]

`[tasks]` 是内置的任务运行器，脚本会自动带上项目的工具链和环境变量：

```toml
[tasks.dev]
run = "npm run dev"

[tasks.test]
run = "vitest run"

[tasks.check]
depends = ["format", "test"]

[tasks.format]
run = "prettier --write ."
```

```bash
mise run dev
mise dev              # mise run 的简写
mise tasks ls         # 列出所有任务
mise tasks info dev   # 看某个任务的详情
```

> **`depends` 不保证顺序** —— 它只是依赖声明，多个依赖**可能并行执行**。需要严格「A 跑完再跑 B」的话，用 run 数组一步一步写。

任务脚本变长时，可以改成**文件任务**：放进 `mise-tasks/` 目录，脚本本身有完整的编辑器语法支持：

```bash
#!/usr/bin/env bash
#MISE description="构建并打包"
set -euo pipefail
npm run build
```

```bash
chmod +x mise-tasks/build
mise run build
```

另外两个顺手的功能：

- `mise watch <task>` 在文件变化时自动重跑任务
- 任务里可以直接读 `MISE_PROJECT_ROOT`、`MISE_CONFIG_ROOT` 等变量

## 从 asdf / nvm 迁移

```bash
mise sync            # 从其他版本管理器同步已装的工具
mise install         # 按当前 .tool-versions / mise.toml 装齐
```

- **别急着删 asdf**：`.tool-versions` 和 asdf 插件 mise 都能用，可以先用 mise 跑一段时间再清理
- `mise doctor` 会告诉你还有哪里没配好

## 要注意的几个点

**信任机制。** 配置文件里的 tasks、hooks 和部分 env 指令**会执行代码**。来自他人的配置先看一眼，再用 `mise trust` 信任它；非 CI 模式下 `mise install` / `exec` / `run` 会自动信任当前配置，paranoid 模式则一律要求显式信任。

**Windows 不是第一公民。** mise 本身在 Windows 上能用，但不少工具的后端对 Windows 支持不完整。要在这套工具链上跑复杂项目，**WSL 里的体验明显更完整**。

**glibc 版本要求。** Linux 上 `linux-x64` 等官方二进制要求 **glibc ≥ 2.18**；Alpine（musl）或更老的系统需要显式使用静态构建：

```bash
curl -fsSL https://mise.run | MISE_INSTALL_MUSL=1 sh
```

**命令跑不了先查激活。** 工具能通过 `mise exec` 运行、但不能直接当命令敲，基本都是 shell 激活没生效 —— 重开一个 shell，或跑 `mise doctor`。

**版本检查与自动补全。**

```bash
mise --version
mise completion bash --install    # bash / zsh / fish / powershell 都支持
```

## 命令速查

| 目的 | 命令 |
|---|---|
| 装工具并记进项目配置 | `mise use node@24` |
| 装工具并设为全局默认 | `mise use --global node@24` |
| 按配置装齐依赖 | `mise install` |
| 临时试用某版本 | `mise exec node@24 -- node -v` |
| 看已安装 / 当前生效 | `mise ls` / `mise ls --current` |
| 看可装版本 | `mise ls-remote node` |
| 看哪些该升级 | `mise outdated` |
| 升级 | `mise upgrade node` |
| 卸载 | `mise uninstall node@20`、`mise unuse node` |
| 清理无用版本 | `mise prune` |
| 运行任务 | `mise run dev` / `mise dev` |
| 体检 | `mise doctor` |
| 看生效的配置文件 | `mise config ls` |

## 小结

- 如果你正在同时用 nvm + pyenv + rbenv，**mise 是这套组合的直接替代**，而且兼容 asdf 的 `.tool-versions`
- 一个项目里最常用的就四条：`mise use node@24`、`mise install`、`mise run xxx`、`mise ls --current`
- 它比单纯的版本管理器多出的两块能力是 **`[env]` 环境变量**和 **`[tasks]` 任务**，可以把 `.env` 和 npm scripts 一起收进 `mise.toml`
- Windows 上建议配合 [Scoop](/posts/scoop-install) 安装，复杂项目优先考虑 WSL
