import { useState } from 'react';
import { Folder, User, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface SidebarFolder {
  id: string; // Полный путь, или ID
  name: string;
}

interface SidebarProps {
  folders: SidebarFolder[];
  /** Корневая папка, внутри которой сейчас открыт контент; `null` — выбрана «Главная». */
  selectedRootFolderId: string | null;
  onFolderClick: (folderId: string) => void;
  userName?: string;
  onCreateFolder?: (name: string) => void;
  onNavigateToProfile?: () => void;
  onFolderDragOver?: (event: React.DragEvent<HTMLButtonElement>, folderId: string) => void;
  onFolderDragLeave?: (folderId: string) => void;
  onFolderDrop?: (event: React.DragEvent<HTMLButtonElement>, folderId: string) => void;
  activeDropFolderId?: string | null;
}

export function Sidebar({
  folders,
  selectedRootFolderId,
  onFolderClick,
  userName,
  onCreateFolder,
  onNavigateToProfile,
  onFolderDragOver,
  onFolderDragLeave,
  onFolderDrop,
  activeDropFolderId,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const homeActive = selectedRootFolderId === null;
  const rowText = (active: boolean) =>
    active ? 'text-gray-900 font-medium' : 'text-gray-400';

  // Создаём папку из боковой панели и закрываем мини-форму.
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim() && onCreateFolder) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-center items-center">
        <h2 className="text-xl font-bold text-gray-800">
          <Link to="/">DocDriveAI</Link>
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="mb-2 text-gray-500 px-3 py-2 flex justify-between items-center">
          <span>Папки</span>
          {onCreateFolder && (
            <button
              onClick={() => setIsCreating(true)}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
              title="Создать папку"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="px-3 mb-2">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => {
                if (!newFolderName.trim()) setIsCreating(false);
              }}
              placeholder="Имя папки"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </form>
        )}

        <div className="space-y-1">
          <button
            onClick={() => onFolderClick('')}
            onDragOver={(e) => onFolderDragOver?.(e, '')}
            onDragLeave={() => onFolderDragLeave?.('')}
            onDrop={(e) => onFolderDrop?.(e, '')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${rowText(homeActive)} ${activeDropFolderId === '' ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
          >
            <Folder size={18} className={homeActive ? 'text-gray-900 shrink-0' : 'text-gray-400 shrink-0'} />
            <span className="truncate">Главная</span>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderClick(folder.id)}
              onDragOver={(e) => onFolderDragOver?.(e, folder.id)}
              onDragLeave={() => onFolderDragLeave?.(folder.id)}
              onDrop={(e) => onFolderDrop?.(e, folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left cursor-pointer ${rowText(selectedRootFolderId === folder.id)} ${activeDropFolderId === folder.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
            >
              <Folder size={18} className={selectedRootFolderId === folder.id ? 'text-gray-900 shrink-0' : 'text-gray-400 shrink-0'} />
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
            <span className="truncate">{'Профиль'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
