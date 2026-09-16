---
title: Windows 安装 Scoop 教程（含国内镜像配置）
date: 2026-09-16
description: 三步搞定 Scoop：调整 PowerShell 执行策略、执行安装命令、配置 Gitee 镜像源，附自定义安装路径与常见问题。
tags:
  - Windows
  - Scoop
  - 工具
---

# Windows 安装 Scoop 教程（含国内镜像配置）

Scoop 是 Windows 上的命令行包管理器，装软件不用再满世界找安装包、一路点下一步。安装 Scoop 本身主要分三步：**调整 PowerShell 策略、执行安装命令、按需配置国内镜像源**。

## 快速安装（默认路径）

最简单的方式，Scoop 会默认装到 `C:\Users\你的用户名\scoop`。

**1. 以普通用户身份打开 PowerShell**

注意**不要**用管理员身份，否则会报错。

**2. 调整执行策略**，允许 PowerShell 运行脚本：

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
```

**3. 执行安装命令**：

```powershell
irm get.scoop.sh | iex
```

**4.** 看到 `Scoop was installed successfully!` 的绿色提示，就说明装好了。

## 自定义安装路径（可选）

C 盘紧张的话，可以在安装前设置环境变量指定目录。

**1. 以管理员身份**打开 PowerShell，设置环境变量（把 `D:\Scoop` 换成你要的路径）：

```powershell
[Environment]::SetEnvironmentVariable('SCOOP', 'D:\Scoop', 'User')
```

> 如果需要全局安装（供所有用户使用），可以额外设置 `SCOOP_GLOBAL` 变量。

**2.** 关掉当前窗口，**重新打开一个普通用户的 PowerShell**，再执行上面的安装命令。Scoop 会自动识别 `SCOOP` 变量，装到你指定的位置。

## 配置国内镜像源（推荐）

默认从 GitHub 拉取，国内速度不稳定。建议把源换成 Gitee 镜像。

**1. 更改 Scoop 核心源**：

```powershell
scoop config SCOOP_REPO https://gitee.com/scoop-installer/scoop
```

**2. 添加常用软件仓库（bucket）**：

```powershell
scoop bucket add main https://gitee.com/scoop-installer/main.git
scoop bucket add extras https://gitee.com/scoop-installer/extras.git
```

之后装软件就会优先从 Gitee 拉取，速度快很多。

## 安装后配置（可选）

**安装 aria2 加速下载**

Scoop 会自动用 aria2 做多线程下载，大文件提速明显：

```powershell
scoop install aria2
```

**添加更多软件源**

- `main`：默认仓库，常用命令行工具
- `extras`：大量常用桌面软件
- `versions`：旧版本软件
- `java`：Java 相关工具

## 常用命令

| 命令 | 作用 |
|------|------|
| `scoop search <name>` | 搜索软件 |
| `scoop install <name>` | 安装软件（跨仓库用 `仓库名/软件名`，如 `extras/bzip3`） |
| `scoop uninstall <name>` | 卸载软件 |
| `scoop update <name>` / `scoop update *` | 更新指定软件 / 全部 |
| `scoop list` | 查看已安装列表 |
| `scoop bucket list` | 查看已添加的仓库 |
| `scoop status` | 检查可更新的软件 |
| `scoop cleanup *` | 清理旧版本，释放空间 |

## 常见问题

**提示"Administrator 账户无法安装"**

Scoop 默认不允许在管理员权限下安装。换一个**普通用户权限**的 PowerShell 窗口执行安装命令即可。

**`irm get.scoop.sh` 执行失败**

多半是访问不了 GitHub。可以先设置代理，或手动下载安装脚本后执行。

## 小结

装完并配好镜像源之后，就可以直接用 `scoop install extras/bzip3` 这类命令装软件了，剩下的交给命令行。
