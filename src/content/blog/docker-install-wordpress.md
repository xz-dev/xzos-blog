---
title: "Docker 安装 WordPress 并快速手动迁移所有数据"
pubDate: "2019-07-26"
description: "使用 Docker Compose 部署 WordPress，包括 NGINX、MariaDB、phpMyAdmin，以及完整的数据库和文件迁移流程。"
author: "xz-dev"
category: "WordPress"
tags: ["Docker", "WordPress", "推荐文章"]
---

> 运行环境选择：裸机环境 -> Docker
>
> 主要软件选择：NGINX，MariaDB，phpMyAdmin

> 由于 Mysql 所需内存过多，原先的服务器配置已无法支持运行。
>
> 因此在 DigitalOcean 上购买了新的配置的服务器，并决定使用Docker部署，方便管理。

<!--more-->

就我观察而言，目前暂无完整的相关教程，在这里做一个简述。

## 前述

关于Web服务器与数据库程序的选择：

[Nginx 和 Apache 各有什么优缺点？](https://www.zhihu.com/question/19571087)，[MariaDB和MySQL全面对比](https://zhuanlan.zhihu.com/p/43993816)

参考资料（主要的）：

[How To Install WordPress With Docker Compose](https://www.digitalocean.com/community/tutorials/how-to-install-wordpress-with-docker-compose)，[Running WordPress with MariaDB](https://vmware.github.io/vsphere-storage-for-docker/documentation/demo-wordpress-app.html)

## 准备工作（你需要什么）

- 一台尚在正常运行 WordPress 的服务器
- 一个等待部署的环境（可以是同一台服务器，但因为可能需要短暂运行两套完整的WordPress服务，可能需要较多的内存 >= 1G）

## 安装 Docker

### APT 安装 Docker 软件包

参考 [官方教程](https://docs.docker.com/install/linux/docker-ce/ubuntu/) 安装。

PS：请安装 `docker-ce` 而非 `docker.io`，原因：[What is docker.io in relation to docker-ce and docker-ee?](https://stackoverflow.com/questions/45023363/what-is-docker-io-in-relation-to-docker-ce-and-docker-ee)

### 给予登录用户 Docker 操作权限

参考 [官方文档](https://docs.docker.com/install/linux/linux-postinstall/)

```bash
sudo groupadd docker
sudo usermod -aG docker $USER
```

## 编写配置文件

创建一个存放所有配置文件的文件夹

```bash
mkdir -p $HOME/.config/wordpress
```

### 编写 Docker 配置文件（配置仅供参考，请仔细配置信息解释部分）

$HOME/.config/wordpress/docker-compose.yml

```yaml
version: '3'

services:
  db:
    image: mariadb
    container_name: mariadb
    restart: unless-stopped
    env_file: .env
    environment:
      - MYSQL_DATABASE=wordpress
    volumes:
      - dbdata:/var/lib/mysql
    networks:
      - app-network

  wordpress:
    depends_on:
      - db
    image: wordpress:fpm
    container_name: wordpress
    restart: unless-stopped
    env_file: .env
    environment:
      - WORDPRESS_DB_HOST=db:3306
      - WORDPRESS_DB_NAME=wordpress
      - WORDPRESS_DB_USER=$MYSQL_USER
      - WORDPRESS_DB_PASSWORD=$MYSQL_PASSWORD
    volumes:
      - wordpress:/var/www/html
    networks:
      - app-network

  webserver:
    depends_on:
      - wordpress
    image: nginx
    container_name: webserver
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - wordpress:/var/www/html
      - ./nginx-conf:/etc/nginx/conf.d
      - certbot-etc:/etc/letsencrypt
    networks:
      - app-network

  certbot:
    depends_on:
      - webserver
    image: certbot/certbot
    container_name: certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - wordpress:/var/www/html
    command: certonly --webroot --webroot-path=/var/www/html --email example@example.com --agree-tos --no-eff-email --force-renewal -d example.com -d www.example.com

volumes:
  certbot-etc:
  wordpress:
  dbdata:

networks:
  app-network:
    driver: bridge
```

$HOME/.config/wordpress/.env

```
MYSQL_ROOT_PASSWORD=XXXXXXXX
MYSQL_USER=wordpress
MYSQL_PASSWORD=XXXXXXXX
```

$HOME/.config/wordpress/.dockerignore

```
.env
.git
docker-compose.yml
.dockerignore
```

### 配置信息解释

#### .dockerignore

我的理解是类似于 [.gitignore](https://github.com/xz-dev/UpgradeAll-rules/blob/master/.gitignore) 用来忽略非必要的文件

[.dockerignore 文件从入门到实践](https://qhh.me/2019/02/24/dockerignore-%E6%96%87%E4%BB%B6%E4%BB%8E%E5%85%A5%E9%97%A8%E5%88%B0%E5%AE%9E%E8%B7%B5/)

#### .env

一个简单的文件，用来存储待会需要使用的环境变量，**叫做其他名字或者不创建该文件均可**

```
MYSQL_ROOT_PASSWORD=XXXXXXXX （填入初始 Root 密码）
MYSQL_USER=wordpress （填入 wordpress 数据库操作用户名，可以自由填写）
MYSQL_PASSWORD=XXXXXXXX （填入上面那个用户的初始密码）
# 建议使用**密码生成器**生成足够安全的密码
```

#### docker-compose.yml

用来编排 Docker 镜像。用来描述 Docker 镜像之间的依赖关系及启动它们所设置参数。简言之，就是为了避免手动输入过多的命令，减少操作复杂程度。

[使用 docker-compose 替代 docker run](https://beginor.github.io/2017/06/08/use-compose-instead-of-run.html)

## 申请 HTTP 证书

Let's Encrypt 的 HTTPS证书是只要你的Web服务器正常运行就能获得的，所以，我们接下来让 NGINX 能够正常运行。

### 编写 NGINX 配置（只为了获取证书用）

参考 [How To Install WordPress With Docker Compose](https://www.digitalocean.com/community/tutorials/how-to-install-wordpress-with-docker-compose#step-1-%E2%80%94-defining-the-web-server-configuration)

创建文件夹

```bash
mkdir -p $HOME/.config/wordpress/nginx-conf
```

$HOME/.config/wordpress/nginx-conf/nginx.conf

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name example.com www.example.com;

    index index.php index.html index.htm;

    root /var/www/html;

    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }

    location / {
        try_files $uri $uri/ /index.php$is_args$args;
    }

    location ~ \.php$ {
        try_files $uri =404;
        fastcgi_split_path_info ^(.+\.php)(/.+)$;
        fastcgi_pass wordpress:9000;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_param PATH_INFO $fastcgi_path_info;
    }

    location ~ /\.ht {
        deny all;
    }

    location = /favicon.ico {
        log_not_found off; access_log off;
    }
    location = /robots.txt {
        log_not_found off; access_log off; allow all;
    }
    location ~* \.(css|gif|ico|jpeg|jpg|js|png)$ {
        expires max;
        log_not_found off;
    }
}
```

### 运行容器

**进入 docker-compose.yml 所在文件夹**

```bash
cd ~/.config/wordpress
```

**运行容器**

```bash
docker-compose up -d
```

你将会看到：

```
Creating db ... done
Creating wordpress ... done
Creating webserver ... done
Creating certbot ... done
```

**检查容器状态**

```bash
docker-compose ps
```

**确认 测试用HTTPS证书 已获得**

```bash
docker-compose exec webserver ls -la /etc/letsencrypt/live
```

**再次运行单独 cerbot**

```bash
docker-compose up --force-recreate --no-deps certbot
```

## 配置 NGINX

参考 [How To Install WordPress With Docker Compose](https://www.digitalocean.com/community/tutorials/how-to-install-wordpress-with-docker-compose#step-2-%E2%80%94-defining-environment-variables)

**停止 nginx 服务**

```bash
docker-compose stop webserver
```

**下载 CertBot 预置的 NGINX SSL 配置文件**

```bash
curl -sSLo nginx-conf/options-ssl-nginx.conf https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf
```

**编辑 nginx.conf （务必替换掉example.com）**

完整的 NGINX 配置包括 HTTP 重定向到 HTTPS 和 SSL 配置。

## WordPress 安装完成

到这里，WordPress 的 Docker 环境已经安装完成了。

现在在浏览器上访问你服务器的 IP，应该可以正常看见 WordPress 欢迎界面。

**之后的内容是关于网站完整的数据快速迁移部分。**

## WordPress 数据迁移

### 数据库迁移

参考 [官方文档](https://wordpress.org/support/article/backing-up-your-database/)

这里选用 phpMyAdmin 作为数据库操作工具

#### 数据库备份

**安装 phpMyAdmin**

- APT 安装 phpmyadmin

```bash
sudo apt install phpmyadmin
```

- 关联 phpMyAdmin 至 Web 服务器

```bash
ln -s /uer/share/phpadmin /var/www/html/phpadmin
```

- 访问 phpMyAdmin

在浏览器上访问 http://<YOUR IP>/phpmyadmin

**导出 WordPress 数据库**

- 选中 WordPress 数据库（你所需要导出的数据库）

![选择数据库](/images/blog/docker-install-wordpress/phpmyadmin-select-database.png)

- 点击"导出"按钮

![点击导出](/images/blog/docker-install-wordpress/phpmyadmin-export.png)

- 点击"执行"，下载**备份文件**到本地。

#### 数据库导入

**安装 Docker 版本 phpMyAdmin**

- 确认 docker 内部网络连接

```bash
docker network ls
```

- 运行 phpMyAdmin

```bash
docker run --name myadmin -d --link mariadb:db -p 8081:80 --net wordpress_app-network phpmyadmin/phpmyadmin
```

Docker 会尝试运行镜像（如果不存在会自动下载），将 phpMyAdmin 与 MariaDB 数据库相链接，并将容器绑定在 wordpress_app-network 中，同时将 Web 访问端口绑定在宿主机的公网 8081 端口。

- 访问 phpMyAdmin

在浏览器上访问 http://<YOUR IP>:8081

**导入 WordPress 数据库**

- 选中 WordPress 数据库（你所需要导入的数据库）

![选择数据库](/images/blog/docker-install-wordpress/phpmyadmin-select-database.png)

- 点击"导入"按钮

![点击导入](/images/blog/docker-install-wordpress/phpmyadmin-import.png)

- 上传备份文件
- 点击"执行"

### 网站文件迁移

网站文件包括了你所安装的插件，你所上传的图片等资源文件。

#### WordPress 文件备份

**SSH 登录老的服务器**

```bash
ssh -p <你的ssh端口> <你的ssh登录用户名>@<你的旧服务器IP>
```

- 确认网站文件位置

```bash
ls -la /var/www/html/wordpress
```

- 打包网站文件

```bash
sudo tar -czvf ~/html.tar.gz /var/www/html/
```

- 修改备份压缩包权限（便于下载）

```bash
sudo chown $USER:$USER html.tar.gz
```

- 退出SSH登录

```bash
exit
```

**下载备份压缩包**

```bash
scp -r -P <你的ssh端口> <你的ssh登录用户名>@<你的旧服务器IP>:~/html.tar.gz ./
```

#### WordPress 文件恢复上传备份压缩包

**上传备份压缩包**

```bash
scp -r -P <你的ssh端口> ./html.tar.gz <你的ssh登录用户名>@<你的新服务器IP>:
```

**SSH 登录新的服务器**

- 解压备份压缩包

```bash
tar -xzvf ~/html.tar.gz
```

- 传入备份文件到 Docker 数据卷

```bash
docker cp ~/var/www/html wordpress:/var/www
```

- 进入 docker-compose.yml 所在文件夹

```bash
cd $HOME/.config/.wordpress
```

- 检查传入文件

```bash
docker-compose exec webserver ls -la /var/www/html/
```

- 修复网站文件权限

```bash
docker-compose exec wordpress chown -R www-data:www-data /var/www/html
```

#### 修复 WordPress 数据库读取

**编辑 wp-config.php 文件**

```bash
cd $/HOME/var/www/html/wordpress
vim wp-config.php
```

修改以下部分 与你之前在 .env 文件中设置一致

```php
// ** MySQL 设置 - 具体信息来自您正在使用的主机 ** //
/** WordPress数据库的名称 */
define('DB_NAME', 'wordpress');

/** MySQL数据库用户名 */
define('DB_USER', 'wordpress');

/** MySQL数据库密码 */
define('DB_PASSWORD', '123456');

/** MySQL主机 */
define('DB_HOST', 'db:3306');
```

**覆盖 WordPress 数据卷 wp-config.php 文件**

```bash
docker cp wp-config.php wordpress:/var/www/html/wp-config.php
```

---

**WordPress 数据恢复完成**

- 关闭 phpMyAdmin

```bash
docker stop myadmin
```

为保证数据库安全，请务必停止，只在**需要调试时开启**。

## 后记

此次数据迁移主要把握两个方向：环境架设（测试可用）、数据备份（确定相关文件）。

### 可能会出现的错误及解决方案

- 新网站运行正常，但访问不显示信息（空白）。

原因：数据库已导入，且正常运行，网站数据未导入成功。

- 其他问题，请注意以下事项

- 请在未导入配置的情况下检查网站是否正常运行。
- WordPress 的问题主要是文件与数据库的匹配。

排查方法：

- 查看Docker日志 `docker-compose logs service_name`
- 使用 phpMyAdmin 检查数据库与用户是否正常
