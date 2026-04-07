/**
 * 音乐播放器配置文件
 * 
 * 配置说明：
 * 1. 腾讯云 COS 配置 - 用于存储上传的歌曲文件
 *    - 注册地址：https://console.cloud.tencent.com/cos
 *    - 获取方式：见 README.md 中的详细说明
 * 
 * 2. Supabase 配置 - 用于存储点赞数据
 *    - 注册地址：https://supabase.com
 *    - 获取方式：见 README.md 中的详细说明
 */

const CONFIG = {
    // 腾讯云 COS 配置
    cos: {
        // SecretId - 从腾讯云控制台获取
        // 路径：访问管理 > 访问密钥 > API密钥管理
        secretId: 'YOUR_COS_SECRET_ID',
        
        // SecretKey - 从腾讯云控制台获取
        secretKey: 'YOUR_COS_SECRET_KEY',
        
        // 存储桶名称 - 创建存储桶时设置的名称
        // 格式：bucketname-appid
        bucket: 'tomsky-1352142599',
        
        // 地域 - 存储桶所在地域
        // 例如：ap-guangzhou, ap-shanghai, ap-beijing
        region: 'ap-chengdu',
        
        // 存储桶访问域名（可选，不填则自动生成）
        // 如果配置了自定义域名，可在此填写
        customDomain: ''
    },
    
    // Supabase 配置
    supabase: {
        // 项目 URL - 从 Supabase 项目设置中获取
        // 路径：Project Settings > API > Project URL
        url: 'https://gpdleszpljkrnsczetyg.supabase.co',
        
        // Anon Key - 公开的匿名密钥
        // 路径：Project Settings > API > Project API keys > anon public
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZGxlc3pwbGprcm5zY3pldHlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1Mzg4MzUsImV4cCI6MjA5MTExNDgzNX0.xoTdM12B1802wnJliJjwMvPcGPrXUi7ZjnaFcb9QC1I'
    },
    
    // 应用配置
    app: {
        // 默认封面图片（用户上传时未提供封面则使用此图）
        defaultCover: 'assets/covers/default-cover.jpg',
        
        // 上传文件大小限制（字节）
        // 默认 20MB
        maxFileSize: 20 * 1024 * 1024,
        
        // 允许的音频文件格式
        allowedFormats: ['.mp3', '.wav', '.ogg', '.m4a', '.flac'],
        
        // 允许的封面图片格式
        allowedImageFormats: ['.jpg', '.jpeg', '.png', '.webp'],
        
        // 封面图片最大尺寸（字节）
        // 默认 5MB
        maxImageSize: 5 * 1024 * 1024
    }
};

// 配置验证函数
function validateConfig() {
    const errors = [];
    
    // 检查 COS 配置
    if (CONFIG.cos.secretId === 'YOUR_COS_SECRET_ID' || 
        CONFIG.cos.secretId === '') {
        errors.push('腾讯云 COS SecretId 未配置');
    }
    if (CONFIG.cos.secretKey === 'YOUR_COS_SECRET_KEY' || 
        CONFIG.cos.secretKey === '') {
        errors.push('腾讯云 COS SecretKey 未配置');
    }
    if (CONFIG.cos.bucket === 'YOUR_BUCKET_NAME' || 
        CONFIG.cos.bucket === '') {
        errors.push('腾讯云 COS Bucket 未配置');
    }
    
    // 检查 Supabase 配置
    if (CONFIG.supabase.url === 'YOUR_SUPABASE_URL' || 
        CONFIG.supabase.url === '') {
        errors.push('Supabase URL 未配置');
    }
    if (CONFIG.supabase.anonKey === 'YOUR_SUPABASE_ANON_KEY' || 
        CONFIG.supabase.anonKey === '') {
        errors.push('Supabase Anon Key 未配置');
    }
    
    if (errors.length > 0) {
        console.warn('⚠️ 配置警告：\n' + errors.map(e => '  - ' + e).join('\n'));
        console.warn('请查看 README.md 中的配置说明');
        return false;
    }
    
    console.log('✅ 配置验证通过');
    return true;
}

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, validateConfig };
}
