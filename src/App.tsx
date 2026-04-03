import { useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { MainScreen } from './components/MainScreen';
import { Profile } from './components/Profile';
import type { AuthState } from './api/client';

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const navigate = useNavigate();

  const handleLogin = (authState: AuthState) => {
    setAuth(authState);
    navigate('/');
  };

  const handleRegister = (authState: AuthState) => {
    setAuth(authState);
    navigate('/');
  };

  const handleLogout = () => {
    setAuth(null);
    navigate('/login');
  };

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
