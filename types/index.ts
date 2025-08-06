export interface Article {
  id: string;
  title: string;
  summary: string;
  original_url: string;
  image_url?: string;
  category: string;
  published_at: string;
  view_count: number;
  source?: string;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  readArticles: Set<string>;
  bookmarkedArticles: Set<string>;
  readingTime: number;
  articlesReadToday: number;
  streak: number;
}
