import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;

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

export const apiClient = {
  async fetchArticles(): Promise<Article[]> {
    try {
      const timestamp = Date.now();
      const response = await fetch(`${API_URL}/api/articles?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((article: Article) => ({
          ...article,
          source: article.source || article.original_url.split('/')[2]?.replace('www.', '') || 'NineT News',
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  },

  async fetchArticle(id: string): Promise<Article> {
    try {
      const response = await fetch(`${API_URL}/api/articles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          ...data.data,
          source: data.data.source || data.data.original_url.split('/')[2]?.replace('www.', '') || 'NineT News',
        };
      }
      
      throw new Error('Article not found');
    } catch (error) {
      console.error('Error fetching article:', error);
      throw error;
    }
  }
};
