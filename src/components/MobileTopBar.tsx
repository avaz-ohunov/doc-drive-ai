import { Link } from 'react-router-dom';
import { Search, Filter, Menu } from 'lucide-react';

interface MobileTopBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchOpen: boolean;
  onSearchToggle: () => void;
  onFilterClick: () => void;
  onMenuClick: () => void;
}

export function MobileTopBar({
  searchValue,
  onSearchChange,
  searchOpen,
  onSearchToggle,
  onFilterClick,
  onMenuClick,
}: MobileTopBarProps) {
  return (
    <>
      <header className="mobile-top-bar">
        <Link to="/" className="mobile-top-bar__logo">
          DocDriveAI
        </Link>
        <div className="mobile-top-bar__actions">
          <button
            type="button"
            className={`mobile-top-bar__btn${searchOpen ? ' mobile-top-bar__btn--active' : ''}`}
            onClick={onSearchToggle}
            aria-label="Поиск"
            aria-expanded={searchOpen}
          >
            <Search size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="mobile-top-bar__btn"
            onClick={onFilterClick}
            aria-label="Фильтры"
          >
            <Filter size={22} strokeWidth={2} />
          </button>
          <button
            type="button"
            className="mobile-top-bar__btn"
            onClick={onMenuClick}
            aria-label="Открыть меню"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div
        className={`mobile-search-panel${searchOpen ? ' mobile-search-panel--open' : ''}`}
        role="search"
        hidden={!searchOpen}
      >
        <div className="mobile-search-panel__input-wrap">
          <Search className="mobile-search-panel__icon" size={18} aria-hidden />
          <input
            type="search"
            className="mobile-search-panel__input"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск (от 2 символов)"
            autoComplete="off"
          />
        </div>
      </div>
    </>
  );
}
