/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTimes } from 'react-icons/fa';
import './WorkCard.css';
import WorkDetailModal from './WorkDetailModal';

const WorkCard = ({ work, onLike, onDelete, onCommentAdded, onCommentDeleted, onWorkUpdated, userId, username, apiBaseUrl, isAdmin }) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [comments, setComments] = useState(work.comments || []);
  const [isPinning, setIsPinning] = useState(false);
  const [imageError, setImageError] = useState(false); // 添加图片错误状态
  const [showDetailModal, setShowDetailModal] = useState(false); // 详情弹窗状态

  // 当work.comments更新时，同步本地状态，避免无限循环
  React.useEffect(() => {
    console.log('🔄 WorkCard useEffect 执行:', {
      workId: work.id,
      workComments: work.comments,
      currentComments: comments,
      timestamp: new Date().toISOString()
    });
    
    const newComments = work.comments || [];
    // 只有当评论真正不同时才更新，避免无限循环
    if (JSON.stringify(newComments) !== JSON.stringify(comments)) {
      setComments(newComments);
    }
  }, [work.comments, work.id]); // 移除comments依赖，避免无限循环

  const isLiked = work.liked_by.includes(userId);

  const handleLikeClick = () => {
    onLike(work.id, isLiked);
  };

  const handleDeleteClick = () => {
    if (window.confirm('确定要删除这个作品吗？')) {
      onDelete(work.id);
    }
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
        // 通知父组件更新评论数量
        if (onCommentAdded) {
          onCommentAdded();
        }
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
        // 通知父组件更新评论数量
        if (onCommentDeleted) {
          onCommentDeleted();
        }
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
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return '时间未知';
      }
      
      // 使用中文格式显示，确保时区正确
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai' // 明确指定北京时间
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '时间未知';
    }
  };

  const canDeleteComment = (comment) => {
    return isAdmin || comment.user_id === userId;
  };

  // 添加置顶/取消置顶功能
  const handleTogglePin = async () => {
    if (!isAdmin) return;
    
    setIsPinning(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${apiBaseUrl}/api/works/${work.id}/pin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        await response.json();
        // 通知父组件更新作品列表
        if (onWorkUpdated) {
          onWorkUpdated();
        }
      } else {
        console.error('置顶操作失败');
      }
    } catch (error) {
      console.error('置顶操作错误:', error);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <>
      <div className={`work-card ${work.is_pinned ? 'pinned' : ''}`}>
        {/* 点击整个卡片打开详情弹窗 */}
        <div className="work-card-content" onClick={() => setShowDetailModal(true)}>
          {/* 置顶标识 */}
          {work.is_pinned && (
            <div className="pin-indicator">
              📌 置顶
            </div>
          )}
          
          {/* 作品标题和操作按钮 */}
          <div className="work-header">
            <h3 className="work-title">{work.title}</h3>
            <div className="work-actions">
              {isAdmin && (
                <>
                  <button 
                    className={`pin-button ${work.is_pinned ? 'pinned' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePin();
                    }}
                    disabled={isPinning}
                    title={work.is_pinned ? '取消置顶' : '置顶'}
                  >
                    {isPinning ? '处理中...' : (work.is_pinned ? '📌 取消置顶' : '📌 置顶')}
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick();
                    }}
                    title="删除作品"
                  >
                    🗑️ 删除
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* 作品图片 */}
          <div className="work-image-container">
            {/* 多图显示 */}
            {work.image_urls && work.image_urls.length > 1 ? (
              <div className="work-images-gallery">
                {work.image_urls.map((imageUrl, index) => (
                  <img 
                    key={index}
                    src={imageUrl.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`}
                    alt={`${work.title} - 图片 ${index + 1}`}
                    className="work-image"
                    onError={(e) => {
                      // 防止无限循环：如果已经是占位符图片，则不再重试
                      if (!e.target.src.includes('data:image/svg+xml')) {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1lcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5Zu+54mH5Y2g5L2N5aSx6ICFPC90ZXh0Pjwvc3ZnPg==';
                      }
                    }}
                  />
                ))}
              </div>
            ) : (
              <>
                {!imageError ? (
                  <img 
                    src={work.main_image_url ? 
                      (work.main_image_url.startsWith('http') ? work.main_image_url : `${apiBaseUrl}${work.main_image_url}`) :
                      (work.image_url ? `${apiBaseUrl}${work.image_url}` : null)
                    }
                    alt={work.title}
                    className="work-image"
                    onError={() => {
                      setImageError(true); // 设置错误状态，避免无限重试
                    }}
                  />
                ) : (
                  <div className="image-placeholder">
                    <div className="placeholder-content">
                      <span>📷</span>
                      <p>图片加载失败</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="work-content">
            {work.description && (
              <p className="work-description">{work.description}</p>
            )}
            
            <div className="work-footer">
              <div className="work-meta">
                <span className="work-username">作者: {work.username || '匿名用户'}{work.realName ? ` (${work.realName})` : ''}</span>
                <span className="work-date">{formatDate(work.created_at)}</span>
              </div>
                
              <div className="work-actions">
                <button 
                  className={`like-button ${isLiked ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeClick();
                  }}
                  aria-label={isLiked ? '取消点赞' : '点赞'}
                >
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                  <span className="like-count">{work.likes}</span>
                </button>
                
                <button 
                  className="comment-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComments(!showComments);
                  }}
                  aria-label="查看评论"
                >
                  <FaComment />
                  <span className="comment-count">{comments.length}</span>
                </button>
              </div>
            </div>

            {/* 评论区域 */}
            {showComments && (
              <div className="comments-section">
                <h4>评论 ({comments.length})</h4>
                
                {/* 添加评论表单 */}
                <form onSubmit={handleAddComment} className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="写下你的评论..."
                    maxLength={500}
                    rows={3}
                    disabled={submittingComment}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || submittingComment}
                    className="submit-comment-btn"
                  >
                    {submittingComment ? '发送中...' : '发送评论'}
                  </button>
                </form>

                {/* 评论列表 */}
                <div className="comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments">还没有评论，快来发表第一条评论吧！</p>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-user">{comment.username || `用户 ${comment.user_id.slice(-6)}`}</span>
                          <span className="comment-date">{formatDate(comment.created_at)}</span>
                          {canDeleteComment(comment) && (
                            <button 
                              className="delete-comment-btn"
                              onClick={() => handleDeleteComment(comment.id)}
                              title="删除评论"
                            >
                              <FaTimes />
                            </button>
                          )}
                        </div>
                        <p className="comment-content">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 作品详情弹窗 */}
      <WorkDetailModal
        work={work}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onLike={handleLikeClick}
        userId={userId}
        username={username}
        apiBaseUrl={apiBaseUrl}
        isAdmin={isAdmin}
      />
    </>
  );
};

export default WorkCard;
