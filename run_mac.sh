#!/bin/bash

# ==================== 【配置项】根据你的环境自动生成 ====================
PROJECT_ROOT="/Volumes/MacExt/UserFiles/Projects/BiliNote-master"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/BillNote_frontend"
CONDA_ENV="bili"
WEB_URL="http://localhost:3015"
BACKEND_PORT="8483"  # 对应你.env里的BACKEND_PORT

# ==================== 工具函数：等待端口就绪 ====================
wait_for_port() {
    local port=$1
    local timeout=60  # 最大等待60秒
    local count=0

    echo "⌛ 等待后端服务启动（端口 $port）..."
    while ! nc -z localhost "$port"; do
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo "❌ 后端启动超时，请检查后端服务！"
            exit 1
        fi
        sleep 1
    done
    echo "✅ 后端服务已就绪（端口 $port）"
}

# ==================== 启动后端（新终端） ====================
echo "🚀 启动后端服务..."
osascript <<EOF
tell application "Terminal"
    do script "cd \"$BACKEND_DIR\"; conda activate $CONDA_ENV; python main.py"
    activate
end tell
EOF

# ==================== 等待后端完全启动 ====================
wait_for_port "$BACKEND_PORT"

# ==================== 启动前端（新终端） ====================
echo "🚀 启动前端服务..."
osascript <<EOF
tell application "Terminal"
    do script "cd \"$FRONTEND_DIR\"; npm run dev"
    activate
end tell
EOF

# ==================== 等待前端就绪（可选，更稳妥） ====================
echo "⌛ 等待前端服务启动..."
sleep 5  # 前端启动快，5秒足够，可根据情况调整

# ==================== 打开浏览器 ====================
echo "🌐 打开浏览器..."
open "$WEB_URL"

echo "✅ 一键启动完成！后端 + 前端 + 浏览器已全部就绪，无报错！"