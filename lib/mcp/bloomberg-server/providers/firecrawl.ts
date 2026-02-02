/**
 * Firecrawl Provider
 * Uses Firecrawl REST API for article scraping and news search
 */

import type { NewsArticle } from "../types";
import { cache, CACHE_TTL } from "./cache";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

// Cache TTL for scraped articles (24 hours)
const ARTICLE_CACHE_TTL = 24 * 60 * 60 * 1000;
// Cache TTL for search results (15 minutes)
const SEARCH_CACHE_TTL = 15 * 60 * 1000;

interface FirecrawlScrapeResult {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      author?: string;
      publishedTime?: string;
      ogImage?: string;
      sourceURL?: string;
    };
  };
  error?: string;
}

interface FirecrawlSearchResult {
  success: boolean;
  data?: Array<{
    url: string;
    title: string;
    description?: string;
    markdown?: string;
    metadata?: {
      publishedTime?: string;
      author?: string;
      ogImage?: string;
    };
  }>;
  error?: string;
}

/**
 * Check if Firecrawl is configured
 */
export function isFirecrawlConfigured(): boolean {
  return Boolean(FIRECRAWL_API_KEY);
}

/**
 * Call Firecrawl REST API
 */
async function callFirecrawlApi<T>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<T | null> {
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set, skipping Firecrawl request");
    return null;
  }

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API error: ${response.status} ${response.statusText}`, errorText);
      return null;
    }

    const result = await response.json();
    
    if (result.error) {
      console.error("Firecrawl API error:", result.error);
      return null;
    }

    return result as T;
  } catch (error) {
    console.error("Firecrawl fetch error:", error);
    return null;
  }
}

/**
 * Scrape full article content from URL
 * Falls back to search if direct scraping fails (common with aggregator URLs)
 */
export async function scrapeArticleContent(
  url: string,
  headline?: string
): Promise<{
  content: string;
  title?: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  sourceUrl?: string;
} | null> {
  const cacheKey = `firecrawl:article:${url}`;
  const cached = cache.get<{
    content: string;
    title?: string;
    author?: string;
    publishedDate?: string;
    imageUrl?: string;
    sourceUrl?: string;
  }>(cacheKey);
  
  if (cached) return cached;

  // Try direct scraping first
  const result = await callFirecrawlApi<FirecrawlScrapeResult>("/scrape", {
    url,
    formats: ["markdown"],
    onlyMainContent: true,
  });

  if (result?.success && result.data?.markdown) {
    const articleData = {
      content: result.data.markdown,
      title: result.data.metadata?.title,
      author: result.data.metadata?.author,
      publishedDate: result.data.metadata?.publishedTime,
      imageUrl: result.data.metadata?.ogImage,
      sourceUrl: url,
    };

    cache.set(cacheKey, articleData, ARTICLE_CACHE_TTL);
    return articleData;
  }

  // If direct scraping fails and we have a headline, try searching for the article
  if (headline) {
    console.log(`Direct scrape failed for ${url}, trying search fallback with headline`);
    const searchResult = await searchAndScrapeByHeadline(headline);
    if (searchResult) {
      cache.set(cacheKey, searchResult, ARTICLE_CACHE_TTL);
      return searchResult;
    }
  }

  return null;
}

/**
 * Search for an article by headline and scrape the first result
 */
async function searchAndScrapeByHeadline(headline: string): Promise<{
  content: string;
  title?: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  sourceUrl?: string;
} | null> {
  // Search for the article
  const searchResult = await callFirecrawlApi<FirecrawlSearchResult>("/search", {
    query: `"${headline}"`,
    limit: 3,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true,
    },
  });

  if (!searchResult?.success || !searchResult.data?.length) {
    return null;
  }

  // Find the first result with actual content
  for (const item of searchResult.data) {
    if (item.markdown && item.markdown.length > 200) {
      return {
        content: item.markdown,
        title: item.title,
        author: item.metadata?.author,
        publishedDate: item.metadata?.publishedTime,
        imageUrl: item.metadata?.ogImage,
        sourceUrl: item.url,
      };
    }
  }

  return null;
}

/**
 * Quality financial news sources for search queries
 */
const QUALITY_NEWS_SOURCES = [
  "reuters.com",
  "bloomberg.com",
  "cnbc.com",
  "wsj.com",
  "ft.com",
  "marketwatch.com",
  "yahoo.com/finance",
  "seekingalpha.com",
  "investopedia.com",
  "barrons.com",
  "fool.com",
  "thestreet.com",
  "benzinga.com",
  "investing.com",
  "finance.yahoo.com",
];

/**
 * Build site filter for search queries
 */
function buildSiteFilter(sites: string[] = QUALITY_NEWS_SOURCES): string {
  return sites.map(s => `site:${s}`).join(" OR ");
}

/**
 * Search for news articles using Firecrawl with improved query building
 */
export async function searchNews(
  query: string,
  options?: {
    limit?: number;
    scrapeContent?: boolean;
    tickers?: string[];
    includeGeneral?: boolean;
  }
): Promise<NewsArticle[]> {
  const limit = options?.limit || 25; // Increased default from 15 to 25
  
  // Build enhanced search query
  let searchQuery = query;
  
  // Add ticker context if provided
  if (options?.tickers?.length) {
    const tickerPart = options.tickers.map(t => `"${t}" OR "${t} stock"`).join(" OR ");
    searchQuery = `(${query}) (${tickerPart})`;
  }
  
  // Add site filters for quality sources unless doing a general search
  if (!options?.includeGeneral) {
    const siteFilter = buildSiteFilter();
    searchQuery = `${searchQuery} (${siteFilter})`;
  }
  
  const cacheKey = `firecrawl:search:${searchQuery}:${limit}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  // Make multiple search attempts with different strategies
  const allArticles: NewsArticle[] = [];
  const seenUrls = new Set<string>();
  
  // Strategy 1: Main query with news sources
  const searchParams1: Record<string, unknown> = {
    query: searchQuery,
    limit: Math.ceil(limit * 0.6), // Get 60% from main query
  };

  if (options?.scrapeContent) {
    searchParams1.scrapeOptions = {
      formats: ["markdown"],
      onlyMainContent: true,
    };
  }

  const result1 = await callFirecrawlApi<FirecrawlSearchResult>("/search", searchParams1);
  
  if (result1?.success && result1.data) {
    for (const item of result1.data) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allArticles.push(createArticleFromSearchResult(item, options?.tickers));
      }
    }
  }
  
  // Strategy 2: If we don't have enough results, try a broader query
  if (allArticles.length < limit) {
    const remainingLimit = limit - allArticles.length;
    
    // Try with just the core query (no site restrictions)
    const broaderQuery = options?.tickers?.length 
      ? `${query} ${options.tickers.join(" ")} financial news`
      : `${query} financial news market`;
    
    const searchParams2: Record<string, unknown> = {
      query: broaderQuery,
      limit: remainingLimit + 5, // Get a few extra
    };
    
    const result2 = await callFirecrawlApi<FirecrawlSearchResult>("/search", searchParams2);
    
    if (result2?.success && result2.data) {
      for (const item of result2.data) {
        if (!seenUrls.has(item.url) && allArticles.length < limit) {
          seenUrls.add(item.url);
          allArticles.push(createArticleFromSearchResult(item, options?.tickers));
        }
      }
    }
  }
  
  // Strategy 3: If still not enough and we have tickers, try ticker-specific searches
  if (allArticles.length < limit && options?.tickers?.length) {
    for (const ticker of options.tickers.slice(0, 2)) { // Limit to first 2 tickers
      if (allArticles.length >= limit) break;
      
      const tickerQuery = `"${ticker}" stock news latest`;
      const searchParams3: Record<string, unknown> = {
        query: tickerQuery,
        limit: 5,
      };
      
      const result3 = await callFirecrawlApi<FirecrawlSearchResult>("/search", searchParams3);
      
      if (result3?.success && result3.data) {
        for (const item of result3.data) {
          if (!seenUrls.has(item.url) && allArticles.length < limit) {
            seenUrls.add(item.url);
            allArticles.push(createArticleFromSearchResult(item, [ticker]));
          }
        }
      }
    }
  }

  // Sort by published date (most recent first)
  allArticles.sort((a, b) => {
    const dateA = new Date(a.publishedAt).getTime();
    const dateB = new Date(b.publishedAt).getTime();
    return dateB - dateA;
  });

  const finalArticles = allArticles.slice(0, limit);
  cache.set(cacheKey, finalArticles, SEARCH_CACHE_TTL);
  return finalArticles;
}

