# api/local_server.py
from http.server import SimpleHTTPRequestHandler, HTTPServer

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/hello':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"message": "本地开发模式"}')
        else:
            super().do_GET()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8000), Handler)
    print("本地API服务器运行在 http://localhost:8000")
    server.serve_forever()