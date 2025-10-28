// Supabase配置文件
const SUPABASE_URL = 'https://evvvotdeckcsizulgcar.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dnZvdGRlY2tjc2l6dWxnY2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDE4MTMsImV4cCI6MjA3NjY3NzgxM30.3S8QGaDcJuVH7F2w931QsvSMe4Z8XjPH1pE2EDY-voQ';

// 初始化Supabase客户端
let supabaseClient = null;

// 延迟初始化Supabase客户端
async function initializeSupabase() {
    // 检查Supabase SDK是否已加载
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase SDK 未加载，等待加载...');
        
        // 检查是否超时（最多等待5秒）
        if (window.supabaseLoadTimeout) {
            console.error('Supabase SDK 加载超时');
            showSupabaseError('Supabase SDK 加载失败，请检查网络连接或刷新页面重试');
            return;
        }
        
        // 设置超时检查
        if (!window.supabaseLoadTimeout) {
            window.supabaseLoadTimeout = setTimeout(() => {
                console.error('Supabase SDK 加载超时');
                showSupabaseError('Supabase SDK 加载失败，请检查网络连接或刷新页面重试');
            }, 5000);
        }
        
        setTimeout(initializeSupabase, 200);
        return;
    }
    
    // 清除超时计时器
    if (window.supabaseLoadTimeout) {
        clearTimeout(window.supabaseLoadTimeout);
        window.supabaseLoadTimeout = null;
    }
    
    try {
        const { createClient } = window.supabase;
        
        // 验证配置
        if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            throw new Error('Supabase URL 未配置');
        }
        if (!SUPABASE_KEY || SUPABASE_KEY === 'YOUR_SUPABASE_KEY') {
            throw new Error('Supabase Key 未配置');
        }
        
        supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        
        // 测试连接
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) {
            console.warn('Supabase连接测试失败（可能正常）:', error.message);
        }
        
        console.log('Supabase客户端初始化成功');
        
        // 立即设置全局服务对象
        window.HeartHarborServices = {
            AuthService,
            TreeholeService,
            KnowledgeBaseService,
            AIChatService,
            supabaseClient
        };
        
        // 触发初始化完成事件
        window.dispatchEvent(new CustomEvent('supabaseInitialized'));
        
    } catch (error) {
        console.error('Supabase客户端初始化失败:', error);
        showSupabaseError(`Supabase初始化失败: ${error.message}`);
    }
}

// 显示Supabase错误信息
function showSupabaseError(message) {
    // 创建错误提示
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f56565;
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;
    errorDiv.innerHTML = `
        <strong>系统错误:</strong> ${message}
        <button onclick="this.parentElement.remove()" style="margin-left: 10px; background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
    `;
    
    document.body.appendChild(errorDiv);
}

// 立即开始初始化
initializeSupabase();

