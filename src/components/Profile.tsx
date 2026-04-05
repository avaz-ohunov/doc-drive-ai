import { useEffect, useState } from 'react';
import { ArrowLeft, Mail, User, Trash2 } from 'lucide-react';
import { apiDeleteUser, type AuthState } from '../api/client';

interface ProfileProps {
  auth: AuthState;
  onLogout: () => void;
  onNavigateBack: () => void;
}

export function Profile({ auth, onLogout, onNavigateBack }: ProfileProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    document.title = 'DocDriveAI – Мой профиль';
  }, []);

  // Обработка удаления аккаунта с подтверждением
  const handleDeleteAccount = async () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие нельзя отменить.')) {
      setIsDeleting(true);
      try {
        await apiDeleteUser(auth.userId, auth.token);
        alert('Аккаунт удален');
        onLogout();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Не удалось удалить аккаунт';
        alert(message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={onNavigateBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 cursor-pointer"
        >
          <ArrowLeft size={20} />
          Назад
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="mb-8">Профиль</h1>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Имя пользователя</div>
                <div>{auth.email.split('@')[0] || 'Пользователь'}</div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-1">
                <Mail className="text-gray-500" size={20} />
                <div className="text-gray-500 text-sm">Email</div>
              </div>
              <div className="ml-8">
                <a href={`mailto:${auth.email}`}>
                  {auth.email}
                </a>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="mb-4">ОПАСНАЯ ЗОНА</h3>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 size={20} />
                {isDeleting ? 'Удаляем...' : 'Удалить аккаунт'}
              </button>
              <p className="mt-2 text-gray-500 text-sm">
                После удаления аккаунта все ваши данные будут безвозвратно удалены
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
