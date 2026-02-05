---
source_hash: "7923e9a4"
title: "Deploying V2Ray with Docker"
pubDate: "2019-05-18"
description: "A comprehensive guide to deploying V2Ray using Docker containers, including multi-protocol configuration, port mapping, and automatic update services."
author: "xz-dev"
category: "Science Online"
tags: ["Docker", "V2Ray", "Arch Linux"]
---

> There are limited Chinese resources on Docker deployment for V2Ray. Here's some reference material.

## Installing Docker Service

1. Install Docker using package manager (using pacman as example): `sudo pacman -S docker`
2. Obtain Docker operation permissions (refer to [Docker Wiki](https://docs.docker.com/install/linux/linux-postinstall/)):
   ```bash
   sudo groupadd docker
   sudo usermod -aG docker $USER
   ```
3. Start Docker service:
   ```bash
   sudo systemctl enable docker
   sudo systemctl start docker
   ```

## Installing V2Ray (Docker Container)

> Note: v2ray/official is deprecated.

1. Download V2Ray container:
   ```bash
   docker pull v2fly/v2fly-core
   ```

### V2Ray Configuration File

Recommended location for V2Ray config file: `/home/$USER/.config/v2ray/config.json` (can be elsewhere)

- V2Ray inbound rules should point to 0.0.0.0 (as shown below), with default port set to 1080

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

- V2Ray Multi-protocol Proxy

V2Ray supports multiple inbound protocols. References:

1. [V2Ray wiki](https://v2ray.com/chapter_02/01_overview.html)
2. [GitHub issues](https://github.com/v2ray/v2ray-core/issues/603)

Example with HTTP and SOCKS5:

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

### Running V2Ray Container

- Single protocol single port

```bash
docker run -dit -d \
   --restart unless-stopped \  # Auto-start container on boot
   --name v2ray \  # Set container name
   -v /home/xz/.config/v2ray/config.json:/etc/v2ray/config.json \  # File mapping
   -p 127.0.0.1:1080:1080 \  # Network port mapping to localhost, can map to other IP if needed
   v2fly/v2fly-core \
   v2ray -config=/etc/v2ray/config.json
```

- Multi-protocol multi-port (example with HTTP and SOCKS5 above)

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

## Installing Docker Container Auto-update Service (Optional)

- Install [Watchtower](https://github.com/v2tec/watchtower):

```bash
docker pull v2tec/watchtower
```

- Run Watchtower

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  v2tec/watchtower
```