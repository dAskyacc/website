# Development Help Guide

## 开发用到环境

> Nodejs > v10

> npm > 6

> bootstrap 4



## Project 目录结构

-- .config                //项目配置文件
-- build                  // 引用node modules 编译后的js目录
-- public                 // 网站静态文件 html,png,css 等等
-- public/index.html      //网站主页
-- src                    // 网站js module 
---- libs/i18n-common.js  //网站语言转换js(目前网站只用到这个模块),
---- index.js             //js module 管理入口

### 中英文支持方式
```text
在html标签中加入class="i18n" data-en="英文" date-cn="中文"
```

### 开发运行

```bash
npm start                 # 启动本地开发服务,默认打开浏览器

node bin/publisher.js     # 将项目达成zip包
```




# 网站服务器信息

## 服务器

IP:45.76.23.250 
secret:

## Nginx 1.16

> 配置文件位置: /etc/nginx/conf.d/hyperorchid.conf 

> 网站 :/opt/nginx/www/hyperorchid/



