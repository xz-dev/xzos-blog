---
source_hash: "f332198c"
title: "WebSocket+TLS+CDN+Web: Deploying V2Ray with Apache2"
pubDate: "2020-06-05"
description: "Detailed guide on configuring V2Ray's WebSocket+TLS+CDN+Web mode using Apache2 for secure and reliable proxy services."
author: "xz-dev"
category: "Science Internet"
tags: ["V2Ray", "Apache2", "WebSocket", "TLS", "CDN"]
---

> Many online tutorials contain errors - this article aims to provide corrections and comprehensive guidance.

This article references official documentation, [Plain Language Tutorial](https://toutyrater.github.io/advanced/wss_and_web.html), [Github issue](https://github.com/v2ray/v2ray-core/issues/747), and [https://ferrummagnus.com/2017/12/22/v2ray-websocket-tls-apache/](https://ferrummagnus.com/2017/12/22/v2ray-websocket-tls-apache/), but you don't need to check them.

Prerequisites: You have a server running Apache2 with an established blog.

My situation: The server IP hosting my blog was blocked by the Great Firewall, and I wanted to maintain domestic access while supporting international proxy services without changing the IP.

## Obtaining CDN Services

You may consider using [cloudflare](https://cloudflare.com/) as your CDN provider.

Specific steps won't be detailed here as there are many guides available online.

## Configuring Apache

We assume you already have a working V2Ray environment and Apache2 setup.

### 1. Enable the following Apache modules on your server

```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_wstunnel
sudo a2enmod proxy_http
sudo a2enmod rewrite
sudo a2enmod headers
```

### 2. Modify Apache configuration files

Locate your configuration files, typically in the /etc/apache2 directory.

Generally, you'll find sites-available (available configurations) and sites-enabled (enabled configurations) folders.

Navigate to sites-enabled and find your 443 configuration (HTTPS config file, e.g., 000-default-le-ssl.conf).

Add the following configuration between `<VirtualHost></VirtualHost>` tags:

```apache
<LocationMatch "/{ws_path}/">
	ProxyPass ws://127.0.0.1:{port}/{ws_path}/ upgrade=WebSocket
	ProxyAddHeaders Off
	ProxyPreserveHost On
	RequestHeader set Host %{HTTP_HOST}s
	RequestHeader set X-Forwarded-For %{REMOTE_ADDR}s
</LocationMatch>
```

For example, my configuration looks like this:

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

### 3. Restart Apache service

```bash
sudo systemctl restart apache2.service
```

At this point, visiting `https://<your-domain>/ray/` in your browser should display a "Bad Request" error, which is normal.

## Configuring V2Ray (referencing Plain Language Tutorial with modifications)

### V2Ray Configuration Files

#### Server V2Ray Configuration

```json
{
  "inbounds": [
    {
      "port": 1080,
      "listen":"127.0.0.1",//Only listen on 127.0.0.1 to prevent detection of open port 10000 from other machines (use 0.0.0.0 for Docker)
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
        "path": "/ray/" // Note: "/ray/"
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

#### Client V2Ray Configuration

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
          "path": "/ray/"  // Note: "/ray/"
        }
      }
    }
  ]
}
```

### Running V2Ray with Docker

> Reference: [Docker Deployment of V2Ray](https://xzos.net/docker-deploy-v2ray/)

```bash
docker run -dit --restart unless-stopped -d --name v2ray -v $HOME/.config/v2ray/config.json:/etc/v2ray/config.json -p 127.0.0.1:1080:1080 v2ray/official v2ray -config=/etc/v2ray/config.json
```

### Important Notes (modified from Plain Language Tutorial)

- V2Ray supports TLS1.3 ([https://github.com/v2ray/v2ray-core/issues/1678](https://github.com/v2ray/v2ray-core/issues/1678))
- Ensure wsSettings are identical between server and client - for V2Ray, `/ray` and `/ray/` are different

Finally, restart your V2Ray service and you're done!

Enjoy! :)

NOTE: **Recommended reading** [Client Load Balancing Tutorial](https://xzos.net/load-balancing-v2ray-with-haproxy-and-docker/)