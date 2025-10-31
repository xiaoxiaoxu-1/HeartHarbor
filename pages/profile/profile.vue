<template>
	<view class="profile-container">
		<!-- 用户信息头部 -->
		<view class="user-header">
			<view class="user-avatar-section">
				<image class="user-avatar" :src="userInfo.avatar || '/static/logo.png'"></image>
				<view class="user-info">
					<text class="user-name">{{ userInfo.name || '未登录用户' }}</text>
					<text class="user-id">ID: {{ userInfo.id || '--' }}</text>
				</view>
				<view class="edit-btn" @click="editProfile">
					<text class="edit-text">编辑</text>
				</view>
			</view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-section">
			<view class="stat-item" @click="goToMyPosts">
				<text class="stat-number">{{ userStats.posts || 0 }}</text>
				<text class="stat-label">我的帖子</text>
			</view>
			<view class="stat-item" @click="goToMyLikes">
				<text class="stat-number">{{ userStats.likes || 0 }}</text>
				<text class="stat-label">获赞</text>
			</view>
			<view class="stat-item" @click="goToMyComments">
				<text class="stat-number">{{ userStats.comments || 0 }}</text>
				<text class="stat-label">评论</text>
			</view>
		</view>

		<!-- 功能菜单 -->
		<view class="menu-section">
			<view class="menu-title">个人设置</view>
			
			<view class="menu-list">
				<view class="menu-item" @click="goToAccountSettings">
					<view class="menu-item-left">
						<view class="menu-icon">
							<text class="iconfont">🔒</text>
						</view>
						<text class="menu-text">账号设置</text>
					</view>
					<view class="menu-arrow">></view>
				</view>

				<view class="menu-item" @click="goToPrivacySettings">
					<view class="menu-item-left">
						<view class="menu-icon">
							<text class="iconfont">👁️</text>
						</view>
						<text class="menu-text">隐私设置</text>
					</view>
					<view class="menu-arrow">></view>
				</view>

				<view class="menu-item" @click="goToNotificationSettings">
					<view class="menu-item-left">
						<view class="menu-icon">
							<text class="iconfont">🔔</text>
						</view>
						<text class="menu-text">通知设置</text>
					</view>
					<view class="menu-arrow">></view>
				</view>

				<view class="menu-item" @click="goToHelpCenter">
					<view class="menu-item-left">
						<view class="menu-icon">
							<text class="iconfont">❓</text>
						</view>
						<text class="menu-text">帮助中心</text>
					</view>
					<view class="menu-arrow">></view>
				</view>

				<view class="menu-item" @click="goToAboutUs">
					<view class="menu-item-left">
						<view class="menu-icon">
							<text class="iconfont">ℹ️</text>
						</view>
						<text class="menu-text">关于我们</text>
					</view>
					<view class="menu-arrow">></view>
				</view>
			</view>
		</view>

		<!-- 退出登录 -->
		<view class="logout-section">
			<button class="logout-btn" @click="logout" v-if="isLoggedIn">退出登录</button>
			<view class="login-prompt" v-else>
				<text class="prompt-text">您还未登录，</text>
				<text class="login-link" @click="goToLogin">立即登录</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				userInfo: {
					name: '',
					avatar: '',
					id: ''
				},
				userStats: {
					posts: 0,
					likes: 0,
					comments: 0
				},
				isLoggedIn: false
			}
		},
		onLoad() {
			this.loadUserInfo();
		},
		methods: {
			// 加载用户信息
			loadUserInfo() {
				// 模拟用户数据，实际项目中应该从后端获取
				this.userInfo = {
					name: '心屿用户',
					avatar: '/static/logo.png',
					id: '20240001'
				};
				this.userStats = {
					posts: 12,
					likes: 156,
					comments: 45
				};
				this.isLoggedIn = true;
			},

			// 编辑个人资料
			editProfile() {
				uni.showToast({
					title: '编辑功能开发中',
					icon: 'none'
				});
			},

			// 跳转到我的帖子
			goToMyPosts() {
				uni.showToast({
					title: '我的帖子页面开发中',
					icon: 'none'
				});
			},

			// 跳转到我的点赞
			goToMyLikes() {
				uni.showToast({
					title: '我的点赞页面开发中',
					icon: 'none'
				});
			},

			// 跳转到我的评论
			goToMyComments() {
				uni.showToast({
					title: '我的评论页面开发中',
					icon: 'none'
				});
			},

			// 跳转到账号设置
			goToAccountSettings() {
				uni.showToast({
					title: '账号设置页面开发中',
					icon: 'none'
				});
			},

			// 跳转到隐私设置
			goToPrivacySettings() {
				uni.showToast({
					title: '隐私设置页面开发中',
					icon: 'none'
				});
			},

			// 跳转到通知设置
			goToNotificationSettings() {
				uni.showToast({
					title: '通知设置页面开发中',
					icon: 'none'
				});
			},

			// 跳转到帮助中心
			goToHelpCenter() {
				uni.showToast({
					title: '帮助中心页面开发中',
					icon: 'none'
				});
			},

			// 跳转到关于我们
			goToAboutUs() {
				uni.showToast({
					title: '关于我们页面开发中',
					icon: 'none'
				});
			},

			// 退出登录
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '您确定要退出登录吗？',
					success: (res) => {
						if (res.confirm) {
							this.isLoggedIn = false;
							this.userInfo = {};
							this.userStats = {};
							uni.showToast({
								title: '退出成功',
								icon: 'success'
							});
						}
					}
				});
			},

			// 跳转到登录页面
			goToLogin() {
				uni.navigateTo({
					url: '/pages/login/login'
				});
			}
		}
	}
