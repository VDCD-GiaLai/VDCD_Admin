export interface SearchResultItem {
  id: string;
  title: string;
  slug?: string;
  url: string;
}

export interface GlobalSearchResult {
  programs?: SearchResultItem[];
  solutions?: SearchResultItem[];
  projects?: SearchResultItem[];
  articles?: SearchResultItem[];
  jobs?: SearchResultItem[];
  leads?: SearchResultItem[];
  "admin-users"?: SearchResultItem[];
}
