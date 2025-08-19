import requests
import time

def test_simple():
    print("等待服务启动...")
    time.sleep(2)
    
    try:
        response = requests.get("http://127.0.0.1:8000/api/health", timeout=5)
        print(f"健康检查成功: {response.status_code}")
        print(f"响应: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("连接失败 - 服务可能没有启动")
    except Exception as e:
        print(f"其他错误: {e}")

if __name__ == "__main__":
    test_simple()
