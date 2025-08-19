import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import WorkCard from './components/WorkCard';
import UploadForm from './components/UploadForm';
import AdminLogin from './components/AdminLogin';

// 根据环境设置API地址
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 生产环境使用相对路径
  : 'http://127.0.0.1:8000'; // 开发环境使用本地服务器地址

// 如果NODE_ENV未设置，默认使用开发环境
if (!process.env.NODE_ENV) {
  console.log('NODE_ENV未设置，使用开发环境配置');
}

function App() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // 用户信息管理
  const [username, setUsername] = useState(localStorage.getItem('username') || `用户_${Math.random().toString(36).substr(2, 4)}`);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [realName, setRealName] = useState(localStorage.getItem('realName') || '');
  
  // 排行榜数据
  const [leaderboard, setLeaderboard] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // 生成用户ID
  const userId = localStorage.getItem('userId') || `user_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('userId', userId);
  
  // 每5分钟更新排行榜
  useEffect(() => {
    console.log('🔄 App useEffect 执行 (排行榜定时器):', new Date().toISOString());
    
    const interval = setInterval(() => {
      console.log('⏰ 排行榜定时器执行:', new Date().toISOString());
      if (works.length > 0) {
        const sorted = [...works].sort((a, b) => b.likes - a.likes);
        const newLeaderboard = sorted.slice(0, 10);
        // 只有当排行榜真正发生变化时才更新状态
        setLeaderboard(prevLeaderboard => {
          if (JSON.stringify(prevLeaderboard) !== JSON.stringify(newLeaderboard)) {
            console.log('📊 定时器排行榜更新:', {
              prevLength: prevLeaderboard.length,
              newLength: newLeaderboard.length,
              timestamp: new Date().toISOString()
            });
            return newLeaderboard;
          }
          return prevLeaderboard;
        });
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [works]);
  
  // 处理用户名修改
  const handleUsernameChange = () => {
    if (newUsername.trim()) {
      setUsername(newUsername);
      localStorage.setItem('username', newUsername);
      localStorage.setItem('realName', realName);
      setShowUsernameModal(false);
      setNewUsername('');
      alert('用户名修改成功！');
    }
  };

  const fetchWorks = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 fetchWorks 开始执行:', new Date().toISOString());
      console.log('=== 调试信息 ===');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Request URL:', `${API_BASE_URL}/api/works`);
      console.log('================');
      
      const response = await axios.get(`${API_BASE_URL}/api/works`);
      console.log('✅ fetchWorks 成功:', {
        status: response.status,
        dataLength: response.data.length,
        timestamp: new Date().toISOString()
      });
      setWorks(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ fetchWorks 失败:', {
        message: err.message,
        timestamp: new Date().toISOString()
      });
      console.error('Error config:', err.config);
      console.error('Error response:', err.response);
      setError(`获取作品失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 App useEffect 执行 (fetchWorks):', new Date().toISOString());
    fetchWorks();
    // 检查是否已登录为管理员
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      setIsAdmin(true);
    }
  }, [fetchWorks]); // 添加fetchWorks依赖项
  
  // 当works数据变化时更新排行榜
  useEffect(() => {
    console.log('🔄 App useEffect 执行 (works变化):', {
      worksLength: works.length,
      timestamp: new Date().toISOString()
    });
    
    if (works.length > 0) {
      const sorted = [...works].sort((a, b) => b.likes - a.likes);
      // 只有当排行榜真正发生变化时才更新状态
      setLeaderboard(prevLeaderboard => {
        const newLeaderboard = sorted.slice(0, 10);
        // 比较新旧排行榜是否真的不同
        if (JSON.stringify(prevLeaderboard) !== JSON.stringify(newLeaderboard)) {
          console.log('📊 排行榜更新:', {
            prevLength: prevLeaderboard.length,
            newLength: newLeaderboard.length,
            timestamp: new Date().toISOString()
          });
          return newLeaderboard;
        }
        return prevLeaderboard;
      });
    }
  }, [works]);

  const handleWorkUploaded = (newWork) => {
    setWorks(prevWorks => [newWork, ...prevWorks]);
    setShowUploadForm(false);
  };

  const handleLikeWork = async (workId, currentLiked) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/works/${workId}/like`, {
        user_id: userId
      });

      setWorks(prevWorks => prevWorks.map(work => {
        if (work.id === workId) {
          return {
            ...work,
            likes: response.data.likes,
            liked_by: response.data.liked 
              ? [...work.liked_by, userId]
              : work.liked_by.filter(id => id !== userId)
          };
        }
        return work;
      }));
    } catch (err) {
      console.error('Error liking work:', err);
    }
  };

  const handleDeleteWork = async (workId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/works/${workId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.status === 200) {
        setWorks(prevWorks => prevWorks.filter(work => work.id !== workId));
        alert('作品删除成功！');
      }
    } catch (err) {
      console.error('Error deleting work:', err);
      alert('删除失败：' + (err.response?.data?.error || '未知错误'));
    }
  };

  const handleWorkUpdated = () => {
    fetchWorks();
  };
  
  const handleCommentAdded = () => {
    fetchWorks();
  };

  const handleCommentDeleted = () => {
    fetchWorks();
  };

  const handleAdminLogin = (token) => {
    setIsAdmin(true);
    setShowAdminLogin(false);
    alert('管理员登录成功！');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAdmin(false);
    alert('已退出管理员模式');
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {showWelcome && (
        <div className="welcome-overlay">
          <div className="welcome-modal">
            <h2>欢迎参加辽宁省实验中学暑期漫画绘制比赛</h2>
            <p>我们期待您的作品！</p>
            <button 
              className="welcome-close-btn"
              onClick={() => setShowWelcome(false)}
            >
              开始体验
            </button>
          </div>
        </div>
      )}
      
      <header className="app-header">
        <h1>辽宁省实验中学动漫社漫画绘制比赛展示平台</h1>
        <div className="header-actions">
          <button 
            className="username-btn"
            onClick={() => setShowUsernameModal(true)}
            title="点击修改用户名"
          >
            {username}{realName ? ` (${realName})` : ''}
          </button>
          <button 
            className="upload-btn"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            {showUploadForm ? '取消上传' : '上传作品'}
          </button>
          {isAdmin ? (
            <button 
              className="admin-btn admin-logout"
              onClick={handleAdminLogout}
            >
              👑 退出管理
            </button>
          ) : (
            <button 
              className="admin-btn admin-login"
              onClick={() => setShowAdminLogin(true)}
            >
              🔐 管理员
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* 排行榜 */}
        <div className="leaderboard">
          <h2>🏆 热门作品排行榜</h2>
          <div className="leaderboard-list">
            {leaderboard.length > 0 ? (
              leaderboard.map((work, index) => (
                <div 
                  key={work.id} 
                  className="leaderboard-item" 
                  onClick={() => {
                    // 这里可以实现跳转到作品详情的逻辑
                    // 由于当前没有作品详情页，我们可以模拟一个弹窗或滚动到对应作品
                    alert(`查看作品: ${work.title}`);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="rank">{index + 1}</span>
                  <span className="work-title">{work.title}</span>
                  <span className="work-author">作者: {work.username || '匿名用户'}{work.realName ? ` (${work.realName})` : ''}</span>
                  <span className="likes-count">❤️ {work.likes}</span>
                </div>
              ))
            ) : (
              <p className="empty-leaderboard">暂无排行榜数据</p>
            )}
          </div>
        </div>

        {showUploadForm && (
          <UploadForm 
            onWorkUploaded={handleWorkUploaded}
            onCancel={() => setShowUploadForm(false)}
            apiBaseUrl={API_BASE_URL}
            username={username}
            realName={realName}
          />
        )}

        <div className="works-grid">
          {works.length === 0 ? (
            <div className="empty-state">
              <p>还没有作品，快来上传第一个作品吧！</p>
            </div>
          ) : (
            works.map(work => (
              <WorkCard
                  key={work.id}
                  work={work}
                  onLike={handleLikeWork}
                  onDelete={handleDeleteWork}
                  onCommentAdded={handleCommentAdded}
                  onCommentDeleted={handleCommentDeleted}
                  onWorkUpdated={handleWorkUpdated}
                  userId={userId}
                  username={username}
                  apiBaseUrl={API_BASE_URL}
                  isAdmin={isAdmin}
                />
            ))
          )}
        </div>
      </main>

      {showAdminLogin && (
        <AdminLogin
          onLogin={handleAdminLogin}
          onCancel={() => setShowAdminLogin(false)}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {showUsernameModal && (
        <div className="username-modal-overlay">
          <div className="username-modal">
            <h3>修改用户名</h3>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="输入新用户名"
              className="username-input"
            />
            <input
              type="text"
              value={realName}
              onChange={(e) => {
                setRealName(e.target.value);
                localStorage.setItem('realName', e.target.value);
              }}
              placeholder="备注真实姓名（选填）"
              className="realname-input"
            />
            <div className="modal-buttons">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowUsernameModal(false);
                  setNewUsername('');
                }}
              >
                取消
              </button>
              <button 
                className="confirm-btn"
                onClick={handleUsernameChange}
                disabled={!newUsername.trim()}
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;