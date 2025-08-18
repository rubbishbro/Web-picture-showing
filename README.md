# Web-picture-showing

# 🎨 作品展示平台

一个功能完整的作品展示网站，支持图片上传、文字介绍、标题和点赞功能。

## ✨ 功能特性

- 📸 **图片上传**: 支持JPG、PNG、GIF、WebP格式，最大16MB
- 📝 **作品信息**: 标题和详细描述
- ❤️ **点赞功能**: 每个用户对每个作品只能点赞一次
- 💬 **评论系统**: 支持用户评论和回复
- 👑 **管理员功能**: 管理员可以删除作品和评论
- 📱 **响应式设计**: 完美适配桌面和移动设备
- 🎨 **现代UI**: 美观的用户界面和流畅的交互体验

## 🚀 快速开始

### 环境要求

- Node.js 16+ 
- Python 3.8+
- npm 或 yarn

### 安装依赖

1. **安装前端依赖**

```bash
cd frontend
npm install
```

2. **安装后端依赖**

```bash
cd api
pip install -r requirements.txt
```

### 启动服务

1. **启动后端服务**

```bash
cd api
python start.py
```

后端服务将在 http://localhost:8000 启动

2. **启动前端服务**

```bash
cd frontend
npm start
```

前端应用将在 http://localhost:3000 启动

## 📖 API 文档

### 获取所有作品

```
GET /api/works
```

### 上传新作品

```
POST /api/works
Content-Type: multipart/form-data

参数:
- title: 作品标题 (必填)
- description: 作品描述 (可选)
- image: 图片文件 (必填)
```

### 点赞/取消点赞

```
POST /api/works/{work_id}/like
Content-Type: application/json

参数:
{
  "user_id": "用户ID"
}
```

### 添加评论

```
POST /api/works/{work_id}/comments
Content-Type: application/json

参数:
{
  "content": "评论内容",
  "user_id": "用户ID"
}
```

### 删除评论

```
DELETE /api/works/{work_id}/comments/{comment_id}
Content-Type: application/json
Authorization: Bearer {admin_token}

参数:
{
  "user_id": "用户ID"
}
```

### 删除作品（管理员）

```
DELETE /api/works/{work_id}
Authorization: Bearer {admin_token}
```

### 管理员登录

```
POST /api/admin/login
Content-Type: application/json

参数:
{
  "password": "管理员密码"
}
```

### 健康检查

```
GET /api/health
```

## 🛠️ 技术栈

### 前端

- React 19
- Axios (HTTP客户端)
- React Icons (图标库)
- CSS3 (样式)

### 后端

- Flask (Python Web框架)
- Flask-CORS (跨域支持)
- Pillow (图像处理)

## 📁 项目结构

```
my-vercel-render-site/
├── api/                    # 后端代码
│   ├── app.py             # Flask应用主文件
│   ├── start.py           # 启动脚本
│   ├── requirements.txt   # Python依赖
│   └── uploads/           # 上传的图片存储目录
├── frontend/              # 前端代码
│   ├── src/
│   │   ├── components/    # React组件
│   │   │   ├── WorkCard.js
│   │   │   ├── WorkCard.css
│   │   │   ├── UploadForm.js
│   │   │   └── UploadForm.css
│   │   ├── App.js         # 主应用组件
│   │   └── App.css        # 主应用样式
│   └── package.json       # 前端依赖
└── README.md              # 项目说明
```

## 🎯 使用说明

1. **上传作品**: 点击"上传作品"按钮，填写标题和描述，选择图片文件
2. **查看作品**: 所有作品以卡片形式展示，包含图片、标题、描述和点赞数
3. **点赞功能**: 点击心形图标为作品点赞，再次点击取消点赞
4. **评论功能**: 点击评论图标查看评论，可以添加新评论
5. **管理员功能**: 点击"管理员"按钮登录，可以删除作品和评论
6. **响应式**: 在移动设备上自动适配屏幕大小

## 🔐 管理员功能

### 默认管理员密码

- **开发环境**: `op123`
- **生产环境**: 建议设置环境变量 `ADMIN_PASSWORD`

### 管理员权限

- 删除任何作品
- 删除任何评论
- 查看所有用户活动

### 安全建议

- 定期更换管理员密码
- 使用强密码
- 在生产环境中设置环境变量

## 🔧 部署

### 一键部署到 Vercel

#### 方法：

1. **安装 Vercel CLI**

```bash
npm install -g vercel
```

2. **登录 Vercel**

```bash
vercel login
```

3. **部署项目**

```bash
vercel --prod
```

#### 方法三：GitHub + Vercel Dashboard

1. 将代码推送到 GitHub
2. 在 [Vercel Dashboard](https://vercel.com) 中导入项目
3. 自动部署完成

### 部署配置

- 前端和后端统一部署到 Vercel
- 自动配置路由和构建
- 支持自定义域名
- 自动 HTTPS 和 CDN

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License
