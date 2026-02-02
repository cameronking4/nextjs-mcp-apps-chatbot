/**
 * Firecrawl Provider
 * Uses Firecrawl MCP for article scraping and news search
 */

import type { NewsArticle } from "../types";
import { cache, CACHE_TTL } from "./cache";

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || "";
const FIRECRAWL_MCP_URL = FIRECRAWL_API_KEY 
  ? `https://mcp.firecrawl.dev/${FIRECRAWL_API_KEY}/v2/mcp`
  : "";

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
 * Call Firecrawl MCP endpoint
 */
async function callFirecrawlMcp<T>(
  method: string,
  params: Record<string, unknown>
): Promise<T | null> {
  if (!FIRECRAWL_MCP_URL) {
    console.warn("FIRECRAWL_API_KEY not set, skipping Firecrawl request");
    return null;
  }

  try {
    const response = await fetch(FIRECRAWL_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: {
          name: method,
          arguments: params,
        },
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl MCP error: ${response.status} ${response.statusText}`);
      return null;
    }

    const result = await response.json();
    
    if (result.error) {
      console.error("Firecrawl MCP error:", result.error);
      return null;
    }

    // Parse the content from MCP response
    const content = result.result?.content?.[0]?.text;
    if (content) {
      return JSON.parse(content) as T;
    }

    return result.result as T;
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

  // Try direct scraping first with stealth proxy for better success rate
  const result = await callFirecrawlMcp<FirecrawlScrapeResult>("firecrawl_scrape", {
    url,
    formats: ["markdown"],
    onlyMainContent: true,
    maxAge: 86400000, // 24h cache on Firecrawl side
    proxy: "stealth", // Use stealth proxy for better success with paywalled sites
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
  // Search for the article with news sources
  const searchResult = await callFirecrawlMcp<FirecrawlSearchResult>("firecrawl_search", {
    query: `"${headline}"`,
    limit: 3,
    sources: [{ type: "news" }],
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
 * Search for news articles using Firecrawl
 */
export async function searchNews(
  query: string,
  options?: {
    limit?: number;
    scrapeContent?: boolean;
    tickers?: string[];
  }
): Promise<NewsArticle[]> {
  const limit = options?.limit || 15;
  
  // Build search query with ticker context
  let searchQuery = query;
  if (options?.tickers?.length) {
    searchQuery = `${query} ${options.tickers.join(" OR ")} stock`;
  }
  
  const cacheKey = `firecrawl:search:${searchQuery}:${limit}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) return cached;

  const searchParams: Record<string, unknown> = {
    query: searchQuery,
    limit,
    sources: [{ type: "news" }],
  };

  // Optionally scrape content for each result
  if (options?.scrapeContent) {
    searchParams.scrapeOptions = {
      formats: ["markdown"],
      onlyMainContent: true,
    };
  }

  const result = await callFirecrawlMcp<FirecrawlSearchResult>("firecrawl_search", searchParams);

  if (!result?.success || !result.data) {
    return [];
  }

  const articles: NewsArticle[] = result.data.map((item, index) => ({
    id: `firecrawl-search-${Date.now()}-${index}`,
    headline: item.title || "Untitled",
    summary: item.description || "",
    body: item.markdown || "",
    source: extractDomain(item.url),
    publishedAt: item.metadata?.publishedTime || new Date().toISOString(),
    tickers: options?.tickers || extractTickersFromText(item.title + " " + (item.description || "")),
    sentiment: analyzeSentimentSimple(item.title + " " + (item.description || "")),
    sentimentScore: 0,
    tags: ["firecrawl-search"],
    importance: "medium" as const,
    url: item.url,
    imageUrl: item.metadata?.ogImage,
  }));

  cache.set(cacheKey, articles, SEARCH_CACHE_TTL);
  return articles;
}

/**
 * Get trending news by category
 */
export async function getTrendingNews(
  category: "all" | "earnings" | "mergers" | "ipo" | "crypto" | "economy" | "fed" | "tech" = "all",
  limit: number = 20
): Promise<NewsArticle[]> {
  const categoryQueries: Record<string, string> = {
    all: "breaking financial news stock market today",
    earnings: "earnings report quarterly results beat miss EPS",
    mergers: "merger acquisition deal buyout M&A",
    ipo: "IPO initial public offering stock debut",
    crypto: "bitcoin ethereum crypto cryptocurrency market",
    economy: "inflation GDP jobs report economic data",
    fed: "federal reserve interest rate FOMC powell",
    tech: "tech stocks FAANG AI artificial intelligence nvidia",
  };

  const query = categoryQueries[category] || categoryQueries.all;
  
  // Add site filters for quality sources
  const qualitySites = "site:reuters.com OR site:bloomberg.com OR site:cnbc.com OR site:wsj.com OR site:ft.com";
  const fullQuery = `${query} (${qualitySites})`;

  return searchNews(fullQuery, { limit, scrapeContent: false });
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
