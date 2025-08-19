import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import './AdminLogin.css';

const AdminLogin = ({ onLogin, onCancel, apiBaseUrl }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('请输入管理员密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 管理员登录请求:', `${apiBaseUrl}/api/admin/login`);
      
      const response = await fetch(`${apiBaseUrl}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      });

      console.log('🔐 登录响应状态:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          setError('管理员登录接口不存在，请检查后端服务');
        } else {
          setError(`登录失败: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      console.log('🔐 登录响应数据:', data);

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.name === 'SyntaxError') {
        setError('服务器响应格式错误，请检查后端服务');
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <div className="admin-login-header">
          <h2>🔐 管理员登录</h2>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="password-input-group">
            <div className="password-input-wrapper">
              <FaLock className="password-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入管理员密码"
                className="password-input"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="admin-login-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="login-btn"
              disabled={loading || !password.trim()}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>

        <div className="admin-login-hint">
          <p>💡 提示：请联系网站管理员获取密码</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;



