import { X } from 'lucide-react';
import { Sidebar, type SidebarProps } from './Sidebar';

interface MobileSidebarDrawerProps extends SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({
  isOpen,
  onClose,
  onFolderClick,
  ...sidebarProps
}: MobileSidebarDrawerProps) {
  const handleFolderClick = (folderId: string) => {
    onFolderClick(folderId);
    onClose();
  };

  return (
    <>
      <div
        className={`mobile-drawer-backdrop${isOpen ? ' mobile-drawer-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`mobile-drawer${isOpen ? ' mobile-drawer--open' : ''}`}
        aria-hidden={!isOpen}
        aria-label="Навигация по папкам"
      >
        <button
          type="button"
          className="mobile-drawer__close"
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          <X size={22} strokeWidth={2} />
        </button>
        <Sidebar
          {...sidebarProps}
          hideBranding
          className="mobile-sidebar-inner"
          onFolderClick={handleFolderClick}
        />
      </aside>
    </>
  );
}
