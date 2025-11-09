import type { MatchData } from '../types/search';

/**
 * HighlightManager uses CSS Custom Highlight API
 * Modern approach that doesn't modify DOM structure
 */
export class HighlightManager {
  private allMatchesHighlight: Highlight | null = null;
  private currentMatchHighlight: Highlight | null = null;
  private matches: MatchData[] = [];
  private currentIndex: number = -1;

  // Highlight group names (must match CSS ::highlight() selectors)
  private readonly ALL_MATCHES_NAME = 'webgrep-search-matches';
  private readonly CURRENT_MATCH_NAME = 'webgrep-search-current';

  /**
   * Check if CSS Custom Highlight API is supported
   */
  static isSupported(): boolean {
    return typeof CSS !== 'undefined' && 'highlights' in CSS;
  }

  /**
   * Highlight all search matches
   */
  highlightMatches(matches: MatchData[]): void {
    this.matches = matches;
    this.clearHighlights();

    if (matches.length === 0 || !HighlightManager.isSupported()) {
      return;
    }

    // Create and register highlight for all matches
    this.allMatchesHighlight = new Highlight(...matches.map((match) => match.range));
    CSS.highlights.set(this.ALL_MATCHES_NAME, this.allMatchesHighlight);

    // Highlight first match as current
    if (matches.length > 0) {
      this.setCurrentMatch(0);
    }
  }

  /**
   * Set the current match (highlighted differently)
   */
  setCurrentMatch(index: number): void {
    if (index < 0 || index >= this.matches.length) {
      console.warn(`Invalid match index: ${index}`);
      return;
    }

    this.currentIndex = index;
    const currentMatch = this.matches[index];

    // Clear previous current highlight
    if (this.currentMatchHighlight) {
      CSS.highlights.delete(this.CURRENT_MATCH_NAME);
    }

    // Create and register new current match highlight
    this.currentMatchHighlight = new Highlight(currentMatch.range);
    CSS.highlights.set(this.CURRENT_MATCH_NAME, this.currentMatchHighlight);

    // Scroll to current match
    this.scrollToMatch(index);
  }

  /**
   * Scroll to a specific match with smooth animation
   */
  scrollToMatch(index: number): void {
    if (index < 0 || index >= this.matches.length) {
      return;
    }

    const rect = this.matches[index].range.getBoundingClientRect();

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: window.scrollY + rect.top - window.innerHeight / 2,
        behavior: 'smooth',
      });
    });
  }

  /**
   * Get current match index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total number of matches
   */
  getTotalMatches(): number {
    return this.matches.length;
  }

  /**
   * Navigate to next match
   */
  nextMatch(): void {
    if (this.matches.length === 0) return;

    const nextIndex = (this.currentIndex + 1) % this.matches.length;
    this.setCurrentMatch(nextIndex);
  }

  /**
   * Navigate to previous match
   */
  previousMatch(): void {
    if (this.matches.length === 0) return;

    const prevIndex = this.currentIndex - 1 < 0 ? this.matches.length - 1 : this.currentIndex - 1;
    this.setCurrentMatch(prevIndex);
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    if (!HighlightManager.isSupported()) {
      return;
    }

    // Remove all registered highlights
    CSS.highlights.delete(this.ALL_MATCHES_NAME);
    CSS.highlights.delete(this.CURRENT_MATCH_NAME);

    this.allMatchesHighlight = null;
    this.currentMatchHighlight = null;
    this.matches = [];
    this.currentIndex = -1;
  }

  /**
   * Update highlights after DOM changes
   * Useful when page content is dynamically updated
   */
  refreshHighlights(): void {
    if (this.matches.length === 0) return;

    // Re-highlight with existing matches
    this.highlightMatches([...this.matches]);

    // Restore current match if it was set
    if (this.currentIndex >= 0) {
      this.setCurrentMatch(this.currentIndex);
    }
  }

  /**
   * Get match at specific index
   */
  getMatch(index: number): MatchData | null {
    if (index < 0 || index >= this.matches.length) {
      return null;
    }
    return this.matches[index];
  }

  /**
   * Check if there are any matches
   */
  hasMatches(): boolean {
    return this.matches.length > 0;
  }
}
