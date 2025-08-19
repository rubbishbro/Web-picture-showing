#!/usr/bin/env python3
"""
云存储模块 - 解决图片持久化问题
支持多种云存储服务，确保图片不会丢失
"""

import os
import requests
import base64
import time
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class CloudStorage:
    """云存储基类"""
    
    def __init__(self):
        self.enabled = False
    
    def upload_image(self, image_data: bytes, filename: str) -> Optional[str]:
        """上传图片到云存储"""
        raise NotImplementedError
    
    def delete_image(self, image_url: str) -> bool:
        """删除云存储中的图片"""
        raise NotImplementedError

class ImgBBStorage(CloudStorage):
    """ImgBB免费图片托管服务"""
    
    def __init__(self):
        super().__init__()
        # ImgBB API密钥 - 免费注册获取
        self.api_key = os.environ.get('IMGBB_API_KEY', '')
        self.enabled = bool(self.api_key)
        
        if self.enabled:
            logger.info("ImgBB云存储已启用")
        else:
            logger.warning("ImgBB云存储未启用，请设置IMGBB_API_KEY环境变量")
    
    def upload_image(self, image_data: bytes, filename: str) -> Optional[str]:
        """上传图片到ImgBB"""
        if not self.enabled:
            return None
            
        try:
            # 将图片数据编码为base64
            image_base64 = base64.b64encode(image_data).decode('utf-8')
            
            # 准备上传数据
            data = {
                'key': self.api_key,
                'image': image_base64,
                'name': filename
            }
            
            # 发送上传请求
            response = requests.post('https://api.imgbb.com/1/upload', data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success'):
                    image_url = result['data']['url']
                    logger.info(f"图片上传到ImgBB成功: {filename}")
                    return image_url
                else:
                    logger.error(f"ImgBB上传失败: {result.get('error', {}).get('message', '未知错误')}")
            else:
                logger.error(f"ImgBB API请求失败: {response.status_code}")
                
        except Exception as e:
            logger.error(f"ImgBB上传异常: {e}")
        
        return None
    
    def delete_image(self, image_url: str) -> bool:
        """ImgBB不支持删除，返回True表示已处理"""
        # ImgBB免费版不支持删除，但图片会永久保存
        logger.info(f"ImgBB图片无法删除: {image_url}")
        return True

class CloudinaryStorage(CloudStorage):
    """Cloudinary免费图片托管服务"""
    
    def __init__(self):
        super().__init__()
        # Cloudinary配置
        self.cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME', '')
        self.api_key = os.environ.get('CLOUDINARY_API_KEY', '')
        self.api_secret = os.environ.get('CLOUDINARY_API_SECRET', '')
        
        self.enabled = bool(self.cloud_name and self.api_key and self.api_secret)
        
        if self.enabled:
            logger.info("Cloudinary云存储已启用")
        else:
            logger.warning("Cloudinary云存储未启用，请设置相关环境变量")
    
    def upload_image(self, image_data: bytes, filename: str) -> Optional[str]:
        """上传图片到Cloudinary"""
        if not self.enabled:
            return None
            
        try:
            # 准备上传数据
            files = {
                'file': (filename, image_data, 'image/jpeg')
            }
            
            data = {
                'api_key': self.api_key,
                'timestamp': str(int(time.time()))
            }
            
            # 这里需要实现签名验证，简化版本
            response = requests.post(
                f'https://api.cloudinary.com/v1_1/{self.cloud_name}/image/upload',
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                image_url = result.get('secure_url')
                if image_url:
                    logger.info(f"图片上传到Cloudinary成功: {filename}")
                    return image_url
                    
        except Exception as e:
            logger.error(f"Cloudinary上传异常: {e}")
        
        return None

class LocalStorage(CloudStorage):
    """本地存储（开发环境使用）"""
    
    def __init__(self, upload_folder: str):
        super().__init__()
        self.upload_folder = upload_folder
        self.enabled = True
        logger.info(f"本地存储已启用: {upload_folder}")
    
    def upload_image(self, image_data: bytes, filename: str) -> Optional[str]:
        """保存图片到本地"""
        try:
            import os
            os.makedirs(self.upload_folder, exist_ok=True)
            
            file_path = os.path.join(self.upload_folder, filename)
            with open(file_path, 'wb') as f:
                f.write(image_data)
            
            logger.info(f"图片保存到本地: {file_path}")
            return f'/api/uploads/{filename}'
            
        except Exception as e:
            logger.error(f"本地保存失败: {e}")
            return None
    
    def delete_image(self, image_url: str) -> bool:
        """删除本地图片文件"""
        try:
            filename = image_url.split('/')[-1]
            file_path = os.path.join(self.upload_folder, filename)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"本地图片已删除: {filename}")
                return True
                
        except Exception as e:
            logger.error(f"删除本地图片失败: {e}")
        
        return False

# 创建存储实例
def create_storage() -> CloudStorage:
    """创建存储实例，按优先级选择"""
    
    # 优先级：ImgBB > Cloudinary > 本地存储
    if os.environ.get('IMGBB_API_KEY'):
        return ImgBBStorage()
    elif os.environ.get('CLOUDINARY_CLOUD_NAME'):
        return CloudinaryStorage()
    else:
        # 使用本地存储
        upload_folder = '/tmp/uploads' if os.environ.get('VERCEL') else 'uploads'
        return LocalStorage(upload_folder)

# 全局存储实例
storage = create_storage()
