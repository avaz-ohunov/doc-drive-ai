import { Folder, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  onFolderClick: (folderId: string) => void;
  onNavigateToProfile?: () => void;
}

// Список папок для бокового меню
const folders = [
  { id: '1', name: 'Документы', icon: '📄' },
  { id: '2', name: 'Фотографии', icon: '📷' },
  { id: '3', name: 'Проекты', icon: '💼' },
  { id: '4', name: 'Видео', icon: '🎥' },
  { id: '5', name: 'Музыка', icon: '🎵' },
];

export function Sidebar({ onFolderClick, onNavigateToProfile }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-center items-center">
        <h2 className="text-xl font-bold text-gray-800">
          <Link to="/">DocDriveAI</Link>
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 text-gray-500 px-3 py-2">Папки</div>
        <div className="space-y-1">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderClick(folder.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-left cursor-pointer"
            >
              <span>{folder.icon}</span>
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </div>

      {onNavigateToProfile && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onNavigateToProfile}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <User size={20} />
            <span>Профиль</span>
          </button>
        </div>
      )}
    </div>
  );
}
