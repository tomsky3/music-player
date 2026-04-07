/**
 * 歌曲数据管理模块 - Supabase 数据库交互
 * 负责歌曲的增删改查操作
 */

class SongsManager {
    constructor() {
        this.supabase = null;
        this.initialized = false;
    }

    /**
     * 初始化 Supabase 连接
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // 等待 Supabase 客户端初始化（来自 config.js）
            const { createClient } = supabase;
            this.supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
            this.initialized = true;
            console.log('✅ SongsManager 初始化成功');
        } catch (error) {
            console.error('❌ SongsManager 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 获取所有歌曲
     * @returns {Promise<Array>} 歌曲列表
     */
    async getAllSongs() {
        await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('songs')
                .select('*')
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            
            console.log(`🎵 从数据库加载 ${data.length} 首歌曲`);
            return this.formatSongs(data);
        } catch (error) {
            console.error('❌ 获取歌曲列表失败:', error);
            return [];
        }
    }

    /**
     * 添加新歌曲
     * @param {Object} song - 歌曲信息
     * @returns {Promise<Object|null>} 添加的歌曲或 null
     */
    async addSong(song) {
        await this.init();
        
        const songData = {
            id: song.id || Date.now().toString(),
            title: song.title || '未知歌曲',
            artist: song.artist || '未知艺术家',
            album: song.album || '',
            duration: song.duration || '0:00',
            cover: song.cover || '',
            file: song.file,
            category: song.category || 'other',
            uploaded_at: new Date().toISOString()
        };

        try {
            const { data, error } = await this.supabase
                .from('songs')
                .insert([songData])
                .select()
                .single();

            if (error) throw error;
            
            console.log('✅ 歌曲添加成功:', songData.title);
            return this.formatSong(data);
        } catch (error) {
            console.error('❌ 添加歌曲失败:', error);
            return null;
        }
    }

    /**
     * 更新歌曲信息
     * @param {string} id - 歌曲ID
     * @param {Object} updates - 更新内容
     * @returns {Promise<Object|null>} 更新后的歌曲或 null
     */
    async updateSong(id, updates) {
        await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('songs')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            
            console.log('✅ 歌曲更新成功:', id);
            return this.formatSong(data);
        } catch (error) {
            console.error('❌ 更新歌曲失败:', error);
            return null;
        }
    }

    /**
     * 删除歌曲
     * @param {string} id - 歌曲ID
     * @returns {Promise<boolean>} 是否成功
     */
    async deleteSong(id) {
        await this.init();
        
        try {
            const { error } = await this.supabase
                .from('songs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            console.log('✅ 歌曲删除成功:', id);
            return true;
        } catch (error) {
            console.error('❌ 删除歌曲失败:', error);
            return false;
        }
    }

    /**
     * 按分类获取歌曲
     * @param {string} category - 分类名称
     * @returns {Promise<Array>} 歌曲列表
     */
    async getSongsByCategory(category) {
        await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('songs')
                .select('*')
                .eq('category', category)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            
            return this.formatSongs(data);
        } catch (error) {
            console.error('❌ 获取分类歌曲失败:', error);
            return [];
        }
    }

    /**
     * 搜索歌曲
     * @param {string} keyword - 搜索关键词
     * @returns {Promise<Array>} 匹配的歌曲列表
     */
    async searchSongs(keyword) {
        await this.init();
        
        try {
            const { data, error } = await this.supabase
                .from('songs')
                .select('*')
                .or(`title.ilike.%${keyword}%,artist.ilike.%${keyword}%,album.ilike.%${keyword}%`)
                .order('uploaded_at', { ascending: false });

            if (error) throw error;
            
            return this.formatSongs(data);
        } catch (error) {
            console.error('❌ 搜索歌曲失败:', error);
            return [];
        }
    }

    /**
     * 格式化单首歌曲数据（转换为前端格式）
     * @param {Object} song - 数据库歌曲对象
     * @returns {Object} 前端格式歌曲对象
     */
    formatSong(song) {
        return {
            id: song.id,
            title: song.title,
            artist: song.artist,
            album: song.album,
            duration: song.duration,
            cover: song.cover,
            file: song.file,
            category: song.category,
            uploadedAt: song.uploaded_at
        };
    }

    /**
     * 批量格式化歌曲数据
     * @param {Array} songs - 数据库歌曲数组
     * @returns {Array} 前端格式歌曲数组
     */
    formatSongs(songs) {
        return songs.map(song => this.formatSong(song));
    }

    /**
     * 迁移本地 JSON 数据到数据库（一次性操作）
     * @param {Array} localSongs - 本地歌曲数组
     * @returns {Promise<number>} 成功迁移的数量
     */
    async migrateFromLocal(localSongs) {
        await this.init();
        
        let successCount = 0;
        
        for (const song of localSongs) {
            const result = await this.addSong(song);
            if (result) successCount++;
        }
        
        console.log(`✅ 迁移完成: ${successCount}/${localSongs.length} 首歌曲`);
        return successCount;
    }
}

// 创建全局实例
const songsManager = new SongsManager();