/**
 * Helper to create NewsArticle from search result
 */
function createArticleFromSearchResult(
  item: { url: string; title: string; description?: string; markdown?: string; metadata?: { publishedTime?: string; author?: string; ogImage?: string } },
  tickers?: string[]
): NewsArticle {
  const text = item.title + " " + (item.description || "");
  return {
    id: `firecrawl-search-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    headline: item.title || "Untitled",
    summary: item.description || "",
    body: item.markdown || "",
    source: extractDomain(item.url),
    publishedAt: item.metadata?.publishedTime || new Date().toISOString(),
    tickers: tickers || extractTickersFromText(text),
    sentiment: analyzeSentimentSimple(text),
    sentimentScore: 0,
    tags: ["firecrawl-search"],
    importance: determineImportance(item.title, extractDomain(item.url)),
    url: item.url,
    imageUrl: item.metadata?.ogImage,
  };
}

/**
 * Determine article importance based on source and content
 */
function determineImportance(headline: string, source: string): "high" | "medium" | "low" {
  const highImportanceSources = ["reuters.com", "bloomberg.com", "wsj.com", "ft.com", "cnbc.com"];
  const highImportanceKeywords = ["breaking", "earnings", "acquisition", "merger", "fda", "sec", "lawsuit", "ceo", "guidance", "outlook"];
  
  const lowerSource = source.toLowerCase();
  const lowerHeadline = headline.toLowerCase();
  
  if (highImportanceSources.some(s => lowerSource.includes(s))) return "high";
  if (highImportanceKeywords.some(k => lowerHeadline.includes(k))) return "high";
  
  return "medium";
}

/**
 * Get trending news by category with improved queries
 */
export async function getTrendingNews(
  category: "all" | "earnings" | "mergers" | "ipo" | "crypto" | "economy" | "fed" | "tech" = "all",
  limit: number = 25
): Promise<NewsArticle[]> {
  // More comprehensive category queries
  const categoryQueries: Record<string, string[]> = {
    all: [
      "breaking financial news stock market today",
      "market movers stocks today",
      "wall street news latest",
    ],
    earnings: [
      "earnings report quarterly results EPS revenue",
      "company earnings beat miss guidance",
      "quarterly earnings announcement results",
    ],
    mergers: [
      "merger acquisition deal buyout announcement",
      "M&A corporate deal acquisition target",
      "company merger buyout takeover",
    ],
    ipo: [
      "IPO initial public offering stock debut",
      "company going public IPO filing",
      "new stock listing IPO price",
    ],
    crypto: [
      "bitcoin ethereum crypto market news",
      "cryptocurrency price bitcoin rally",
      "crypto trading blockchain news",
    ],
    economy: [
      "inflation GDP economic data jobs report",
      "economy unemployment consumer spending",
      "economic indicators recession growth",
    ],
    fed: [
      "federal reserve interest rate decision FOMC",
      "fed powell monetary policy inflation",
      "interest rate hike cut federal reserve",
    ],
    tech: [
      "tech stocks FAANG AI artificial intelligence",
      "nvidia apple microsoft google amazon stock",
      "technology sector AI chip semiconductor",
    ],
  };

  const queries = categoryQueries[category] || categoryQueries.all;
  const allArticles: NewsArticle[] = [];
  const seenUrls = new Set<string>();
  
  // Search with multiple queries in parallel for better coverage
  const searchPromises = queries.slice(0, 2).map(async (query) => {
    const perQueryLimit = Math.ceil(limit / 2);
    return searchNews(query, { 
      limit: perQueryLimit, 
      scrapeContent: false,
      includeGeneral: false,
    });
  });
  
  const results = await Promise.all(searchPromises);
  
  for (const articles of results) {
    for (const article of articles) {
      if (!seenUrls.has(article.url)) {
        seenUrls.add(article.url);
        allArticles.push(article);
      }
    }
  }
  
  // Sort by date and importance
  allArticles.sort((a, b) => {
    // Prioritize high importance
    if (a.importance !== b.importance) {
      const importanceOrder = { high: 0, medium: 1, low: 2 };
      return importanceOrder[a.importance] - importanceOrder[b.importance];
    }
    // Then by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
  
  return allArticles.slice(0, limit);
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

/**
 * Extract potential ticker symbols from text
 */
function extractTickersFromText(text: string): string[] {
  // Match potential ticker patterns (1-5 uppercase letters)
  const matches = text.match(/\b[A-Z]{1,5}\b/g) || [];
  
  // Filter out common words that look like tickers
  const commonWords = new Set(["I", "A", "THE", "AND", "OR", "FOR", "TO", "IN", "ON", "AT", "BY", "IS", "IT", "AS", "BE", "SO", "IF", "AN", "NO", "DO", "UP", "AI", "US", "CEO", "IPO", "ETF", "GDP", "CPI", "SEC", "FDA", "FED", "NYSE", "NASDAQ"]);
  
  return [...new Set(matches.filter(m => !commonWords.has(m)))].slice(0, 5);
}

/**
 * Simple sentiment analysis for search results
 */
function analyzeSentimentSimple(text: string): "bullish" | "bearish" | "neutral" | "mixed" {
  const lowerText = text.toLowerCase();
  
  const bullish = ["surge", "soar", "rally", "gain", "rise", "jump", "bullish", "beat", "upgrade", "strong", "profit", "record"].some(w => lowerText.includes(w));
  const bearish = ["fall", "drop", "decline", "plunge", "crash", "bearish", "miss", "downgrade", "weak", "loss", "warning"].some(w => lowerText.includes(w));
  
  if (bullish && bearish) return "mixed";
  if (bullish) return "bullish";
  if (bearish) return "bearish";
  return "neutral";
}

/**
 * Store article URL mapping for later retrieval
 * This maps article IDs to URLs so news_article can look them up
 */
const articleUrlCache = new Map<string, string>();

export function storeArticleUrl(id: string, url: string): void {
  articleUrlCache.set(id, url);
}

export function getArticleUrl(id: string): string | undefined {
  return articleUrlCache.get(id);
}

/**
 * Get full article content by ID
 * First tries to find the URL from cache, then scrapes it
 */
export async function getArticleById(id: string): Promise<{
  id: string;
  headline?: string;
  content: string;
  author?: string;
  publishedDate?: string;
  imageUrl?: string;
  url?: string;
} | null> {
  const url = articleUrlCache.get(id);
  
  if (!url) {
    return null;
  }

  const scraped = await scrapeArticleContent(url);
  
  if (!scraped) {
    return null;
  }

  return {
    id,
    headline: scraped.title,
    content: scraped.content,
    author: scraped.author,
    publishedDate: scraped.publishedDate,
    imageUrl: scraped.imageUrl,
    url,
  };
}
