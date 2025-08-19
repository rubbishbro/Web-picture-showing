from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime, timezone, timedelta
from werkzeug.utils import secure_filename
import logging
# from cloud_storage import storage  # 暂时注释掉云存储模块

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = '/tmp/uploads' if os.environ.get('VERCEL') else 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# 确保上传目录存在（用于本地存储）
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 数据文件 - 在Vercel中使用临时存储
DATA_FILE = '/tmp/works.json' if os.environ.get('VERCEL') else 'works.json'

# 配置WORKS_FILE
app.config['WORKS_FILE'] = DATA_FILE

# 管理员配置
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'op123')  # 默认密码，建议在生产环境中设置环境变量

def get_beijing_time():
    """获取北京时间"""
    # 北京时间是UTC+8
    beijing_tz = timezone(timedelta(hours=8))
    return datetime.now(beijing_tz)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_works():
    """从JSON文件加载作品数据"""
    try:
        if os.path.exists(app.config['WORKS_FILE']):
            with open(app.config['WORKS_FILE'], 'r', encoding='utf-8') as f:
                works = json.load(f)
                # 确保每个作品都有置顶字段
                for work in works:
                    if 'is_pinned' not in work:
                        work['is_pinned'] = False
                return works
        return []
    except Exception as e:
        logger.error(f"加载作品数据失败: {e}")
        return []

def save_works(works):
    """保存作品数据到JSON文件"""
    try:
        # 按置顶状态和创建时间排序：置顶的在前，然后按时间倒序
        sorted_works = sorted(works, key=lambda x: (not x.get('is_pinned', False), x.get('created_at', ''), x.get('id', '')), reverse=True)
        
        with open(app.config['WORKS_FILE'], 'w', encoding='utf-8') as f:
            json.dump(sorted_works, f, ensure_ascii=False, indent=2)
        logger.info(f"作品数据已保存，共 {len(works)} 个作品")
    except Exception as e:
        logger.error(f"保存作品数据失败: {e}")

def is_admin(request):
    """检查是否为管理员"""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        return token == ADMIN_PASSWORD
    return False

@app.route('/')
def index():
    """根路由 - 返回前端页面"""
    return render_template_string('''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>作品展示平台</title>
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .loading { font-size: 18px; color: #666; }
        </style>
    </head>
    <body>
        <div class="loading">正在加载作品展示平台...</div>
        <script>
            // 重定向到前端应用
            window.location.href = '/frontend';
        </script>
    </body>
    </html>
    ''')

@app.route('/api/works', methods=['GET'])
def get_works():
    """获取所有作品列表"""
    try:
        works = load_works()
        # 按置顶状态和创建时间排序
        sorted_works = sorted(works, key=lambda x: (not x.get('is_pinned', False), x.get('created_at', ''), x.get('id', '')), reverse=True)
        logger.info(f"获取作品列表，共 {len(works)} 个作品")
        return jsonify(sorted_works)
    except Exception as e:
        logger.error(f"获取作品列表失败: {e}")
        return jsonify({'error': '获取作品列表失败'}), 500

