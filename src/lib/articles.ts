import { isSupabaseConfigured, supabase } from './supabase';

export interface PublicArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  articleType: 'news' | 'update' | 'column';
  publishedAt: string | null;
  seasonYear: number | null;
}

interface ArticleRow {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  article_type: 'news' | 'update' | 'column';
  published_at: string | null;
  season_year: number | null;
}

interface FetchArticlesOptions {
  limit?: number;
  excludeSlug?: string;
}

const mapArticle = (row: ArticleRow): PublicArticle => ({
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt || '',
  body: row.body,
  articleType: row.article_type,
  publishedAt: row.published_at,
  seasonYear: row.season_year,
});

export const fetchPublishedArticles = async (
  options: FetchArticlesOptions = {}
): Promise<PublicArticle[]> => {
  if (!isSupabaseConfigured) return [];

  const { limit = 50, excludeSlug } = options;

  try {
    let query = supabase
      .from('content_articles')
      .select('slug, title, excerpt, body, article_type, published_at, season_year')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (excludeSlug) {
      query = query.neq('slug', excludeSlug);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    return (data as ArticleRow[]).map(mapArticle);
  } catch (error) {
    console.error('Failed to fetch published articles:', error);
    return [];
  }
};

export const fetchPublishedArticleBySlug = async (slug: string): Promise<PublicArticle | null> => {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('content_articles')
      .select('slug, title, excerpt, body, article_type, published_at, season_year')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error || !data) return null;
    return mapArticle(data as ArticleRow);
  } catch (error) {
    console.error('Failed to fetch published article:', error);
    return null;
  }
};
