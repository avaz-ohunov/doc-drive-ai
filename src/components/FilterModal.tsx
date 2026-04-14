import { X } from 'lucide-react';

export interface FileFilters {
  globalSearch: string;
  category: string;
  nameFilter: string;
  aiSummaryFilter: string;
  minSize: string;
  maxSize: string;
  dateFrom: string;
  dateTo: string;
  tagsFilter: string;
}

interface FilterModalProps {
  filters: FileFilters;
  onFiltersChange: (next: FileFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

export function FilterModal({ filters, onFiltersChange, onReset, onClose }: FilterModalProps) {
  // Унифицированный апдейт любого поля фильтра.
  const updateField = <K extends keyof FileFilters>(key: K, value: FileFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
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
            <label htmlFor="globalSearch" className="block mb-2 text-gray-700">
              Поиск (название + AI анализ)
            </label>
            <input
              id="globalSearch"
              type="text"
              value={filters.globalSearch}
              onChange={(e) => updateField('globalSearch', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Введите текст"
            />
          </div>

          <div>
            <label htmlFor="category" className="block mb-2 text-gray-700">
              Категория
            </label>
            <select
              id="category"
              value={filters.category}
              onChange={(e) => updateField('category', e.target.value)}
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
              value={filters.nameFilter}
              onChange={(e) => updateField('nameFilter', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Введите текст"
            />
          </div>

          <div>
            <label htmlFor="aiSummaryFilter" className="block mb-2 text-gray-700">
              AI анализ содержит
            </label>
            <input
              id="aiSummaryFilter"
              type="text"
              value={filters.aiSummaryFilter}
              onChange={(e) => updateField('aiSummaryFilter', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Фраза из AI-резюме"
            />
          </div>

          <div>
            <label htmlFor="tagsFilter" className="block mb-2 text-gray-700">
              Теги содержит
            </label>
            <input
              id="tagsFilter"
              type="text"
              value={filters.tagsFilter}
              onChange={(e) => updateField('tagsFilter', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Введите теги через запятую"
            />
          </div>

          <div>
            <label className="block mb-2 text-gray-700">Размер файла</label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={filters.minSize}
                onChange={(e) => updateField('minSize', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="От (MB)"
              />
              <span className="text-gray-500">—</span>
              <input
                type="text"
                value={filters.maxSize}
                onChange={(e) => updateField('maxSize', e.target.value)}
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
                value={filters.dateFrom}
                onChange={(e) => updateField('dateFrom', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateField('dateTo', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onReset}
            className="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Сбросить фильтры
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}