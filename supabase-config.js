// Supabase配置文件
const SUPABASE_URL = 'https://evvvotdeckcsizulgcar.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dnZvdGRlY2tjc2l6dWxnY2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDE4MTMsImV4cCI6MjA3NjY3NzgxM30.3S8QGaDcJuVH7F2w931QsvSMe4Z8XjPH1pE2EDY-voQ';

// 初始化Supabase客户端
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// 用户认证相关函数
class AuthService {
    // 用户注册
    static async register(email, password, username) {
        try {
            console.log('开始注册用户:', { email, username });
            
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
    // 获取所有帖子
    static async getPosts(limit = 20, offset = 0) {
        try {
            const { data, error } = await supabaseClient
                .from('treehole_posts')
                .select(`
                    *,
                    user:users(username, avatar_url)
                `)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('获取帖子错误:', error);
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

// 导出服务类
window.HeartHarborServices = {
    AuthService,
    TreeholeService,
    KnowledgeBaseService,
    AIChatService,
    supabaseClient
};