# 项目记忆

## 项目信息
- **项目名称**：music-player（个人音乐作品展示平台）
- **GitHub 仓库**：https://github.com/tomsky3/music-player
- **部署地址**：https://tomsky3.github.io/music-player/
- **创建日期**：2026-04-07

## 技术栈
- **前端**：纯 HTML/CSS/JavaScript，无框架
- **样式**：Tailwind CSS + 自定义 CSS 变量，玻璃拟态设计风格
- **字体**：Google Fonts (Poppins)
- **云存储**：腾讯云 COS（用于歌曲上传）
- **后端服务**：Supabase（用于点赞数据持久化）

## 功能清单
1. ✅ 音乐播放（播放/暂停、上下首、进度条、音量）
2. ✅ 封面展示
3. ✅ 响应式设计
4. ✅ GitHub Pages 部署
5. ✅ 歌曲上传（腾讯云 COS）
6. ✅ 点赞功能（Supabase）

## 文件结构
```
music-player/
├── index.html          # 主页面
├── css/style.css       # 样式文件
├── js/
│   ├── app.js          # 播放器核心逻辑
│   ├── config.js       # COS + Supabase 配置
│   ├── likes.js        # 点赞模块
│   └── upload.js       # 上传模块
├── assets/
│   ├── songs/          # MP3 文件
│   └── covers/         # 封面图片
├── songs-config.json   # 歌曲配置
└── README.md           # 使用说明
```

## 配置说明
- 腾讯云 COS 配置：`js/config.js` → `CONFIG.cos`
- Supabase 配置：`js/config.js` → `CONFIG.supabase`
- 配置文档见 README.md 高级配置部分

## 注意事项
- COS 存储桶需要设置为「公有读私有写」
- Supabase 需要创建 `song_likes` 表并配置 RLS 策略
- 点赞状态使用 LocalStorage 存储用户点赞记录