</script>

<style>
	.profile-container {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding: 20rpx;
	}

	/* 用户头部样式 */
	.user-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		margin-bottom: 30rpx;
		color: white;
	}

	.user-avatar-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.user-avatar {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		border: 4rpx solid rgba(255, 255, 255, 0.3);
	}

	.user-info {
		flex: 1;
		margin-left: 30rpx;
	}

	.user-name {
		font-size: 36rpx;
		font-weight: bold;
		display: block;
		margin-bottom: 10rpx;
	}

	.user-id {
		font-size: 24rpx;
		opacity: 0.8;
	}

	.edit-btn {
		background: rgba(255, 255, 255, 0.2);
		padding: 10rpx 20rpx;
		border-radius: 20rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.3);
	}

	.edit-text {
		font-size: 24rpx;
	}

	/* 统计信息样式 */
	.stats-section {
		display: flex;
		justify-content: space-around;
		background: white;
		border-radius: 20rpx;
		padding: 30rpx 0;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.stat-item {
		text-align: center;
		flex: 1;
	}

	.stat-number {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}

	.stat-label {
		font-size: 24rpx;
		color: #666;
	}

	/* 菜单样式 */
	.menu-section {
		background: white;
		border-radius: 20rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.menu-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #333;
		padding: 30rpx 30rpx 20rpx;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.menu-list {
		padding: 0 30rpx;
	}

	.menu-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.menu-item:last-child {
		border-bottom: none;
	}

	.menu-item-left {
		display: flex;
		align-items: center;
	}

	.menu-icon {
		width: 60rpx;
		height: 60rpx;
		border-radius: 12rpx;
		background: #f8f9fa;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}

	.menu-text {
		font-size: 28rpx;
		color: #333;
	}

	.menu-arrow {
		color: #ccc;
		font-size: 24rpx;
	}

	/* 退出登录样式 */
	.logout-section {
		background: white;
		border-radius: 20rpx;
		padding: 30rpx;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
	}

	.logout-btn {
		background: #ff4757;
		color: white;
		border: none;
		border-radius: 50rpx;
		padding: 20rpx 0;
		font-size: 28rpx;
		width: 100%;
	}

	.login-prompt {
		text-align: center;
		padding: 20rpx 0;
	}

	.prompt-text {
		font-size: 28rpx;
		color: #666;
	}

	.login-link {
		font-size: 28rpx;
		color: #1890ff;
		margin-left: 10rpx;
	}
</style>