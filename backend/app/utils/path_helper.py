"""
统一路径管理工具。

所有数据文件（data、uploads、static、note_results、models 等）的存放位置
均由 DATA_DIR 环境变量派生。若不设置 DATA_DIR，则回退到代码所在目录。
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# 项目根目录（代码所在位置，作为兜底）
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))

# 外置数据目录（优先级最高），通过 .env 中 DATA_DIR 配置
# 若未配置，则使用项目根目录
DATA_ROOT = os.getenv("DATA_DIR", PROJECT_ROOT)


def _resolve_path(*segments: str) -> str:
    """拼接路径并自动创建目录。"""
    full_path = os.path.join(DATA_ROOT, *segments)
    os.makedirs(full_path, exist_ok=True)
    return full_path


def get_data_dir() -> str:
    """返回 data/ 目录（用于存放下载音频、转写缓存等任务中间文件）。"""
    return _resolve_path("data")


def get_static_dir() -> str:
    """返回 static/ 目录（用于存放截图、封面等静态资源）。"""
    return _resolve_path("static")


def get_uploads_dir() -> str:
    """返回 uploads/ 目录（用于存放用户上传的文件）。"""
    return _resolve_path("uploads")


def get_note_output_dir() -> str:
    """返回 note_results/ 目录（用于存放生成的笔记 JSON 和 Markdown 文件）。"""
    return _resolve_path("note_results")


def get_screenshots_dir() -> str:
    """返回 static/screenshots/ 子目录。"""
    return _resolve_path("static", "screenshots")


def get_model_dir(subdir: str = "whisper") -> str:
    """返回模型文件目录（whisper 模型等大文件，通常不在 DATA_DIR 中）。"""
    # 模型文件体积大，独立存放
    if getattr(sys, 'frozen', False):
        base_dir = os.path.join(os.getenv("APPDATA") or str(Path.home()), "BiliNote", "models")
    else:
        # 优先从环境变量读取
        models_root = os.getenv("MODELS_DIR", os.path.join(DATA_ROOT, "models"))
        base_dir = models_root

    path = os.path.join(base_dir, subdir)
    os.makedirs(path, exist_ok=True)
    return path


def get_app_dir(subdir: str = "") -> str:
    """返回应用可写目录（开发时等同于 data/ 目录）。"""
    if getattr(sys, 'frozen', False):
        base_dir = os.path.dirname(sys.executable)
    else:
        base_dir = _resolve_path("data")

    full_path = os.path.join(base_dir, subdir) if subdir else base_dir
    os.makedirs(full_path, exist_ok=True)
    return full_path


def get_vector_db_dir() -> str:
    """返回 vector_db/ 目录（用于存放向量数据库文件）。"""
    return _resolve_path("vector_db")


def get_database_path() -> str:
    """
    返回 SQLite 数据库文件的完整路径。
    若设置了 DATABASE_URL (sqlite:///...)，优先使用；否则使用 DATA_DIR 下的默认路径。
    """
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite:///"):
        # 提取路径部分，支持绝对路径和相对路径
        db_path = db_url[len("sqlite:///"):]
        if not os.path.isabs(db_path):
            db_path = os.path.join(DATA_ROOT, db_path)
        return db_path
    # 默认路径
    return os.path.join(DATA_ROOT, "bili_note.db")
