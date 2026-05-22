
## 📜 Guyon 补充

# 🖥️ Mac 系统 一键启动方式
## 快速启动（推荐）
1. 进入项目根目录
2. 双击运行 `start.sh`
3. 自动启动：后端服务 + 前端页面 + 浏览器访问

## 手动启动
后端：
```bash
cd /Users/macalpha/Projects/BiliNote-Solobackend
conda activate bili
python main.py
```

前端：
```bash
cd /Users/macalpha/Projects/BiliNote-SoloBillNote_frontend
pnpm run dev
```
访问地址：http://localhost:3015

# 📂 数据文件存储位置（重要！方便管理/清理）
所有生成的数据**不会占用项目盘**，全部在外置目录，方便管理：

## 1. 项目主数据目录

```bash
/Users/macalpha/Projects/BiliNoteData/
```

- 数据库文件
- 配置文件
- 任务记录

## 2. 视频截图 / 图片输出目录
```bash
/Users/macalpha/Projects/BiliNoteData/screenshot/
```
- 视频封面
- 截图
- 生成的图片

## 3. 音频 / 视频临时缓存
由 ffmpeg / yt-dlp 生成，默认存放在：
```bash
/Users/macalpha/Projects/BiliNoteData/temp/
```

## 4. 语音转文字模型缓存
``` fast-whisper 模型缓存，默认存放在：
```bash
/Users/macalpha/Projects/BiliNoteData/whisper/
```
或者
```bash
~/.cache/huggingface/
~/.cache/whisper/
```
# 💾 数据管理建议
- 生成的视频、截图、文件都在外置硬盘，**不占用系统空间**
- 如需清理：直接删除 `screenshots/` 和 `data/` 内不需要的内容即可
- 模型缓存较大时，可清理 `~/.cache/whisper/`
