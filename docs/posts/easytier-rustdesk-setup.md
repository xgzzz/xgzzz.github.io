---
title: EasyTier + RustDesk 自建远程控制方案
date: 2026-09-16
description: 用 EasyTier 组网配合自建 RustDesk 服务端，搭一套延迟低、无需公网 IP、数据自主可控的远程桌面方案，含完整部署步骤。
tags:
  - RustDesk
  - EasyTier
  - 自建服务
  - 远程桌面
---

# EasyTier + RustDesk 自建远程控制方案

前面写过 [RustDesk + ZeroTier 的搭法](/posts/rustdesk-zerotier)，也横向对比过 [ZeroTier / EasyTier / Tailscale 三种组网方案](/posts/easytier-zerotier-tailscale)。这篇把方案落地到 EasyTier，记录完整的部署步骤。

## 一、方案概述

RustDesk 配合 EasyTier 组网，实现全自建远程控制，延迟低、无需公网 IP、数据完全自主可控。相比此前使用的 ZeroTier 方案，EasyTier 在国内网络环境下具有更优秀的 P2P 打洞能力和更低的中继延迟。

EasyTier 是一款由 Rust 和 Tokio 驱动的开源去中心化异地组网工具，支持 UDP 和 IPv6 穿透，即使在 NAT4-NAT4 的复杂网络环境下也能建立稳定的 P2P 连接。RustDesk 则提供远程桌面控制能力，两者配合可以实现：

- **网络层**：EasyTier 建立虚拟局域网，所有设备通过虚拟 IP 互相通信
- **应用层**：RustDesk 提供远程桌面连接，通过 EasyTier 虚拟 IP 直连

## 二、环境准备

### 2.1 设备清单

| 设备 | 角色 | 系统 |
|------|------|------|
| 公司电脑 | RustDesk 服务端 + 被控端 | Windows/Linux |
| 手机 | RustDesk 控制端 | Android |
| （可选）云服务器 | EasyTier 中继节点 | Linux |

### 2.2 EasyTier 安装

**Linux（推荐）**：

```bash
curl -fsSL "https://github.com/EasyTier/EasyTier/blob/main/script/install.sh?raw=true" | sudo bash -s install
```

**Windows（推荐，以管理员权限运行）**：

```powershell
irm "https://github.com/EasyTier/EasyTier/blob/main/script/install.ps1?raw=true" | iex
```

**Android**：从 EasyTier 官方 Release 页面下载 APK 安装包。

## 三、EasyTier 组网

EasyTier 提供两种组网方式，可根据需求选择。

### 3.1 方式一：使用公共共享节点（零配置，推荐入门）

EasyTier 官方提供了免费的公共共享节点，无需自备公网服务器即可快速组网。节点间会自动尝试 NAT 穿透并建立 P2P 直连，当 P2P 失败时数据将通过共享节点中继。

所有设备需要提供相同的 `--network-name` 和 `--network-secret` 作为网络唯一标识。

**电脑端（被控端）**：

```bash
sudo easytier-core -d --network-name myremote --network-secret mypassword -p tcp://public.easytier.top:11010
```

**手机端**：打开 EasyTier App，填写相同的网络名称和密码，公共节点填写 `tcp://public.easytier.top:11010`。

> `-d` 参数表示开启 DHCP 自动分配虚拟 IP，无需手动指定。

组网成功后，电脑端会获得一个虚拟 IP（如 `10.144.144.1`），在 EasyTier 日志或 Web 控制台中可以查看。

### 3.2 方式二：自建中继节点（性能最优，需云服务器）

如果你有一台具有公网 IP 的云服务器，可以自建中继节点，获得最佳延迟和稳定性。

**1. 在云服务器上启动共享节点**

EasyTier 的共享节点启动非常简单，无需任何参数即可作为公共服务器运行（无需 root 权限）：

```bash
easytier-core
```

如果希望指定监听端口（推荐，便于防火墙管理）：

```bash
easytier-core --listeners udp://0.0.0.0:7000
```

**2. 各设备连接到自建节点**

在电脑和手机上，将 `-p` 参数指向你的云服务器 IP 和端口：

```bash
sudo easytier-core -d --network-name myremote --network-secret mypassword -p udp://你的云服务器IP:7000
```

**3. 防火墙配置**

确保云服务器防火墙和云厂商安全组中放行 EasyTier 使用的 UDP 端口（如 7000）。

> **提示**：可以同时指定多个 `-p` 参数连接到多个共享节点，当其中一个节点失效时，节点间依然可以使用其他存活节点通信。

