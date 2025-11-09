import type { MatchData, SearchOptions, SearchResult } from '../types/search';
import { HighlightManager } from './highlightManager';
import { SearchEngine } from './searchEngine';

/**
 * SearchController - Orchestrates search operations with highlighting
 * VSCode-like search experience using CSS Custom Highlight API
 */
export class SearchController {
  private searchEngine: SearchEngine;
  private highlightManager: HighlightManager;
  private currentQuery: string = '';
  private currentOptions: SearchOptions = {
    isRegex: false,
    caseSensitive: false,
    wholeWord: false,
  };
  private searchResult: SearchResult | null = null;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Callbacks for UI updates
  private onSearchCompleteCallback?: (result: SearchResult) => void;
  private onMatchChangeCallback?: (current: number, total: number) => void;

  constructor() {
    this.searchEngine = new SearchEngine();
    this.highlightManager = new HighlightManager();

    // Check API support
    if (!HighlightManager.isSupported()) {
      console.warn('CSS Custom Highlight API is not supported in this browser');
    }
  }

  /**
   * Perform search with debouncing for performance
   */
  search(query: string, options: SearchOptions, debounceMs: number = 300): Promise<SearchResult> {
    query = query.trim();
    if (!query) {
      this.clear();
      return Promise.resolve({ matches: [], totalCount: 0, searchTime: 0 });
    }

    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
    }

    return new Promise((resolve) => {
      this.searchDebounceTimer = setTimeout(() => {
        const result = this.performSearch(query, options);
        resolve(result);
      }, debounceMs);
    });
  }

  /**
   * Internal search implementation
   */
  private performSearch(query: string, options: SearchOptions): SearchResult {
    // Clear previous highlights
    this.clear();

    // Store current search parameters
    this.currentQuery = query;
    this.currentOptions = options;

    // Perform search
    this.searchResult = this.searchEngine.search(query, options);

    // Highlight results
    if (this.searchResult.matches.length > 0) {
      this.highlightManager.highlightMatches(this.searchResult.matches);
    }

    // Notify callbacks
    if (this.onSearchCompleteCallback) {
      this.onSearchCompleteCallback(this.searchResult);
    }

    if (this.onMatchChangeCallback && this.searchResult.matches.length > 0) {
      this.onMatchChangeCallback(0, this.searchResult.totalCount);
    }

    return this.searchResult;
  }

  /**
   * Navigate to next match
   */
  navigateNext(): void {
    if (!this.highlightManager.hasMatches()) {
      return;
    }

    this.highlightManager.nextMatch();

    if (this.onMatchChangeCallback) {
      this.onMatchChangeCallback(
        this.highlightManager.getCurrentIndex(),
        this.highlightManager.getTotalMatches(),
      );
    }
  }

  /**
   * Navigate to previous match
   */
  navigatePrevious(): void {
    if (!this.highlightManager.hasMatches()) {
      return;
    }

    this.highlightManager.previousMatch();

    if (this.onMatchChangeCallback) {
      this.onMatchChangeCallback(
        this.highlightManager.getCurrentIndex(),
        this.highlightManager.getTotalMatches(),
      );
    }
  }

  /**
   * Navigate to specific match by index
   */
  navigateToMatch(index: number): void {
    if (!this.highlightManager.hasMatches()) {
      return;
    }

    this.highlightManager.setCurrentMatch(index);

    if (this.onMatchChangeCallback) {
      this.onMatchChangeCallback(
        this.highlightManager.getCurrentIndex(),
        this.highlightManager.getTotalMatches(),
      );
    }
  }

  /**
   * Clear all search highlights and reset state
   */
  clear(): void {
    this.highlightManager.clearHighlights();
    this.searchResult = null;
    this.currentQuery = '';
    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  /**
   * Get current match index (0-based)
   */
  getCurrentMatchIndex(): number {
    return this.highlightManager.getCurrentIndex();
  }

  /**
   * Get total number of matches
   */
  getTotalMatches(): number {
    return this.highlightManager.getTotalMatches();
  }

  /**
   * Get current search query
   */
  getSearchQuery(): string {
    return this.currentQuery;
  }

  /**
   * Get current search options
   */
  getSearchOptions(): SearchOptions {
    return { ...this.currentOptions };
  }

  /**
   * Get current search result
   */
  getSearchResult(): SearchResult | null {
    return this.searchResult;
  }

  /**
   * Get match at specific index
   */
  getMatch(index: number): MatchData | null {
    return this.highlightManager.getMatch(index);
  }

  /**
   * Check if API is supported
   */
  isSupported(): boolean {
    return HighlightManager.isSupported();
  }

  /**
   * Register callback for search completion
   */
  onSearchComplete(callback: (result: SearchResult) => void): void {
    this.onSearchCompleteCallback = callback;
  }

  /**
   * Register callback for match changes (navigation)
   */
  onMatchChange(callback: (current: number, total: number) => void): void {
    this.onMatchChangeCallback = callback;
  }

  /**
   * Validate regex pattern before searching
   */
  static validatePattern(pattern: string): { isValid: boolean; error?: string } {
    return SearchEngine.validatePattern(pattern);
  }
}
