"""
SQlite 直连工具（用于需要直接操作 SQLite 的场景）。
优先从环境变量 DATABASE_URL 读取路径，回退到 path_helper 管理的外置数据目录。
"""
import os
import sqlite3

from dotenv import load_dotenv

load_dotenv()


def get_connection():
    """获取 SQLite 连接，路径由 DATABASE_URL 环境变量决定。"""
    db_url = os.getenv("DATABASE_URL", "")
    if db_url.startswith("sqlite:///"):
        db_path = db_url[len("sqlite:///"):]
        if not os.path.isabs(db_path):
            # 相对路径相对于当前工作目录
            from app.utils.path_helper import get_database_path
            db_path = get_database_path()
    else:
        # 没有 DATABASE_URL 或不是 SQLite，使用默认路径
        from app.utils.path_helper import get_database_path
        db_path = get_database_path()

    return sqlite3.connect(db_path)