// 用户认证相关函数
class AuthService {
    // 用户注册
    static async register(email, password, username) {
        try {
            console.log('开始注册用户:', { email, username });
            
            // 检查Supabase客户端是否已初始化
            if (!supabaseClient) {
                console.error('Supabase客户端未初始化');
                return { success: false, error: '系统初始化失败，请刷新页面重试' };
            }
            
            // 使用Supabase Auth进行用户注册，禁用邮箱确认
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        username: username
                    }
                }
            });
            
            if (error) {
                console.error('Supabase注册错误:', error);
                
                // 根据错误类型返回相应的错误消息
                let errorMessage = '注册失败，请重试';
                if (error.message.includes('already registered')) {
                    errorMessage = '该邮箱已被注册';
                } else if (error.message.includes('password')) {
                    errorMessage = '密码不符合要求';
                } else if (error.message.includes('email')) {
                    errorMessage = '邮箱格式不正确';
                }
                
                return { success: false, error: errorMessage };
            }
            
            console.log('注册成功:', data);
            
            // 如果注册成功，尝试在users表中创建用户记录
            if (data.user) {
                try {
                    const { error: dbError } = await supabaseClient
                        .from('users')
                        .insert([{
                            id: data.user.id,
                            email: email,
                            username: username,
                            created_at: new Date().toISOString()
                        }]);
                    
                    if (dbError) {
                        console.log('创建用户记录失败（可能已存在）:', dbError);
                        // 不返回错误，因为Auth注册已经成功
                    }
                } catch (dbError) {
                    console.log('创建用户记录异常:', dbError);
                    // 不返回错误，因为Auth注册已经成功
                }
            }
            
            // 自动登录用户（不需要邮箱确认）
            if (data.user) {
                try {
                    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });
                    
                    if (signInError) {
                        console.log('自动登录失败:', signInError);
                        // 即使自动登录失败，注册仍然成功
                    } else {
                        console.log('自动登录成功:', sessionData.user.email);
                    }
                } catch (signInError) {
                    console.log('自动登录异常:', signInError);
                    // 即使自动登录失败，注册仍然成功
                }
            }
            
            return { 
                success: true, 
                data: {
                    user: data.user,
                    message: '注册成功！已自动登录'
                }
            };
        } catch (error) {
            console.error('注册异常:', error);
            return { success: false, error: '注册过程中发生错误，请重试' };
        }
    }
    
    // 简单的密码哈希函数
    static async hashPassword(password) {
        // 使用简单的哈希方法（实际项目中应使用更安全的哈希算法）
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'heart-harbor-salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // 用户登录
    static async login(email, password) {
        try {
            console.log('开始用户登录:', email);
            
            // 检查Supabase客户端是否已初始化
            if (!supabaseClient) {
                console.error('Supabase客户端未初始化');
                return { success: false, error: '系统初始化失败，请刷新页面重试' };
            }
            
            // 使用Supabase认证登录
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('登录错误:', error);
                
                // 根据错误类型返回相应的错误消息
                let errorMessage = '登录失败，请检查邮箱和密码';
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = '邮箱或密码错误';
                } else if (error.message.includes('Email not confirmed')) {
                    errorMessage = '请先验证邮箱';
                }
                
                return { success: false, error: errorMessage };
            }
            
            console.log('登录成功:', data.user.email);
            
            // 更新最后登录时间
            if (data.user) {
                try {
                    await supabaseClient
                        .from('users')
                        .update({ last_login: new Date().toISOString() })
                        .eq('id', data.user.id);
                } catch (dbError) {
                    console.log('更新登录时间失败:', dbError);
                    // 不返回错误，因为登录已经成功
                }
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('登录异常:', error);
            return { success: false, error: '登录过程中发生错误，请重试' };
        }
    }
    
    // 用户登出
    static async logout() {
        try {
            // 清除localStorage中的会话信息
            localStorage.removeItem('heart-harbor-session');
            
            // 检查Supabase客户端是否已初始化
            if (!supabaseClient) {
                console.error('Supabase客户端未初始化');
                return { success: true }; // 即使Supabase未初始化，也认为登出成功
            }
            
            // 尝试Supabase登出
            const { error } = await supabaseClient.auth.signOut();
            if (error) {
                console.log('Supabase登出失败，但已清除本地会话:', error.message);
            }
            
            return { success: true };
        } catch (error) {
            console.error('登出错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取当前用户
    static async getCurrentUser() {
        try {
            // 首先检查localStorage中的会话
            const sessionData = localStorage.getItem('heart-harbor-session');
            if (sessionData) {
                const session = JSON.parse(sessionData);
                return { data: { user: session.user }, error: null };
            }
            
            // 如果没有本地会话，使用Supabase认证
            return await supabaseClient.auth.getUser();
        } catch (error) {
            console.error('获取用户信息错误:', error);
            return { data: { user: null }, error: error };
        }
    }
}

// 树洞相关函数
class TreeholeService {
    // 获取所有帖子（带缓存优化）
    static async getPosts(limit = 15, offset = 0) {
        try {
            // 生成缓存键
            const cacheKey = `treehole_posts_${limit}_${offset}`;
            const cacheTimestamp = `treehole_posts_timestamp`;
            
            // 检查缓存是否有效（5分钟内）
            const cachedData = localStorage.getItem(cacheKey);
            const cachedTime = localStorage.getItem(cacheTimestamp);
            const now = Date.now();
            
            if (cachedData && cachedTime && (now - parseInt(cachedTime)) < 5 * 60 * 1000) {
                console.log('使用缓存的帖子数据');
                return { success: true, data: JSON.parse(cachedData), cached: true };
            }
            
            // 从数据库获取最新数据
            const { data, error } = await supabaseClient
                .from('treehole_posts')
                .select(`
                    *,
                    user:users(username, avatar_url)
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) throw error;
            
            // 缓存数据
            if (data) {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                localStorage.setItem(cacheTimestamp, now.toString());
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('获取帖子错误:', error);
            
            // 如果网络错误，尝试使用缓存数据
            const cacheKey = `treehole_posts_${limit}_${offset}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                console.log('网络错误，使用缓存的帖子数据');
                return { success: true, data: JSON.parse(cachedData), cached: true };
            }
            
            return { success: false, error: error.message };
        }
    }
    
    // 创建新帖子
    static async createPost(content, mood = null, isAnonymous = true) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) throw new Error('用户未登录');
            
            const { data, error } = await supabaseClient
                .from('treehole_posts')
                .insert([{
                    user_id: user.data.user.id,
                    content: content,
                    mood: mood,
                    is_anonymous: isAnonymous,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('创建帖子错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取帖子评论
    static async getComments(postId) {
        try {
            const { data, error } = await supabaseClient
                .from('treehole_comments')
                .select(`
                    *,
                    user:users(username, avatar_url)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取评论错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 添加评论
    static async addComment(postId, content, isAnonymous = true) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) throw new Error('用户未登录');
            
            const { data, error } = await supabaseClient
                .from('treehole_comments')
                .insert([{
                    post_id: postId,
                    user_id: user.data.user.id,
                    content: content,
                    is_anonymous: isAnonymous,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            // 更新帖子评论数
            await supabaseClient.rpc('increment_comment_count', { post_id: postId });
            
            return { success: true, data };
        } catch (error) {
            console.error('添加评论错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 点赞帖子
    static async likePost(postId) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) {
                return { success: false, error: '用户未登录，请先登录后再点赞' };
            }
            
            // 验证帖子是否存在
            const { data: post, error: postError } = await supabaseClient
                .from('treehole_posts')
                .select('id')
                .eq('id', postId)
                .single();
            
            if (postError) {
                if (postError.code === 'PGRST116') {
                    return { success: false, error: '帖子不存在或已被删除' };
                }
                throw postError;
            }
            
            // 检查是否已经点赞
            const { data: existingLike, error: checkError } = await supabaseClient
                .from('treehole_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.data.user.id)
                .single();
            
            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }
            
            if (existingLike) {
                // 取消点赞
                const { error: deleteError } = await supabaseClient
                    .from('treehole_likes')
                    .delete()
                    .eq('id', existingLike.id);
                
                if (deleteError) throw deleteError;
                
                // 减少点赞数
                const { error: decrementError } = await supabaseClient.rpc('decrement_like_count', { post_id: postId });
                if (decrementError) throw decrementError;
                
                return { success: true, liked: false, action: 'unlike' };
            } else {
                // 添加点赞
                const { error: insertError } = await supabaseClient
                    .from('treehole_likes')
                    .insert([{
                        post_id: postId,
                        user_id: user.data.user.id,
                        created_at: new Date().toISOString()
                    }]);
                
                if (insertError) throw insertError;
                
                // 增加点赞数
                const { error: incrementError } = await supabaseClient.rpc('increment_like_count', { post_id: postId });
                if (incrementError) throw incrementError;
                
                return { success: true, liked: true, action: 'like' };
            }
        } catch (error) {
            console.error('点赞操作错误:', error);
            
            // 提供更友好的错误信息
            let errorMessage = '点赞失败，请重试';
            if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message.includes('timeout')) {
                errorMessage = '请求超时，请稍后重试';
            } else if (error.message.includes('permission') || error.message.includes('auth')) {
                errorMessage = '权限不足，请重新登录';
            }
            
            return { success: false, error: errorMessage };
        }
    }
    
    // 批量获取帖子点赞状态
    static async getPostsLikeStatus(postIds) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) {
                // 如果用户未登录，返回所有帖子都未点赞
                const statusMap = {};
                postIds.forEach(id => {
                    statusMap[id] = false;
                });
                return { success: true, data: statusMap };
            }
            
            const { data, error } = await supabaseClient
                .from('treehole_likes')
                .select('post_id')
                .eq('user_id', user.data.user.id)
                .in('post_id', postIds);
            
            if (error) throw error;
            
            // 构建点赞状态映射
            const statusMap = {};
            postIds.forEach(id => {
                statusMap[id] = data.some(like => like.post_id === id);
            });
            
            return { success: true, data: statusMap };
        } catch (error) {
            console.error('获取帖子点赞状态错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取帖子点赞状态
    static async getPostLikeStatus(postId) {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) return { success: true, liked: false };
            
            const { data, error } = await supabaseClient
                .from('treehole_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', user.data.user.id)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                throw error;
            }
            
            return { success: true, liked: !!data };
        } catch (error) {
            console.error('获取点赞状态错误:', error);
            return { success: false, error: error.message };
        }
    }
}

// 心理咨询库相关函数
class KnowledgeBaseService {
    // 获取所有文章
    static async getArticles(category = null, limit = 20, offset = 0) {
        try {
            let query = supabaseClient
                .from('knowledge_articles')
                .select('*')
                .eq('is_published', true)
                .order('created_at', { ascending: false });
            
            if (category) {
                query = query.eq('category', category);
            }
            
            const { data, error } = await query.range(offset, offset + limit - 1);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取文章错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 搜索文章
    static async searchArticles(query, limit = 20) {
        try {
            const { data, error } = await supabaseClient
                .from('knowledge_articles')
                .select('*')
                .textSearch('title', query)
                .eq('is_published', true)
                .limit(limit);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('搜索文章错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取文章详情
    static async getArticle(id) {
        try {
            const { data, error } = await supabaseClient
                .from('knowledge_articles')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            
            // 增加浏览量
            await supabaseClient.rpc('increment_view_count', { article_id: id });
            
            return { success: true, data };
        } catch (error) {
            console.error('获取文章详情错误:', error);
            return { success: false, error: error.message };
        }
    }
}

// AI聊天相关函数
class AIChatService {
    // 获取用户的所有聊天会话
    static async getSessions() {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) throw new Error('用户未登录');
            
            const { data, error } = await supabaseClient
                .from('ai_chat_sessions')
                .select('*')
                .eq('user_id', user.data.user.id)
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取聊天会话错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 创建新聊天会话
    static async createSession(title = '新对话') {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user.data.user) throw new Error('用户未登录');
            
            const { data, error } = await supabaseClient
                .from('ai_chat_sessions')
                .insert([{
                    user_id: user.data.user.id,
                    title: title,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('创建聊天会话错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 获取聊天消息
    static async getMessages(sessionId) {
        try {
            const { data, error } = await supabaseClient
                .from('ai_chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取聊天消息错误:', error);
            return { success: false, error: error.message };
        }
    }
    
    // 发送消息
    static async sendMessage(sessionId, content, role = 'user') {
        try {
            const { data, error } = await supabaseClient
                .from('ai_chat_messages')
                .insert([{
                    session_id: sessionId,
                    role: role,
                    content: content,
                    created_at: new Date().toISOString()
                }])
                .select();
            
            if (error) throw error;
            
            // 更新会话时间
            await supabaseClient
                .from('ai_chat_sessions')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', sessionId);
            
            return { success: true, data };
        } catch (error) {
            console.error('发送消息错误:', error);
            return { success: false, error: error.message };
        }
    }
}

// 如果初始化函数还没有设置全局服务对象，在这里设置
if (!window.HeartHarborServices) {
    window.HeartHarborServices = {
        AuthService,
        TreeholeService,
        KnowledgeBaseService,
        AIChatService,
        supabaseClient
    };
}