@app.route('/api/works', methods=['POST'])
def upload_work():
    """上传作品（支持多图）"""
    try:
        # 获取表单数据
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        username = request.form.get('username', '匿名用户').strip()
        realName = request.form.get('realName', '').strip()
        
        if not title:
            return jsonify({'error': '标题不能为空'}), 400
        
        # 检查是否有图片文件
        if 'images' not in request.files:
            return jsonify({'error': '请选择至少一张图片'}), 400
        
        images = request.files.getlist('images')  # 获取多个图片文件
        
        if not images or all(img.filename == '' for img in images):
            return jsonify({'error': '请选择至少一张图片'}), 400
        
        # 验证所有图片文件
        valid_images = []
        for img in images:
            if img and img.filename and allowed_file(img.filename):
                valid_images.append(img)
        
        if not valid_images:
            return jsonify({'error': '没有有效的图片文件'}), 400
        
        # 生成作品ID
        work_id = str(uuid.uuid4())
        
        # 保存所有图片
        image_urls = []
        for i, img in enumerate(valid_images):
            # 生成唯一文件名
            file_ext = os.path.splitext(img.filename)[1]
            unique_filename = f"{work_id}_{i}{file_ext}"
            
            # 读取图片数据
            img.seek(0)  # 重置文件指针
            image_data = img.read()
            
            # 尝试上传到云存储
            # cloud_url = storage.upload_image(image_data, unique_filename)
            
            # if cloud_url:
            #     # 云存储成功
            #     image_urls.append(cloud_url)
            #     logger.info(f"图片上传到云存储成功: {unique_filename}")
            # else:
            #     # 云存储失败，回退到本地存储
            #     img.seek(0)  # 再次重置文件指针
            #     image_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            #     img.save(image_path)
            #     local_url = f'/api/uploads/{unique_filename}'
            #     image_urls.append(local_url)
            #     logger.warning(f"云存储失败，使用本地存储: {unique_filename}")
            # 暂时注释掉云存储，使用本地存储
            img.seek(0)  # 重置文件指针
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            img.save(image_path)
            local_url = f'/api/uploads/{unique_filename}'
            image_urls.append(local_url)
            logger.warning(f"云存储失败，使用本地存储: {unique_filename}")
        
        # 创建作品对象
        work = {
            'id': work_id,
            'title': title,
            'description': description,
            'image_urls': image_urls,  # 改为复数，存储多个图片URL
            'main_image_url': image_urls[0],  # 主图片（第一张）
            'likes': 0,
            'liked_by': [],
            'comments': [],
            'created_at': get_beijing_time().isoformat(),
            'username': username,
            'realName': realName,
            'is_pinned': False  # 新作品默认不置顶
        }
        
        # 保存作品信息
        works = load_works()
        works.append(work)
        save_works(works)
        
        logger.info(f"作品上传成功: {work_id}, 图片数量: {len(image_urls)}")
        return jsonify(work), 201
        
    except Exception as e:
        logger.error(f"上传失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/works/<work_id>', methods=['DELETE'])
def delete_work(work_id):
    """删除作品（仅管理员）"""
    if not is_admin(request):
        return jsonify({'error': '权限不足'}), 403
    
    try:
        works = load_works()
        work = None
        work_index = None
        
        for i, w in enumerate(works):
            if w['id'] == work_id:
                work = w
                work_index = i
                break
        
        if not work:
            return jsonify({'error': '作品不存在'}), 404
        
        # 删除图片文件
        try:
            # 删除所有相关图片
            if 'image_urls' in work:
                # 新版本：多图支持
                for image_url in work['image_urls']:
                    # 尝试从云存储删除
                    # if storage.delete_image(image_url):
                    #     logger.info(f"云存储图片删除成功: {image_url}")
                    # else:
                    #     # 如果云存储删除失败，尝试删除本地文件
                    #     try:
                    #         image_filename = image_url.split('/')[-1]
                    #         image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    #         if os.path.exists(image_path):
                    #             os.remove(image_path)
                    #             logger.info(f"本地图片文件已删除: {image_filename}")
                    #     except Exception as e:
                    #         logger.warning(f"删除本地图片文件失败: {e}")
                    # 暂时注释掉云存储，使用本地存储
                    try:
                        image_filename = image_url.split('/')[-1]
                        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                        if os.path.exists(image_path):
                            os.remove(image_path)
                            logger.info(f"本地图片文件已删除: {image_filename}")
                    except Exception as e:
                        logger.warning(f"删除本地图片文件失败: {e}")
            elif 'image_url' in work:
                # 旧版本：单图支持（向后兼容）
                image_url = work['image_url']
                # if storage.delete_image(image_url):
                #     logger.info(f"云存储图片删除成功: {image_url}")
                # else:
                #     # 回退到本地删除
                #     try:
                #         image_filename = image_url.split('/')[-1]
                #         image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                #         if os.path.exists(image_path):
                #             os.remove(image_path)
                #             logger.info(f"本地图片文件已删除: {image_filename}")
                #     except Exception as e:
                #         logger.warning(f"删除本地图片文件失败: {e}")
                # 暂时注释掉云存储，使用本地存储
                try:
                    image_filename = image_url.split('/')[-1]
                    image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                    if os.path.exists(image_path):
                        os.remove(image_path)
                        logger.info(f"本地图片文件已删除: {image_filename}")
                except Exception as e:
                    logger.warning(f"删除本地图片文件失败: {e}")
        except Exception as e:
            logger.warning(f"删除图片文件失败: {e}")
        
        # 从列表中移除作品
        works.pop(work_index)
        save_works(works)
        
        logger.info(f"作品删除成功: {work_id}")
        return jsonify({'message': '作品删除成功'})
        
    except Exception as e:
        logger.error(f"删除失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/works/<work_id>/like', methods=['POST'])
def like_work(work_id):
    """点赞/取消点赞作品"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        
        works = load_works()
        work = None
        work_index = None
        
        for i, w in enumerate(works):
            if w['id'] == work_id:
                work = w
                work_index = i
                break
        
        if not work:
            return jsonify({'error': '作品不存在'}), 404
        
        # 检查用户是否已经点赞
        if user_id in work['liked_by']:
            # 取消点赞
            work['liked_by'].remove(user_id)
            work['likes'] -= 1
            liked = False
        else:
            # 点赞
            work['liked_by'].append(user_id)
            work['likes'] += 1
            liked = True
        
        # 保存更新
        works[work_index] = work
        save_works(works)
        
        return jsonify({
            'likes': work['likes'],
            'liked': liked
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/works/<work_id>/comments', methods=['POST'])
def add_comment(work_id):
    """添加评论"""
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        user_id = data.get('user_id', 'anonymous')
        
        if not content:
            return jsonify({'error': '评论内容不能为空'}), 400
        
        works = load_works()
        work = None
        work_index = None
        
        for i, w in enumerate(works):
            if w['id'] == work_id:
                work = w
                work_index = i
                break
        
        if not work:
            return jsonify({'error': '作品不存在'}), 404
        
        # 获取用户名
        username = data.get('username', '匿名用户')

        # 创建评论对象
        comment = {
            'id': str(uuid.uuid4()),
            'content': content,
            'user_id': user_id,
            'username': username,
            'created_at': get_beijing_time().isoformat()
        }
        
        # 添加评论到作品
        if 'comments' not in work:
            work['comments'] = []
        work['comments'].append(comment)
        
        # 保存更新
        works[work_index] = work
        save_works(works)
        
        logger.info(f"评论添加成功: {comment['id']}")
        return jsonify(comment), 201
        
    except Exception as e:
        logger.error(f"添加评论失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/works/<work_id>/comments/<comment_id>', methods=['DELETE'])
def delete_comment(work_id, comment_id):
    """删除评论（仅管理员或评论作者）"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'anonymous')
        
        works = load_works()
        work = None
        work_index = None
        
        for i, w in enumerate(works):
            if w['id'] == work_id:
                work = w
                work_index = i
                break
        
        if not work:
            return jsonify({'error': '作品不存在'}), 404
        
        # 查找评论
        comment = None
        comment_index = None
        for i, c in enumerate(work.get('comments', [])):
            if c['id'] == comment_id:
                comment = c
                comment_index = i
                break
        
        if not comment:
            return jsonify({'error': '评论不存在'}), 404
        
        # 检查权限（管理员或评论作者）
        if not is_admin(request) and comment['user_id'] != user_id:
            return jsonify({'error': '权限不足，只能删除自己的评论'}), 403
        
        # 删除评论
        work['comments'].pop(comment_index)
        
        # 保存更新
        works[work_index] = work
        save_works(works)
        
        logger.info(f"评论删除成功: {comment_id}")
        return jsonify({'message': '评论删除成功'})
        
    except Exception as e:
        logger.error(f"删除评论失败: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """管理员登录"""
    try:
        data = request.get_json()
        password = data.get('password', '')
        
        if password == ADMIN_PASSWORD:
            return jsonify({
                'success': True,
                'message': '登录成功',
                'token': ADMIN_PASSWORD
            })
        else:
            return jsonify({'error': '密码错误'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/uploads/<filename>')
def uploaded_file(filename):
    """提供上传的图片文件"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/health')
def health_check():
    """健康检查"""
    logger.info("健康检查请求")
    return jsonify({'status': 'ok', 'message': '服务正常运行'})

@app.route('/api/works/<work_id>/pin', methods=['POST'])
def toggle_pin_work(work_id):
    """切换作品置顶状态（仅管理员）"""
    try:
        # 验证管理员权限
        admin_token = request.headers.get('Authorization')
        if not admin_token or admin_token != 'Bearer op123':
            return jsonify({'error': '需要管理员权限'}), 403
        
        works = load_works()
        work = next((w for w in works if w['id'] == work_id), None)
        
        if not work:
            return jsonify({'error': '作品不存在'}), 404
        
        # 切换置顶状态
        work['is_pinned'] = not work.get('is_pinned', False)
        
        # 保存更新
        save_works(works)
        
        action = "置顶" if work['is_pinned'] else "取消置顶"
        logger.info(f"作品 {work_id} 已{action}")
        
        return jsonify({
            'message': f'作品已{action}',
            'is_pinned': work['is_pinned']
        })
        
    except Exception as e:
        logger.error(f"切换置顶状态失败: {e}")
        return jsonify({'error': '操作失败'}), 500

if __name__ == '__main__':
    logger.info("启动Flask应用...")
    app.run(debug=True, host='0.0.0.0', port=8000)
