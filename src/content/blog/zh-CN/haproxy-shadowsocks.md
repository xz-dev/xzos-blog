---
source_hash: "68d5c419"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "HAProxy 与 ShadowSocks"
pubDate: "2018-06-27"
description: "使用 HAProxy 对多台 ShadowSocks 服务器进行负载均衡，实现带宽聚合和加速访问的配置指南。"
author: "xz-dev"
category: "科学上网"
tags: ["HAProxy", "ShadowSocks"]
---

> - 自架设的 ShadowSocks 总不能跑满带宽，在下载大文件时就很缓慢
> - 有多台 shadowsocks 服务器，只能用一个有些浪费资源
>
> 面对以上情况， HAProxy 为我们提供了一种解决方案

## 安装 HAProxy (以Fedora为例)

```bash
sudo dnf install haproxy
```

## 配置 HAProxy

### 1. 进入配置文件夹

```bash
ls /etc/haproxy/
```

### 2. 备份配置文件 (可选)

```bash
sudo cp haproxy.cfg haproxy.cfg.bak
```

### 3. 编辑配置文件 (/etc/haproxy)

```
defaults
    mode tcp
    option dontlognull
    timeout connect 10s
    timeout client 1m
    timeout server 1m

#---------------------------------------------------------------------

frontend shadowsocks-in
    bind *:8388
    default_backend shadowsocks-out

#---------------------------------------------------------------------

backend shadowsocks-out
    balance roundrobin
    server server1_name 104.224.152.169:2000
    server server2_name 67.218.134.185:2000
    # 自己替换IP和端口
```

## 修改 shadowsocks 密码

经过 HAProxy 的 shadowsocks 服务器密码需要相同

## 配置 shadowsocks 客户端

- ip地址：配置为127.0.0.1
- 端口： HAProxy的端口

## 设置开机自启

```bash
sudo setsebool -P haproxy_connect_any=1
sudo systemctl enable haproxy
```
