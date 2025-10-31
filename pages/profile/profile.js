// pages/profile/profile.js
Page({
  data: {
    userInfo: {},
    userStats: {},
    isLoggedIn: false
  },

  onLoad: function (options) {
    this.loadUserInfo();
  },

  loadUserInfo: function() {
    // 模拟用户数据
    this.setData({
      userInfo: {
        name: '心屿用户',
        avatar: '/static/logo.png',
        id: '20240001'
      },
      userStats: {
        posts: 12,
        likes: 156,
        comments: 45
      },
      isLoggedIn: true
    });
  },

  editProfile: function() {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
  },

  goToMyPosts: function() {
    wx.showToast({
      title: '我的帖子页面开发中',
      icon: 'none'
    });
  },

  goToMyLikes: function() {
    wx.showToast({
      title: '我的点赞页面开发中',
      icon: 'none'
    });
  },

  goToMyComments: function() {
    wx.showToast({
      title: '我的评论页面开发中',
      icon: 'none'
    });
  },

  goToAccountSettings: function() {
    wx.showToast({
      title: '账号设置页面开发中',
      icon: 'none'
    });
  },

  goToPrivacySettings: function() {
    wx.showToast({
      title: '隐私设置页面开发中',
      icon: 'none'
    });
  },

  goToNotificationSettings: function() {
    wx.showToast({
      title: '通知设置页面开发中',
      icon: 'none'
    });
  },

  goToHelpCenter: function() {
    wx.showToast({
      title: '帮助中心页面开发中',
      icon: 'none'
    });
  },

  goToAboutUs: function() {
    wx.showToast({
      title: '关于我们页面开发中',
      icon: 'none'
    });
  },

  logout: function() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            isLoggedIn: false,
            userInfo: {},
            userStats: {}
          });
          wx.showToast({
            title: '退出成功',
            icon: 'success'
          });
        }
      }
    });
  },

  goToLogin: function() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  }
})