import React, { useState } from 'react';
import './UploadForm.css';

const UploadForm = ({ onWorkUploaded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // 从localStorage获取用户信息
  React.useEffect(() => {
    const savedUsername = localStorage.getItem('username') || '';
    const savedRealName = localStorage.getItem('realName') || '';
    setUsername(savedUsername);
    setRealName(savedRealName);
  }, []);

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // 验证文件数量（最多5张）
    if (selectedFiles.length > 5) {
      setError('最多只能选择5张图片');
      return;
    }
    
    // 验证文件类型和大小
    const validFiles = selectedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 16 * 1024 * 1024; // 16MB
      
      if (!isValidType) {
        setError(`文件 ${file.name} 格式不支持`);
        return false;
      }
      
      if (!isValidSize) {
        setError(`文件 ${file.name} 太大，不能超过16MB`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length !== selectedFiles.length) {
      return;
    }
    
    setImages(validFiles);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }
    
    if (images.length === 0) {
      setError('请选择至少一张图片');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('username', username.trim() || '匿名用户');
      formData.append('realName', realName.trim());
      
      // 添加所有图片
      images.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const response = await fetch('/api/works', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const work = await response.json();
        
        // 保存用户信息到localStorage
        if (username.trim()) {
          localStorage.setItem('username', username.trim());
        }
        if (realName.trim()) {
          localStorage.setItem('realName', realName.trim());
        }
        
        // 重置表单
        setTitle('');
        setDescription('');
        setImages([]);
        setError('');
        
        // 通知父组件
        onWorkUploaded(work);
        
        alert('作品上传成功！');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '上传失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="upload-form">
      <h2>上传作品</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">作品标题 *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入作品标题"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">作品描述</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请描述您的作品..."
            rows="4"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="images">选择图片 * (最多5张)</label>
          <input
            type="file"
            id="images"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          <small>支持 JPG, PNG, GIF, WebP 格式，每张图片最大16MB</small>
        </div>
        
        {/* 图片预览 */}
        {images.length > 0 && (
          <div className="image-preview">
            <h4>已选择的图片 ({images.length}/5):</h4>
            <div className="preview-grid">
              {images.map((image, index) => (
                <div key={index} className="preview-item">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`预览 ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(index)}
                    title="移除图片"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="realName">真实姓名</label>
          <input
            type="text"
            id="realName"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="建议填写真实姓名"
          />
          <small>建议填写真实姓名，方便联系</small>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={isUploading} className="submit-btn">
          {isUploading ? '上传中...' : '上传作品'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
