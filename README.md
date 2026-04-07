# 🎵 爱玩社区主题曲库

爱玩社区主题曲投票与音乐作品展示平台，支持 MP3 播放、封面展示、歌曲上传和点赞功能，可一键部署到 GitHub Pages。

## ✨ 功能特性

- 🎨 **现代化 UI** - 采用玻璃拟态设计风格，深色主题，视觉效果出众
- 🎵 **音乐播放** - 支持播放/暂停、上一首/下一首、进度条拖拽、音量调节
- 🖼️ **封面展示** - 每首歌曲配有专属封面，支持渐近式加载
- 📤 **歌曲上传** - 支持在线上传歌曲到云存储（腾讯云 COS）
- ❤️ **点赞功能** - 支持歌曲点赞，数据持久化存储（Supabase）
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **性能优化** - 音频懒加载，加载速度快
- 🎯 **易于维护** - JSON 配置驱动，添加歌曲无需修改代码

## 📁 项目结构

```
.
├── index.html              # 主页面
├── css/
│   └── style.css          # 样式文件（玻璃拟态 UI）
├── js/
│   ├── app.js             # 播放器逻辑
│   ├── config.js          # 配置文件（COS + Supabase）
│   ├── likes.js           # 点赞模块
│   ├── songs-manager.js   # 歌曲数据管理模块
│   └── upload.js          # 上传模块
├── assets/
│   ├── songs/             # MP3 文件存储目录
│   └── covers/            # 封面图片存储目录
├── songs-config.json      # 歌曲配置文件
└── README.md              # 使用说明
```

## 🚀 快速开始

### 1. 添加歌曲

将你的 MP3 文件和封面图片分别放入 `assets/songs/` 和 `assets/covers/` 目录。

### 2. 配置歌曲信息

编辑 `songs-config.json` 文件，添加歌曲信息：

```json
{
  "songs": [
    {
      "id": "my-song-1",
      "title": "歌曲名称",
      "artist": "艺术家",
      "album": "专辑名称",
      "duration": "3:45",
      "cover": "assets/covers/my-song-1.jpg",
      "file": "assets/songs/my-song-1.mp3"
    }
  ]
}
```

**字段说明：**

- `id`: 唯一标识符（必填）
- `title`: 歌曲名称（必填）
- `artist`: 艺术家名称（必填）
- `album`: 专辑名称（可选）
- `duration`: 时长（可选，显示用）
- `cover`: 封面图片路径（推荐 500x500 以上）
- `file`: MP3 文件路径（必填）

### 3. 本地预览

使用本地服务器预览网站：

```bash
# 方法 1: Python
python -m http.server 8000

# 方法 2: Node.js
npx serve

# 方法 3: VS Code Live Server 插件
右键 index.html → Open with Live Server
```

访问 `http://localhost:8000` 查看效果。

## 📤 部署到 GitHub Pages

### 方法 1: 使用 Git 命令行

```bash
# 1. 初始化 Git 仓库
git init

# 2. 添加所有文件
git add .

# 3. 提交更改
git commit -m "Initial commit: 我的音乐作品集"

# 4. 创建 GitHub 仓库后，添加远程仓库
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 5. 推送到 GitHub
git push -u origin main

# 6. 在 GitHub 仓库设置中启用 GitHub Pages
#    Settings → Pages → Source → main 分支 → Save
```

### 方法 2: 使用 GitHub Desktop

1. 打开 GitHub Desktop
2. File → Add Local Repository → 选择项目文件夹
3. 点击 "Create a new repository on GitHub"
4. 创建后，推送到 GitHub
5. 在仓库设置中启用 GitHub Pages

部署完成后，你的网站将可通过以下地址访问：

```
https://你的用户名.github.io/你的仓库名/
```

## 🎨 自定义主题

### 修改颜色

编辑 `css/style.css` 中的 CSS 变量：

```css
:root {
    /* 主题色 */
    --primary: #1DB954;          /* 主色调 */
    --primary-light: #1ED760;    /* 浅色 */
    
    /* 背景色 */
    --bg-dark: #0a0a0a;          /* 深色背景 */
    --bg-medium: #1a1a2e;        /* 中等背景 */
    
    /* 文字色 */
    --text-primary: #FFFFFF;     /* 主文字 */
    --text-secondary: #B3B3B3;   /* 次要文字 */
}
```

