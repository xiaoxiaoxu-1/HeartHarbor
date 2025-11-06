# HeartHarbor 心屿 - 校园匿名心理支持平台 数据库结构文档

## 概述

HeartHarbor 使用 Supabase 作为后端数据库服务，提供完整的用户管理、树洞社交、心理咨询库和AI聊天功能。

## 数据库连接信息

- **Supabase URL**: `https://evvvotdeckcsizulgcar.supabase.co`
- **API Key**: 已配置在 `supabase-config.js` 中
- **数据库**: PostgreSQL

## 数据表结构

### 1. users - 用户表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 用户ID (与Supabase Auth关联) | PRIMARY KEY |
| username | VARCHAR(50) | 用户名 | NOT NULL, UNIQUE |
| email | VARCHAR(255) | 邮箱 | NOT NULL, UNIQUE |
| avatar_url | TEXT | 头像URL | NULLABLE |
| bio | TEXT | 个人简介 | NULLABLE |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| last_login | TIMESTAMP | 最后登录时间 | NULLABLE |
| is_active | BOOLEAN | 是否活跃 | DEFAULT true |

**索引**:
- `idx_users_username` (username)
- `idx_users_email` (email)
- `idx_users_created_at` (created_at)

### 2. treehole_posts - 树洞帖子表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 帖子ID | PRIMARY KEY |
| user_id | UUID | 用户ID | FOREIGN KEY (users.id) |
| content | TEXT | 帖子内容 | NOT NULL |
| mood | VARCHAR(20) | 心情标签 | NULLABLE |
| is_anonymous | BOOLEAN | 是否匿名 | DEFAULT true |
| like_count | INTEGER | 点赞数 | DEFAULT 0 |
| comment_count | INTEGER | 评论数 | DEFAULT 0 |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT NOW() |

**索引**:
- `idx_posts_user_id` (user_id)
- `idx_posts_created_at` (created_at)
- `idx_posts_like_count` (like_count)
- `idx_posts_mood` (mood)

### 3. treehole_comments - 树洞评论表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 评论ID | PRIMARY KEY |
| post_id | UUID | 帖子ID | FOREIGN KEY (treehole_posts.id) |
| user_id | UUID | 用户ID | FOREIGN KEY (users.id) |
| content | TEXT | 评论内容 | NOT NULL |
| is_anonymous | BOOLEAN | 是否匿名 | DEFAULT true |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

**索引**:
- `idx_comments_post_id` (post_id)
- `idx_comments_user_id` (user_id)
- `idx_comments_created_at` (created_at)

### 4. treehole_likes - 点赞记录表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 点赞记录ID | PRIMARY KEY |
| post_id | UUID | 帖子ID | FOREIGN KEY (treehole_posts.id) |
| user_id | UUID | 用户ID | FOREIGN KEY (users.id) |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

**索引**:
- `idx_likes_post_user` (post_id, user_id) UNIQUE
- `idx_likes_user_id` (user_id)

### 5. knowledge_articles - 心理咨询文章表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 文章ID | PRIMARY KEY |
| title | VARCHAR(200) | 文章标题 | NOT NULL |
| content | TEXT | 文章内容 | NOT NULL |
| category | VARCHAR(50) | 文章分类 | NOT NULL |
| author | VARCHAR(100) | 作者 | NULLABLE |
| view_count | INTEGER | 浏览量 | DEFAULT 0 |
| is_published | BOOLEAN | 是否发布 | DEFAULT true |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT NOW() |

**分类枚举**: anxiety(焦虑), depression(抑郁), stress(压力), relationship(人际关系), study(学习), life(生活)

**索引**:
- `idx_articles_category` (category)
- `idx_articles_created_at` (created_at)
- `idx_articles_view_count` (view_count)
- `idx_articles_title_tsvector` (title) GIN

### 6. ai_chat_sessions - AI聊天会话表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 会话ID | PRIMARY KEY |
| user_id | UUID | 用户ID | FOREIGN KEY (users.id) |
| title | VARCHAR(100) | 会话标题 | NOT NULL |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |
| updated_at | TIMESTAMP | 更新时间 | DEFAULT NOW() |

**索引**:
- `idx_sessions_user_id` (user_id)
- `idx_sessions_updated_at` (updated_at)

### 7. ai_chat_messages - AI聊天消息表

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | UUID | 消息ID | PRIMARY KEY |
| session_id | UUID | 会话ID | FOREIGN KEY (ai_chat_sessions.id) |
| role | VARCHAR(10) | 消息角色 | NOT NULL |
| content | TEXT | 消息内容 | NOT NULL |
| created_at | TIMESTAMP | 创建时间 | DEFAULT NOW() |

**角色枚举**: user(用户), assistant(助手)

**索引**:
- `idx_messages_session_id` (session_id)
- `idx_messages_created_at` (created_at)

## 存储过程和函数

### 1. increment_like_count - 增加点赞数
```sql
CREATE OR REPLACE FUNCTION increment_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET like_count = like_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

### 2. decrement_like_count - 减少点赞数
```sql
CREATE OR REPLACE FUNCTION decrement_like_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. increment_comment_count - 增加评论数
```sql
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE treehole_posts 
    SET comment_count = comment_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;
```

### 4. increment_view_count - 增加浏览量
```sql
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE knowledge_articles 
    SET view_count = view_count + 1 
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;
```

## 触发器

### 1. 自动更新帖子更新时间
```sql
CREATE OR REPLACE FUNCTION update_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_timestamp
    BEFORE UPDATE ON treehole_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_post_timestamp();
```

### 2. 自动更新文章更新时间
```sql
CREATE OR REPLACE FUNCTION update_article_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_article_timestamp
    BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_article_timestamp();
```

## 行级安全策略 (RLS)

所有表都启用了行级安全策略，确保数据隔离和安全。

### users 表策略
- 用户只能查看自己的信息
- 管理员可以查看所有用户信息

### treehole_posts 表策略
- 用户可以查看所有已发布的帖子
- 用户只能修改和删除自己的帖子

### treehole_comments 表策略
- 用户可以查看所有帖子的评论
- 用户只能修改和删除自己的评论

### treehole_likes 表策略
- 用户可以查看所有点赞记录
- 用户只能操作自己的点赞

## 示例数据

### 用户示例数据
```sql
INSERT INTO users (id, username, email, avatar_url, bio, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', '小明同学', 'xiaoming@example.com', '/avatars/xiaoming.jpg', '喜欢学习和交朋友', NOW()),
('550e8400-e29b-41d4-a716-446655440001', '小美', 'xiaomei@example.com', '/avatars/xiaomei.jpg', '热爱生活，积极向上', NOW());
```

### 帖子示例数据
```sql
INSERT INTO treehole_posts (id, user_id, content, mood, is_anonymous, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '今天考试没考好，有点失落...', 'sad', true, NOW()),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '遇到了一个很好的朋友，很开心！', 'happy', false, NOW());
```

## 性能优化建议

1. **定期清理过期数据**：设置自动清理6个月前的聊天记录
2. **分区表**：对于大数据量表考虑按时间分区
3. **连接池优化**：根据并发用户数调整连接池大小
4. **监控告警**：设置数据库性能监控和告警

## 备份策略

1. **自动备份**：Supabase提供每日自动备份
2. **手动备份**：重要数据变更前进行手动备份
3. **恢复测试**：定期测试数据恢复流程

---

*文档最后更新: 2025-11-06*