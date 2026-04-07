-- ============================================
-- Supabase 歌曲数据表创建脚本（修复版）
-- 执行位置：Supabase 控制台 → SQL Editor
-- ============================================

-- 1. 创建 songs 表（如果不存在）
CREATE TABLE IF NOT EXISTS songs (
  id TEXT PRIMARY KEY,                    -- 歌曲唯一标识（使用时间戳）
  title TEXT NOT NULL,                     -- 歌曲名称
  artist TEXT,                             -- 艺术家
  album TEXT,                              -- 专辑
  duration TEXT,                           -- 时长（格式 "mm:ss"）
  cover TEXT,                              -- 封面图片 URL
  file TEXT NOT NULL,                      -- 音频文件 URL
  category TEXT DEFAULT 'other',           -- 分类：pop/rock/classical/electronic/other
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),   -- 上传时间
  created_at TIMESTAMPTZ DEFAULT NOW()     -- 记录创建时间
);

-- 2. 启用行级安全策略（RLS）
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略（使用 OR REPLACE 避免冲突）
CREATE OR REPLACE POLICY "公开读取" ON songs 
  FOR SELECT 
  USING (true);

CREATE OR REPLACE POLICY "公开写入" ON songs 
  FOR INSERT 
  WITH CHECK (true);

CREATE OR REPLACE POLICY "公开更新" ON songs 
  FOR UPDATE 
  USING (true);

CREATE OR REPLACE POLICY "公开删除" ON songs 
  FOR DELETE 
  USING (true);

-- 4. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_songs_category ON songs(category);
CREATE INDEX IF NOT EXISTS idx_songs_uploaded_at ON songs(uploaded_at DESC);

-- 5. 验证表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'songs' 
ORDER BY ordinal_position;
