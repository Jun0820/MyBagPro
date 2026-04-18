import { isSupabaseConfigured, supabase } from './supabase';

export interface PublicArticle {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  articleType: 'news' | 'update' | 'column';
  publishedAt: string | null;
  seasonYear: number | null;
  relatedProfileId?: string | null;
  relatedProfileSlug?: string | null;
  relatedProfileName?: string | null;
}

interface ArticleRow {
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  article_type: 'news' | 'update' | 'column';
  published_at: string | null;
  season_year: number | null;
  related_profile_id: string | null;
}

interface FetchArticlesOptions {
  limit?: number;
  excludeSlug?: string;
}

interface FallbackArticleRow {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  article_type: 'news' | 'update' | 'column';
  published_at: string | null;
  season_year: number | null;
  related_profile_id?: string | null;
}

const FALLBACK_ARTICLES_PATH = '/published-articles-fallback.json';
let fallbackArticlesPromise: Promise<PublicArticle[]> | null = null;

const mapArticle = (row: ArticleRow): PublicArticle => ({
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt || '',
  body: row.body,
  articleType: row.article_type,
  publishedAt: row.published_at,
  seasonYear: row.season_year,
  relatedProfileId: row.related_profile_id,
});

const loadPublishedArticlesFallback = async (): Promise<PublicArticle[]> => {
  if (fallbackArticlesPromise) return fallbackArticlesPromise;

  fallbackArticlesPromise = (async () => {
    if (typeof fetch !== 'function') return [];

    try {
      const response = await fetch(FALLBACK_ARTICLES_PATH, { cache: 'force-cache' });
      if (!response.ok) return [];
      const payload = (await response.json()) as { articles?: FallbackArticleRow[] };
      if (!payload.articles?.length) return [];
      return payload.articles.map((row) => mapArticle(row as ArticleRow));
    } catch (error) {
      console.error('Failed to load published articles fallback:', error);
      return [];
    }
  })();

  return fallbackArticlesPromise;
};

export const fetchPublishedArticles = async (
  options: FetchArticlesOptions = {}
): Promise<PublicArticle[]> => {
  const { limit = 50, excludeSlug } = options;
  const fallback = await loadPublishedArticlesFallback();
  const filteredFallback = excludeSlug ? fallback.filter((article) => article.slug !== excludeSlug) : fallback;

  if (filteredFallback.length > 0) {
    return filteredFallback.slice(0, limit);
  }
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('content_articles')
      .select('slug, title, excerpt, body, article_type, published_at, season_year, related_profile_id')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (excludeSlug) {
      query = query.neq('slug', excludeSlug);
    }

    const { data, error } = await query;

    if (error || !data) return [];
    const articles = (data as ArticleRow[]).map(mapArticle);
    const profileIds = [...new Set(articles.map((article) => article.relatedProfileId).filter(Boolean))] as string[];

    if (profileIds.length === 0) return articles;

    const { data: profiles } = await supabase
      .from('setting_profiles')
      .select('id, slug, display_name')
      .in('id', profileIds);

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, { slug: profile.slug, name: profile.display_name }])
    );

    return articles.map((article) => {
      const related = article.relatedProfileId ? profileMap.get(article.relatedProfileId) : undefined;
      return {
        ...article,
        relatedProfileSlug: related?.slug || null,
        relatedProfileName: related?.name || null,
      };
    });
  } catch (error) {
    console.error('Failed to fetch published articles:', error);
    return [];
  }
};

export const fetchPublishedArticleBySlug = async (slug: string): Promise<PublicArticle | null> => {
  const fallback = await loadPublishedArticlesFallback();
  const fallbackMatch = fallback.find((article) => article.slug === slug) || null;
  if (fallbackMatch) return fallbackMatch;
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('content_articles')
      .select('slug, title, excerpt, body, article_type, published_at, season_year, related_profile_id')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    if (error || !data) return null;
    const article = mapArticle(data as ArticleRow);

    if (!article.relatedProfileId) return article;

    const { data: profile } = await supabase
      .from('setting_profiles')
      .select('slug, display_name')
      .eq('id', article.relatedProfileId)
      .maybeSingle();

    return {
      ...article,
      relatedProfileSlug: profile?.slug || null,
      relatedProfileName: profile?.display_name || null,
    };
  } catch (error) {
    console.error('Failed to fetch published article:', error);
    return null;
  }
};
