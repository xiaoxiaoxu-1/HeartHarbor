-- HeartHarbor 心屿 - 校园匿名心理支持平台 数据库初始化脚本
-- 创建时间: 2025-11-06

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 2. 创建树洞帖子表
CREATE TABLE IF NOT EXISTS treehole_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mood VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT true,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建树洞评论表
CREATE TABLE IF NOT EXISTS treehole_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES treehole_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建点赞记录表
CREATE TABLE IF NOT EXISTS treehole_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES treehole_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- 5. 创建心理咨询文章表
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    author VARCHAR(100),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建AI聊天会话表
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建AI聊天消息表
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引

-- users 表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- treehole_posts 表索引
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON treehole_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON treehole_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_like_count ON treehole_posts(like_count);
CREATE INDEX IF NOT EXISTS idx_posts_mood ON treehole_posts(mood);

-- treehole_comments 表索引
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON treehole_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON treehole_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON treehole_comments(created_at);

-- treehole_likes 表索引
CREATE INDEX IF NOT EXISTS idx_likes_post_user ON treehole_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON treehole_likes(user_id);

-- knowledge_articles 表索引
CREATE INDEX IF NOT EXISTS idx_articles_category ON knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON knowledge_articles(created_at);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON knowledge_articles(view_count);
CREATE INDEX IF NOT EXISTS idx_articles_title_tsvector ON knowledge_articles USING GIN(to_tsvector('simple', title));

-- ai_chat_sessions 表索引
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON ai_chat_sessions(updated_at);

-- ai_chat_messages 表索引
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON ai_chat_messages(created_at);

-- 创建存储过程和函数

-- 增加点赞数
CREATE OR REPLACE FUNCTION increment_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET like_count = like_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 减少点赞数
CREATE OR REPLACE FUNCTION decrement_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 增加评论数
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET comment_count = comment_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 增加浏览量
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE knowledge_articles 
    SET view_count = view_count + 1 
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器函数

-- 自动更新帖子更新时间
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新文章更新时间
CREATE OR REPLACE FUNCTION update_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 自动更新会话更新时间
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器

-- treehole_posts 表触发器
DROP TRIGGER IF EXISTS trigger_update_post_timestamp ON treehole_posts;
CREATE TRIGGER trigger_update_post_timestamp
    BEFORE UPDATE ON treehole_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_post_timestamp();

-- knowledge_articles 表触发器
DROP TRIGGER IF EXISTS trigger_update_article_timestamp ON knowledge_articles;
CREATE TRIGGER trigger_update_article_timestamp
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_timestamp();

-- ai_chat_sessions 表触发器
DROP TRIGGER IF EXISTS trigger_update_session_timestamp ON ai_chat_sessions;
CREATE TRIGGER trigger_update_session_timestamp
    BEFORE UPDATE ON ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();

-- 插入示例数据

