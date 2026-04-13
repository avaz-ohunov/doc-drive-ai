import { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Filter, Folder, File, FileText, FileImage,
  FileVideo, FileArchive, ChevronRight, Plus
} from 'lucide-react';

import { Sidebar, type SidebarFolder } from './Sidebar';
import { FileModal } from './FileModal';
import { FilterModal, type FileFilters } from './FilterModal';
import { DropZone } from './DropZone';
import {
  apiListFiles, apiUploadFile, apiCreateFolder, apiDeleteFile, apiDeleteFolder,
  apiSearchFiles, apiMoveObject, createSSEConnection,
  type ApiFile, type AuthState, type AnalysisEvent
} from '../api/client';

export interface FileItem {
  id: string; // path
  name: string;
  type: 'folder' | 'file';
  fileType?: string;
  size?: string;
  lastModified: string;
  category?: string;
  summary?: string;
  tags?: string[];
}

interface MainScreenProps {
  auth: AuthState;
  onNavigateToProfile: () => void;
  onLogout: () => void;
}

export function MainScreen({ auth, onNavigateToProfile, onLogout }: MainScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const EMPTY_FILTERS: FileFilters = {
    globalSearch: '',
    category: '',
    nameFilter: '',
    aiSummaryFilter: '',
    minSize: '',
    maxSize: '',
    dateFrom: '',
    dateTo: '',
  };

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FileFilters>(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null);
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isCreatingFolderInline, setIsCreatingFolderInline] = useState(false);
  const [newFolderNameInline, setNewFolderNameInline] = useState('');
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selectionAreaRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [folderPathToSlug, setFolderPathToSlug] = useState<Map<string, string>>(new Map());
  const [folderSlugToPath, setFolderSlugToPath] = useState<Map<string, string>>(new Map());

  if (typeof document !== 'undefined' && document.title !== 'DocDriveAI') {
    document.title = 'DocDriveAI';
  }

  // Дебаунс для поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.globalSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.globalSearch]);

  const normalizePath = (value: string): string =>
    value.replace(/^\/+/, '').replace(/\/+$/, '');

  const toSlugSegment = (segment: string): string =>
    segment
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\p{L}\p{N}-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      || 'folder';

  const toSlugPath = (folderPath: string): string =>
    normalizePath(folderPath)
      .split('/')
      .filter(Boolean)
      .map(toSlugSegment)
      .join('/');

  const buildFolderRouteMaps = (apiFiles: ApiFile[]) => {
    const pathToSlug = new Map<string, string>();
    const slugToPath = new Map<string, string>();
    const folderPaths = new Set<string>();

    for (const apiFile of apiFiles) {
      const fullPath = normalizePath(apiFile.path);
      if (!fullPath) continue;
      const parts = fullPath.split('/').filter(Boolean);
      const depth = apiFile.is_dir || apiFile.path.endsWith('/') ? parts.length : parts.length - 1;
      for (let i = 0; i < depth; i += 1) {
        const folderPath = parts.slice(0, i + 1).join('/');
        folderPaths.add(folderPath);
      }
    }

    for (const folderPath of folderPaths) {
      const slugPath = toSlugPath(folderPath);
      pathToSlug.set(folderPath, slugPath);
      if (!slugToPath.has(slugPath)) {
        slugToPath.set(slugPath, folderPath);
      }
    }

    setFolderPathToSlug(pathToSlug);
    setFolderSlugToPath(slugToPath);
  };

  const toFileItem = (file: ApiFile, path: string, name: string, isDir: boolean): FileItem => ({
    id: path,
    name,
    type: isDir ? 'folder' : 'file',
    fileType: isDir ? undefined : file.content_type || undefined,
    size: isDir ? undefined : file.human_size,
    lastModified: file.last_modified,
    category: file.analysis_tags?.join(', '),
    summary: file.summary,
    tags: file.analysis_tags,
  });

  const buildFolderView = (apiFiles: ApiFile[], folder: string): FileItem[] => {
    const normalizedFolder = normalizePath(folder);
    const prefix = normalizedFolder ? `${normalizedFolder}/` : '';
    const folderMap = new Map<string, FileItem>();
    const result: FileItem[] = [];

    // Из "плоского" списка путей строим витрину текущей папки.
    for (const apiFile of apiFiles) {
      const fullPath = normalizePath(apiFile.path);
      if (!fullPath) continue;
      if (normalizedFolder && !fullPath.startsWith(prefix)) continue;

      const relativePath = normalizedFolder ? fullPath.slice(prefix.length) : fullPath;
      if (!relativePath) continue;

      const parts = relativePath.split('/').filter(Boolean);
      if (parts.length === 0) continue;

      if (parts.length > 1) {
        const folderName = parts[0];
        const folderPath = normalizedFolder ? `${normalizedFolder}/${folderName}` : folderName;
        if (!folderMap.has(folderPath)) {
          folderMap.set(folderPath, toFileItem(apiFile, folderPath, folderName, true));
          result.push(folderMap.get(folderPath)!);
        }
        continue;
      }

      const itemName = parts[0];
      const isDir = apiFile.is_dir || apiFile.path.endsWith('/');
      const itemPath = isDir ? normalizePath(fullPath) : fullPath;

      // Если папка уже добавлена как виртуальная (через дочерние элементы), не дублируем её.
      if (isDir && folderMap.has(itemPath)) continue;

      result.push(toFileItem(apiFile, itemPath, itemName, isDir));
    }

    return result;
  };

  const loadFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res;
      // Используем серверный поиск только от 2 символов.
      if (debouncedSearch.trim().length >= 2) {
        res = await apiSearchFiles(auth.bucket, auth.token, debouncedSearch.trim());
      } else {
        res = await apiListFiles(auth.bucket, auth.token);
        buildFolderRouteMaps(res.files || []);
      }

      const mapped = res.files
        ? (debouncedSearch.trim().length >= 2
          ? res.files.map((file) => {
            const normalizedPath = normalizePath(file.path);
            const fallbackName = normalizedPath.split('/').pop() || normalizedPath;
            return toFileItem(file, normalizedPath, fallbackName, file.is_dir || file.path.endsWith('/'));
          })
          : buildFolderView(res.files, currentFolder))
        : [];
      setFiles(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить файлы';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let res;
        if (debouncedSearch.trim().length >= 2) {
          res = await apiSearchFiles(auth.bucket, auth.token, debouncedSearch.trim());
        } else {
          res = await apiListFiles(auth.bucket, auth.token);
          buildFolderRouteMaps(res.files || []);
        }
        if (cancelled) return;
        const mapped = res.files
          ? (debouncedSearch.trim().length >= 2
            ? res.files.map((file) => {
              const normalizedPath = normalizePath(file.path);
              const fallbackName = normalizedPath.split('/').pop() || normalizedPath;
              return toFileItem(file, normalizedPath, fallbackName, file.is_dir || file.path.endsWith('/'));
            })
            : buildFolderView(res.files, currentFolder))
          : [];
        setFiles(mapped);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Не удалось загрузить файлы';
        setError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchFiles();
    return () => { cancelled = true; };
  }, [auth.bucket, auth.token, currentFolder, debouncedSearch]);

  useEffect(() => {
    const slugPath = normalizePath(location.pathname);
    if (!slugPath) {
      if (currentFolder) {
        setCurrentFolder('');
      }
      return;
    }

    const resolvedFolderPath = folderSlugToPath.get(slugPath);
    if (resolvedFolderPath && resolvedFolderPath !== currentFolder) {
      setCurrentFolder(resolvedFolderPath);
      setFilters(prev => ({ ...prev, globalSearch: '' }));
      setSelectedFolderIds(new Set());
      setSelectedFileIds(new Set());
    }
  }, [location.pathname, folderSlugToPath, currentFolder]);

  useEffect(() => {
    const targetPath = currentFolder ? `/${folderPathToSlug.get(currentFolder) || toSlugPath(currentFolder)}` : '/';
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true });
    }
  }, [currentFolder, folderPathToSlug, location.pathname, navigate]);

  // SSE Подписка на события анализа
  useEffect(() => {
    const sse = createSSEConnection(auth.token, (event: AnalysisEvent) => {
      if (event.status === 'completed' || event.status === 'analysis_complete') {
        const eventPath = normalizePath(event.path);
        setFiles(prev => prev.map(f => {
          if (f.id === eventPath) {
            return {
              ...f,
              summary: event.summary,
              tags: event.tags,
              category: event.tags?.join(', ')
            };
          }
          return f;
        }));

        setAnalyzingFiles(prev => {
          const next = new Set(prev);
          next.delete(eventPath);
          return next;
        });

        setSelectedFile(prev => {
          if (prev && prev.id === eventPath) {
            return {
              ...prev,
              summary: event.summary,
              tags: event.tags,
              category: event.tags?.join(', ')
            };
          }
          return prev;
        });
      }
    });

    return () => sse.close();
  }, [auth.token]);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setCurrentFolder(normalizePath(file.id));
      setFilters(prev => ({ ...prev, globalSearch: '' }));
    } else {
      setSelectedFile(file);
    }
  };

  const handleItemClick = (file: FileItem, e: React.MouseEvent<HTMLButtonElement>) => {
    const isMultiSelect = e.ctrlKey || e.metaKey;
    if (isMultiSelect) {
      if (file.type === 'folder') {
        setSelectedFolderIds(prev => {
          const next = new Set(prev);
          if (next.has(file.id)) {
            next.delete(file.id);
          } else {
            next.add(file.id);
          }
          return next;
        });
      } else {
        setSelectedFileIds(prev => {
          const next = new Set(prev);
          if (next.has(file.id)) {
            next.delete(file.id);
          } else {
            next.add(file.id);
          }
          return next;
        });
      }
      return;
    }

    // Обычный клик очищает множественное выделение.
    if (!isMultiSelect && (selectedFolderIds.size > 0 || selectedFileIds.size > 0)) {
      setSelectedFolderIds(new Set());
      setSelectedFileIds(new Set());
    }
    handleFileClick(file);
  };

  const handleFileDrop = async (droppedFiles: File[]) => {
    if (!droppedFiles.length) return;
    try {
      for (const file of droppedFiles) {
        await apiUploadFile(auth.bucket, auth.token, file, currentFolder);
      }
      await loadFiles();
      alert(`Загружено файлов: ${droppedFiles.length}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить файлы';
      alert(message);
    }
  };

  const handleCreateFolder = async (name: string) => {
    const safeName = name.trim().replace(/^\/+|\/+$/g, '');
    if (!safeName) return;
    const folderPath = currentFolder ? `${normalizePath(currentFolder)}/${safeName}` : safeName;
    try {
      await apiCreateFolder(auth.bucket, auth.token, folderPath);
      await loadFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать папку';
      alert(message);
    }
  };

  const handleInlineCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderNameInline.trim()) return;
    await handleCreateFolder(newFolderNameInline);
    setNewFolderNameInline('');
    setIsCreatingFolderInline(false);
  };

  const getParentPath = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('/');
  };

  const getBaseName = (path: string): string => {
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || path;
  };

  const canDropToFolder = (item: FileItem, targetFolderId: string): boolean => {
    // Запрещаем перенос в себя, потомка или ту же самую директорию.
    if (item.id === targetFolderId) return false;
    if (item.type === 'folder' && targetFolderId.startsWith(`${item.id}/`)) return false;
    return getParentPath(item.id) !== targetFolderId;
  };

  const cleanupDragState = () => {
    setDraggedItem(null);
    setDropTargetFolder(null);
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, item: FileItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));

    const source = e.currentTarget;
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.width = `${source.clientWidth}px`;
    ghost.style.opacity = '0.8';
    ghost.style.background = '#e5e7eb';
    ghost.style.border = '1px solid #9ca3af';
    ghost.style.borderRadius = '8px';
    ghost.style.pointerEvents = 'none';
    ghost.style.color = '#374151';
    ghost.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 24, 16);

    // Удаляем временный элемент после инициализации drag image.
    requestAnimationFrame(() => {
      document.body.removeChild(ghost);
    });
  };

  const moveDraggedItemToFolder = async (targetFolderId: string) => {
    if (!draggedItem) return;
    if (!canDropToFolder(draggedItem, targetFolderId)) return;

    const newPath = targetFolderId ? `${targetFolderId}/${getBaseName(draggedItem.id)}` : getBaseName(draggedItem.id);
    try {
      setIsLoading(true);
      await apiMoveObject(
        auth.bucket,
        auth.token,
        draggedItem.id,
        newPath,
        draggedItem.type === 'folder',
      );
      await loadFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось переместить объект';
      setError(message);
    } finally {
      setIsLoading(false);
      cleanupDragState();
    }
  };

  const getFolderSelectionForDelete = (): string[] => {
    const selected = Array.from(selectedFolderIds);
    return selected.filter((folder) => {
      const prefix = `${folder}/`;
      return !selected.some(other => other !== folder && prefix.startsWith(`${other}/`));
    });
  };

  const handleDeleteSelectedItems = async () => {
    if (selectedFolderIds.size === 0 && selectedFileIds.size === 0) return;

    const foldersToDelete = getFolderSelectionForDelete();
    const filesToDelete = Array.from(selectedFileIds);
    if (foldersToDelete.length === 0 && filesToDelete.length === 0) return;

    const foldersLabel = foldersToDelete.length ? `папок: ${foldersToDelete.length}` : '';
    const filesLabel = filesToDelete.length ? `файлов: ${filesToDelete.length}` : '';
    const details = [foldersLabel, filesLabel].filter(Boolean).join(', ');
    if (!window.confirm(`Удалить выбранные элементы (${details})?`)) return;

    try {
      setIsLoading(true);
      setError(null);
      // Удаляем папки рекурсивно на сервере.
      for (const folderPath of foldersToDelete) {
        await apiDeleteFolder(auth.bucket, auth.token, folderPath);
      }

      // Удаляем файлы, которые не входят в удалённые папки.
      for (const filePath of filesToDelete) {
        const normalizedFilePath = normalizePath(filePath);
        const coveredByFolder = foldersToDelete.some(folder => {
          const normalizedFolder = normalizePath(folder);
          return normalizedFilePath === normalizedFolder || normalizedFilePath.startsWith(`${normalizedFolder}/`);
        });
        if (!coveredByFolder) {
          await apiDeleteFile(auth.bucket, auth.token, filePath);
        }
      }

      setSelectedFolderIds(new Set());
      setSelectedFileIds(new Set());
      await loadFiles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось удалить папки';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getIntersectionsForSelection = (rect: DOMRect) => {
    const folders = new Set<string>();
    const files = new Set<string>();

    for (const item of filteredFiles) {
      const rowEl = rowRefs.current.get(item.id);
      if (!rowEl) continue;
      const rowRect = rowEl.getBoundingClientRect();
      const intersects = !(
        rowRect.right < rect.left ||
        rowRect.left > rect.right ||
        rowRect.bottom < rect.top ||
        rowRect.top > rect.bottom
      );
      if (!intersects) continue;
      if (item.type === 'folder') folders.add(item.id);
      else files.add(item.id);
    }

    return { folders, files };
  };

  const handleAreaMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !selectionAreaRef.current) return;
    // Не стартуем рамочное выделение из интерактивных элементов.
    if ((e.target as HTMLElement).closest('button,input,a,textarea,select,label')) return;

    const containerRect = selectionAreaRef.current.getBoundingClientRect();
    const startX = e.clientX - containerRect.left;
    const startY = e.clientY - containerRect.top;
    const additive = e.ctrlKey || e.metaKey;
    const initialFolders = new Set(selectedFolderIds);
    const initialFiles = new Set(selectedFileIds);

    setSelectionBox({ x: startX, y: startY, w: 0, h: 0 });

    const onMove = (ev: MouseEvent) => {
      if (!selectionAreaRef.current) return;
      const rect = selectionAreaRef.current.getBoundingClientRect();
      const curX = ev.clientX - rect.left;
      const curY = ev.clientY - rect.top;

      const x = Math.min(startX, curX);
      const y = Math.min(startY, curY);
      const w = Math.abs(curX - startX);
      const h = Math.abs(curY - startY);
      setSelectionBox({ x, y, w, h });

      const selectionClientRect = new DOMRect(
        x + rect.left,
        y + rect.top,
        w,
        h,
      );
      const { folders, files } = getIntersectionsForSelection(selectionClientRect);

      if (additive) {
        setSelectedFolderIds(new Set([...initialFolders, ...folders]));
        setSelectedFileIds(new Set([...initialFiles, ...files]));
      } else {
        setSelectedFolderIds(folders);
        setSelectedFileIds(files);
      }
    };

    const onUp = () => {
      setSelectionBox(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleDropOnFolder = async (targetFolder: FileItem) => {
    if (targetFolder.type !== 'folder') return;
    await moveDraggedItemToFolder(targetFolder.id);
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File size={20} />;
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('text') || type.includes('powerpoint')) return <FileText size={20} />;
    if (type.includes('jpeg') || type.includes('png') || type.includes('jpg')) return <FileImage size={20} />;
    if (type.includes('mp4') || type.includes('video')) return <FileVideo size={20} />;
    if (type.includes('zip') || type.includes('rar')) return <FileArchive size={20} />;
    return <File size={20} />;
  };

  const parseHumanSizeToMb = (sizeValue?: string): number => {
    if (!sizeValue) return 0;
    const normalized = sizeValue.replace(',', '.').trim();
    const match = normalized.match(/^([\d.]+)\s*([A-Za-zА-Яа-я]+)$/);
    if (!match) return 0;
    const num = Number(match[1]);
    if (!Number.isFinite(num)) return 0;
    const unit = match[2].toLowerCase();
    if (unit === 'b') return num / (1024 * 1024);
    if (unit === 'kb' || unit === 'кб') return num / 1024;
    if (unit === 'mb' || unit === 'мб') return num;
    if (unit === 'gb' || unit === 'гб') return num * 1024;
    if (unit === 'tb' || unit === 'тб') return num * 1024 * 1024;
    return 0;
  };

  const matchesCategory = (item: FileItem, category: string): boolean => {
    if (!category) return true;
    if (item.type === 'folder') return false;
    const type = (item.fileType || '').toLowerCase();
    switch (category) {
      case 'documents':
        return type.includes('pdf') || type.includes('text') || type.includes('word') || type.includes('officedocument') || type.includes('spreadsheet') || type.includes('presentation');
      case 'images':
        return type.startsWith('image/');
      case 'videos':
        return type.startsWith('video/');
      case 'music':
        return type.startsWith('audio/');
      case 'archives':
        return type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar');
      default:
        return true;
    }
  };

  const filteredFiles = useMemo(() => {
    const nameFilter = filters.nameFilter.trim().toLowerCase();
    const globalSearch = filters.globalSearch.trim().toLowerCase();
    const aiSummaryFilter = filters.aiSummaryFilter.trim().toLowerCase();
    const minSize = Number(filters.minSize);
    const maxSize = Number(filters.maxSize);
    const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
    const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    return files.filter((item) => {
      if (!matchesCategory(item, filters.category)) return false;
      if (globalSearch) {
        const matchesName = item.name.toLowerCase().includes(globalSearch);
        const matchesSummary = (item.summary || '').toLowerCase().includes(globalSearch);
        if (!matchesName && !matchesSummary) return false;
      }
      if (nameFilter && !item.name.toLowerCase().includes(nameFilter)) return false;
      if (aiSummaryFilter && !(item.summary || '').toLowerCase().includes(aiSummaryFilter)) return false;

      if (Number.isFinite(minSize) && filters.minSize.trim() !== '' && item.type === 'file') {
        if (parseHumanSizeToMb(item.size) < minSize) return false;
      }
      if (Number.isFinite(maxSize) && filters.maxSize.trim() !== '' && item.type === 'file') {
        if (parseHumanSizeToMb(item.size) > maxSize) return false;
      }

      const modifiedDate = new Date(item.lastModified);
      if (fromDate && modifiedDate < fromDate) return false;
      if (toDate && modifiedDate > toDate) return false;
      return true;
    });
  }, [files, filters]);

  const sidebarFolders: SidebarFolder[] = useMemo(() => {
    return files.filter(f => f.type === 'folder').map(f => ({ id: f.id, name: f.name }));
  }, [files]);

  const breadcrumbs = useMemo(() => {
    if (!currentFolder) return [];
    const parts = currentFolder.split('/');
    return parts.map((part, index) => {
      const path = parts.slice(0, index + 1).join('/');
      return { name: part, path };
    });
  }, [currentFolder]);

  return (
    <div className="flex h-screen">
      <Sidebar
        folders={sidebarFolders}
        onFolderClick={(id) => {
          setCurrentFolder(id);
          setFilters(prev => ({ ...prev, globalSearch: '' }));
          setSelectedFolderIds(new Set());
          setSelectedFileIds(new Set());
        }}
        userName={auth.name}
        onCreateFolder={handleCreateFolder}
        onNavigateToProfile={onNavigateToProfile}
        onFolderDragOver={(e, folderId) => {
          if (!draggedItem) return;
          if (!canDropToFolder(draggedItem, folderId)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDropTargetFolder(folderId);
        }}
        onFolderDragLeave={(folderId) => {
          if (dropTargetFolder === folderId) {
            setDropTargetFolder(null);
          }
        }}
        onFolderDrop={(e, folderId) => {
          e.preventDefault();
          moveDraggedItemToFolder(folderId);
        }}
        activeDropFolderId={dropTargetFolder}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3 max-w-4xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={filters.globalSearch}
                onChange={(e) => setFilters(prev => ({ ...prev, globalSearch: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Поиск по названию и AI-анализу (от 2 символов)"
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

        <div
          ref={selectionAreaRef}
          onMouseDown={handleAreaMouseDown}
          className="flex-1 overflow-auto p-6 bg-gray-50 relative select-none"
        >
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4 gap-3">
              <div className="flex items-center min-w-0 flex-1 overflow-x-auto whitespace-nowrap pr-2">
                <button
                  onClick={() => {
                    setCurrentFolder('');
                    setFilters(prev => ({ ...prev, globalSearch: '' }));
                    setSelectedFolderIds(new Set());
                    setSelectedFileIds(new Set());
                  }}
                  className="hover:text-blue-600 transition-colors"
                >
                  Главная
                </button>
                {breadcrumbs.map((crumb, idx) => (
                  <div key={crumb.path} className="flex items-center">
                    <ChevronRight size={16} className="mx-1 text-gray-400" />
                    <button
                      onClick={() => {
                        setCurrentFolder(crumb.path);
                        setFilters(prev => ({ ...prev, globalSearch: '' }));
                        setSelectedFolderIds(new Set());
                        setSelectedFileIds(new Set());
                      }}
                      onDragOver={(e) => {
                        if (!draggedItem) return;
                        if (!canDropToFolder(draggedItem, crumb.path)) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDropTargetFolder(crumb.path);
                      }}
                      onDragLeave={() => {
                        if (dropTargetFolder === crumb.path) {
                          setDropTargetFolder(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        moveDraggedItemToFolder(crumb.path);
                      }}
                      className={`transition-colors rounded px-1 ${dropTargetFolder === crumb.path
                        ? 'bg-blue-100 text-blue-700'
                        : `hover:text-blue-600 ${idx === breadcrumbs.length - 1 ? 'font-medium text-gray-900' : ''}`
                        }`}
                    >
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </div>
              <div className="shrink-0">
                {!isCreatingFolderInline ? (
                  <button
                    onClick={() => setIsCreatingFolderInline(true)}
                    className="inline-flex items-center whitespace-nowrap gap-2 px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 text-gray-700 leading-none"
                    title="Создать подпапку в текущей директории"
                  >
                    Новая папка здесь
                    <Plus size={16} />
                  </button>
                ) : (
                  <form onSubmit={handleInlineCreateSubmit} className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={newFolderNameInline}
                      onChange={(e) => setNewFolderNameInline(e.target.value)}
                      placeholder={currentFolder ? `Новая папка в ${currentFolder}` : 'Новая папка в корне'}
                      className="px-2 py-1.5 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" className="px-2.5 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">OK</button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingFolderInline(false);
                        setNewFolderNameInline('');
                      }}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
                    >
                      Отмена
                    </button>
                  </form>
                )}
              </div>
            </div>
            <DropZone onFileDrop={handleFileDrop} />
            {(selectedFolderIds.size > 0 || selectedFileIds.size > 0) && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                <span className="text-amber-900">
                  Выбрано: папок {selectedFolderIds.size}, файлов {selectedFileIds.size} (Ctrl/Cmd + клик)
                </span>
                <button
                  onClick={handleDeleteSelectedItems}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Удалить выбранные
                </button>
              </div>
            )}
          </div>

          {isLoading && <div className="text-gray-600 my-4">Загрузка файлов...</div>}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-center justify-between gap-3">
              <div className="text-red-700 text-sm">{error}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={loadFiles}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Повторить
                </button>
                <button
                  onClick={onLogout}
                  className="shrink-0 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Выйти
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm relative"
            >
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                <div className="col-span-5">Название</div>
                <div className="col-span-3">Дата изменения</div>
                <div className="col-span-2">Категория</div>
                <div className="col-span-2">Размер</div>
              </div>

              {filteredFiles.map((item) => (
                <button
                  key={item.id}
                  ref={(el) => {
                    if (el) rowRefs.current.set(item.id, el);
                    else rowRefs.current.delete(item.id);
                  }}
                  onClick={(e) => handleItemClick(item, e)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={cleanupDragState}
                  onDragOver={(e) => {
                    if (item.type !== 'folder' || !draggedItem) return;
                    if (!canDropToFolder(draggedItem, item.id)) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    setDropTargetFolder(item.id);
                  }}
                  onDragLeave={() => {
                    if (dropTargetFolder === item.id) {
                      setDropTargetFolder(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (item.type !== 'folder') return;
                    e.preventDefault();
                    handleDropOnFolder(item);
                  }}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-100 transition-colors w-full text-left cursor-pointer items-center ${dropTargetFolder === item.id
                    ? 'bg-blue-100'
                    : selectedFolderIds.has(item.id)
                      ? 'bg-amber-100 border-2 border-amber-300 shadow-inner'
                      : selectedFileIds.has(item.id)
                        ? 'bg-blue-100 border-2 border-blue-300 shadow-inner'
                        : 'hover:bg-blue-50'
                    }`}
                >
                  <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                    {item.type === 'folder' ? (
                      <Folder className="text-blue-500 shrink-0" size={20} />
                    ) : (
                      <span className="text-gray-500 shrink-0">{getFileIcon(item.fileType)}</span>
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="col-span-3 text-gray-500 text-sm">{new Date(item.lastModified).toLocaleString()}</div>
                  <div className="col-span-2 text-gray-500 text-sm truncate">
                    {item.type === 'folder' ? 'Папка' : item.category || item.fileType || '—'}
                  </div>
                  <div className="col-span-2 text-gray-500 text-sm">
                    {item.type === 'file' ? item.size : '—'}
                  </div>
                </button>
              ))}

              {filteredFiles.length === 0 && (
                <div className="px-4 py-8 text-center text-gray-500">
                  {debouncedSearch || filters.nameFilter || filters.aiSummaryFilter || filters.category || filters.minSize || filters.maxSize || filters.dateFrom || filters.dateTo
                    ? 'По заданным условиям ничего не найдено'
                    : 'Папка пуста'}
                </div>
              )}
            </div>
          )}
          {selectionBox && (
            <div
              className="absolute border-2 border-blue-400 bg-blue-200/20 pointer-events-none z-30"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.w,
                height: selectionBox.h,
              }}
            />
          )}
        </div>
      </div>

      {selectedFile && (
        <FileModal
          file={selectedFile}
          auth={auth}
          isAnalyzing={analyzingFiles.has(selectedFile.id)}
          onAnalyzeStart={() => {
            setAnalyzingFiles(prev => {
              const next = new Set(prev);
              next.add(selectedFile.id);
              return next;
            });
          }}
          onClose={() => setSelectedFile(null)}
          onFileChanged={loadFiles}
        />
      )}

      {showFilterModal && (
        <FilterModal
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          onClose={() => setShowFilterModal(false)}
        />
      )}
    </div>
  );
}