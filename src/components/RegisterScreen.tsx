import { useEffect, useState } from 'react';
import { Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { apiLogin, apiRegister, type AuthState } from '../api/client';
import { ThemeToggle } from './ThemeToggle';

interface RegisterScreenProps {
  onRegister: (auth: AuthState) => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  // Поля формы и служебное состояние процесса регистрации.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = 'DocDriveAI – Регистрация';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Имя пользователя обязательно');
      return;
    }
    if (password !== confirmPassword) {
      const message = 'Пароли не совпадают';
      setError(message);
      return;
    }
    setIsSubmitting(true);
    try {
      // После регистрации сразу авторизуем пользователя.
      await apiRegister(email, password, name.trim());
      const auth = await apiLogin(email, password);
      onRegister({ ...auth, name: name.trim() });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось выполнить регистрацию';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-center mb-8">Регистрация в DocDriveAI</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="text-sm text-center" style={{ color: '#dc2626' }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block mb-2 text-gray-700">
                Имя пользователя
              </label>
              <div className="relative">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Иван Иванов"
                  required
                />
              </div>
            </div>

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
                  // Локально переключаем видимость поля пароля.
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-gray-700">
                Повторите пароль
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg px-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <Lock className="text-gray-400" size={20} />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 ml-3 py-2 border-none outline-none focus:ring-0"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  // Независимо управляем видимостью подтверждения пароля.
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="ml-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
              {isSubmitting ? 'Регистрируемся...' : 'Зарегистрироваться'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500">или</span>
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer bg-transparent border-0"
              >
                Уже есть аккаунт? Войти
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
