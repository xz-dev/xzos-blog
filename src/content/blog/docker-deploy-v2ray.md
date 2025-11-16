---
title: "Docker 部署 V2Ray"
pubDate: "2019-05-18"
description: "使用 Docker 容器部署 V2Ray 的完整指南，包括多协议配置、端口映射和自动更新服务。"
author: "xz-dev"
category: "科学上网"
tags: ["Docker", "V2Ray", "Arch Linux"]
---

> Docker 部署 V2Ray 中文资料尚少，这里提供一些参考

## 安装docker服务

1. 使用包管理（以 pacman 为例）安装docker：`sudo pacman -S docker`
2. 获取docker操作权限（参考 [Docker Wiki](https://docs.docker.com/install/linux/linux-postinstall/)）：
   ```bash
   sudo groupadd docker
   sudo usermod -aG docker $USER
   ```
3. 启动docker服务：
   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

## 安装V2Ray（Docker容器）

> 注意：v2ray/official 已弃用。

1. 下载V2Ray容器：
   ```bash
   docker pull v2fly/v2fly-core
   ```

### V2Ray 配置文件

推荐将 V2Ray配置文件放在 `/home/$USER/.config/v2ray/config.json`（也可以在其他地方）

- V2Ray配置文件入站规则需指向 0.0.0.0（如下）端口默认设置为1080

```json
"inbounds": [
    {
        "port": 1080,
        "listen": "0.0.0.0",
        "protocol": "socks",
        "sniffing": {
            "enabled": true,
            "destOverride": [
                "http",
                "tls"
            ]
        }
    }
],
```

- V2Ray 多协议代理

V2Ray 提供了多入站协议的功能，参考：

1. [V2Ray wiki](https://v2ray.com/chapter_02/01_overview.html)
2. [GitHub issues](https://github.com/v2ray/v2ray-core/issues/603)

以 HTTP 和 SOCKS5 为例：

```json
"inbounds": [
    {
        "port": 1080,
        "listen": "0.0.0.0",
        "protocol": "socks",
        "sniffing": {
            "enabled": true,
            "destOverride": [
                "http",
                "tls"
            ]
        }
    },
    {
        "listen": "0.0.0.0",
        "port": 8118,
        "protocol": "http",
        "settings": {
            "timeout": 0,
            "allowTransparent": false,
            "userLevel": 0
        }
    }
],
```

### 运行 V2Ray 容器

- 单协议单端口

```bash
docker run -dit -d \
   --restart unless-stopped \  # 开机自动运行容器
   --name v2ray \  # 设置容器名称
   -v /home/xz/.config/v2ray/config.json:/etc/v2ray/config.json \  # 文件映射
   -p 127.0.0.1:1080:1080 \  # 网络端口映射到本地，有需要可以映射到其他 IP
   v2fly/v2fly-core \
   v2ray -config=/etc/v2ray/config.json
```

- 多协议多端口（对应上面 HTTP 和 SOCKS5 的例子）

```bash
docker run -dit -d \
   --restart unless-stopped \
   --name v2ray \
   -v /home/xz/.config/v2ray/config.json:/etc/v2ray/config.json \
   -p 127.0.0.1:1080:1080 \
   -p 127.0.0.1:8118:8118 \
   v2fly/v2fly-core \
   v2ray -config=/etc/v2ray/config.json
```

## 安装 Docker 容器自动更新服务（可选）

- 安装 [Watchtower](https://github.com/v2tec/watchtower)：

```bash
docker pull v2tec/watchtower
```

- 运行 Watchtower

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  v2tec/watchtower
```