-- 插入示例用户
INSERT INTO users (id, username, email, avatar_url, bio, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', '小明同学', 'xiaoming@example.com', '/avatars/xiaoming.jpg', '喜欢学习和交朋友，愿意倾听大家的心事', NOW()),
('550e8400-e29b-41d4-a716-446655440001', '小美', 'xiaomei@example.com', '/avatars/xiaomei.jpg', '热爱生活，积极向上，希望能帮助到更多的人', NOW()),
('550e8400-e29b-41d4-a716-446655440002', '心理辅导员', 'counselor@example.com', '/avatars/counselor.jpg', '专业心理咨询师，提供专业的心理支持和建议', NOW())
ON CONFLICT (id) DO NOTHING;

-- 插入示例帖子
INSERT INTO treehole_posts (id, user_id, content, mood, is_anonymous, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '今天考试没考好，有点失落...感觉自己努力了却还是这样，不知道该怎么办', 'sad', true, NOW() - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '遇到了一个很好的朋友，很开心！我们一起学习，一起进步，生活充满了希望', 'happy', false, NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', '最近压力好大，学业、人际关系都让我喘不过气来...', 'stress', true, NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- 插入示例评论
INSERT INTO treehole_comments (id, post_id, user_id, content, is_anonymous, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', '别灰心，一次考试不代表什么，加油！', false, NOW() - INTERVAL '1 day'),
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '考试只是检验学习的方式，重要的是从中吸取经验，继续努力！', false, NOW() - INTERVAL '23 hours'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', '真羡慕你！希望我也能遇到这样的好朋友', true, NOW() - INTERVAL '20 hours')
ON CONFLICT (id) DO NOTHING;

-- 插入示例点赞记录
INSERT INTO treehole_likes (id, post_id, user_id, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '1 day'),
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '23 hours'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', NOW() - INTERVAL '20 hours')
ON CONFLICT (post_id, user_id) DO NOTHING;

-- 更新帖子的点赞数和评论数
UPDATE treehole_posts 
SET like_count = 2, comment_count = 2 
WHERE id = '660e8400-e29b-41d4-a716-446655440000';

UPDATE treehole_posts 
SET like_count = 1, comment_count = 1 
WHERE id = '660e8400-e29b-41d4-a716-446655440001';

-- 插入心理咨询文章
INSERT INTO knowledge_articles (id, title, content, category, author, view_count, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440000', '如何应对考试焦虑', '考试焦虑是学生常见的心理问题，可以通过合理的复习计划、放松训练和积极心态来应对...', 'anxiety', '张心理老师', 156, NOW() - INTERVAL '30 days'),
('990e8400-e29b-41d4-a716-446655440001', '大学生人际关系处理技巧', '大学生活中，良好的人际关系对心理健康至关重要。本文介绍了几种有效的人际交往技巧...', 'relationship', '李辅导员', 89, NOW() - INTERVAL '15 days'),
('990e8400-e29b-41d4-a716-446655440002', '压力管理的有效方法', '适度的压力可以促进成长，但过度的压力会影响身心健康。以下是几种有效的压力管理方法...', 'stress', '王心理咨询师', 203, NOW() - INTERVAL '7 days'),
('990e8400-e29b-41d4-a716-446655440003', '如何提高学习效率', '高效学习不仅需要时间投入，更需要科学的方法。本文分享了几种提高学习效率的技巧...', 'study', '赵学习顾问', 67, NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- 插入AI聊天会话示例
INSERT INTO ai_chat_sessions (id, user_id, title, created_at, updated_at) VALUES
('aa0e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '关于学习压力的讨论', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
('aa0e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '人际关系建议', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 插入AI聊天消息示例
INSERT INTO ai_chat_messages (id, session_id, role, content, created_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440000', 'aa0e8400-e29b-41d4-a716-446655440000', 'user', '最近学习压力很大，怎么办？', NOW() - INTERVAL '5 days'),
('bb0e8400-e29b-41d4-a716-446655440001', 'aa0e8400-e29b-41d4-a716-446655440000', 'assistant', '学习压力是很常见的，建议你可以：1. 制定合理的学习计划 2. 适当休息和放松 3. 寻求朋友或老师的帮助', NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),
('bb0e8400-e29b-41d4-a716-446655440002', 'aa0e8400-e29b-41d4-a716-446655440001', 'user', '如何与室友相处得更好？', NOW() - INTERVAL '3 days'),
('bb0e8400-e29b-41d4-a716-446655440003', 'aa0e8400-e29b-41d4-a716-446655440001', 'assistant', '与室友相处需要注意：1. 尊重彼此的空间和习惯 2. 及时沟通解决问题 3. 共同制定宿舍规则', NOW() - INTERVAL '3 days' + INTERVAL '1 minute')
ON CONFLICT (id) DO NOTHING;

-- 创建视图

-- 用户活跃度视图
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT p.id) as post_count,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT l.id) as like_count,
    COALESCE(MAX(p.created_at), u.created_at) as last_activity
FROM users u
LEFT JOIN treehole_posts p ON p.user_id = u.id
LEFT JOIN treehole_comments c ON c.user_id = u.id
LEFT JOIN treehole_likes l ON l.user_id = u.id
GROUP BY u.id, u.username, u.email, u.created_at;

-- 文章热度视图
CREATE OR REPLACE VIEW article_popularity AS
SELECT 
    id,
    title,
    category,
    author,
    view_count,
    created_at,
    CASE 
        WHEN view_count > 100 THEN '热门'
        WHEN view_count > 50 THEN '较热'
        ELSE '一般'
    END as popularity_level
FROM knowledge_articles
WHERE is_published = true
ORDER BY view_count DESC, created_at DESC;

-- 完成消息
SELECT 'HeartHarbor 数据库初始化完成！' as message;
SELECT '创建了 ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') || ' 个数据表' as table_count;
SELECT '插入了 ' || (SELECT COUNT(*) FROM users) || ' 个示例用户' as user_count;
SELECT '插入了 ' || (SELECT COUNT(*) FROM treehole_posts) || ' 个示例帖子' as post_count;
SELECT '插入了 ' || (SELECT COUNT(*) FROM knowledge_articles) || ' 篇心理咨询文章' as article_count;