import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthForm from './components/AuthForm';
import StudyRoom from './components/StudyRoom';

const AppContent = () => {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        🔄 Loading...
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLogin={login} />;
  }

  return (
    <div style={{minHeight: '100vh'}}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        textAlign: 'center',
        color: 'white',
        marginBottom: '0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            margin: '0',
            fontSize: '2.5rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fff, #f8f9ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            🎓 Study Sync AI
          </h1>
          <p style={{
            margin: '8px 0 0 0',
            fontSize: '1.1rem',
            opacity: '0.9',
            fontWeight: '300'
          }}>
            Collaborative Learning with AI Assistant
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            padding: '10px 15px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '0.9rem', opacity: '0.8' }}>Welcome, </span>
            <span style={{ fontWeight: '600' }}>{user.profile?.displayName || user.username}</span>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(220, 53, 69, 0.8)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(220, 53, 69, 1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(220, 53, 69, 0.8)'}
          >
            🚪 Logout
          </button>
        </div>
      </header>
      <StudyRoom />
    </div>
  );
};

export default function App(){
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
