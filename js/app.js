/**
 * 音乐播放器核心逻辑
 * 负责加载配置、渲染歌曲列表、控制播放
 * 集成上传功能和点赞功能
 */

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.songs = [];
        this.currentSongIndex = -1;
        this.isPlaying = false;
        this.currentVolume = 0.7;
        this.likesCounts = {}; // 缓存点赞数
        
        // DOM元素
        this.themeSongsGrid = document.getElementById('themeSongsGrid');
        this.otherSongsGrid = document.getElementById('otherSongsGrid');
        this.themeCount = document.getElementById('themeCount');
        this.otherCount = document.getElementById('otherCount');
        this.currentCover = document.getElementById('currentCover');
        this.currentTitle = document.getElementById('currentTitle');
        this.currentArtist = document.getElementById('currentArtist');
        this.playBtn = document.getElementById('playBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.progressBar = document.getElementById('progressBar');
        this.progressFill = document.getElementById('progressFill');
        this.progressThumb = document.getElementById('progressThumb');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        
        // 上传弹窗相关
        this.uploadModal = document.getElementById('uploadModal');
        this.uploadForm = document.getElementById('uploadForm');
        this.uploadThemeSong = document.getElementById('uploadThemeSong');
        this.uploadOther = document.getElementById('uploadOther');
        this.currentUploadType = 'other'; // 默认为其他歌单
        this.closeUploadBtn = document.getElementById('closeUploadBtn');
        this.cancelUploadBtn = document.getElementById('cancelUploadBtn');
        this.submitUploadBtn = document.getElementById('submitUploadBtn');
        this.uploadProgress = document.getElementById('uploadProgress');
        this.uploadProgressBar = document.getElementById('uploadProgressBar');
        this.progressStage = document.getElementById('progressStage');
        this.progressPercent = document.getElementById('progressPercent');
        this.audioFileInput = document.getElementById('audioFile');
        this.coverFileInput = document.getElementById('coverFile');
        this.audioFileDisplay = document.getElementById('audioFileDisplay');
        this.coverFileDisplay = document.getElementById('coverFileDisplay');
        
        this.init();
    }
    
    async init() {
        // 验证配置
        if (typeof validateConfig === 'function') {
            validateConfig();
        }
        
        // 初始化点赞系统
        if (typeof likesManager !== 'undefined') {
            await likesManager.init();
        }
        
        // 初始化上传系统
        if (typeof uploadManager !== 'undefined') {
            uploadManager.init();
        }
        
        await this.loadSongsConfig();
        await this.loadLikesCounts();
        this.renderSongsList();
        this.bindEvents();
        this.audio.volume = this.currentVolume;
    }
    
    /**
     * 加载歌曲（优先从 Supabase 数据库，失败时回退到本地 JSON）
     */
    async loadSongsConfig() {
        // 尝试从数据库加载
        if (typeof songsManager !== 'undefined') {
            try {
                const songs = await songsManager.getAllSongs();
                // 数据库加载成功（即使为空数组也算成功）
                this.songs = songs || [];
                console.log('✅ 从数据库加载歌曲:', this.songs.length, '首');
                return;
            } catch (error) {
                console.warn('⚠️ 从数据库加载失败，尝试本地配置:', error);
            }
        }
        
        // 回退到本地 JSON
        try {
            const response = await fetch('songs-config.json');
            const data = await response.json();
            this.songs = data.songs || [];
            console.log('📄 从本地配置加载歌曲:', this.songs.length, '首');
        } catch (error) {
            console.error('加载歌曲配置失败:', error);
            this.songs = [];
        }
    }
    
    /**
     * 加载所有歌曲的点赞数
     */
    async loadLikesCounts() {
        if (typeof likesManager === 'undefined' || !likesManager.initialized) {
            return;
        }
        
        const songIds = this.songs.map(s => s.id);
        this.likesCounts = await likesManager.getBatchLikesCount(songIds);
    }
    
    /**
     * 渲染歌曲列表（分类展示）
     */
    renderSongsList() {
        // 检查 DOM 元素是否存在
        if (!this.themeSongsGrid || !this.otherSongsGrid) {
            console.error('歌曲列表容器元素未找到');
            return;
        }
        
        // 分类歌曲
        const themeSongs = this.songs.filter(song => song.category === 'theme');
        const otherSongs = this.songs.filter(song => song.category !== 'theme');
        
        // 更新歌曲数量
        if (this.themeCount) {
            this.themeCount.textContent = `${themeSongs.length} 首`;
        }
        if (this.otherCount) {
            this.otherCount.textContent = `${otherSongs.length} 首`;
        }
        
        // 渲染主题曲
        this.renderSongGrid(this.themeSongsGrid, themeSongs);
        
        // 渲染其它歌单
        this.renderSongGrid(this.otherSongsGrid, otherSongs);
    }
    
    /**
     * 渲染单个歌曲网格
     */
    renderSongGrid(gridElement, songs) {
        if (songs.length === 0) {
            gridElement.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <p style="font-size: 14px;">暂无歌曲</p>
                </div>
            `;
            return;
        }
        
        gridElement.innerHTML = songs.map((song) => {
            const globalIndex = this.songs.findIndex(s => s.id === song.id);
            const likesCount = this.likesCounts[song.id] || 0;
            const hasLiked = typeof likesManager !== 'undefined' && likesManager.hasLiked(song.id);
            
            return `
                <div class="song-card" data-index="${globalIndex}" data-song-id="${song.id}">
                    <div class="card-cover">
                        <img src="${song.cover}" alt="${song.title}" onerror="this.src='https://placehold.co/200x200/1a1a2e/1DB954?text=♪'">
                        <div class="play-overlay">
                            <div class="play-icon-large">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div class="card-info">
                        <div class="card-title">${song.title}</div>
                        <div class="card-artist">${song.artist}</div>
                    </div>
                    <div class="card-footer">
                        <button class="like-btn ${hasLiked ? 'liked' : ''}" data-song-id="${song.id}" title="点赞">
                            <svg viewBox="0 0 24 24" fill="${hasLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            <span class="like-count">${likesCount}</span>
                        </button>
                        <span class="card-duration">${song.duration || '0:00'}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 歌曲卡片点击 - 主题曲网格
        if (this.themeSongsGrid) {
            this.themeSongsGrid.addEventListener('click', (e) => this.handleSongCardClick(e));
        }
        
        // 歌曲卡片点击 - 其它歌单网格
        if (this.otherSongsGrid) {
            this.otherSongsGrid.addEventListener('click', (e) => this.handleSongCardClick(e));
        }
        
        // 播放/暂停按钮
        this.playBtn.addEventListener('click', () => {
            this.togglePlay();
        });
        
        // 上一首按钮
        this.prevBtn.addEventListener('click', () => {
            this.playPrevious();
        });
        
        // 下一首按钮
        this.nextBtn.addEventListener('click', () => {
            this.playNext();
        });
        
        // 进度条点击
        this.progressBar.addEventListener('click', (e) => {
            this.seekTo(e);
        });
        
        // 进度条拖拽
        let isDragging = false;
        this.progressBar.addEventListener('mousedown', () => isDragging = true);
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.seekTo(e);
            }
        });
        
        // 音量滑块
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
        
        // 静音按钮
        this.volumeBtn.addEventListener('click', () => {
            this.toggleMute();
        });
        
        // 音频事件
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });
        
        this.audio.addEventListener('ended', () => {
            this.playNext();
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.togglePlay();
            }
        });
        
        // ===== 上传相关事件 =====
        
        // 打开上传弹窗 - 主题曲
        this.uploadThemeSong.addEventListener('click', () => {
            this.currentUploadType = 'theme';
            this.openUploadModal('爱玩社区主题曲投票');
        });
        
        // 打开上传弹窗 - 其它歌单
        this.uploadOther.addEventListener('click', () => {
            this.currentUploadType = 'other';
            this.openUploadModal('其它歌单');
        });
        
        // 关闭上传弹窗
        this.closeUploadBtn.addEventListener('click', () => {
            this.closeUploadModal();
        });
        
        this.cancelUploadBtn.addEventListener('click', () => {
            this.closeUploadModal();
        });
        
        // 点击遮罩层关闭
        this.uploadModal.addEventListener('click', (e) => {
            if (e.target === this.uploadModal) {
                this.closeUploadModal();
            }
        });
        
        // 文件选择显示
        this.audioFileInput.addEventListener('change', (e) => {
            this.updateFileDisplay(e, this.audioFileDisplay, '音频');
        });
        
        this.coverFileInput.addEventListener('change', (e) => {
            this.updateFileDisplay(e, this.coverFileDisplay, '封面');
        });
        
        // 上传表单提交
        this.uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUpload();
        });
    }
    
    /**
     * 处理歌曲卡片点击
     */
    handleSongCardClick(e) {
        // 检查是否点击了点赞按钮
        const likeBtn = e.target.closest('.like-btn');
        if (likeBtn) {
            e.stopPropagation();
            this.handleLikeClick(likeBtn);
            return;
        }
        
        // 否则播放歌曲
        const card = e.target.closest('.song-card');
        if (card) {
            const index = parseInt(card.dataset.index);
            this.playSong(index);
        }
    }
    
    /**
     * 处理点赞点击
     */
    async handleLikeClick(btn) {
        if (typeof likesManager === 'undefined' || !likesManager.initialized) {
            this.showToast('点赞系统未初始化，请检查配置', 'error');
            return;
        }
        
        const songId = btn.dataset.songId;
        const countEl = btn.querySelector('.like-count');
        
        // 添加加载状态
        btn.classList.add('loading');
        
        const result = await likesManager.toggleLike(songId);
        
        btn.classList.remove('loading');
        
        if (result.success) {
            // 更新UI
            btn.classList.toggle('liked', result.liked);
            countEl.textContent = result.count;
            
            // 更新点赞图标
            const svg = btn.querySelector('svg');
            svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
            
            // 更新缓存
            this.likesCounts[songId] = result.count;
            
            this.showToast(result.message, 'success');
        } else {
            this.showToast(result.message, 'error');
        }
    }
    
    /**
     * 打开上传弹窗
     */
    openUploadModal(title = '上传新歌曲') {
        const modalTitle = this.uploadModal.querySelector('.modal-header h2');
        modalTitle.textContent = title;
        this.uploadModal.classList.add('active');
        this.resetUploadForm();
    }
    
    /**
     * 关闭上传弹窗
     */
    closeUploadModal() {
        this.uploadModal.classList.remove('active');
        this.resetUploadForm();
    }
    
    /**
     * 重置上传表单
     */
    resetUploadForm() {
        this.uploadForm.reset();
        this.uploadProgress.style.display = 'none';
        this.uploadProgressBar.style.width = '0%';
        this.progressStage.textContent = '准备上传...';
        this.progressPercent.textContent = '0%';
        
        // 重置文件显示
        this.audioFileDisplay.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <span>点击选择音频文件</span>
            <small>支持 MP3, WAV, OGG, M4A, FLAC (最大 20MB)</small>
        `;
        
        this.coverFileDisplay.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <span>点击选择封面图片</span>
            <small>支持 JPG, PNG, WEBP (最大 5MB)</small>
        `;
    }
    
    /**
     * 更新文件选择显示
     */
    updateFileDisplay(e, display, type) {
        const file = e.target.files[0];
        if (file) {
            const size = (file.size / 1024 / 1024).toFixed(2);
            display.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" style="color: var(--primary);">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span style="color: var(--primary);">${file.name}</span>
                <small>${size} MB</small>
            `;
        }
    }
    
    /**
     * 处理上传
     */
    async handleUpload() {
        if (typeof uploadManager === 'undefined' || !uploadManager.initialized) {
            this.showToast('上传系统未初始化，请检查配置', 'error');
            return;
        }
        
        const audioFile = this.audioFileInput.files[0];
        const coverFile = this.coverFileInput.files[0];
        const title = document.getElementById('songTitle').value.trim();
        const artist = document.getElementById('songArtist').value.trim();
        const album = document.getElementById('songAlbum').value.trim();
        
        if (!audioFile) {
            this.showToast('请选择音频文件', 'error');
            return;
        }
        
        // 显示进度
        this.uploadProgress.style.display = 'block';
        this.submitUploadBtn.disabled = true;
        
        const result = await uploadManager.uploadSong(
            audioFile,
            coverFile,
            { title, artist, album, category: this.currentUploadType },
            (stage, percent, message) => {
                this.progressStage.textContent = message;
                this.progressPercent.textContent = percent + '%';
                this.uploadProgressBar.style.width = percent + '%';
            }
        );
        
        this.submitUploadBtn.disabled = false;
        
        if (result.success) {
            // 获取音频时长
            const duration = await uploadManager.getAudioDuration(result.song.file);
            result.song.duration = duration;
            
            // 写入数据库
            if (typeof songsManager !== 'undefined') {
                const dbSong = await songsManager.addSong(result.song);
                if (dbSong) {
                    result.song.id = dbSong.id; // 使用数据库返回的 ID
                    console.log('✅ 歌曲已写入数据库');
                }
            }
            
            // 添加到本地列表
            this.songs.push(result.song);
            this.likesCounts[result.song.id] = 0;
            
            // 重新渲染
            this.renderSongsList();
            
            this.showToast('上传成功！', 'success');
            
            // 延迟关闭弹窗
            setTimeout(() => {
                this.closeUploadModal();
            }, 1500);
        } else {
            this.showToast(result.message, 'error');
        }
    }
    
    /**
     * 显示 Toast 提示
     */
    showToast(message, type = 'success') {
        // 移除已有的 toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 显示动画
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // 自动隐藏
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    /**
     * 播放指定歌曲
     */
    playSong(index) {
        if (index < 0 || index >= this.songs.length) return;
        
        const song = this.songs[index];
        this.currentSongIndex = index;
        
        // 更新音频源
        this.audio.src = song.file;
        
        // 更新UI
        this.currentTitle.textContent = song.title;
        this.currentArtist.textContent = song.artist;
        this.currentCover.src = song.cover;
        
        // 更新活动状态
        document.querySelectorAll('.song-card').forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        
        // 开始播放
        this.audio.play()
            .then(() => {
                this.isPlaying = true;
                this.updatePlayButton();
            })
            .catch(error => {
                console.error('播放失败:', error);
            });
    }
    
    /**
     * 切换播放/暂停
     */
    togglePlay() {
        if (this.currentSongIndex === -1 && this.songs.length > 0) {
            this.playSong(0);
            return;
        }
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(error => {
                console.error('播放失败:', error);
            });
        }
        
        this.isPlaying = !this.isPlaying;
        this.updatePlayButton();
    }
    
    /**
     * 播放上一首
     */
    playPrevious() {
        if (this.songs.length === 0) return;
        
        let newIndex = this.currentSongIndex - 1;
        if (newIndex < 0) {
            newIndex = this.songs.length - 1;
        }
        
        this.playSong(newIndex);
    }
    
    /**
     * 播放下一首
     */
    playNext() {
        if (this.songs.length === 0) return;
        
        let newIndex = this.currentSongIndex + 1;
        if (newIndex >= this.songs.length) {
            newIndex = 0;
        }
        
        this.playSong(newIndex);
    }
    
    /**
     * 跳转到指定位置
     */
    seekTo(e) {
        const rect = this.progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const clampedPercent = Math.max(0, Math.min(1, percent));
        
        if (this.audio.duration) {
            this.audio.currentTime = clampedPercent * this.audio.duration;
        }
    }
    
    /**
     * 更新进度条
     */
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressFill.style.width = percent + '%';
            this.progressThumb.style.left = percent + '%';
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    /**
     * 设置音量
     */
    setVolume(value) {
        this.currentVolume = value;
        this.audio.volume = value;
        this.volumeSlider.value = value * 100;
        this.updateVolumeIcon();
    }
    
    /**
     * 切换静音
     */
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.7);
        }
    }
    
    /**
     * 更新音量图标
     */
    updateVolumeIcon() {
        const volumeHigh = this.volumeBtn.querySelector('.volume-high');
        const volumeMuted = this.volumeBtn.querySelector('.volume-muted');
        
        if (this.audio.volume === 0) {
            volumeHigh.style.display = 'none';
            volumeMuted.style.display = 'block';
        } else {
            volumeHigh.style.display = 'block';
            volumeMuted.style.display = 'none';
        }
    }
    
    /**
     * 更新播放按钮图标
     */
    updatePlayButton() {
        const playIcon = this.playBtn.querySelector('.play-icon');
        const pauseIcon = this.playBtn.querySelector('.pause-icon');
        
        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    }
    
    /**
     * 格式化时间
     */
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    window.player = new AudioPlayer();
});
