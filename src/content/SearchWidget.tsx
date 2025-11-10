import { useEffect, useRef, useState } from 'react';
import type { SearchOptions } from '../types/search';
import type { SearchController } from './searchController';
import './searchWidget.css';

interface SearchWidgetProps {
  controller: SearchController;
  onClose?: () => void;
}

export function SearchWidget({ controller, onClose }: SearchWidgetProps) {
  const [query, setQuery] = useState('');
  const [totalMatches, setTotalMatches] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [options, setOptions] = useState<SearchOptions>({
    isRegex: false,
    caseSensitive: false,
    wholeWord: false,
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    controller
      .search(query, options)
      .then((result) => {
        if (result.error) {
          setSearchError(result.error);
          setCurrentMatchIndex(-1);
          setTotalMatches(0);
        } else {
          setSearchError('');
          setCurrentMatchIndex(result.totalCount > 0 ? 1 : -1);
          setTotalMatches(result.totalCount);
        }
      })
      .catch((error) => {
        if (
          error?.message !== 'Search cancelled by new search' &&
          error?.message !== 'Search cleared'
        ) {
          console.error('Search error:', error);
        }
      });
  }, [controller, query, options]);

  const toggleOption = (optionKey: keyof SearchOptions) => {
    setOptions((prev) => {
      return { ...prev, [optionKey]: !prev[optionKey] };
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.shiftKey ? handleNavigatePrevious() : handleNavigateNext();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleNavigatePrevious = () => {
    controller.navigatePrevious();
  };

  const handleNavigateNext = () => {
    controller.navigateNext();
  };

  const handleClose = () => {
    controller.clear();
    onClose?.();
  };

  return (
    <div className="webgrep-widget">
      <div className="search-bar">
        <div className="input-container">
          <div className="search-icon">🔍</div>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Find in page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="clear-input-btn"
              onClick={() => setQuery('')}
              title="Clear"
            >
              ✕
            </button>
          )}
        </div>

        <span className={`match-counter ${searchError ? 'error' : ''}`}>
          {searchError || currentMatchIndex === -1
            ? 'No results'
            : `${currentMatchIndex} / ${totalMatches}`}
        </span>

        <div className="nav-buttons">
          <button
            type="button"
            className="nav-btn prev-btn"
            onClick={handleNavigatePrevious}
            disabled={totalMatches === 0}
            title="Previous (Shift+Enter)"
            aria-label="Previous match"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 4 L2 8 L10 8 Z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className="nav-btn next-btn"
            onClick={handleNavigateNext}
            disabled={totalMatches === 0}
            title="Next (Enter)"
            aria-label="Next match"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 8 L2 4 L10 4 Z" fill="currentColor" />
            </svg>
          </button>
          <button type="button" className="close-btn" onClick={handleClose} title="Close (Esc)">
            ✕
          </button>
        </div>
      </div>

      <div className="options-bar">
        <button
          type="button"
          className={`option-btn ${options.caseSensitive ? 'active' : ''}`}
          onClick={() => toggleOption('caseSensitive')}
          title="Match Case"
        >
          Aa
        </button>
        <button
          type="button"
          className={`option-btn ${options.wholeWord ? 'active' : ''}`}
          onClick={() => toggleOption('wholeWord')}
          title="Match Whole Word"
        >
          Ab|
        </button>
        <button
          type="button"
          className={`option-btn ${options.isRegex ? 'active' : ''}`}
          onClick={() => toggleOption('isRegex')}
          title="Use Regular Expression"
        >
          .*
        </button>
      </div>
    </div>
  );
}
