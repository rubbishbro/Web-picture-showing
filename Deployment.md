# 部署指南

## 部署到 Vercel

### 1. 准备工作

1. **安装 Vercel CLI**

```bash
npm install -g vercel
```

2. **登录 Vercel**

```bash
vercel login
```

### 2. 部署步骤

#### 方法一：使用 Vercel CLI

1. **在项目根目录执行**:

```bash
vercel
```

2. **按照提示操作**:
   - 选择项目名称
   - 确认部署设置
   - 等待部署完成

#### 方法二：使用 GitHub + Vercel Dashboard

1. **将代码推送到 GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

2. **在 Vercel Dashboard 中导入项目**
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 选择您的 GitHub 仓库
   - 配置部署设置

### 3. 环境变量配置

在 Vercel Dashboard 中设置以下环境变量：

```
NODE_ENV=production
```

### 4. 部署配置说明

#### vercel.json 配置

- `builds`: 定义构建配置
  - Python Flask 后端 (`@vercel/python`)
  - React 前端静态构建 (`@vercel/static-build`)
- `routes`: 定义路由规则
  - `/api/*` 路由到 Flask 后端
  - 其他路由到 React 前端

#### 后端适配

- 使用 `/tmp` 目录存储文件（Vercel 无服务器环境）
- 添加根路由重定向到前端
- 配置 CORS 支持

#### 前端适配

- 生产环境使用相对路径访问 API
- 开发环境使用本地服务器

### 5. 部署后验证

1. **访问您的网站**
   - 部署完成后会获得一个 `.vercel.app` 域名
   - 例如: `https://your-project.vercel.app`

2. **测试功能**
   - 上传图片
   - 查看作品列表
   - 测试点赞功能

### 6. 自定义域名（可选）

1. **在 Vercel Dashboard 中添加域名**
2. **配置 DNS 记录**
3. **等待 DNS 生效**

### 7. 常见问题

#### 问题：上传失败

**解决方案**:

- 检查文件大小限制（16MB）
- 确保文件格式支持（JPG, PNG, GIF, WebP）

#### 问题：API 请求失败

**解决方案**:

- 检查 Vercel 函数日志
- 确认路由配置正确

#### 问题：静态文件无法访问

**解决方案**:

- 确认前端构建成功
- 检查路由配置

### 8. 监控和维护

1. **查看部署日志**
   - 在 Vercel Dashboard 中查看函数日志
   - 监控错误和性能

2. **更新部署**
   - 推送代码到 GitHub 自动触发重新部署
   - 或使用 `vercel --prod` 手动部署

### 9. 性能优化

1. **图片优化**
   - 压缩上传的图片
   - 使用 WebP 格式

2. **缓存策略**
   - 配置适当的缓存头
   - 使用 CDN 加速

### 10. 安全考虑

1. **文件上传安全**
   - 验证文件类型
   - 限制文件大小
   - 扫描恶意文件

2. **API 安全**
   - 添加速率限制
   - 实现用户认证（可选）

## 部署完成！

部署成功后，您的作品展示平台就可以在互联网上访问了！

### 功能特性

- ✅ 图片上传和展示
- ✅ 作品标题和描述
- ✅ 点赞功能
- ✅ 响应式设计
- ✅ 现代化 UI

### 技术支持

如果遇到问题，请查看：

- Vercel 部署日志
- 浏览器控制台错误
- 网络请求状态
