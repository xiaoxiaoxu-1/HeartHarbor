# HeartHarbor 数据库使用指南

## 概述

本文档提供 HeartHarbor 平台数据库的详细使用指南，包括常见查询、最佳实践和性能优化建议。

## 数据库连接

### 通过 Supabase 客户端连接

```javascript
// 使用现有配置
const { supabaseClient } = window.HeartHarborServices;

// 或者手动创建连接
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
```

## 核心数据表操作

### 1. 用户管理

#### 获取当前用户信息
```javascript
const { data: { user }, error } = await supabaseClient.auth.getUser();
```

#### 查询用户统计信息
```sql
-- 获取用户活跃度统计
SELECT 
    u.username,
    COUNT(p.id) as post_count,
    COUNT(c.id) as comment_count,
    COUNT(l.id) as like_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN treehole_posts p ON p.user_id = u.id
LEFT JOIN treehole_comments c ON c.user_id = u.id
LEFT JOIN treehole_likes l ON l.user_id = u.id
WHERE u.id = 'user_id'
GROUP BY u.id, u.username;
```

### 2. 树洞帖子操作

#### 获取最新帖子（带用户信息）
```javascript
const { data: posts, error } = await supabaseClient
    .from('treehole_posts')
    .select(`
        *,
        user:users(username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(15);
```

#### 创建新帖子
```javascript
const { data, error } = await supabaseClient
    .from('treehole_posts')
    .insert([{
        user_id: user.id,
        content: '帖子内容',
        mood: 'happy',
        is_anonymous: true
    }])
    .select();
```

#### 点赞/取消点赞
```javascript
// 点赞
const { error } = await supabaseClient.rpc('increment_like_count', { 
    post_id: postId 
});

// 取消点赞
const { error } = await supabaseClient.rpc('decrement_like_count', { 
    post_id: postId 
});
```

### 3. 评论管理

#### 获取帖子评论
```javascript
const { data: comments, error } = await supabaseClient
    .from('treehole_comments')
    .select(`
        *,
        user:users(username, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
```

#### 添加评论
```javascript
const { data, error } = await supabaseClient
    .from('treehole_comments')
    .insert([{
        post_id: postId,
        user_id: userId,
        content: '评论内容',
        is_anonymous: true
    }])
    .select();
```

### 4. 心理咨询文章

#### 按分类获取文章
```javascript
const { data: articles, error } = await supabaseClient
    .from('knowledge_articles')
    .select('*')
    .eq('category', 'anxiety')
    .eq('is_published', true)
    .order('created_at', { ascending: false });
```

#### 搜索文章
```javascript
const { data: articles, error } = await supabaseClient
    .from('knowledge_articles')
    .select('*')
    .textSearch('title', '搜索关键词')
    .eq('is_published', true);
```

### 5. AI 聊天

#### 获取用户聊天会话
```javascript
const { data: sessions, error } = await supabaseClient
    .from('ai_chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
```

#### 获取聊天消息
```javascript
const { data: messages, error } = await supabaseClient
    .from('ai_chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
```

## 高级查询示例

### 1. 热门帖子排行榜
```sql
SELECT 
    p.id,
    p.content,
    p.like_count,
    p.comment_count,
    u.username,
    p.created_at
FROM treehole_posts p
JOIN users u ON p.user_id = u.id
WHERE p.created_at >= NOW() - INTERVAL '7 days'
ORDER BY p.like_count DESC, p.comment_count DESC
LIMIT 10;
```

### 2. 用户活跃度分析
```sql
SELECT 
    u.username,
    COUNT(DISTINCT p.id) as posts,
    COUNT(DISTINCT c.id) as comments,
    COUNT(DISTINCT l.id) as likes,
    COALESCE(MAX(p.created_at), u.created_at) as last_activity
FROM users u
LEFT JOIN treehole_posts p ON p.user_id = u.id
LEFT JOIN treehole_comments c ON c.user_id = u.id
LEFT JOIN treehole_likes l ON l.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.created_at
ORDER BY last_activity DESC;
```

### 3. 情绪分析统计
```sql
SELECT 
    mood,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM treehole_posts), 2) as percentage
FROM treehole_posts 
WHERE mood IS NOT NULL
GROUP BY mood
ORDER BY count DESC;
```

### 4. 文章热度分析
```sql
SELECT 
    category,
    COUNT(*) as article_count,
    SUM(view_count) as total_views,
    AVG(view_count) as avg_views,
    MAX(view_count) as max_views
FROM knowledge_articles
WHERE is_published = true
GROUP BY category
ORDER BY total_views DESC;
```

## 性能优化建议

### 1. 查询优化

#### 使用适当的索引
```sql
-- 为常用查询字段创建索引
CREATE INDEX CONCURRENTLY idx_posts_user_created ON treehole_posts(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_comments_post_created ON treehole_comments(post_id, created_at);
```

#### 避免 N+1 查询问题
```javascript
// 错误做法：多次查询
posts.forEach(async post => {
    const { data: user } = await supabaseClient
        .from('users')
        .select('username, avatar_url')
        .eq('id', post.user_id)
        .single();
});

// 正确做法：一次查询
const { data: posts } = await supabaseClient
    .from('treehole_posts')
    .select(`
        *,
        user:users(username, avatar_url)
    `)
    .order('created_at', { ascending: false });
```

### 2. 分页优化

#### 使用游标分页
```javascript
const PAGE_SIZE = 20;

// 第一页
const { data: posts, error } = await supabaseClient
    .from('treehole_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

// 下一页
const lastPost = posts[posts.length - 1];
const { data: nextPosts, error } = await supabaseClient
    .from('treehole_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .lt('created_at', lastPost.created_at)
    .limit(PAGE_SIZE);
```

### 3. 缓存策略

#### 客户端缓存
```javascript
// 使用 localStorage 缓存常用数据
const CACHE_KEY = 'treehole_posts_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

async function getPostsWithCache() {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
    
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < CACHE_DURATION) {
        return JSON.parse(cached);
    }
    
    const { data: posts, error } = await supabaseClient
        .from('treehole_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
    
    if (posts && !error) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(posts));
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
    }
    
    return posts;
}
```

## 错误处理最佳实践

### 1. 统一的错误处理
```javascript
async function handleDatabaseOperation(operation) {
    try {
        const { data, error } = await operation;
        
        if (error) {
            console.error('数据库操作失败:', error);
            
            // 根据错误类型提供用户友好的提示
            if (error.code === '23505') {
                throw new Error('数据已存在');
            } else if (error.code === '23503') {
                throw new Error('关联数据不存在');
            } else {
                throw new Error('操作失败，请重试');
            }
        }
        
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
```

### 2. 重试机制
```javascript
async function withRetry(operation, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            // 指数退避
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
        }
    }
}
```

## 安全考虑

### 1. 行级安全策略 (RLS)
确保所有表都启用了 RLS，并设置了适当的策略。

### 2. 输入验证
```javascript
function validatePostContent(content) {
    if (!content || content.trim().length === 0) {
        throw new Error('内容不能为空');
    }
    
    if (content.length > 1000) {
        throw new Error('内容长度不能超过1000个字符');
    }
    
    // 防止 XSS 攻击
    const sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    return sanitized;
}
```

## 监控和日志

### 1. 性能监控
```javascript
// 记录查询性能
const startTime = Date.now();
const { data, error } = await supabaseClient.from('table').select('*');
const duration = Date.now() - startTime;

if (duration > 1000) { // 超过1秒
    console.warn(`慢查询警告: ${duration}ms`);
}
```

### 2. 错误日志
```javascript
// 集中记录错误
function logDatabaseError(error, context) {
    console.error('数据库错误:', {
        timestamp: new Date().toISOString(),
        context,
        error: {
            message: error.message,
            code: error.code,
            details: error.details
        }
    });
}
```

## 总结

本指南提供了 HeartHarbor 数据库的完整使用说明，包括常见操作、高级查询、性能优化和安全考虑。开发者应该：

1. **遵循最佳实践**：使用适当的查询方式和错误处理
2. **关注性能**：合理使用索引和缓存
3. **确保安全**：验证输入并使用 RLS
4. **监控维护**：定期检查数据库性能和错误日志

通过遵循这些指南，可以确保 HeartHarbor 平台的数据库操作高效、安全且可维护。