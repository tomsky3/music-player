/**
 * 上传模块 - 腾讯云 COS 集成
 * 
 * 功能：
 * - 上传歌曲文件到腾讯云 COS
 * - 上传封面图片到腾讯云 COS
 * - 文件格式和大小验证
 * - 上传进度显示
 * - 生成可访问的 URL
 */

class UploadManager {
    constructor() {
        this.cos = null;
        this.initialized = false;
    }

    /**
     * 初始化 COS 客户端
     */
    init() {
        try {
            // 检查 COS SDK 是否加载
            if (typeof COS === 'undefined') {
                console.error('❌ COS SDK 未加载，请确保在 HTML 中引入腾讯云 COS JS 库');
                return false;
            }

            // 调试：输出配置信息
            console.log('COS 配置:', {
                SecretId: CONFIG.cos.secretId,
                bucket: CONFIG.cos.bucket,
                region: CONFIG.cos.region
            });

            // 创建 COS 客户端（使用永久密钥直接传入）
            this.cos = new COS({
                SecretId: CONFIG.cos.secretId,
                SecretKey: CONFIG.cos.secretKey
            });

            this.initialized = true;
            console.log('✅ 上传系统初始化成功');
            return true;
        } catch (err) {
            console.error('❌ 上传系统初始化异常:', err);
            return false;
        }
    }

    /**
     * 验证文件
     * @param {File} file - 文件对象
     * @param {string} type - 文件类型 'audio' 或 'image'
     * @returns {{valid: boolean, message: string}}
     */
    validateFile(file, type) {
        // 检查文件是否存在
        if (!file) {
            return { valid: false, message: '请选择文件' };
        }

        // 根据类型检查
        if (type === 'audio') {
            // 检查文件大小
            if (file.size > CONFIG.app.maxFileSize) {
                const maxMB = (CONFIG.app.maxFileSize / 1024 / 1024).toFixed(0);
                return { valid: false, message: `音频文件大小不能超过 ${maxMB}MB` };
            }

            // 检查文件格式
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!CONFIG.app.allowedFormats.includes(ext)) {
                return { 
                    valid: false, 
                    message: `不支持的音频格式，支持：${CONFIG.app.allowedFormats.join(', ')}` 
                };
            }
        } else if (type === 'image') {
            // 检查图片大小
            if (file.size > CONFIG.app.maxImageSize) {
                const maxMB = (CONFIG.app.maxImageSize / 1024 / 1024).toFixed(0);
                return { valid: false, message: `图片大小不能超过 ${maxMB}MB` };
            }

            // 检查图片格式
            const ext = '.' + file.name.split('.').pop().toLowerCase();
            if (!CONFIG.app.allowedImageFormats.includes(ext)) {
                return { 
                    valid: false, 
                    message: `不支持的图片格式，支持：${CONFIG.app.allowedImageFormats.join(', ')}` 
                };
            }
        }

