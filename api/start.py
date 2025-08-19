#!/usr/bin/env python3
"""
启动脚本 - 运行Flask应用
"""

from app import app

if __name__ == '__main__':
    print("🚀 启动作品展示平台后端服务...")
    print("📍 服务地址: http://localhost:8000")
    print("📖 API文档:")
    print("   - GET  /api/works - 获取所有作品")
    print("   - POST /api/works - 上传新作品")
    print("   - POST /api/works/<id>/like - 点赞/取消点赞")
    print("   - GET  /api/health - 健康检查")
    print("\n按 Ctrl+C 停止服务")
    
    app.run(debug=True, host='0.0.0.0', port=8000)
