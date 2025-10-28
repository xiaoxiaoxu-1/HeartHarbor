// 全局用户状态管理模块
class UserStateManager {
    constructor() {
        this.currentUser = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // 等待Supabase服务初始化（最多等待10秒）
            let retryCount = 0;
            const maxRetries = 50; // 10秒（50 * 200ms）
            
            while (!window.HeartHarborServices && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 200));
                retryCount++;
            }
            
            if (!window.HeartHarborServices) {
                console.warn('HeartHarborServices 未初始化，使用默认状态');
                this.currentUser = null;
                this.isInitialized = true;
                this.dispatchStateChange();
                
                // 监听Supabase初始化完成事件
                window.addEventListener('supabaseInitialized', () => {
                    console.log('Supabase初始化完成，重新初始化用户状态');
                    this.updateUserState();
                });
                
                return;
            }
            
            // 检查Supabase客户端是否可用
            if (!window.HeartHarborServices.supabaseClient) {
                console.warn('Supabase客户端不可用，使用默认状态');
                this.currentUser = null;
                this.isInitialized = true;
                this.dispatchStateChange();
                return;
            }
            
            const { data: { user } } = await window.HeartHarborServices.supabaseClient.auth.getUser();
            this.currentUser = user;
            this.isInitialized = true;
            
            // 触发状态更新事件
            this.dispatchStateChange();
        } catch (error) {
            console.error('用户状态初始化失败:', error);
            this.currentUser = null;
            this.isInitialized = true;
            this.dispatchStateChange();
        }
    }

    // 获取当前用户
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }

    // 更新用户状态
    async updateUserState() {
        try {
            const { data: { user } } = await window.HeartHarborServices.supabaseClient.auth.getUser();
            this.currentUser = user;
            this.dispatchStateChange();
            return user;
        } catch (error) {
            console.error('更新用户状态失败:', error);
            return null;
        }
    }

    // 设置用户状态
    setUser(user) {
        this.currentUser = user;
        this.dispatchStateChange();
    }

    // 清除用户状态
    clearUser() {
        this.currentUser = null;
        this.dispatchStateChange();
    }

    // 分发状态变化事件
    dispatchStateChange() {
        const event = new CustomEvent('userStateChange', {
            detail: {
                user: this.currentUser,
                isLoggedIn: !!this.currentUser
            }
        });
        window.dispatchEvent(event);
    }

    // 等待初始化完成
    async waitForInitialization() {
        while (!this.isInitialized) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return this;
    }
}

// 创建全局实例
window.UserStateManager = new UserStateManager();

// 导航栏状态管理
class NavigationManager {
    constructor() {
        this.init();
    }

    async init() {
        // 监听用户状态变化
        window.addEventListener('userStateChange', (event) => {
            this.updateNavigation(event.detail);
        });

        // 初始更新
        await window.UserStateManager.waitForInitialization();
        this.updateNavigation({
            user: window.UserStateManager.getCurrentUser(),
            isLoggedIn: window.UserStateManager.isLoggedIn()
        });
    }

    // 更新导航栏状态
    updateNavigation(state) {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.querySelector('.user-menu');
        
        if (state.isLoggedIn) {
            // 用户已登录，显示用户菜单
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'flex';
            
            // 更新用户信息
            this.updateUserInfo(state.user);
        } else {
            // 用户未登录，显示登录注册按钮
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    // 更新用户信息
    async updateUserInfo(user) {
        if (!user) return;

        try {
            // 获取用户详细信息
            const { data: userData, error } = await window.HeartHarborServices.supabaseClient
                .from('users')
                .select('username, avatar_url')
                .eq('id', user.id)
                .single();

            if (userData && !error) {
                const userNameElement = document.querySelector('.user-name');
                if (userNameElement) {
                    userNameElement.textContent = userData.username || '用户';
                }

                const userAvatar = document.querySelector('.user-avatar');
                if (userAvatar && userData.avatar_url) {
                    userAvatar.innerHTML = `<img src="${userData.avatar_url}" alt="用户头像">`;
                }
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    }

    // 初始化导航栏事件
    initNavigationEvents() {
        // 退出登录事件
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // 用户菜单点击事件
        const userInfo = document.querySelector('.user-info');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        if (userInfo && dropdownMenu) {
            userInfo.addEventListener('click', () => {
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            });

            // 点击其他地方关闭下拉菜单
            document.addEventListener('click', (e) => {
                if (!userInfo.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }
    }

    // 退出登录
    async logout() {
        try {
            const result = await window.HeartHarborServices.AuthService.logout();
            if (result.success) {
                window.UserStateManager.clearUser();
                
                // 显示成功消息
                this.showMessage('已成功退出登录', 'success');
                
                // 延迟刷新页面
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showMessage('退出登录失败，请重试', 'error');
            }
        } catch (error) {
            console.error('退出登录错误:', error);
            this.showMessage('退出登录失败，请重试', 'error');
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 移除现有的消息
        const existingMessage = document.querySelector('.global-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建新消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `global-message global-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#48BB78' : type === 'error' ? '#E53E3E' : '#3182CE'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(messageDiv);

        // 3秒后自动移除
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// 创建全局导航管理器
window.NavigationManager = new NavigationManager();

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.NavigationManager.initNavigationEvents();
    });
} else {
    window.NavigationManager.initNavigationEvents();
}