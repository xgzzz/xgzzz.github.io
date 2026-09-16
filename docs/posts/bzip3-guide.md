---
title: bzip3 压缩工具：安装与使用教程
date: 2026-09-16
description: bzip3 是 bzip2 的精神续作，压缩率与速度都更强，尤其擅长文本和源代码。这篇介绍它的原理、各平台安装方式与完整命令行用法。
tags:
  - bzip3
  - 压缩
  - 工具
---

# bzip3：比 bzip2 更强的压缩工具，安装与使用教程

bzip3 是 bzip2 的"精神续作"：一样擅长压文本和源代码，但压缩率更高、速度也更快。它由 Kamila Szewczyk 开发，仓库在 [github.com/iczelia/bzip3](https://github.com/iczelia/bzip3)，当前版本 v1.5.4，整体以 **LGPLv3** 授权（其中用到的 libsais 是 Apache 2.0）。

## 它做了什么

bzip3 的压缩流程是：**RLE + Lempel-Ziv 预测 → Burrows-Wheeler 变换 → 算术编码**。

更具体地说，官方 README 提到三个关键点：

- **order-0 上下文混合熵编码器**（算术编码，替代 bzip2 的 Huffman）
- **用后缀数组实现的快速 BWT**
- **LZ77 风格串匹配 + PPM 风格上下文建模**的 LZP 预处理

和祖先一样，**bzip3 的强项是文本和源代码**；对已经压缩过的数据（视频、图片、zip 包）基本没用。

## 和其他压缩工具比怎么样

官方 README 给了一组基准：把 Perl5 所有历史版本的源码打包成一个 tar（约 20GB 级别），分别压：

| 方法 | 压缩后大小（字节） |
|------|-------------------|
| LZMA（xz -9） | 2,056,645,240 |
| bzip2 -9 | 3,441,163,911 |
| **bzip3 -b 256** | **1,001,957,587** |
| **bzip3 -b 511** | **546,456,978** |
| Zstandard -16 | 3,076,143,660 |

解压耗时（机械硬盘）：

| 方法 | 解压时间 |
|------|---------|
| LZMA（xz） | 4 分 40 秒 |
| bzip2 | 9 分 22 秒 |
| **bzip3（并行）** | **4 分 06 秒** |
| Zstandard | 3 分 51 秒 |

结论很直观：**在这个语料上 bzip3 的体积明显小于 xz 和 zstd，解压也比 bzip2 快一倍多**。不过要注意，这是在文本语料上的结果，换成别的类型结论可能完全不同，别把它当成通用答案。

## 安装

### Linux

多数发行版已经收录，直接用包管理器：

```bash
# Arch
sudo pacman -S bzip3

# Debian / Ubuntu
sudo apt install bzip3

# Fedora
sudo dnf install bzip3
```

装了之后除了 `bzip3`，还会有 `bunzip3`、`bz3cat`、`bz3grep`、`bz3less`、`bz3more`、`bz3most` 这些配套命令。

### macOS

```bash
brew install bzip3
```

### 源码编译

```bash
# git clone 的话先执行（源码发布包不需要）
./bootstrap.sh

./configure
make
sudo make install
```

### Windows

官方没有提供 MSI 安装包，常见几种方式：

- **Scoop**：先 `scoop search bzip3` 确认仓库里有没有（在 extras 里的话就是 `scoop install extras/bzip3`）。Scoop 本身的安装可以参考 [Windows 安装 Scoop 教程](/posts/scoop-install)。
- **GitHub Releases**：到项目 Releases 页面看看有没有提供 Windows 构建
- **WSL**：在 WSL 里按上面的 Linux 方式装

> 官方提醒：Windows 和 32 位构建的性能可能明显低于 x64 Linux（clang13 下 x64 Linux 每线程约 17MiB/s 压缩、23MiB/s 解压）。

## 基本用法

### 压缩

```bash
bzip3 file.txt          # 生成 file.txt.bz3，默认保留原文件
bzip3 -e file.txt       # 同上，-e（编码）是默认行为
bzip3 -f file.txt       # 已存在 .bz3 时覆盖（默认不覆盖）
```

### 解压

```bash
bzip3 -d file.txt.bz3   # 解压，等价于 bunzip3
bunzip3 file.txt.bz3
```

### 输出到标准输出

```bash
bzip3 -c file.txt > out.bz3        # 压缩到 stdout
bzip3 -dc file.txt.bz3             # 解压到 stdout，等价于 bz3cat
bz3cat file.txt.bz3
```

不指定文件名时，bzip3 从标准输入读、往标准输出写，并且隐含 `-e`。所以可以直接接管道：

```bash
tar cf - somedir/ | bzip3 > somedir.tar.bz3
```

### 批量处理

默认最多接受两个文件名（一个输入、一个输出），要处理多个文件得加 `-B`：

```bash
bzip3 -Bd *.bz3         # 解压当前目录下所有 .bz3
```

### 校验与其他

```bash
bzip3 -t file.txt.bz3   # 校验压缩块是否有效
bzip3 -v file.txt       # 显示压缩统计信息
bzip3 --rm file.txt     # 压缩成功后删除原文件
```

## 参数一览

| 参数 | 作用 |
|------|------|
| `-e` / `-z` | 压缩（默认行为） |
| `-d` | 解压 |
| `-c` | 输出到标准输出 |
| `-b N` | 块大小，单位 MiB，范围 1–511，**默认 16** |
| `-j N` | 并行工作线程数，每线程处理一个块，默认 1 |
| `-B` | 批量模式，把每个参数都当输入文件 |
| `-f` | 覆盖已存在的输出文件 |
| `-k` | 保留输入文件（默认就是保留，仅为兼容其他压缩工具） |
| `--rm` | 成功后删除输入文件 |
| `-t` | 校验压缩块 |
| `-v` | 显示统计信息 |
| `-V` | 显示版本 |
| `-h` | 帮助 |
| `--` | 之后的参数都当文件名（处理以 `-` 开头的文件） |

## 注意事项

**块大小和内存**

- 内存占用约为 **6 × 块大小**。用 `-b 511` 时单线程就要 3GB 左右，多线程会成倍增长
- 块越大压缩率越好，但收益递减；**压缩和解压速度几乎不受块大小影响**
- **解压时需要的内存由压缩时的块大小决定** —— 给别人传文件时别把块设得过大，否则对方内存不够就打不开

**格式与兼容**

- 扩展名是 `.bz3`，和 `.bz2` / `.gz` / `.xz` 互不兼容，别指望用其他工具解压
- 文件头固定 9 字节开销，每个块 9–17 字节；小于 64 字节的块直接存字面量
- 随机数据最多膨胀约 0.8%
- 用 32 位 CRC 校验，能发现压缩数据是否损坏

**数据安全**

作者在 README 里明确写了免责声明：虽然经过了充分设计和测试，但算法复杂、存在极低频的特殊分支，**无法完全排除解压失败的可能**。别用它压缩唯一一份重要数据——至少留个备份。

## 小结

- 想压**文本、日志、源代码**，又不介意多花点 CPU：bzip3 值得一试，压缩率比 xz、zstd 都好
- 常规用法就三条：`bzip3 文件`、`bzip3 -d 文件.bz3`、`bzip3 -b 256 -j 8 大文件`
- 追求通用和速度还是选 zstd；bzip3 更适合"存档型"的冷数据
