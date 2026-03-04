import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>シフト管理システム</span>
          {isAdmin() ? (
            <nav style={{ display: 'flex', gap: '16px' }}>
              <Link to="/admin/dashboard" style={{ color: 'white', textDecoration: 'none' }}>ダッシュボード</Link>
              <Link to="/admin/shifts" style={{ color: 'white', textDecoration: 'none' }}>シフト管理</Link>
              <Link to="/admin/employees" style={{ color: 'white', textDecoration: 'none' }}>従業員管理</Link>
              <Link to="/admin/shift-requests" style={{ color: 'white', textDecoration: 'none' }}>希望シフト確認</Link>
            </nav>
          ) : (
            <nav style={{ display: 'flex', gap: '16px' }}>
              <Link to="/shifts" style={{ color: 'white', textDecoration: 'none' }}>シフト確認</Link>
              <Link to="/shift-requests" style={{ color: 'white', textDecoration: 'none' }}>希望シフト入力</Link>
            </nav>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>{user?.name} さん</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ログアウト
          </button>
        </div>
      </header>
      <main style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
