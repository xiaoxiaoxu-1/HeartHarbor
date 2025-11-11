<template>
	<view class="content">
		<image class="logo" src="/static/logo.png"></image>
		<view class="text-area">
			<text class="title">{{title}}</text>
		</view>
		<view class="nav-buttons">
			<button class="nav-btn" @click="goToProfile">进入个人中心</button>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				title: 'Hello'
			}
		},
		onLoad() {

		},
		methods: {
			goToProfile() {
				uni.navigateTo({
					url: '/pages/profile/profile'
				});
			}
		}
	}
</script>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.logo {
		height: 200rpx;
		width: 200rpx;
		margin-top: 200rpx;
		margin-left: auto;
		margin-right: auto;
		margin-bottom: 50rpx;
	}

	.text-area {
		display: flex;
		justify-content: center;
	}

	.title {
		font-size: 36rpx;
		color: #8f8f94;
	}

	.nav-buttons {
		margin-top: 40rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20rpx;
	}

	.nav-btn {
		background: #007AFF;
		color: white;
		border: none;
		border-radius: 10rpx;
		padding: 20rpx 40rpx;
		font-size: 28rpx;
		min-width: 200rpx;
	}

	.nav-btn:active {
		background: #0056CC;
		transform: scale(0.98);
	}
</style>
