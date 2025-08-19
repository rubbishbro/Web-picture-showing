import React, { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './WorkDetailModal.css';

const WorkDetailModal = ({ work, isOpen, onClose, onLike, userId, username, apiBaseUrl, isAdmin }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState(work?.comments || []);

  if (!isOpen || !work) return null;

  const isLiked = work.liked_by.includes(userId);
  const imageUrls = work.image_urls || [work.main_image_url || work.image_url];

  const handleLikeClick = () => {
    onLike(work.id, isLiked);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/works/${work.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          user_id: userId,
          username: username
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([...comments, comment]);
        setNewComment('');
      } else {
        const errorData = await response.json();
        alert('添加评论失败: ' + (errorData.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('添加评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('确定要删除这条评论吗？')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/works/${work.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        const errorData = await response.json();
        alert('删除评论失败: ' + (errorData.error || '未知错误'));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('删除评论失败');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '时间未知';
      }
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    } catch (error) {
      return '时间未知';
    }
  };

  return (
    <div className="work-detail-modal-overlay" onClick={onClose}>
      <div className="work-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* 关闭按钮 */}
        <button className="modal-close-btn" onClick={onClose}>
          <FaTimes />
        </button>

        {/* 作品标题和作者信息 */}
        <div className="modal-header">
          <h2 className="modal-title">{work.title}</h2>
          <div className="modal-author-info">
            <span className="author-name">作者: {work.username || '匿名用户'}</span>
            {work.realName && <span className="real-name">({work.realName})</span>}
            <span className="upload-time">{formatDate(work.created_at)}</span>
          </div>
        </div>

        {/* 图片展示区域 */}
        <div className="modal-image-section">
          {imageUrls.length > 1 && (
            <>
              <button className="image-nav-btn prev-btn" onClick={prevImage}>
                <FaChevronLeft />
              </button>
              <button className="image-nav-btn next-btn" onClick={nextImage}>
                <FaChevronRight />
              </button>
              <div className="image-counter">
                {currentImageIndex + 1} / {imageUrls.length}
              </div>
            </>
          )}
          
          <div className="modal-image-container">
            <img
              src={imageUrls[currentImageIndex]?.startsWith('http') 
                ? imageUrls[currentImageIndex] 
                : `${apiBaseUrl}${imageUrls[currentImageIndex]}`
              }
              alt={`${work.title} - 图片 ${currentImageIndex + 1}`}
              className="modal-main-image"
            />
          </div>

          {/* 缩略图导航 */}
          {imageUrls.length > 1 && (
            <div className="thumbnail-nav">
              {imageUrls.map((url, index) => (
                <img
                  key={index}
                  src={url.startsWith('http') ? url : `${apiBaseUrl}${url}`}
                  alt={`缩略图 ${index + 1}`}
                  className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 作品描述 */}
        <div className="modal-description">
          <h3>作品介绍</h3>
          <p className="description-text">{work.description}</p>
        </div>

        {/* 点赞和评论区域 */}
        <div className="modal-actions">
          <button 
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLikeClick}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
            <span>{work.likes} 点赞</span>
          </button>
          
          <button 
            className="comments-toggle-btn"
            onClick={() => setShowComments(!showComments)}
          >
            <FaComment />
            <span>评论 ({comments.length})</span>
          </button>
        </div>

        {/* 评论区域 */}
        {showComments && (
          <div className="modal-comments">
            <h3>评论 ({comments.length})</h3>
            
            {/* 添加评论 */}
            <form className="comment-form" onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                className="comment-input"
                rows="3"
              />
              <button 
                type="submit" 
                className="comment-submit-btn"
                disabled={!newComment.trim() || submittingComment}
              >
                {submittingComment ? '发送中...' : '发送评论'}
              </button>
            </form>

            {/* 评论列表 */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="no-comments">还没有评论，快来抢沙发吧！</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{comment.username || '匿名用户'}</span>
                      <span className="comment-time">{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="comment-content">{comment.content}</p>
                    {(isAdmin || comment.user_id === userId) && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkDetailModal;
