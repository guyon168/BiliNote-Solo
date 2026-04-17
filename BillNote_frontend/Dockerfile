# 固定稳定版本
FROM node:18.17.0-alpine AS builder

# 跳过 corepack，直接用 npm 安装 pnpm（绝对不超时！）
RUN npm install -g pnpm

WORKDIR /app
COPY BillNote_frontend/package.json ./
COPY BillNote_frontend/ ./

# 安装依赖，不检查版本
RUN pnpm install --force --ignore-scripts

# 构建前端
RUN pnpm run build

# 部署 Nginx
FROM nginx:1.25-alpine
RUN rm -rf /etc/nginx/conf.d/default.conf
COPY BillNote_frontend/deploy/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
