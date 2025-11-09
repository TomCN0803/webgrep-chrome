import type { MatchData, SearchOptions, SearchResult } from '../types/search';

export class SearchEngine {
  private readonly MAX_MATCHES = 10000;

  /**
   * Search for text in the DOM
   * Pure function - no side effects, only returns match data
   */
  search(
    searchText: string,
    options: SearchOptions,
    rootElement: HTMLElement = document.body,
  ): SearchResult {
    const startTime = performance.now();

    if (!searchText) {
      return { matches: [], totalCount: 0, searchTime: 0 };
    }

    // Build regex pattern
    const pattern = this.buildPattern(searchText, options);
    if (!pattern) {
      return { matches: [], totalCount: 0, searchTime: 0 };
    }

    const matches: MatchData[] = [];
    for (const textNode of this.getTextNodesGenerator(rootElement)) {
      if (matches.length >= this.MAX_MATCHES) break;

      const nodeMatches = this.findMatchesInNode(textNode, pattern, matches.length);
      matches.push(...nodeMatches);
    }

    const searchTime = performance.now() - startTime;

    return {
      matches,
      totalCount: matches.length,
      searchTime,
    };
  }

  /**
   * Build regex pattern from search text and options
   */
  private buildPattern(searchText: string, options: SearchOptions): RegExp | null {
    let pattern = searchText;

    // Escape regex special characters if not in regex mode
    if (!options.isRegex) {
      pattern = this.escapeRegex(pattern);
    }

    // Whole word matching
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }

    // Build flags
    const flags = options.caseSensitive ? 'g' : 'gi';

    try {
      return new RegExp(pattern, flags);
    } catch (e) {
      console.error('Invalid regex pattern:', e);
      return null;
    }
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private *getTextNodesGenerator(rootElement: HTMLElement): Generator<Text> {
    const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => this.shouldIncludeNode(node),
    });

    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      yield node as Text;
    }
  }

  private shouldIncludeNode(node: Node): number {
    const parent = node.parentElement;
    if (!parent) return NodeFilter.FILTER_REJECT;

    // Skip if no text content
    if (!node.textContent?.trim()) {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip hidden elements
    const style = window.getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip script, style, and other non-visible elements
    const tagName = parent.tagName.toLowerCase();
    const excludedTags = ['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'svg'];

    if (excludedTags.includes(tagName)) {
      return NodeFilter.FILTER_REJECT;
    }

    // Skip input fields (can be added as an option later)
    if (['input', 'textarea', 'select'].includes(tagName)) {
      return NodeFilter.FILTER_REJECT;
    }

    return NodeFilter.FILTER_ACCEPT;
  }

  /**
   * Find all matches within a single text node
   */
  private findMatchesInNode(textNode: Text, pattern: RegExp, startIndex: number): MatchData[] {
    const matches: MatchData[] = [];
    const text = textNode.textContent || '';

    // Reset regex state
    pattern.lastIndex = 0;

    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
      matches.push(this.createMatchData(textNode, match, startIndex + matches.length));

      // Prevent infinite loop for zero-width matches
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }

    return matches;
  }

  /**
   * Create match data structure
   */
  private createMatchData(textNode: Text, match: RegExpExecArray, index: number): MatchData {
    const range = new Range();
    range.setStart(textNode, match.index);
    range.setEnd(textNode, match.index + match[0].length);

    return {
      text: match[0],
      range,
      index,
      node: textNode,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    };
  }

  /**
   * Validate regex pattern for safety (prevent ReDoS)
   */
  static validatePattern(pattern: string): {
    isValid: boolean;
    error?: string;
  } {
    // Check length
    if (pattern.length > 1000) {
      return {
        isValid: false,
        error: 'Pattern too long (max 1000 characters)',
      };
    }

    // Try to compile
    try {
      new RegExp(pattern);
    } catch (e) {
      return {
        isValid: false,
        error: e instanceof Error ? e.message : 'Invalid pattern',
      };
    }

    // Check for dangerous patterns (basic ReDoS detection)
    const dangerousPatterns = [
      /(\w+)+\+/, // Nested quantifiers
      /(a+)+\+/,
      /(a\*)\*\+/,
      /(\(.+\))+\+/,
    ];

    for (const dangerous of dangerousPatterns) {
      if (dangerous.test(pattern)) {
        return {
          isValid: false,
          error: 'Pattern contains potentially dangerous nested quantifiers',
        };
      }
    }

    return { isValid: true };
  }
}
