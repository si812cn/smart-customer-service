# Dockerfile
FROM nginx:alpine

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 复制 dashboard 构建产物
COPY dashboard/dist /usr/share/nginx/html

# 复制 Nginx 配置（支持单页应用路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]