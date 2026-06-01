import { useState } from 'react';
import { X, File, FileText, FileImage, FileVideo, FileArchive, Download, Trash2, Edit2, FolderInput, Sparkles, Tag, Loader2 } from 'lucide-react';
import type { FileItem } from './MainScreen';
import {
  apiDownloadFile, apiDeleteFile, apiRenameObject, apiMoveObject,
  apiAnalyzeFile, apiTagObject, type AuthState
} from '../api/client';

interface FileModalProps {
  file: FileItem;
  auth: AuthState;
  isAnalyzing?: boolean;
  onAnalyzeStart?: () => void;
  onClose: () => void;
  onFileChanged: () => Promise<void>;
}

export function FileModal({ file, auth, isAnalyzing, onAnalyzeStart, onClose, onFileChanged }: FileModalProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isMoving, setIsMoving] = useState(false);
  const [newPath, setNewPath] = useState(file.id);
  const [newTag, setNewTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  // Определение иконки для отображения в модальном окне
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File size={48} />;
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('text') || type.includes('powerpoint')) return <FileText size={48} />;
    if (type.includes('jpeg') || type.includes('png') || type.includes('jpg')) return <FileImage size={48} />;
    if (type.includes('mp4') || type.includes('video')) return <FileVideo size={48} />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive size={48} />;
    return <File size={48} />;
  };

  const handleDownload = async () => {
    if (file.type === 'folder') return;
    try {
      setIsWorking(true);
      const blob = await apiDownloadFile(auth.bucket, auth.token, file.id);
      // Скачивание через временную ссылку blob в браузере.
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Ошибка скачивания: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Вы уверены, что хотите удалить ${file.name}?`)) return;
    try {
      setIsWorking(true);
      await apiDeleteFile(auth.bucket, auth.token, file.id);
      await onFileChanged();
      onClose();
    } catch (e: any) {
      alert(`Ошибка удаления: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === file.name) {
      setIsRenaming(false);
      return;
    }
    try {
      setIsWorking(true);
      // Меняем только последнее звено пути (имя объекта).
      const parts = file.id.split('/');
      parts[parts.length - 1] = newName.trim();
      const newObPath = parts.join('/');
      await apiRenameObject(auth.bucket, auth.token, file.id, newObPath, file.type === 'folder');
      await onFileChanged();
      onClose();
    } catch (e: any) {
      alert(`Ошибка переименования: ${e.message}`);
    } finally {
      setIsWorking(false);
      setIsRenaming(false);
    }
  };

  const handleMove = async () => {
    if (!newPath.trim() || newPath === file.id) {
      setIsMoving(false);
      return;
    }
    try {
      setIsWorking(true);
      await apiMoveObject(auth.bucket, auth.token, file.id, newPath.trim(), file.type === 'folder');
      await onFileChanged();
      onClose();
    } catch (e: any) {
      alert(`Ошибка перемещения: ${e.message}`);
    } finally {
      setIsWorking(false);
      setIsMoving(false);
    }
  };

  const handleAnalyze = async () => {
    if (file.type === 'folder' || isAnalyzing) return;
    try {
      if (onAnalyzeStart) onAnalyzeStart();
      await apiAnalyzeFile(auth.bucket, auth.token, file.id);
      // Не показываем alert, прогресс будет крутиться, пока не придет SSE
    } catch (e: any) {
      alert(`Ошибка анализа: ${e.message}`);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const tagToAdd = newTag.trim();
    if (!tagToAdd) return;

    try {
      setIsWorking(true);
      const currentTags = (file.tags || []).filter(t => t.trim() !== '');
      // Не отправляем запрос, если тег уже существует.
      if (currentTags.includes(tagToAdd)) {
        setNewTag('');
        return;
      }

      const updatedTagsStr = [...currentTags, tagToAdd].join(',');
      await apiTagObject(auth.bucket, auth.token, file.id, updatedTagsStr);
      setNewTag('');
      await onFileChanged();
    } catch (e: any) {
      alert(`Ошибка добавления тега: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      setIsWorking(true);
      const updatedTagsStr = (file.tags || [])
        .filter(t => t !== tagToRemove && t.trim() !== '')
        .join(',');
      await apiTagObject(auth.bucket, auth.token, file.id, updatedTagsStr);
      await onFileChanged();
    } catch (e: any) {
      alert(`Ошибка удаления тега: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  const handleEditTagStart = (index: number, value: string) => {
    setEditingTagIndex(index);
    setEditingTagValue(value);
  };

  const handleEditTagSubmit = async () => {
    if (editingTagIndex === null) return;
    const newValue = editingTagValue.trim();
    const oldTags = [...(file.tags || [])];

    if (!newValue) {
      // If empty, treat as removal
      await handleRemoveTag(oldTags[editingTagIndex]);
      setEditingTagIndex(null);
      return;
    }

    if (newValue === oldTags[editingTagIndex]) {
      setEditingTagIndex(null);
      return;
    }

    try {
      setIsWorking(true);
      oldTags[editingTagIndex] = newValue;
      // Remove duplicates if any after rename
      const uniqueTags = Array.from(new Set(oldTags.filter(t => t.trim() !== '')));
      const updatedTagsStr = uniqueTags.join(',');

      await apiTagObject(auth.bucket, auth.token, file.id, updatedTagsStr);
      await onFileChanged();
      setEditingTagIndex(null);
    } catch (e: any) {
      alert(`Ошибка изменения тега: ${e.message}`);
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div
      className="file-modal-overlay fixed inset-0 bg-black/60 z-50 transition-opacity"
      onClick={onClose}
    >
      <div className="file-modal-overlay__center">
        <div
          className="file-modal-dialog bg-white rounded-lg shadow-xl max-w-2xl w-full relative"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="file-modal-header flex items-start justify-between p-4 pr-14 border-b border-gray-100 gap-3">
          <div className="flex items-start gap-3 w-full min-w-0">
            <div className="text-blue-600 bg-blue-50 p-2 rounded-xl shrink-0">
              <div className="scale-75 origin-top-left w-9 h-9">
                {getFileIcon(file.fileType)}
              </div>
            </div>
            {isRenaming ? (
              <div className="flex gap-2 w-full min-w-0">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename();
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                />
                <button onClick={handleRename} className="px-3 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">OK</button>
                <button onClick={() => setIsRenaming(false)} className="px-3 border rounded text-sm hover:bg-gray-50">Отмена</button>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-full min-w-0">
                <h2 className="text-xl font-bold text-gray-800 break-words leading-tight pr-1">{file.name}</h2>
                <button onClick={() => setIsRenaming(true)} className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 shrink-0 mt-0.5" title="Переименовать" disabled={isWorking}>
                  <Edit2 size={16} />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="file-modal-body p-6 w-full space-y-6 min-w-0">
          <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
            <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
              <span className="text-gray-500">Тип</span>
              <span className="font-medium text-gray-800 break-words">{file.type === 'folder' ? 'Папка' : file.fileType || 'Неизвестно'}</span>
            </div>
            {file.type === 'file' && (
              <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                <span className="text-gray-500">Размер</span>
                <span className="font-medium text-gray-800 break-words">{file.size}</span>
              </div>
            )}
            <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
              <span className="text-gray-500">Изменен</span>
              <span className="font-medium text-gray-800 break-words">{new Date(file.lastModified).toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-gray-200">
              {isMoving ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPath}
                    onChange={e => setNewPath(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Новый путь (напр. docs/file.txt)"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleMove();
                      if (e.key === 'Escape') setIsMoving(false);
                    }}
                  />
                  <button onClick={handleMove} className="px-3 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">OK</button>
                  <button onClick={() => setIsMoving(false)} className="px-3 border rounded text-sm hover:bg-gray-50">Отмена</button>
                </div>
              ) : (
                <div className="grid grid-cols-[120px_1fr] gap-3 items-start">
                  <span className="text-gray-500 pt-0.5">Путь</span>
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="font-medium text-gray-800 break-all min-w-0">{file.id}</span>
                    <button onClick={() => setIsMoving(true)} className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600" title="Переместить" disabled={isWorking}>
                      <FolderInput size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {file.type === 'file' && (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-blue-600" />
                  <h3 className="font-semibold text-blue-900">AI Анализ</h3>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isWorking || isAnalyzing}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isAnalyzing && <Loader2 size={14} className="animate-spin" />}
                  {isAnalyzing ? 'Анализ...' : 'Анализировать'}
                </button>
              </div>

              {file.summary ? (
                <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap break-words leading-relaxed bg-white/60 rounded-lg px-3 py-2">{file.summary}</p>
              ) : (
                <p className="text-xs text-gray-500 italic mb-4">Резюме пока отсутствует. Запустите анализ.</p>
              )}

              <div className="space-y-3 border-t border-blue-100 pt-3">
                <div className="flex items-center justify-between gap-2 text-sm font-medium text-blue-900 mb-1">
                  <div className="flex items-center gap-2">
                    <Tag size={16} className="text-blue-600" />
                    Теги
                  </div>
                  <span className="text-[10px] text-gray-400 font-normal">кликните на тег для изменения</span>
                </div>

                <div className="flex flex-wrap gap-2 bg-white/70 border border-blue-100 rounded-lg p-3 min-h-12">
                  {file.tags && file.tags.map((tag, idx) => (
                    tag && (
                      <div key={`${tag}-${idx}`} className="inline-flex items-center gap-1 bg-white border border-blue-200 text-blue-700 text-xs rounded-full shadow-sm pr-1 py-1">
                        {editingTagIndex === idx ? (
                          <div className="flex items-center gap-1 px-2">
                            <input
                              type="text"
                              value={editingTagValue}
                              onChange={(e) => setEditingTagValue(e.target.value)}
                              autoFocus
                              className="w-20 outline-none border-b border-blue-300 bg-transparent"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditTagSubmit();
                                if (e.key === 'Escape') setEditingTagIndex(null);
                              }}
                              onBlur={handleEditTagSubmit}
                            />
                          </div>
                        ) : (
                          <span
                            className="px-2 py-0.5 leading-none cursor-pointer hover:text-blue-900 transition-colors"
                            onClick={() => handleEditTagStart(idx, tag)}
                            title="Нажмите, чтобы изменить"
                          >
                            {tag}
                          </span>
                        )}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="p-1 rounded-full hover:bg-red-50 hover:text-red-500 opacity-80 hover:opacity-100 transition-all"
                          disabled={isWorking}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )
                  ))}
                  {(!file.tags || file.tags.length === 0 || (file.tags.length === 1 && !file.tags[0])) && <span className="text-xs text-gray-500 italic px-1 py-1">Нет тегов</span>}
                </div>

                <form onSubmit={handleAddTag} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Добавить тег..."
                    className="flex-1 text-sm px-3 py-1.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isWorking}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isWorking}
                  >
                    +
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        <div className="file-modal-footer p-4 border-t border-gray-100 flex gap-3 bg-gray-50 rounded-b-lg">
          {file.type === 'file' && (
            <button
              onClick={handleDownload}
              disabled={isWorking}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium shadow-sm disabled:opacity-50"
            >
              <Download size={18} /> Скачать
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isWorking}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium shadow-sm disabled:opacity-50"
            style={{ color: '#fff', backgroundColor: '#c10007' }}
          >
            <Trash2 size={18} /> Удалить
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}