## 四、部署 RustDesk 服务端

在被控端电脑上部署 RustDesk Server（hbbs 和 hbbr）。

### 4.1 Docker 部署（推荐）

```bash
# 安装 Docker
bash <(wget -qO- https://get.docker.com)

# 创建目录并下载编排文件
mkdir -p ~/rustdesk-server && cd ~/rustdesk-server
wget rustdesk.com/oss.yml -O compose.yml
sudo docker compose up -d
```

> 使用 Docker Compose 时必须使用 `network_mode: "host"`，以确保授权正常工作。

### 4.2 获取服务器公钥

服务启动后，公钥会自动生成在数据目录中：

```bash
cat ~/rustdesk-server/data/id_ed25519.pub
```

复制输出的公钥内容，客户端配置需要用到。

### 4.3 防火墙配置

如果安装了 UFW，使用以下命令放行 RustDesk 所需端口：

```bash
ufw allow 21114:21119/tcp
ufw allow 21116/udp
sudo ufw enable
```

核心端口说明：21115（NAT 探测）、21116 TCP/UDP（注册与心跳）、21117（中继转发）。

## 五、配置 RustDesk 客户端

在**每一台**需要使用 RustDesk 的设备上进行以下配置。

### 5.1 电脑端（被控端 + 控制端）

打开 RustDesk 客户端，点击主界面 ID 旁边的菜单按钮 **[ ⋮ ]**，然后点击 **网络**：

| 配置项 | 填写内容 |
|--------|----------|
| **ID 服务器** | EasyTier 虚拟 IP，如 `10.144.144.1` |
| **中继服务器** | 通常留空，RustDesk 会自动推导 |
| **Key** | 粘贴服务器上 `id_ed25519.pub` 中的公钥内容 |

> 不需要填写中继地址，RustDesk 会自动推导。

### 5.2 手机端（控制端）

在 Android 手机上安装 RustDesk App，按相同步骤配置 ID 服务器（填写被控端电脑的 EasyTier 虚拟 IP）和 Key。

> **注意**：iOS 设备无法作为被控端，但可以作为控制端。

## 六、测试连接

1. 确保手机和电脑都已接入 EasyTier 组网，且能互相 Ping 通对方的虚拟 IP
2. 在电脑端 RustDesk 中记下本机 ID 和设置的密码
3. 在手机端 RustDesk 中输入该 ID，输入密码即可连接

**验证 P2P 直连**：在电脑上执行 `sudo easytier-cli peers` 查看连接状态，显示 `DIRECT` 为直连，`RELAY` 为中继。

## 七、优化建议

### 7.1 自建 Web 控制台

EasyTier 支持 Web 控制台管理节点。在启动时添加 `--config-server` 或 `-w` 参数即可将节点注册到 Web 控制台：

```bash
sudo easytier-core -d --network-name myremote --network-secret mypassword \
  -p tcp://public.easytier.top:11010 \
  -w udp://public.easytier.top:22020
```

然后访问 https://easytier.cn/web 注册账号并登录管理。

### 7.2 延迟优化

- **优先使用 UDP 协议**：EasyTier 支持 UDP 和 TCP 两种传输方式，在 UDP 不被运营商限制的情况下优先使用 UDP，延迟更低
- **就近部署中继节点**：如果使用自建节点，选择离你所在地区较近的云服务器机房
- **RustDesk 画质调整**：在远程会话中切换至"优化响应速度"模式，优先保障操作流畅度

### 7.3 安全加固

- **设置复杂的网络名称和密码**：`--network-name` 和 `--network-secret` 是网络唯一标识，建议使用复杂字符串
- **限制节点转发**：如果自建了共享节点，可通过 `--relay-network-whitelist` 参数限制只转发指定网络，避免为其他网络提供中继服务

## 八、方案对比

| 特性 | EasyTier + RustDesk | ZeroTier + RustDesk |
|------|---------------------|---------------------|
| 国内打洞成功率 | 高（NAT4-NAT4 可打通） | 一般 |
| 中继节点位置 | 可自建国内节点 | 官方节点在海外 |
| 延迟 | 低（P2P 直连） | 中继时较高 |
| 配置复杂度 | 低 | 低 |
| 免费额度 | 完全免费无限制 | 免费 50 台设备 |

EasyTier 相比 ZeroTier 在国内网络环境下具有明显的优势，特别是自建中继节点后，可以彻底解决中继延迟高的问题。建议先使用公共共享节点快速验证，如果体验良好即可长期使用；如果对延迟有更高要求，再自建国内中继节点。
