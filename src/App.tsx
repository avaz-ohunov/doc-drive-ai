import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { MainScreen } from './components/MainScreen';
import { Profile } from './components/Profile';
import { AUTH_EXPIRED_EVENT, type AuthState } from './api/client';

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => {
    // Восстанавливаем сессию при инициализации
    const saved = localStorage.getItem('auth_session');
    if (saved) {
      try {
        return JSON.parse(saved) as AuthState;
      } catch {
        // Игнорируем ошибки парсинга
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const handleLogin = (authState: AuthState) => {
    setAuth(authState);
    localStorage.setItem('auth_session', JSON.stringify(authState));
    navigate('/');
  };

  const handleRegister = (authState: AuthState) => {
    setAuth(authState);
    localStorage.setItem('auth_session', JSON.stringify(authState));
    navigate('/');
  };

  const handleLogout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem('auth_session');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, [handleLogout]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route
          path="/login"
          element={
            <LoginScreen
              onLogin={handleLogin}
              onNavigateToRegister={() => navigate('/registration')}
            />
          }
        />
        <Route
          path="/registration"
          element={
            <RegisterScreen
              onRegister={handleRegister}
              onNavigateToLogin={() => navigate('/login')}
            />
          }
        />
        <Route
          path="/profile"
          element={
            auth ? (
              <Profile auth={auth} onLogout={handleLogout} onNavigateBack={() => navigate('/')} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/"
          element={
            auth ? (
              <MainScreen auth={auth} onNavigateToProfile={() => navigate('/profile')} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
