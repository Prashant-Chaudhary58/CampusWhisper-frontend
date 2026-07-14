import React, { useState, useEffect } from 'react';
import { authService } from './services/AuthService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#9ca3af',
        fontSize: '1.2rem',
        fontFamily: 'sans-serif'
      }}>
        Loading CampusWhisper...
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={() => setUser(null)} refreshUser={checkSession} />
      ) : (
        <Login onLoginSuccess={(u) => setUser(u)} />
      )}
    </>
  );
}

export default App;
