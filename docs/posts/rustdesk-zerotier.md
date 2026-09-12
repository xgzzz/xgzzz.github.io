---
title: RustDesk 与 ZeroTier 搭建自用服务器
date: 2026-09-12
tags:
  - RustDesk
  - ZeroTier
  - 自建服务
---

# RustDesk 与 ZeroTier 搭建自用服务器

## 方案：

**ZeroTier + RustDesk方式**

**ZeroTier：**局域网

**RustDesk：**中继服务器

| **方案** | **核心原理** | **优点** | **缺点** | **适合场景** |
| --- | --- | --- | --- | --- |
| **ZeroTier** | **虚拟局域网**：将所有设备加入一个虚拟网络，像在同一个局域网内直接通信。 | **配置极简**，无需公网IP，免费额度对个人完全够用，支持P2P直连，延迟低。 | 需要在**所有**访问端（手机、家里电脑）都安装客户端。 | **推荐首选**，适合个人长期、稳定的远程访问需求，如远程开发、访问NAS。 |

## 第一阶段：安装 ZeroTier

### **第一步：注册 ZeroTier 账号**

1. 访问 ZeroTier 官网：[https://www.zerotier.com/](https://www.zerotier.com/)
2. 点击右上角 **Sign Up** 注册账号
3. 推荐使用**邮箱注册**，避免后续服务依赖第三方账号
4. 注册完成后登录，进入控制台

> 💡 免费版支持 **10 台设备**、**1 个网络**，个人使用完全够用。

### **第二步：创建虚拟网络**

1. 在控制台点击 **Create A Network**
2. 系统会自动生成一个 **16 位的 Network ID**，例如 `a1b2c3d4e5f6g7h8`，记下这个 ID
3. 点击该 Network ID 进入网络配置页面
4. 关键配置项：
    - **Access Control**：设置为 `Private`（私有网络，新设备加入需要手动授权，更安全）
    - **IPv4 Auto-Assign**：选择自动分配网段，例如 `10.144.0.0/16` 或默认即可

### **第三步：在 Linux 虚拟机上安装客户端**

假设你的虚拟机系统是 Ubuntu/Debian，在虚拟机终端中执行以下命令。

#### **1. 安装 ZeroTier**

```powershell
curl -s https://install.zerotier.com | sudo bash
```

这条命令会自动下载并安装 ZeroTier One

#### **2. 加入网络（替换为你的实际 Network ID）**

```
sudo zerotier-cli join a1b2c3d4e5f6g7h8
```

执行成功后返回 `200 join OK`。

#### **3. 验证安装状态**

```
sudo zerotier-cli info
sudo zerotier-cli listnetworks
```

`info` 命令会显示 ZeroTier 的节点地址和版本信息。`listnetworks` 可以看到网络状态，刚加入时可能显示 `REQUESTING_CONFIGURATION`，需要等待授权。

#### **4. 设置开机自启（重要）**

```
sudo systemctl enable zerotier-one
sudo systemctl start zerotier-one
```

确保虚拟机重启后 ZeroTier 服务自动运行，否则远程连接会断开。

#### **5. 设置直连模式**

```powershell
sudo zerotier-cli peers
```

### **第四步：手机上安装 ZeroTier 客户端**

1、[https://www.zerotier.com/download/](https://www.zerotier.com/download/)

下载对应的安装包

2、打开软件之后，点击右上角SETTINGS，勾选“Allow mobile data”

3、点击“ADD NETWORK”，输入ZeroTier官网创建的**Network ID**

4、添加完成后，点击开关连接

5、打开开关后，官网会提示有设备接入，要点击授权 **Authorized**

6、授权成功后，手机会提示 Connected

7、左下角会提示你的device ID ，在官网会显示哪一个是你的设备

### **第五步：虚拟机中安装完 ZeroTier 后查看IP**

![查看 ZeroTier 分配的虚拟 IP](/images/rustdesk-zerotier/01.png)

这个就是注册的服务器地址，也能在官网看到，也需要授权

![在 ZeroTier 官网授权设备](/images/rustdesk-zerotier/02.png)

## 第二阶段：在虚拟机中部署 RustDesk 服务器

#### **2.1 安装 Docker**

```
bash <(wget -qO- https://get.docker.com)
```

#### **2.2 创建工作目录并下载编排文件**

```
mkdir -p ~/rustdesk-server && cd ~/rustdesk-server
wget rustdesk.com/oss.yml -O compose.yml
sudo docker compose up -d
```

这是 RustDesk 官方推荐的 Docker 部署方式，会自动启动 hbbs（ID 服务器）和 hbbr（中继服务器）两个容器。

#### **2.3 配置防火墙**

如果虚拟机启用了 UFW，需要放行以下端口：

```
ufw allow 21114:21119/tcp
ufw allow 21116/udp
sudo ufw enable
```

核心端口说明：21115（NAT 探测）、21116 TCP/UDP（注册与心跳）、21117（中继转发）。如果不需要网页客户端，21118/21119 可以保持关闭。

#### **2.4 获取服务器公钥**

服务启动后，公钥会自动生成在数据目录中：

```
cat ~/rustdesk-server/data/id_ed25519.pub
```

复制输出的公钥内容，后续客户端配置需要用到。

#### **2.5 验证服务状态**

```
docker ps
docker logs hbbs
```

确认 hbbs 和 hbbr 两个容器都处于运行状态。

## 第三阶段：配置 RustDesk 客户端

### **第一步：手机上安装客户端**

[https://github.com/rustdesk/rustdesk/releases/tag/1.4.9](https://github.com/rustdesk/rustdesk/releases/tag/1.4.9)

1、选择universal-signed.apk安装包

2、现在手机不允许安装rustdesk客户端，所以先打开手机开发者选项，关闭手机的启动优化或者高危监测预警

3、安装客户端

4、关闭开发者选项

5、每部手机都要安装

### **第二步：配置客户端连接自建服务器**

所有手机都配置下面的

1. **进入网络设置**：打开 RustDesk，点击底部导航栏的 **“设置” (Settings)**，然后选择 **“ID/中继服务器” (ID/Relay Server)**。
2. **填写服务器信息**：
    - **ID 服务器 (ID Server)**：填写你虚拟机的 **ZeroTier 虚拟 IP**（例如 `10.144.1.2`）。
    - **中继服务器 (Relay Server)**：**留空**。RustDesk 会自动推导，指向同一台服务器上的 hbbr 服务。
    - **API 服务器 (API Server)**：**留空**（自建 OSS 版无需填写）。
    - **Key**：粘贴你之前从服务器上获取的**公钥**内容（`id_ed25519.pub` 文件中的字符串）。
3. **保存配置**：点击 **“确定” (OK)** 保存。设置会自动生效，客户端会切换到你的自建服务器。

### **第三步：设置被控端权限（关键）**

如果你希望**手机A可以控制手机B**，那么**手机B（被控端）** 必须开启以下权限，否则只能看屏幕但无法操作。

- **开启屏幕共享**：在手机B的 RustDesk 底部导航栏点击 **“共享屏幕” (Share Screen)**，然后点击 **“启动服务”**。系统会弹出录屏授权提示，同意即可。**注意：每次重启 RustDesk 后都需要重新授权屏幕捕获权限**。
- **开启输入控制**：这是实现远程操作的关键。你需要前往手机的 **设置 → 无障碍 (Accessibility) → 已安装的服务**，找到 **“RustDesk Input”** 并开启它。
    - **部分手机提示**：如果因“受限设置”无法开启，可以尝试在手机的 **设置 → 应用 → RustDesk → 右上角菜单** 中，选择 **“允许受限设置” (Allow restricted settings)**。
- **文件传输权限（可选）**：如果需要远程管理手机文件，也需要在“共享屏幕”页面中开启“传输文件”权限。

### **第四步：开始连接**

1、两部手机都完成配置后，就可以进行测试了。

**2、获取被控端 ID**：在**手机B（被控端）** 的 RustDesk 主界面，会显示一个本机的 **ID** 和临时密码，记下它。

**3、发起连接**：在**手机A（控制端）** 的 RustDesk 主界面，输入手机B的 **ID**，点击连接。

**4、输入密码**：输入手机B上显示的密码，验证通过后即可开始远程控制。

5、可以修改成固定密码

## 注意事项

每次控制端要先连接 ZeroTier，再开始连接 RustDesk 手机客户端。第一次连接之后，连接记录会显示对方在线（有个绿色的小点，说明 ZeroTier 连线成功）。此外，对方手机要保持亮屏，尽可能不要锁屏。
