import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    # 测试健康检查
    print("1. 测试健康检查...")
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.json()}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试获取作品列表
    print("\n2. 测试获取作品列表...")
    try:
        response = requests.get(f"{base_url}/api/works")
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.json()}")
    except Exception as e:
        print(f"   错误: {e}")
    
    # 测试上传作品（模拟）
    print("\n3. 测试上传作品...")
    try:
        # 创建一个简单的测试文件
        files = {
            'image': ('test.jpg', b'fake image data', 'image/jpeg')
        }
        data = {
            'title': '测试作品',
            'description': '这是一个测试作品'
        }
        
        response = requests.post(f"{base_url}/api/works", files=files, data=data)
        print(f"   状态码: {response.status_code}")
        print(f"   响应: {response.json()}")
    except Exception as e:
        print(f"   错误: {e}")

if __name__ == "__main__":
    test_api()
