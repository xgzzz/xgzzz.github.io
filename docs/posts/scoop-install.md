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

> 如果第 3 步报网络错误（国内网络很常见），直接看文末 [遇到的问题记录](#yu-dao-de-wen-ti-ji-lu) 里的 Gitee 镜像安装脚本。

## 自定义安装路径（建议先设置）

**这一步建议在装 Scoop 之前就做**，原因是：Scoop 会把**每个软件的本体都装到 Scoop 目录下的 `apps` 子目录**里。装完一批软件后，目录大概是这个结构：

```text
D:\Scoop\
├── apps\        ← 所有软件的本体，一个软件一个目录（体积主要占在这）
├── buckets\     ← 软件仓库（main / extras 等）
├── cache\       ← 下载缓存，用久了会很大，可定期 scoop cache rm *
├── persist\     ← 需要长期保留的配置数据（不受版本更新影响）
└── shims\       ← 命令行入口，软链到 apps 里的可执行文件
```

不指定的话默认路径是 `C:\Users\你的用户名\scoop`，之后每次 `scoop install` 都在往 C 盘堆东西——像 JDK、Node、Python 这类动辄几百 MB 的装几个就很可观了。

而且**装完再改比较麻烦**：环境变量一改，已经装好的软件就找不着了，得重装或者手动迁移。所以第一次安装时顺手指定好最省事。

**1. 以管理员身份**打开 PowerShell，设置环境变量（把 `D:\Scoop` 换成你要的路径）：

```powershell
[Environment]::SetEnvironmentVariable('SCOOP', 'D:\Scoop', 'User')
```

> 需要"全局安装"（`scoop install -g`，供所有用户使用）的话，额外设置 `SCOOP_GLOBAL` 变量，全局软件会装到它指向的目录下。

**2.** 关掉当前窗口，**重新打开一个普通用户的 PowerShell**，再执行上面的安装命令。Scoop 会自动识别 `SCOOP` 变量，装到你指定的位置。

**确认装到哪了**：

```powershell
$env:SCOOP          # 输出你设置的路径；为空说明走默认，软件会进 C 盘
```

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

多半是访问不了 GitHub。可以先设置代理，或手动下载安装脚本后执行。具体报错和替代方案见下面一节。

## 遇到的问题记录

### `irm get.scoop.sh | iex` 报"基础连接已经关闭"

**现象**：执行安装命令时如下报错，Scoop 装不上：

```text
PS C:\Users\你的用户名> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
PS C:\Users\你的用户名> irm get.scoop.sh | iex
irm : 基础连接已经关闭: 接收时发生错误。
所在位置 行:1 字符: 1
+ irm get.scoop.sh | iex
+ ~~~~~~~~~~~~~~~~
    + CategoryInfo          : InvalidOperation: (System.Net.HttpWebRequest:HttpWebRequest) [Invoke-RestMethod]，WebException
    + FullyQualifiedErrorId : WebCmdletWebResponseException,Microsoft.PowerShell.Commands.InvokeRestMethodCommand
```

**原因**：安装脚本托管在 GitHub，国内访问常常不稳定，TLS 连接会在传输中途被掐断，PowerShell 就报这个错。注意执行策略那条命令是成功了的，**问题出在下载，不在权限**。

**解决**：改用社区维护的 **Gitee 镜像安装脚本**：

```powershell
irm https://gitee.com/happy-peter/InstallScoop/raw/master/install.ps1 | iex
```

装好之后，别忘了再按前面「[配置国内镜像源](#pei-zhi-guo-nei-jing-xiang-yuan-tui-jian)」那节把软件源也换成 Gitee，否则后面 `scoop install` 还是会去 GitHub 拉，一样会卡。

> 其他可选办法：挂代理后再跑原命令；或者用浏览器打开 `https://get.scoop.sh` 把脚本存成 `.ps1` 后本地执行。

## 小结

装完并配好镜像源之后，就可以直接用 `scoop install extras/bzip3` 这类命令装软件了，剩下的交给命令行。
