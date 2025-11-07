export interface SearchOptions {
  isRegex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
}

export interface MatchData {
  text: string;
  range: Range;
  index: number;
  node: Text;
  startOffset: number;
  endOffset: number;
}

export interface SearchResult {
  matches: MatchData[];
  totalCount: number;
  searchTime: number;
}
