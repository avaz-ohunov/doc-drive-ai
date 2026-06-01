import { useEffect, useState } from 'react';
import { Upload } from 'lucide-react';

interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
}

const MOBILE_MQ = '(max-width: 480px)';

export function DropZone({ onFileDrop }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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

  const rootClass = isMobile ? 'drop-zone--mobile' : '';
  const areaClass = [
    'drop-zone-area relative border-2 border-dashed rounded-lg text-center transition-all',
    isMobile ? 'p-8' : 'p-12',
    isDragging ? 'is-dragging border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400',
  ].join(' ');

  return (
    <div className={rootClass}>
      <h2 className="mb-4">Загрузка файлов</h2>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={areaClass}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className={
              isMobile
                ? `drop-zone-upload-btn transition-transform ${isDragging ? 'scale-105' : ''}`
                : `p-4 rounded-full transition-colors ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`
            }
          >
            <Upload
              className={isMobile ? '' : isDragging ? 'text-blue-600' : 'text-gray-600'}
              size={isMobile ? 28 : 32}
            />
          </div>

          <div>
            <p className={`text-gray-700 mb-1${isMobile ? ' drop-zone-title' : ''}`}>
              {isMobile ? 'Нажмите, чтобы загрузить' : 'Перетащите файлы сюда или нажмите для выбора'}
            </p>
            <p className={`text-gray-500 text-sm${isMobile ? ' drop-zone-subtitle' : ''}`}>
              {isMobile ? 'Или перетащите файлы в эту область' : 'Поддерживаются все типы файлов'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
