import { X, File, FileText, FileImage, FileVideo, FileArchive } from 'lucide-react';
import type { FileItem } from './MainScreen';

interface FileModalProps {
  file: FileItem;
  onClose: () => void;
}

export function FileModal({ file, onClose }: FileModalProps) {
  // Определение иконки для отображения в модальном окне (увеличенный размер)
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File size={64} />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('text') || type.includes('powerpoint')) {
      return <FileText size={64} />;
    }
    if (type.includes('jpeg') || type.includes('png') || type.includes('jpg')) {
      return <FileImage size={64} />;
    }
    if (type.includes('mp4') || type.includes('video')) {
      return <FileVideo size={64} />;
    }
    if (type.includes('zip') || type.includes('rar')) {
      return <FileArchive size={64} />;
    }
    return <File size={64} />;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center">
          <div className="mb-4 text-blue-600">
            {getFileIcon(file.fileType)}
          </div>

          <h2 className="mb-6 text-center break-all">{file.name}</h2>

          <div className="w-full space-y-4">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Тип файла:</span>
              <span>{file.fileType}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Размер:</span>
              <span>{file.size}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Дата изменения:</span>
              <span>{file.lastModified}</span>
            </div>

            {file.category && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Категория:</span>
                <span>{file.category}</span>
              </div>
            )}
          </div>

          <div className="mt-6 w-full flex gap-3">
            <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
              Скачать
            </button>
            <button className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
              Поделиться
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}