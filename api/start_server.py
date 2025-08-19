#!/usr/bin/env python3
"""
启动脚本 - 确保Flask应用正常启动
"""

import os
import sys
import time
import requests
from app import app

def check_server():
    """检查服务器是否正常启动"""
    max_retries = 10
    for i in range(max_retries):
        try:
            response = requests.get("http://127.0.0.1:8000/api/health", timeout=2)
            if response.status_code == 200:
                print("✅ 服务器启动成功！")
                return True
        except:
            pass
        time.sleep(1)
        print(f"⏳ 等待服务器启动... ({i+1}/{max_retries})")
    return False

if __name__ == '__main__':
    print("🚀 启动作品展示平台后端服务...")
    print("📍 服务地址: http://localhost:8000")
    print("📖 API文档:")
    print("   - GET  /api/works - 获取所有作品")
    print("   - POST /api/works - 上传新作品")
    print("   - POST /api/works/<id>/like - 点赞/取消点赞")
    print("   - GET  /api/health - 健康检查")
    print("\n正在启动服务...")
    
    # 确保上传目录存在
    os.makedirs('uploads', exist_ok=True)
    
    # 启动服务器
    app.run(debug=True, host='0.0.0.0', port=8000, use_reloader=False)
