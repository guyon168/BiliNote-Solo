import shutil
from pathlib import Path

from dotenv import load_dotenv
import subprocess
import os
import uuid
load_dotenv()

from app.utils.path_helper import get_static_dir
from typing import Optional

def generate_screenshot(video_path: str, output_dir: str, timestamp: int, index: int) -> str:
    """
    使用 ffmpeg 生成截图，返回生成图片路径
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    filename = f"screenshot_{index:03}_{uuid.uuid4()}.jpg"
    output_path = output_dir / filename

    command = [
        "ffmpeg",
        "-ss", str(timestamp),
        "-i", str(video_path),
        "-frames:v", "1",
        "-q:v", "2",
        str(output_path),
        "-y"
    ]

    print("Running command:", command)
    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0:
        print("ffmpeg failed:", result.stderr)

    return str(output_path)



def save_cover_to_static(local_cover_path: str, subfolder: Optional[str] = "cover") -> str:
    """
    将封面图片保存到 static 目录下，并返回前端可访问的相对路径。
    
    :param local_cover_path: 本地原封面路径（比如提取出来的jpg）
    :param subfolder: 子目录，默认是 cover，可以自定义
    :return: 前端可访问的相对路径，例如 /static/cover/xxx.jpg
    """
    # 使用统一的 static 目录，不再依赖 os.getcwd()
    static_dir = get_static_dir()

    # 确定目标子目录
    target_dir = os.path.join(static_dir, subfolder or "cover")
    os.makedirs(target_dir, exist_ok=True)

    if not os.path.exists(local_cover_path):
        print(f"警告: 封面文件不存在: {local_cover_path}")
        return ""

    # 拷贝文件
    file_name = os.path.basename(local_cover_path)
    target_path = os.path.join(target_dir, file_name)
    shutil.copy2(local_cover_path, target_path)  # 保留原时间戳、权限

    # 返回相对路径，前端通过 Vite 代理或 nginx 访问 /static/ 路由
    image_relative_path = f"/static/{subfolder}/{file_name}".replace("\\", "/")
    return image_relative_path
