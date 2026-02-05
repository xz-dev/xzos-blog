---
source_hash: "a85ae84a"
title: "Load Balancing V2Ray Multi-Protocol Multi-Server Setup with HAProxy"
pubDate: "2019-11-23"
description: "Implement load balancing across multiple protocols and servers using Docker, HAProxy, and V2Ray's Dokodemo-door feature to automatically maintain a list of available nodes."
author: "xz-dev"
category: "Science Online"
tags: ["Docker", "HAProxy", "V2Ray", "Science Online"]
---

> V2Ray's built-in [load balancing](https://guide.v2fly.org/routing/balance2.html) strategy only offers random selection, which is clearly insufficient for unstable networks.
>
> [ShadowSocks can use HAProxy for load balancing](https://xzos.net/haproxy-shadowsocks/), but V2Ray supports multiple protocols, making this approach impractical.

> We can leverage Docker's features to create a network that uses HAProxy for load balancing while **automatically maintaining a list of available nodes** (utilizing HAProxy's health check feature and V2Ray's Dokodemo-door).

> **NOTE**: Almost all code in this article can be copied and used directly, but I strongly recommend reading the comments carefully.

<!--more-->

## Load Balancing Network Overview

![V2Ray Proxy Network Architecture](/images/blog/load-balancing-v2ray-with-haproxy-and-docker/v2ray-network-architecture.png)

HAProxy can handle TCP data streams and recently added [support for Socks](https://github.com/haproxy/haproxy/issues/82) (though I'm not sure how to configure it).

[V2Ray also supports TCP protocol](https://v2ray.com/chapter_02/transport/tcp.html).

Therefore, we can create multiple independent V2Ray Docker containers at the exit point to convert V2Ray's other protocols to TCP (or directly use HTTP proxy), then use HAProxy for load balancing.

## Cluster Configuration

> The code contains **extensive comments** (covering almost every parameter line), please read carefully.

### Docker Cluster Configuration

For convenience, we'll use Docker Compose for configuration.

/home/$USER/.config/v2ray/docker/docker-compose.yml

```yaml
version: "3"

services:
  v2ray:  # Entry proxy, the client that directly provides HTTP, Socks, and other proxy protocols to users
    image: v2ray/official  # Use V2Ray stable image
    container_name: v2ray  # Name the container V2Ray
    restart: unless-stopped  # Auto-start on boot
    depends_on:
      - haproxy  # Start after HAProxy
    ports:
      - "127.0.0.1:1080:1080"  # Open TCP protocol access for Docker container on local port 1080
      - "127.0.0.1:1080:1080/udp"  # UDP protocol access for local port 1080
      - "8118:8080"  # Open TCP access for LAN on port 8118
      - "8118:8080/udp"  # Open UDP access for LAN on port 8118
    volumes:
      - /home/$USER/.config/v2ray/docker/v2ray/config.json:/etc/v2ray/config.json  # Map the corresponding config file from host to Docker container
    networks:
      - app-network  # Use custom Docker network named app-network

  # Explained parameters should be understood by comparison
  haproxy:
    image: haproxy
    container_name: haproxy
    restart: unless-stopped
    expose:
      - "8388"  # Allow port 8338 access initiated within app-network https://docs.docker.com/compose/compose-file/#expose
    ports:
      - "127.0.0.1:8080:8080"  # Port mapping for web management page
    volumes:
      - /home/$USER/.config/v2ray/docker/haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    networks:
      - app-network

  v2ray_out_0_tcp:  # Handle exit traffic, sending load-balanced TCP traffic to corresponding servers using other protocols
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
  app-network:  # Custom Docker network
    driver: bridge  # Bridge network
    driver_opts:
      com.docker.network.bridge.name: v2ray_bridge  # Custom name for bridge (default is random string), convenient for host firewall management
```

### V2Ray Entry Configuration

This section can be partially referenced from [Docker Deployment of V2Ray](https://xzos.net/docker-deploy-v2ray/)

We'll use V2Ray's TCP protocol as the intermediate protocol (convenient for HAProxy load balancing).

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
            "//": "Docker's internal routing will resolve 'haproxy' to the correct IP address",
            "port": 8388,
            "//": "The demo HAProxy config here uses port 8388",
            "users": [
              {
                "alterId": 64,
                "id": "2279f418-5be1-48db-92e8-c80eae89ee28",
                "//": "Used for internal network communication between containers, remember to delete comments",
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
        "//": " Enabling mux here is useless, but single-host mux can significantly improve speed, this should be configured at the exit point"
      }
    },
    {
      "protocol": "freedom",
      "tag": "direct",
      "settings": {}
    }
  ],
  "routing": {
    "//": "Configure routing as per your usual habits, like global proxy or bypassing mainland websites",
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

### HAProxy Load Balancing Configuration

This configuration can be referenced from [Using HAProxy to Accelerate ShadowSocks](https://xzos.net/haproxy-shadowsocks/)

HAProxy health check references: [HAProxy Advanced Usage Tips](https://blog.yuanbin.me/posts/2018-06/2018-06-30_21-26-14/), [Official Documentation](https://www.haproxy.com/documentation/aloha/10-0/traffic-management/lb-layer7/health-checks/#check-any-service)

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
    # Here v2ray_out_0_tcp will be automatically resolved to the correct IP by Docker
    # check enables monitoring, port 80 uses port 80 for availability monitoring
    server server2_name v2ray_out_0_quic:1080 check port 80
    server server3_name v2ray_out_1_tcp:1080 check port 80
    server server4_name v2ray_out_2_tcp:1080 check port 80

#---------------------------------------------------------------------
listen admin_stats  # Web management page
    bind 0.0.0.0:8080  # If you followed the same port mapping earlier, access http://127.0.0.1:8080/haproxy after starting containers
    mode http
    log 127.0.0.1 local0 err
    stats refresh 10s
    stats uri /haproxy
    stats realm welcome login\\ Haproxy
    stats hide-version
    stats admin if TRUE
```

### V2Ray Exit Configuration

Configurations are similar, using v2ray_out_0_tcp as an example.

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
            "//": "Fill in your own UUID for intermediate V2Ray TCP protocol within Docker network",
            "alterId": 64,
            "security": "none",
            "level": 0
          }
        ]
      }
    },
    {
      "protocol": "dokodemo-door",
      "//": "Use dokodemo-door to forward 204 traffic to Google for node availability monitoring",
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
            "//": "Fill in your server's IP and port",
            "users": [
              {
                "alterId": 64,
                "id": "8a21a0a7-6392-4f96-a6f4-22a792bd1baf",
                "//": "Fill in your own UUID for accessing the server",
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
        "//": "We can aggregate TCP connections at the exit point, tests show significant improvement on slow networks, proxy network becomes more stable https://guide.v2fly.org/advanced/mux.html",
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
    "//": "We've already configured routing in V2Ray entry config, routing here can be omitted for efficiency, similar to server-side, I included it just for comments 2333",
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

### Running the Cluster

> The following commands **must** be executed in the **same directory** as docker-compose.yml to work properly

```bash
docker-compose up -d  # Run cluster, "-d" runs in background. For debugging, omit "-d"
```

```bash
docker-compose stop  # Stop cluster
```

## Conclusion

Docker configuration is flexible and convenient, making it an excellent application container.

Two main points to note here:

- The [expose parameter](https://docs.docker.com/compose/compose-file/#expose) in Docker Compose configuration
- Docker Compose uses service names for routing, e.g., "services" at the beginning of docker-compose.yml (search the page if you can't find it)