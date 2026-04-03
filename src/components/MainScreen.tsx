import { useEffect, useState } from 'react';
import { Search, Filter, Upload, Folder, File, FileText, FileImage, 
        FileVideo, FileArchive } from 'lucide-react';

import { Sidebar } from './Sidebar';
import { FileModal } from './FileModal';
import { FilterModal } from './FilterModal';
import { DropZone } from './DropZone';
import { apiListFiles, apiUploadFile, type ApiFile, type AuthState } from '../api/client';

// Интерфейс элемента файловой системы (файл или папка)
export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  fileType?: string;  // Тип файла (PDF, JPEG, MP4 и т.д.)
  size?: string;  // Размер в человекочитаемом формате
  lastModified: string;
  category?: string;  // Категория для фильтрации
  fileCount?: number;  // Количество файлов в папке
  lastUpload?: string;  // Дата последней загрузки
}

interface MainScreenProps {
  auth: AuthState;
  onNavigateToProfile: () => void;
}

export function MainScreen({ auth, onNavigateToProfile }: MainScreenProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Установка заголовка страницы
  if (typeof document !== 'undefined' && document.title !== 'DocDriveAI') {
    document.title = 'DocDriveAI';
  }

  const mapApiFileToFileItem = (file: ApiFile): FileItem => ({
    id: file.path,
    name: file.name || file.path,
    type: file.is_dir ? 'folder' : 'file',
    fileType: file.is_dir ? undefined : file.content_type || undefined,
    size: file.is_dir ? undefined : file.human_size,
    lastModified: file.last_modified,
    category: file.analysis_tags?.join(', '),
  });

  useEffect(() => {
    let cancelled = false;
    const loadFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiListFiles(auth.bucket, auth.token);
        if (cancelled) return;
        const mapped = res.files.map(mapApiFileToFileItem);
        setFiles(mapped);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Не удалось загрузить файлы';
        setError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, [auth.bucket, auth.token]);

  // Обработка клика по элементу: открытие папки или модального окна файла
  const handleFileClick = (file: FileItem) => {
    setSelectedFile(file);
  };

  const handleFileDrop = async (droppedFiles: File[]) => {
    if (!droppedFiles.length) return;
    try {
      for (const file of droppedFiles) {
        await apiUploadFile(auth.bucket, auth.token, file);
      }
      const res = await apiListFiles(auth.bucket, auth.token);
      const mapped = res.files.map(mapApiFileToFileItem);
      setFiles(mapped);
      alert(`Загружено файлов: ${droppedFiles.length}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить файлы';
      alert(message);
    }
  };

  // Определение иконки файла на основе его типа
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File size={20} />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('text') || type.includes('powerpoint')) {
      return <FileText size={20} />;
    }
    if (type.includes('jpeg') || type.includes('png') || type.includes('jpg')) {
      return <FileImage size={20} />;
    }
    if (type.includes('mp4') || type.includes('video')) {
      return <FileVideo size={20} />;
    }
    if (type.includes('zip') || type.includes('rar')) {
      return <FileArchive size={20} />;
    }
    return <File size={20} />;
  };

  const filteredFiles = files.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex h-screen">
      <Sidebar onFolderClick={() => {}} onNavigateToProfile={onNavigateToProfile} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with search */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Поиск по названию, категории"
              />
            </div>
            <button
              onClick={() => setShowFilterModal(true)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              title="Фильтры"
            >
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <DropZone onFileDrop={handleFileDrop} />
          </div>

          {isLoading && <div className="text-gray-600">Загрузка файлов...</div>}
          {error && <div className="text-red-600 mb-4">{error}</div>}

          {!isLoading && !error && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="col-span-5">Название</div>
                <div className="col-span-3">Дата изменения</div>
                <div className="col-span-2">Тип</div>
                <div className="col-span-2">Размер</div>
              </div>

              {/* Table rows */}
              {filteredFiles.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleFileClick(item)}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors w-full text-left cursor-pointer"
                >
                  <div className="col-span-5 flex items-center gap-2">
                    {item.type === 'folder' ? (
                      <Folder className="text-blue-600" size={20} />
                    ) : (
                      <span className="text-gray-600">{getFileIcon(item.fileType)}</span>
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="col-span-3 text-gray-600">{item.lastModified}</div>
                  <div className="col-span-2 text-gray-600">
                    {item.type === 'folder' ? 'Папка' : item.fileType}
                  </div>
                  <div className="col-span-2 text-gray-600">
                    {item.type === 'file' ? item.size : '—'}
                  </div>
                </button>
              ))}

              {filteredFiles.length === 0 && (
                <div className="px-4 py-6 text-center text-gray-500">
                  Файлы не найдены
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedFile && (
        <FileModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}

      {showFilterModal && (
        <FilterModal onClose={() => setShowFilterModal(false)} />
      )}
    </div>
  );
}