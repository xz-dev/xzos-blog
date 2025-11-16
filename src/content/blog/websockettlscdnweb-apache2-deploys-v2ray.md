---
title: "WebSocket+TLS+CDN+Web，Apache2 部署V2Ray"
pubDate: "2020-06-05"
description: "详细介绍如何使用 Apache2 配置 V2Ray 的 WebSocket+TLS+CDN+Web 模式，实现安全可靠的代理服务。"
author: "xz-dev"
category: "科学上网"
tags: ["V2Ray", "Apache2", "WebSocket", "TLS", "CDN"]
---

> 网上教程或多或少有些错误，这里做一些完善、总结

这篇文章参考了官方文档、[白话文教程](https://toutyrater.github.io/advanced/wss_and_web.html)，[Github issue](https://github.com/v2ray/v2ray-core/issues/747) 和 [https://ferrummagnus.com/2017/12/22/v2ray-websocket-tls-apache/](https://ferrummagnus.com/2017/12/22/v2ray-websocket-tls-apache/)，但你完全没有必要去查看它们。

前提条件：你有一台使用 Apache2 建立了博客的服务器。

我的境遇：架设博客的服务器IP被墙，不想换IP且希望保持国内访问与支持国际代理服务。

## 获取CDN服务

你可以考虑选择 [cloudflare](https://cloudflare.com/) 作为你的CDN服务商。

具体步骤不再阐述，网上有很多。

## 配置 Apache

我们假设，你已经有了一个可以正常运行的V2Ray环境和Apache2。

### 1. 在服务器上开启以下 Apache 模组

```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_wstunnel
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
```

### 2. 修改Apache 配置文件

我们找到配置文件，一般在 /etc/apache2 文件夹下。

一般，我们可以在该目录下找到sites-available（可用的配置文件） 和 sites-enabled（启用的配置文件）

我们进入 sites-enabled，找到 443（即 HTTPS 配置文件，例如：000-default-le-ssl.conf）。

把以下配置加到 `<VirtualHost></VirtualHost>` 之间

```apache
<LocationMatch "/{ws_path}/">
	ProxyPass ws://127.0.0.1:{port}/{ws_path}/ upgrade=WebSocket
	ProxyAddHeaders Off
	ProxyPreserveHost On
	RequestHeader set Host %{HTTP_HOST}s
	RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
</LocationMatch>
```

例如，我的配置文件如下所示：

```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
        # The ServerName directive sets the request scheme, hostname and port that
        # the server uses to identify itself. This is used when creating
        # redirection URLs. In the context of virtual hosts, the ServerName
        # specifies what hostname must appear in the request's Host: header to
        # match this virtual host. For the default virtual host (this file) this
        # value is not decisive as it is used as a last resort host regardless.
        # However, you must set it for any further virtual host explicitly.
        #ServerName www.example.com

        ServerAdmin webmaster@localhost
        DocumentRoot /var/www/html

        # Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
        # error, crit, alert, emerg.
        # It is also possible to configure the loglevel for particular
        # modules, e.g.
        #LogLevel info ssl:warn

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined

        # For most configuration files from conf-available/, which are
        # enabled or disabled at a global level, it is possible to
        # include a line for only one particular virtual host. For example the
        # following line enables the CGI configuration for this host only
        # after it has been globally disabled with "a2disconf".
        #Include conf-available/serve-cgi-bin.conf


ServerName www.xzos.net
Include /etc/letsencrypt/options-ssl-apache.conf
ServerAlias xzos.net
SSLCertificateFile /etc/letsencrypt/live/www.xzos.net/fullchain.pem
SSLCertificateKeyFile /etc/letsencrypt/live/www.xzos.net/privkey.pem

<LocationMatch "/ray/">
        ProxyPass ws://127.0.0.1:1080/ray/ upgrade=WebSocket
        ProxyAddHeaders Off
        ProxyPreserveHost On
        RequestHeader set Host %{HTTP_HOST}s
        RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
</LocationMatch>
</VirtualHost>
</IfModule>
```

### 3. 重启 Apache 服务

```bash
sudo systemctl restart apache2.service
```

这时，你通过浏览器访问 `https://<你的域名>/ray/` 应该会显示 "Bad Request" 错误，这是正常的。

## 配置 V2Ray（参考白话文教程，但有所不同）

### V2Ray 配置文件

#### 服务器 V2Ray 配置

```json
{
  "inbounds": [
    {
      "port": 1080,
      "listen":"127.0.0.1",//只监听 127.0.0.1，避免除本机外的机器探测到开放了 10000 端口，docker运行需要0.0.0.0
      "protocol": "vmess",
      "settings": {
        "clients": [
          {
            "id": "b831381d-6324-4d53-ad4f-8cda48b30811",
            "alterId": 64
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
        "path": "/ray/" // 这里是 "/ray/"
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    }
  ]
}
```

#### 客户端 V2Ray 配置

```json
{
  "inbounds": [
    {
      "port": 1080,
      "listen": "127.0.0.1",
      "protocol": "socks",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      },
      "settings": {
        "auth": "noauth",
        "udp": false
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vmess",
      "settings": {
        "vnext": [
          {
            "address": "xzos.net",
            "port": 443,
            "users": [
              {
                "id": "b831381d-6324-4d53-ad4f-8cda48b30811",
                "alterId": 64
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "wsSettings": {
          "path": "/ray/"  // 这里是 "/ray/"
        }
      }
    }
  ]
}
```

### Docker 运行 V2Ray

> 可以参考 [Docker 部署 V2Ray](https://xzos.net/docker-deploy-v2ray/)

```bash
docker run -dit --restart unless-stopped -d --name v2ray -v $HOME/.config/v2ray/config.json:/etc/v2ray/config.json -p 127.0.0.1:1080:1080 v2ray/official v2ray -config=/etc/v2ray/config.json
```

### 注意事项（参考白话文教程，但有所不同）

- V2Ray 支持 TLS1.3（[https://github.com/v2ray/v2ray-core/issues/1678](https://github.com/v2ray/v2ray-core/issues/1678)）
- 请保持服务器和客户端的 wsSettings 严格一致，对于 V2Ray，`/ray` 和 `/ray/` 是不一样的

最后启动重启V2Ray服务即可

Enjoy！:)

NOTE：**推荐阅读** [客户端负载均衡教程](https://xzos.net/load-balancing-v2ray-with-haproxy-and-docker/)
