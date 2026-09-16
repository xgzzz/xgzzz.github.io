---
title: Zed Globalization：Zed 编辑器的汉化版 / 多语言版
date: 2026-09-16
description: Zed 是 Rust 写的高性能编辑器，但官方还没有中文界面。Zed Globalization 用 AI 全自动翻译流水线构建出简繁中文、日语、韩语版本，开箱即用。
tags:
  - Zed
  - 编辑器
  - 汉化
  - 工具
---

# Zed Globalization：Zed 编辑器的汉化版 / 多语言版

[Zed](https://github.com/zed-industries/zed) 是 Atom 和 Tree-sitter 原班人马用 Rust 写的编辑器，GPU 加速渲染，启动和响应速度都很快，原生支持协作和 AI 编程。唯一的问题是：**官方界面目前只有英文**。

[Zed Globalization](https://github.com/x6nux/zed-globalization)（简称 ZedG）就是为了解决这个问题：它不是外挂补丁，而是用 **AI 驱动的全自动翻译流水线**，把 Zed 源码里的界面字符串翻译后重新编译，直接产出各平台的安装包。支持简体中文、繁体中文、日语、韩语等。

项目：[github.com/x6nux/zed-globalization](https://github.com/x6nux/zed-globalization)，MIT 许可。

## 它和普通汉化补丁的区别

传统汉化一般是替换资源文件，ZedG 走的是另一条路：翻译 **Rust 源码里的字符串**，然后整个重新编译。好处是界面文本覆盖得更彻底，代价是必须有完整的构建流水线。它的做法是：

- AI 自动扫描，识别哪些 `.rs` 文件需要翻译
- 正则提取双引号字符串，同时收集代码上下文
- AI 并发翻译，带三级降级策略（JSON → XML CDATA → 编号格式）
- 源码替换时三层保护：过滤纯 ASCII 标点、跳过字节字符串与属性宏、自动转义引号、把中文标点还原为 ASCII 标点
- JSON ↔ Excel 双向转换，方便人工校对
- GitHub Actions 跑完整流程：扫描 → 翻译 → 构建 → 发布

所以你拿到的不是"改过的 Zed"，而是一个**独立构建、独立安装、可以和官方 Zed 共存**的编辑器。

## 下载安装

到 [Releases](https://github.com/x6nux/zed-globalization/releases/latest) 下载对应平台的包：

| 平台 | 文件 |
|------|------|
| macOS（Universal / aarch64 / x86_64） | `zedg-zh-cn-macos-*.dmg` |
| Windows（x86_64 / aarch64） | `zedg-zh-cn-windows-*.zip` |
| Linux（x86_64 / aarch64） | `zedg-zh-cn-linux-*.tar.gz` / `.deb` / `.rpm` |

### macOS

**Homebrew（推荐）**

```bash
brew tap x6nux/zedg
brew install --cask zedg        # 稳定版
# 预览版：brew install --cask zedg-preview

brew update && brew upgrade --cask zedg   # 手动更新
```

想要自动更新的话（Homebrew 会每 12 小时检查并升级**所有** formulae 和 cask，不能只指定单个包）：

```bash
brew tap homebrew/autoupdate
brew autoupdate start 43200 --upgrade
```

**DMG 手动安装**

拖入 Applications 即可。因为构建没有经过 Apple 签名，首次打开会提示"应用已损坏"，终端执行下面这条就行：

```bash
sudo xattr -rd com.apple.quarantine /Applications/ZedG.app
```

### Windows

**Scoop（推荐）**

```bash
scoop bucket add zedg https://github.com/x6nux/scoop-zedg
scoop install zedg          # 稳定版
# 预览版：scoop install zedg-preview

scoop update zedg           # 更新
```

Scoop 本身的安装可以看看 [Windows 安装 Scoop 教程](/posts/scoop-install)。

**两个包的区别** —— 装的是同一个编辑器，差别在命令行：

| 包 | 说明 |
|----|------|
| `zedg` | 只注册 `zedg` 命令，**不影响**官方 Zed。已经装了官方 Zed 就选这个 |
| `zedg-compat` | 额外注册 `zed` 命令，`git difftool`、终端 `zed .` 这类生态工具会自动把 ZedG 当默认编辑器 |

两者可以随时切换：`scoop uninstall zedg && scoop install zedg-compat`。

Windows 也有 NSIS 安装包版本，安装向导的组件页可以勾选"覆盖官方 Zed 安装"（会自动把官方 `zed.exe` 备份为 `zed.exe.official.bak`，卸载时还原）。

### Linux

```bash
# Debian / Ubuntu
sudo dpkg -i zedg-zh-cn-linux-x86_64-*.deb

# Fedora / RHEL
sudo dnf install zedg-zh-cn-linux-x86_64-*.rpm

# 通用 tar.gz
sudo tar -xzf zedg-zh-cn-linux-x86_64-*.tar.gz -C /usr/local
```

deb / rpm 会自动注册 `zedg.desktop` 并关联 `text/plain`，应用列表里直接就能看到。

## 让系统把 ZedG 当作 `zed`（可选）

很多生态工具（git difftool、终端 `zed .`、系统的默认编辑器选择器）找的是名为 `zed` 的命令。ZedG 提供三种方式注册，都**不破坏官方 Zed**，也都能还原：

- **Windows（NSIS）**：安装向导勾选"覆盖官方 Zed 安装"
- **Windows（Scoop）**：装 `zedg-compat`
- **macOS / Linux**：用 `zedg-activate.sh`

```bash
zedg-activate.sh            # 激活：创建 ~/.local/bin/zed 链接 + 注册 desktop 入口
zedg-activate.sh --status   # 查看当前接管状态
zedg-activate.sh --revert   # 还原（官方 zed 会自动备份为 zed.orig）
```

## 卸载

```bash
# macOS
brew uninstall --cask zedg
brew untap x6nux/zedg       # 可选

# Windows（Scoop）
scoop uninstall zedg

# Linux
sudo apt remove zedg        # 或 sudo dnf remove zedg
```

如果开过自动更新，卸载前记得先停掉定时任务：`brew autoupdate stop` 或 `schtasks /delete /tn "ZedGUpdate" /f`。

## 想自己构建 / 参与翻译

工具用 pip 装：

```bash
pip install .            # 基础（仅替换功能）
pip install ".[ai]"      # 含 AI 翻译
pip install ".[all]"     # 全部功能
```

分步跑：

```bash
zedl10n scan     --source-root zed                                  # 识别待翻译文件
zedl10n extract  --source-root zed --output string.json              # 提取字符串
zedl10n translate --input string.json --output i18n/zh-CN.json --mode full
zedl10n replace  --input i18n/zh-CN.json --source-root zed           # 写回源码

# 或者一条流水线搞定
zedl10n pipeline --source-root zed --lang zh-CN --mode full
```

然后本地编译：

```bash
git clone https://github.com/zed-industries/zed.git
zedl10n replace --input i18n/zh-CN.json --source-root zed
python3 patch_agent_env.py --source-root zed
cd zed && cargo build --release
```

AI 部分支持任何 OpenAI 兼容接口，用环境变量配置：`AI_BASE_URL`、`AI_API_KEY`（必填）、`AI_MODEL`（默认 `gpt-4o-mini`）、`AI_CONCURRENCY`（默认 5）。优先级是 CLI 参数 > 环境变量 > 默认值。

### 顺带修的一个坑

构建时会跑 `patch_agent_env.py`，它修的是 Zed 上游两个问题：

- `agent_server_store.rs` 里有一行 `env.insert("ANTHROPIC_API_KEY", "")`，会**把你系统里已配好的 API Key 清空**
- `claude.rs` 的 `connect()` 没有像 Codex / Gemini 那样从环境变量读取并透传 API Key

补丁会删掉那行强制清空，并给 Claude Code 进程透传 `ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL` 以及 `AWS_*`、`GOOGLE_CLOUD_*` 等变量。脚本是幂等的（用 `[ZED_GLOBALIZATION_PATCH]` 标记检测），也支持 `--dry-run` 只看不改。

## 小结

- 想用中文界面的 Zed，直接装 ZedG 就行，macOS 用 Homebrew、Windows 用 Scoop、Linux 用 deb/rpm
- 它和官方 Zed 可以共存；需要 `zed` 命令被生态工具识别的话，装 `zedg-compat` 或跑 `zedg-activate.sh`
- 翻译是 AI 自动跑的，术语表里能改，也支持导出 Excel 人工校对
- 上游 Zed 每次发新版，流水线会自动重新扫描翻译，跟着更新

> 注意：这是第三方构建，不是 Zed 官方发行版。涉及登录、AI Key 这些，按自己的接受程度决定要不要用。
