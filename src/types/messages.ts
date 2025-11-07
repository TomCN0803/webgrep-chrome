import type { SearchOptions } from './search';

export interface SearchRequest {
  type: 'SEARCH';
  query: string;
  options: SearchOptions;
}

export interface SearchResponse {
  type: 'SEARCH_RESULT';
  matchCount: number;
  currentIndex: number;
}

export interface NavigateRequest {
  type: 'NAVIGATE';
  direction: 'next' | 'previous';
}

export type Message = SearchRequest | SearchResponse | NavigateRequest | { type: 'CLEAR' };
