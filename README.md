# HeartHarbor - 校园匿名心理支持平台

这是一个基于uni-app开发的多端应用项目。

## 项目运行说明

### 方式一：使用HBuilderX（推荐）
1. 下载并安装[HBuilderX](https://www.dcloud.io/hbuilderx.html)
2. 打开HBuilderX，选择"文件" → "打开目录"，选择本项目文件夹
3. 在HBuilderX中运行项目：
   - 选择运行到浏览器
   - 或运行到微信开发者工具
   - 或运行到其他小程序平台

### 方式二：使用命令行工具
需要安装uni-app官方CLI工具：
```bash
# 安装vue-cli
npm install -g @vue/cli

# 安装uni-app CLI（正确的包名）
npm install -g @dcloudio/vue-cli-plugin-uni

# 创建uni-app项目（如果当前项目无法直接运行）
vue create -p dcloudio/uni-preset-vue my-project
```

### 方式三：使用HBuilderX CLI（推荐）
```bash
# 如果已安装HBuilderX，可以使用其命令行工具
# 运行到H5
npm run dev:h5
# 运行到微信小程序
npm run dev:mp-weixin
```

### 项目结构
- `pages/` - 页面文件
- `static/` - 静态资源
- `App.vue` - 应用入口
- `main.js` - 主程序文件
- `pages.json` - 页面配置
- `manifest.json` - 应用配置

### 注意事项
- 这是一个uni-app项目，不能直接使用普通静态服务器运行
- 需要编译后才能生成可运行的HTML文件
- 建议使用HBuilderX进行开发和调试