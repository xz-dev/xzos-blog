---
source_hash: "68d5c419"
title: "HAProxy with ShadowSocks"
pubDate: "2018-06-27"
description: "A configuration guide for using HAProxy to load balance multiple ShadowSocks servers, achieving bandwidth aggregation and accelerated access."
author: "xz-dev"
category: "Science Online"
tags: ["HAProxy", "ShadowSocks"]
---

> - Self-hosted ShadowSocks often fails to utilize full bandwidth, resulting in slow downloads for large files
> - Having multiple shadowsocks servers but only using one wastes resources
>
> HAProxy provides a solution for these scenarios

## Installing HAProxy (Fedora as example)

```bash
sudo dnf install haproxy
```

## Configuring HAProxy

### 1. Enter configuration directory

```bash
ls /etc/haproxy/
```

### 2. Backup configuration file (optional)

```bash
sudo cp haproxy.cfg haproxy.cfg.bak
```

### 3. Edit configuration file (/etc/haproxy)

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
    # replace with your own IPs and ports
```

## Modify ShadowSocks password

ShadowSocks servers behind HAProxy must use the same password

## Configure ShadowSocks client

- IP address: Set to 127.0.0.1
- Port: HAProxy's port

## Enable auto-start on boot

```bash
sudo setsebool -P haproxy_connect_any=1
sudo systemctl enable haproxy
```