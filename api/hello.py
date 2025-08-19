from http.server import BaseHTTPRequestHandler
import json
import os


class Handler(BaseHTTPRequestHandler):
    def do_get(self):
        # 添加调试日志
        print(f"请求路径: {self.path}")
        print(f"环境变量: {os.environ}")

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

        response = json.dumps({
            "status": "success",
            "message": "来自 Python 的响应",
            "path": self.path
        })

        print(f"响应内容: {response}")
        self.wfile.write(response.encode())