        return { valid: true, message: '验证通过' };
    }

    /**
     * 生成唯一文件名
     * @param {string} originalName - 原始文件名
     * @param {string} folder - 存储文件夹
     * @returns {string}
     */
    generateUniqueKey(originalName, folder = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = originalName.split('.').pop();
        const baseName = originalName.replace(/\.[^/.]+$/, '').substring(0, 20);
        
        const fileName = `${baseName}_${timestamp}_${random}.${ext}`;
        return folder ? `${folder}/${fileName}` : fileName;
    }

    /**
     * 上传文件到 COS
     * @param {File} file - 文件对象
     * @param {string} folder - 存储文件夹
     * @param {Function} onProgress - 进度回调 (percent) => {}
     * @returns {Promise<{success: boolean, url?: string, message: string}>}
     */
    async uploadFile(file, folder = '', onProgress = null) {
        if (!this.initialized) {
            return { success: false, message: '上传系统未初始化' };
        }

        return new Promise((resolve) => {
            const key = this.generateUniqueKey(file.name, folder);

            this.cos.putObject({
                Bucket: CONFIG.cos.bucket,
                Region: CONFIG.cos.region,
                Key: key,
                Body: file,
                onProgress: (progressData) => {
                    if (onProgress) {
                        const percent = Math.round(progressData.percent * 100);
                        onProgress(percent);
                    }
                }
            }, (err, data) => {
                if (err) {
                    console.error('上传失败:', err);
                    resolve({ 
                        success: false, 
                        message: '上传失败: ' + (err.message || '未知错误')
                    });
                    return;
                }

                // 生成访问 URL
                let url;
                if (CONFIG.cos.customDomain) {
                    url = `https://${CONFIG.cos.customDomain}/${key}`;
                } else {
                    url = `https://${CONFIG.cos.bucket}.cos.${CONFIG.cos.region}.myqcloud.com/${key}`;
                }

                resolve({
                    success: true,
                    url: url,
                    key: key,
                    message: '上传成功'
                });
            });
        });
    }

    /**
     * 上传歌曲
     * @param {File} audioFile - 音频文件
     * @param {File} coverFile - 封面图片（可选）
     * @param {Object} metadata - 歌曲元数据 {title, artist, album}
     * @param {Function} onProgress - 进度回调 (stage, percent, message) => {}
     * @returns {Promise<{success: boolean, song?: Object, message: string}>}
     */
    async uploadSong(audioFile, coverFile, metadata, onProgress = null) {
        // 验证音频文件
        const audioValidation = this.validateFile(audioFile, 'audio');
        if (!audioValidation.valid) {
            return { success: false, message: audioValidation.message };
        }

        // 验证封面图片（如果有）
        if (coverFile) {
            const coverValidation = this.validateFile(coverFile, 'image');
            if (!coverValidation.valid) {
                return { success: false, message: coverValidation.message };
            }
        }

        try {
            // 上传音频文件
            if (onProgress) onProgress('audio', 0, '正在上传音频...');
            const audioResult = await this.uploadFile(
                audioFile, 
                'songs', 
                (percent) => {
                    if (onProgress) onProgress('audio', percent, '正在上传音频...');
                }
            );

            if (!audioResult.success) {
                return { success: false, message: audioResult.message };
            }

            let coverUrl = CONFIG.app.defaultCover;

            // 上传封面图片（如果有）
            if (coverFile) {
                if (onProgress) onProgress('cover', 0, '正在上传封面...');
                const coverResult = await this.uploadFile(
                    coverFile, 
                    'covers', 
                    (percent) => {
                        if (onProgress) onProgress('cover', percent, '正在上传封面...');
                    }
                );

                if (coverResult.success) {
                    coverUrl = coverResult.url;
                }
            }

            // 生成歌曲 ID
            const songId = 'song_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

            // 构建歌曲对象
            const song = {
                id: songId,
                title: metadata.title || audioFile.name.replace(/\.[^/.]+$/, ''),
                artist: metadata.artist || '未知艺术家',
                album: metadata.album || '未知专辑',
                duration: '0:00', // 需要前端获取音频时长
                cover: coverUrl,
                file: audioResult.url,
                category: metadata.category || 'other', // 添加分类字段
                uploadedAt: new Date().toISOString()
            };

            if (onProgress) onProgress('done', 100, '上传完成！');

            return {
                success: true,
                song: song,
                message: '上传成功'
            };
        } catch (err) {
            console.error('上传歌曲异常:', err);
            return { success: false, message: '上传异常: ' + err.message };
        }
    }

    /**
     * 获取音频时长
     * @param {string} url - 音频 URL
     * @returns {Promise<string>} - 格式化后的时长 "mm:ss"
     */
    async getAudioDuration(url) {
        return new Promise((resolve) => {
            const audio = new Audio(url);
            
            audio.addEventListener('loadedmetadata', () => {
                const duration = audio.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                const formatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                resolve(formatted);
            });

            audio.addEventListener('error', () => {
                resolve('0:00');
            });

            audio.src = url;
        });
    }
}

// 创建全局实例
const uploadManager = new UploadManager();
