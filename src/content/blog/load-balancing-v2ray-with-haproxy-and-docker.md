---
title: "V2Ray 多协议多服务器情况使用 HAProxy 负载均衡"
pubDate: "2019-11-23"
description: "使用 Docker、HAProxy 和 V2Ray 任意门功能实现多协议多服务器的负载均衡，自动维护可用节点列表。"
author: "xz-dev"
category: "科学上网"
tags: ["Docker", "HAProxy", "V2Ray", "科学上网"]
---

> V2Ray 自带的 [负载均衡](https://guide.v2fly.org/routing/balance2.html) 策略只有随机选择,对于不稳定的网络而言，显然是不够的
>
> [ShadowSocks 可以使用 HAProxy 进行负载均衡](https://xzos.net/haproxy-shadowsocks/)，但是 V2Ray 具有多种协议，显然是不可行的

> 我们可以利用 Docker 的特性完成一个使用 HAProxy 进行负载均衡且可以**自动维护可用节点**列表（利用 HAProxy 健康检查功能 与 V2Ray 任意门）的网络

> **NOTE**：这篇文章所有代码几乎全部复制即可用，但是我还是强烈建议仔细阅读注释

<!--more-->

## 负载均衡网络概述

![V2Ray 代理网络架构](/images/blog/load-balancing-v2ray-with-haproxy-and-docker/v2ray-network-architecture.png)

HAProxy 可以处理 TCP 数据流，最近也添加了 [对 Socks 的支持](https://github.com/haproxy/haproxy/issues/82)（尽管我不知道怎么配置）

[V2Ray 也支持 TCP 协议](https://v2ray.com/chapter_02/transport/tcp.html)

所以，我们可以在出口处创建多个独立的 V2Ray Docker 容器用来把 V2Ray 的其他协议都转换为 TCP 协议（或者直接使用 HTTP 代理），然后在使用 HAProxy 对其进行负载均衡。

## 集群配置

> 代码中有**大量注释**（几乎包含每一行参数），请仔细阅读

### Docker 集群配置

这里为了方便。我们使用 Docker Compose 进行配置

/home/$USER/.config/v2ray/docker/docker-compose.yml

```yaml
version: "3"

services:
  v2ray:  # 入口代理，也就是为用户直接提供 HTTP、Socks 等代理协议的客户端
    image: v2ray/official  # 使用 V2Ray 稳定版镜像
    container_name: v2ray  # 为容器命名为 V2Ray
    restart: unless-stopped  # 开机自启
    depends_on:
      - haproxy  # 待 HAProxy 启动后再启动
    ports:
      - "127.0.0.1:1080:1080"  # 为 Docker 容器打开 1080 本地端口的 TCP 协议访问
      - "127.0.0.1:1080:1080/udp"  # 1080本地端口的 UDP 协议访问
      - "8118:8080"  # 为局域网打开 8118 端口的 TCP 访问
      - "8118:8080/udp"  # 为局域网打开 8118 端口的 UDP 访问
    volumes:
      - /home/$USER/.config/v2ray/docker/v2ray/config.json:/etc/v2ray/config.json  # 将宿主机上相对应的配置文件映射到 Docker 容器中
    networks:
      - app-network  # 使用名为app-network 的自定义 Docker 网络

  # 解释过的参数请对照理解
  haproxy:
    image: haproxy
    container_name: haproxy
    restart: unless-stopped
    expose:
      - "8388"  # 允许在 app-network 网络中发起的 8338 端口访问 https://docs.docker.com/compose/compose-file/#expose
    ports:
      - "127.0.0.1:8080:8080"  # 为网络管理页面做 8080 端口映射
    volumes:
      - /home/$USER/.config/v2ray/docker/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    networks:
      - app-network

  v2ray_out_0_tcp:  # 处理出口流量，也就是把负载均衡过的 TCP 流量用其他协议发给对应的服务器
    image: v2ray/official
    container_name: v2ray_out_0_tcp
    restart: unless-stopped
    expose:
      - "80"
      - "1080"
    volumes:
      - /home/$UAER/.config/v2ray/docker/v2ray/config_0_tcp.json:/etc/v2ray/config.json
    networks:
      - app-network

  v2ray_out_0_quic:
    image: v2ray/official
    container_name: v2ray_out_0_quic
    restart: unless-stopped
    expose:
      - "80"
      - "1080"
    volumes:
      - /home/$USER/.config/v2ray/docker/v2ray/config_0_quic.json:/etc/v2ray/config.json
    networks:
      - app-network

  v2ray_out_1_tcp:
    image: v2ray/official
    container_name: v2ray_out_1_tcp
    restart: unless-stopped
    expose:
      - "80"
      - "1080"
    volumes:
      - /home/$USER/.config/v2ray/docker/v2ray/config_out_1_tcp.json:/etc/v2ray/config.json
    networks:
      - app-network

  v2ray_out_2_tcp:
    image: v2ray/official
    container_name: v2ray_out_2_tcp
    restart: unless-stopped
    expose:
      - "80"
      - "1080"
    volumes:
      - /home/$USER/.config/v2ray/docker/v2ray/config_2_tcp.json:/etc/v2ray/config.json
    networks:
      - app-network

networks:
  app-network:  # 自定义一个 Docker 网络
    driver: bridge  # 网桥网络
    driver_opts:
      com.docker.network.bridge.name: v2ray_bridge  # 为网桥自定义一个名字（不设置就是一个随机的字符串），方便主机防火墙管理
```

### V2Ray 入口配置

这一部分可以部分参考 [Docker 部署 V2Ray](https://xzos.net/docker-deploy-v2ray/)

我们使用 V2Ray 的 TCP 协议作为中间协议（方便 HAProxy 负载均衡）

/home/$USER/.config/v2ray/docker/v2ray/config.json

```json
{
  "inbounds": [
    {
      "port": 1080,
      "listen": "0.0.0.0",
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    },
    {
      "listen": "0.0.0.0",
      "port": 8080,
      "protocol": "http",
      "settings": {
        "timeout": 0,
        "allowTransparent": false,
        "userLevel": 0
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vmess",
      "tag": "proxy",
      "settings": {
        "vnext": [
          {
            "address": "haproxy",
            "//": "Docker 内部的路由会把 haproxy 解析为正确的 IP 地址",
            "port": 8388,
            "//": "这里的演示用 HAProxy 配置文件用的是 8388 端口",
            "users": [
              {
                "alterId": 64,
                "id": "2279f418-5be1-48db-92e8-c80eae89ee28",
                "//": "用于容器集群内部的网络通讯，注释记得删了",
                "security": "auto"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp"
      },
      "mux": {
        "enabled": false,
        "concurrency": 32,
        "//": " 在这里开 mux 没有用，但是单主机 mux 可以明显提高速度，这种情况下应该在出口端配置 mux"
      }
    },
    {
      "protocol": "freedom",
      "tag": "direct",
      "settings": {}
    }
  ],
  "routing": {
    "//": "路由就按照自己平常的习惯配置，比如全局代理还是绕过大陆网址什么的",
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "outboundTag": "proxy",
        "domain": ["google.cn"]
      },
      {
        "type": "field",
        "outboundTag": "direct",
        "domain": [
          "geosite:cn",
          "baidupan.com",
          "lanzous.com"
        ]
      },
      {
        "type": "field",
        "outboundTag": "direct",
        "ip": ["geoip:private", "geoip:cn", "192.168.0.0/24"]
      }
    ]
  }
}
```

### HAProxy 负载均衡配置

这一部分配置可以参考 [用 HAProxy 为 ShadowSocks 加速](https://xzos.net/haproxy-shadowsocks/)

HAProxy 健康检查参考资料：[HAProxy 进阶使用技巧](https://blog.yuanbin.me/posts/2018-06/2018-06-30_21-26-14/)，[官方文档](https://www.haproxy.com/documentation/aloha/10-0/traffic-management/lb-layer7/health-checks/#check-any-service)

/home/$USER/.config/v2ray/docker/haproxy/haproxy.cfg

```
defaults
    mode tcp
    option dontlognull
    timeout connect 10s
    timeout client 1m
    timeout server 1m

#---------------------------------------------------------------------
frontend v2ray-in
    bind 0.0.0.0:8388
    default_backend v2ray-out

#---------------------------------------------------------------------
backend v2ray-out
    balance leastconn
    option httpchk GET http://google.com/generate_204 HTTP/1.1\\r\\nHost:\\ google.com\\r\\n
    server server1_name v2ray_out_0_tcp:1080 check port 80
    # 这里的 v2ray_out_0_tcp，Docker 会自动解析为正确的 IP
    # check 表示启用监控，port 80 表示使用 80 端口进行可用性监控
    server server2_name v2ray_out_0_quic:1080 check port 80
    server server3_name v2ray_out_1_tcp:1080 check port 80
    server server4_name v2ray_out_2_tcp:1080 check port 80

#---------------------------------------------------------------------
listen admin_stats  # 网页管理页面
    bind 0.0.0.0:8080  # 如果在前面你是跟我相同配置的端口映射，启动容器后访问 http://127.0.0.1:8080/haproxy
    mode http
    log 127.0.0.1 local0 err
    stats refresh 10s
    stats uri /haproxy
    stats realm welcome login\\ Haproxy
    stats hide-version
    stats admin if TRUE
```

### V2Ray 出口配置

配置大同小异，以 v2ray_out_0_tcp 为例

/home/$UAER/.config/v2ray/docker/v2ray/config_0_tcp.json

```json
{
  "inbounds": [
    {
      "port": 1080,
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "2279f418-5be1-48db-92e8-c80eae89ee28",
            "//": "这里填你自己的 Docker 网络内部的中间 V2Ray TCP 协议用的 UUID",
            "alterId": 64,
            "security": "none",
            "level": 0
          }
        ]
      }
    },
    {
      "protocol": "dokodemo-door",
      "//": "这里利用任意门将 204 流量转发到 google 实现对节点可用性的监控",
      "port": 80,
      "settings": {
        "address": "google.com",
        "port": 80,
        "network": "tcp,udp",
        "timeout": 300
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vmess",
      "tag": "proxy",
      "settings": {
        "vnext": [
          {
            "address": "example.com",
            "port": 1080,
            "//": "这里填你自己的服务器的 IP 和端口",
            "users": [
              {
                "alterId": 64,
                "id": "8a21a0a7-6392-4f96-a6f4-22a792bd1baf",
                "//": "这里填你自己访问服务器用的 UUID",
                "security": "auto"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "tcp"
      },
      "mux": {
        "//": "我们可以在出口处聚合一下 TCP 连接，实测在低速网络下效果非常显著，代理网络能够更加稳定 https://guide.v2fly.org/advanced/mux.html",
        "enabled": true,
        "concurrency": 64
      }
    },
    {
      "protocol": "freedom",
      "tag": "direct",
      "settings": {}
    }
  ],
  "routing": {
    "//": "我们已经在 V2Ray 入口配置里配置了路由，这里的路由可以不设置，以提高效率，就好象服务端一样，我这里有只是为了放注释 2333",
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "type": "field",
        "outboundTag": "direct",
        "ip": ["geoip:private"]
      }
    ]
  }
}
```

### 运行集群

> 以下命令**必须**要在 docker-compose.yml 文件**相对应的目录**下才能正常执行

```bash
docker-compose up -d  # 运行集群，"-d"是后台运行。如果要调试代码，不加"-d"即可
```

```bash
docker-compose stop  # 停止集群
```

## 结语

Docker 配置灵活方便，是不错的应用容器。

这里主要需要注意两点：

- Docker Compose 配置里的 [expose 参数](https://docs.docker.com/compose/compose-file/#expose)
- Docker Compose 以服务名作为路由，例如 docker-compose.yml 配置文件开头的 "services"（找不到可以搜索一下该网页）