### 修改字体

在 `index.html` 中更改 Google Fonts 链接：

```html
<link href="https://fonts.googleapis.com/css2?family=你的字体:wght@400;600&display=swap" rel="stylesheet">
```

## 🔧 高级配置

### 配置上传和点赞功能

要启用歌曲上传和点赞功能，需要配置腾讯云 COS 和 Supabase。

#### 1. 腾讯云 COS 配置（歌曲上传）

腾讯云 COS 提供免费额度：50GB 存储 + 10GB 流量/月。

**步骤：**

1. 注册腾讯云账号：https://cloud.tencent.com
2. 开通对象存储 COS 服务
3. 创建存储桶（Bucket）：
   - 进入 [COS 控制台](https://console.cloud.tencent.com/cos)
   - 点击「创建存储桶」
   - 名称：自定义（如 `music-player-1234567890`）
   - 地域：选择离用户最近的地区
   - 访问权限：选择「公有读私有写」
4. 获取 API 密钥：
   - 进入 [访问管理 → API密钥管理](https://console.cloud.tencent.com/cam/capi)
   - 创建或查看 SecretId 和 SecretKey

**配置示例：**

编辑 `js/config.js`：

```javascript
cos: {
    secretId: 'YOUR_COS_SECRET_ID',
    secretKey: 'YOUR_COS_SECRET_KEY',
    bucket: 'music-player-1234567890',  // 存储桶名称
    region: 'ap-guangzhou',              // 地域
    customDomain: ''                     // 自定义域名（可选）
}
```

#### 2. Supabase 配置（点赞功能 + 歌曲数据持久化）

Supabase 提供免费额度：500MB 数据库 + 1GB 文件存储。

**步骤：**

1. 注册 Supabase 账号：https://supabase.com
2. 创建新项目：
   - 点击「New Project」
   - 填写项目名称和数据库密码
   - 选择地区（推荐 Singapore 或 Tokyo）
3. 创建数据表：
   - 进入 SQL Editor
   - 执行以下 SQL：

```sql
-- 创建点赞数据表
CREATE TABLE song_likes (
    id BIGSERIAL PRIMARY KEY,
    song_id VARCHAR(100) UNIQUE NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建歌曲数据表
CREATE TABLE songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    duration TEXT,
    cover TEXT,
    file TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_song_likes_song_id ON song_likes(song_id);
CREATE INDEX idx_songs_category ON songs(category);
CREATE INDEX idx_songs_uploaded_at ON songs(uploaded_at DESC);

-- 启用行级安全策略
ALTER TABLE song_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 点赞表权限策略
CREATE POLICY "Allow public read" ON song_likes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON song_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON song_likes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON song_likes FOR DELETE USING (true);

-- 歌曲表权限策略
CREATE POLICY "公开读取" ON songs FOR SELECT USING (true);
CREATE POLICY "公开写入" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "公开更新" ON songs FOR UPDATE USING (true);
CREATE POLICY "公开删除" ON songs FOR DELETE USING (true);
```

4. 获取 API 密钥：
   - 进入 Project Settings → API
   - 复制 `Project URL` 和 `anon public` key

**配置示例：**

编辑 `js/config.js`：

```javascript
supabase: {
    url: 'https://xxxxxxxxxxxxx.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

### 支持云存储

如果 MP3 文件较大，可以使用云存储（如腾讯云 COS、阿里云 OSS）：

```json
{
  "id": "cloud-song",
  "title": "云存储歌曲",
  "artist": "艺术家",
  "cover": "https://your-cloud.com/cover.jpg",
  "file": "https://your-cloud.com/song.mp3"
}
```

### 添加更多歌曲信息

可以在配置中添加额外字段，然后在代码中使用：

```json
{
  "id": "song-001",
  "title": "歌曲名称",
  "artist": "艺术家",
  "album": "专辑",
  "year": "2024",
  "genre": "流行",
  "description": "歌曲描述..."
}
```

## 📱 浏览器支持

- ✅ Chrome (推荐)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ⚠️ IE 不支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 自由使用和修改

## 🙏 致谢

- 图标: 内联 SVG
- 字体: Google Fonts (Poppins)
- 设计灵感: Spotify, Apple Music

---

**Made with ❤️ for music lovers**
