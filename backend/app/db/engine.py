import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# 数据库 URL，优先从环境变量读取
# 若未设置则使用 path_helper 生成外置数据目录下的默认路径
_raw_db_url = os.getenv("DATABASE_URL", "")
if _raw_db_url:
    DATABASE_URL = _raw_db_url
else:
    from app.utils.path_helper import get_database_path
    _db_path = get_database_path()
    # 构造 SQLite URL：绝对路径需要 4 个斜杠（sqlite:////absolute/path）
    DATABASE_URL = f"sqlite:////{_db_path}"

# SQLite 需要特定连接参数，其他数据库不需要
engine_args = {}
if DATABASE_URL.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

_pool_args = {}
if not DATABASE_URL.startswith("sqlite"):
    _pool_args = {
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
        "pool_pre_ping": True,
    }

engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQLALCHEMY_ECHO", "false").lower() == "true",
    **engine_args,
    **_pool_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_engine():
    return engine


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()