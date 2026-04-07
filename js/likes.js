/**
 * 点赞模块 - Supabase 集成
 * 
 * 功能：
 * - 点赞/取消点赞歌曲
 * - 获取歌曲点赞数
 * - 实时同步点赞数据
 * - 防止重复点赞（基于 LocalStorage）
 */

class LikesManager {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.userLikes = this.loadUserLikes();
    }

    /**
     * 初始化 Supabase 客户端
     */
    async init() {
        try {
            // 检查 Supabase SDK 是否加载
            if (typeof supabase === 'undefined') {
                console.error('❌ Supabase SDK 未加载，请确保在 HTML 中引入 Supabase JS 库');
                return false;
            }

            // 创建 Supabase 客户端
            this.supabase = supabase.createClient(
                CONFIG.supabase.url,
                CONFIG.supabase.anonKey
            );

            // 测试连接
            const { data, error } = await this.supabase
                .from('song_likes')
                .select('count')
                .limit(1);

            if (error && error.code !== 'PGRST116') {
                console.error('❌ Supabase 连接失败:', error.message);
                return false;
            }

            this.initialized = true;
            console.log('✅ 点赞系统初始化成功');
            return true;
        } catch (err) {
            console.error('❌ 点赞系统初始化异常:', err);
            return false;
        }
    }

    /**
     * 从 LocalStorage 加载用户的点赞记录
     */
    loadUserLikes() {
        try {
            const saved = localStorage.getItem('user_likes');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    }

    /**
     * 保存用户的点赞记录到 LocalStorage
     */
    saveUserLikes() {
        try {
            localStorage.setItem('user_likes', JSON.stringify(this.userLikes));
        } catch (err) {
            console.warn('保存点赞记录失败:', err);
        }
    }

    /**
     * 检查用户是否已点赞某歌曲
     * @param {string} songId - 歌曲ID
     * @returns {boolean}
     */
    hasLiked(songId) {
        return this.userLikes[songId] === true;
    }

    /**
     * 获取歌曲的点赞数
     * @param {string} songId - 歌曲ID
     * @returns {Promise<number>}
     */
    async getLikesCount(songId) {
        if (!this.initialized) {
            return 0;
        }

        try {
            const { data, error } = await this.supabase
                .from('song_likes')
                .select('likes_count')
                .eq('song_id', songId)
                .single();

            if (error) {
                // 如果记录不存在，返回 0
                if (error.code === 'PGRST116') {
                    return 0;
                }
                console.error('获取点赞数失败:', error);
                return 0;
            }

            return data?.likes_count || 0;
        } catch (err) {
            console.error('获取点赞数异常:', err);
            return 0;
        }
    }

    /**
     * 批量获取多首歌曲的点赞数
     * @param {string[]} songIds - 歌曲ID数组
     * @returns {Promise<Object>} - { songId: count }
     */
    async getBatchLikesCount(songIds) {
        if (!this.initialized || !songIds.length) {
            return {};
        }

        try {
            const { data, error } = await this.supabase
                .from('song_likes')
                .select('song_id, likes_count')
                .in('song_id', songIds);

            if (error) {
                console.error('批量获取点赞数失败:', error);
                return {};
            }

            // 转换为 { songId: count } 格式
            const result = {};
            data.forEach(item => {
                result[item.song_id] = item.likes_count;
            });

            // 没有点赞记录的歌曲默认为 0
            songIds.forEach(id => {
                if (!(id in result)) {
                    result[id] = 0;
                }
            });

            return result;
        } catch (err) {
            console.error('批量获取点赞数异常:', err);
            return {};
        }
    }

    /**
     * 点赞歌曲
     * @param {string} songId - 歌曲ID
     * @returns {Promise<{success: boolean, count: number, message: string}>}
     */
    async likeSong(songId) {
        // 检查是否已点赞
        if (this.hasLiked(songId)) {
            return {
                success: false,
                count: await this.getLikesCount(songId),
                message: '您已经点赞过这首歌曲了'
            };
        }

        if (!this.initialized) {
            return {
                success: false,
                count: 0,
                message: '点赞系统未初始化'
            };
        }

        try {
            // 先尝试获取现有记录
            const { data: existing, error: fetchError } = await this.supabase
                .from('song_likes')
                .select('likes_count')
                .eq('song_id', songId)
                .single();

            let newCount = 1;

            if (existing) {
                // 已有记录，更新点赞数
                newCount = existing.likes_count + 1;
                
                const { error: updateError } = await this.supabase
                    .from('song_likes')
                    .update({ 
                        likes_count: newCount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('song_id', songId);

                if (updateError) {
                    throw updateError;
                }
            } else {
                // 无记录，创建新记录
                const { error: insertError } = await this.supabase
                    .from('song_likes')
                    .insert({
                        song_id: songId,
                        likes_count: 1,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (insertError) {
                    throw insertError;
                }
            }

            // 记录用户点赞
            this.userLikes[songId] = true;
            this.saveUserLikes();

            return {
                success: true,
                count: newCount,
                message: '点赞成功'
            };
        } catch (err) {
            console.error('点赞失败:', err);
            return {
                success: false,
                count: await this.getLikesCount(songId),
                message: '点赞失败，请稍后重试'
            };
        }
    }

    /**
     * 取消点赞
     * @param {string} songId - 歌曲ID
     * @returns {Promise<{success: boolean, count: number, message: string}>}
     */
    async unlikeSong(songId) {
        // 检查是否已点赞
        if (!this.hasLiked(songId)) {
            return {
                success: false,
                count: await this.getLikesCount(songId),
                message: '您还没有点赞过这首歌曲'
            };
        }

        if (!this.initialized) {
            return {
                success: false,
                count: 0,
                message: '点赞系统未初始化'
            };
        }

        try {
            const { data: existing, error: fetchError } = await this.supabase
                .from('song_likes')
                .select('likes_count')
                .eq('song_id', songId)
                .single();

            if (!existing) {
                // 无记录，直接清除本地状态
                delete this.userLikes[songId];
                this.saveUserLikes();
                return {
                    success: true,
                    count: 0,
                    message: '取消点赞成功'
                };
            }

            const newCount = Math.max(0, existing.likes_count - 1);

            if (newCount === 0) {
                // 点赞数为 0，删除记录
                const { error: deleteError } = await this.supabase
                    .from('song_likes')
                    .delete()
                    .eq('song_id', songId);

                if (deleteError) {
                    throw deleteError;
                }
            } else {
                // 更新点赞数
                const { error: updateError } = await this.supabase
                    .from('song_likes')
                    .update({ 
                        likes_count: newCount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('song_id', songId);

                if (updateError) {
                    throw updateError;
                }
            }

            // 清除用户点赞记录
            delete this.userLikes[songId];
            this.saveUserLikes();

            return {
                success: true,
                count: newCount,
                message: '取消点赞成功'
            };
        } catch (err) {
            console.error('取消点赞失败:', err);
            return {
                success: false,
                count: await this.getLikesCount(songId),
                message: '取消点赞失败，请稍后重试'
            };
        }
    }

    /**
     * 切换点赞状态
     * @param {string} songId - 歌曲ID
     * @returns {Promise<{success: boolean, count: number, liked: boolean, message: string}>}
     */
    async toggleLike(songId) {
        if (this.hasLiked(songId)) {
            const result = await this.unlikeSong(songId);
            return { ...result, liked: false };
        } else {
            const result = await this.likeSong(songId);
            return { ...result, liked: true };
        }
    }
}

// 创建全局实例
const likesManager = new LikesManager();
