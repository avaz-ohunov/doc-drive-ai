import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { apiLogin, type AuthState } from '../api/client';

interface LoginScreenProps {
  onLogin: (auth: AuthState) => void;
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  // Локальное состояние формы авторизации.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    document.title = 'DocDriveAI – Вход';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Блокируем повторную отправку до завершения запроса.
    setIsSubmitting(true);
    try {
      const auth = await apiLogin(email, password);
      onLogin(auth);
    } catch (err) {
      // Ошибка входа
      const message = err instanceof Error ? err.message : 'Не удалось выполнить вход';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработка входа через Google Auth
  const handleGoogleLogin = () => {
    alert('Вход через Google пока не реализован');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-center mb-8">Вход в DocDriveAI</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm text-center" style={{ color: '#dc2626' }}>
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="example@mail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block mb-2 text-gray-700">
                Пароль
              </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
              <Lock className="text-gray-400" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 ml-3 py-2 border-none outline-none focus:ring-0"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                // Скрытие и отображение пароля
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            </div>

            <div className="text-center">
              <a href="#" className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                Не удается войти? Восстановить пароль
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-lg transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Входим...' : 'Войти'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500">или</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 hover:bg-gray-50 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M19.8 10.2273C19.8 9.51819 19.7364 8.83637 19.6182 8.18182H10.2V12.05H15.6109C15.3727 13.3 14.6182 14.3591 13.4864 15.0682V17.5773H16.7727C18.7182 15.8364 19.8 13.2727 19.8 10.2273Z" fill="#4285F4"/>
                <path d="M10.2 20C12.9 20 15.1727 19.1045 16.7727 17.5773L13.4864 15.0682C12.5409 15.6682 11.3455 16.0227 10.2 16.0227C7.59545 16.0227 5.38182 14.2636 4.54091 11.9H1.14545V14.4909C2.73636 17.6591 6.20909 20 10.2 20Z" fill="#34A853"/>
                <path d="M4.54091 11.9C4.34091 11.3 4.22727 10.6591 4.22727 10C4.22727 9.34091 4.34091 8.7 4.54091 8.1V5.50909H1.14545C0.472727 6.85909 0.0909091 8.38636 0.0909091 10C0.0909091 11.6136 0.472727 13.1409 1.14545 14.4909L4.54091 11.9Z" fill="#FBBC05"/>
                <path d="M10.2 3.97727C11.4591 3.97727 12.5864 4.40909 13.4727 5.24091L16.3864 2.32727C15.1682 1.18636 12.9 0.5 10.2 0.5C6.20909 0.5 2.73636 2.84091 1.14545 5.50909L4.54091 8.1C5.38182 5.73636 7.59545 3.97727 10.2 3.97727Z" fill="#EA4335"/>
              </svg>
              Войти через Google
            </button>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer bg-transparent border-0"
              >
                Еще нет аккаунта? Зарегистрироваться
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
