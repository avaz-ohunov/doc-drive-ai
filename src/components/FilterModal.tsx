import { useState } from 'react';
import { X } from 'lucide-react';

interface FilterModalProps {
  onClose: () => void;
}

export function FilterModal({ onClose }: FilterModalProps) {
  // Состояния фильтров для поиска файлов
  const [category, setCategory] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [minSize, setMinSize] = useState('');
  const [maxSize, setMaxSize] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const handleReset = () => {
    setCategory('');
    setNameFilter('');
    setMinSize('');
    setMaxSize('');
    setDateFrom('');
    setDateTo('');
  };

  const handleApply = () => {
    console.log('Применить фильтры:', {
      category,
      nameFilter,
      minSize,
      maxSize,
      dateFrom,
      dateTo,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2>Фильтры</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="category" className="block mb-2 text-gray-700">
              Категория
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
            >
              <option value="">Все категории</option>
              <option value="documents">Документы</option>
              <option value="images">Изображения</option>
              <option value="videos">Видео</option>
              <option value="music">Музыка</option>
              <option value="archives">Архивы</option>
            </select>
          </div>

          <div>
            <label htmlFor="nameFilter" className="block mb-2 text-gray-700">
              Название содержит
            </label>
            <input
              id="nameFilter"
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Введите текст"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Размер файла</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={minSize}
                onChange={(e) => setMinSize(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="От (MB)"
              />
              <span className="text-gray-500">—</span>
              <input
                type="text"
                value={maxSize}
                onChange={(e) => setMaxSize(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="До (MB)"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Дата последнего обновления</label>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Сбросить фильтры
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}