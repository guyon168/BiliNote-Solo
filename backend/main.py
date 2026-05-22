import os
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from starlette.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.db.init_db import init_db
from app.db.provider_dao import seed_default_providers
from app.exceptions.exception_handlers import register_exception_handlers
from app.utils.logger import get_logger
from app.utils.path_helper import (
    get_static_dir,
    get_uploads_dir,
    get_screenshots_dir,
)
from app import create_app
from app.services.transcriber_config_manager import TranscriberConfigManager
from events import register_handler
from ffmpeg_helper import ensure_ffmpeg_or_raise

logger = get_logger(__name__)
load_dotenv()

# ================= 路径配置：统一从 path_helper 获取 =================
# 读取 .env 中的网络路由前缀和截图输出目录
static_path = os.getenv('STATIC', '/static')

# 物理目录 —— 全部由 path_helper 统一管理，不再硬编码
static_dir = get_static_dir()
uploads_dir = get_uploads_dir()
out_dir = get_screenshots_dir()

logger.info(f"数据根目录: {os.getenv('DATA_DIR', '(项目目录)')}")
logger.info(f"static 目录: {static_dir}")
logger.info(f"uploads 目录: {uploads_dir}")
logger.info(f"screenshots 目录: {out_dir}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_handler()
    init_db()
    _cfg = TranscriberConfigManager().get_config()
    logger.info(f"当前转写器配置: type={_cfg['transcriber_type']}, model_size={_cfg['whisper_model_size']}")
    seed_default_providers()
    yield

app = create_app(lifespan=lifespan)
origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://tauri.localhost",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
register_exception_handlers(app)
app.mount(static_path, StaticFiles(directory=static_dir), name="static")
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


if __name__ == "__main__":
    port = int(os.getenv("BACKEND_PORT", 8483))
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(app, host=host, port=port, reload=False)
