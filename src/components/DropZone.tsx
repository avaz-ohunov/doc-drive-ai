import { useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
}

export function DropZone({ onFileDrop }: DropZoneProps) {
  // Состояние для визуальной обратной связи при перетаскивании
  const [isDragging, setIsDragging] = useState(false);

  // Обработка события перетаскивания над зоной загрузки
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Обработка выхода курсора за пределы зоны загрузки
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Обработка события отпускания файлов в зоне загрузки
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileDrop(files);
      alert(`Загружено файлов: ${files.length}`);
    }
  };

  // Обработка выбора файлов через стандартный input
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFileDrop(files);
      alert(`Загружено файлов: ${files.length}`);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Загрузка файлов</h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-white hover:border-blue-400'
          }
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            p-4 rounded-full transition-colors
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={isDragging ? 'text-blue-600' : 'text-gray-600'} size={32} />
          </div>
          
          <div>
            <p className="text-gray-700 mb-1">
              Перетащите файлы сюда или нажмите для выбора
            </p>
            <p className="text-gray-500 text-sm">
              Поддерживаются все типы файлов
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
