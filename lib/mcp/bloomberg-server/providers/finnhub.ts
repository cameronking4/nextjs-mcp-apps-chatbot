/**
 * Finnhub Provider
 * Uses Finnhub API for news with sentiment and earnings calendar
 */

import type { NewsArticle, EarningsEvent } from "../types";
import { cache, CACHE_TTL } from "./cache";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

interface FinnhubNewsItem {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface FinnhubEarningsItem {
  date: string;
  epsActual: number | null;
  epsEstimate: number | null;
  hour: string;
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

async function fetchFinnhub<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
  if (!FINNHUB_API_KEY) {
    console.warn("FINNHUB_API_KEY not set, skipping Finnhub request");
    return null;
  }

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set("token", FINNHUB_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json() as T;
  } catch (error) {
    console.error("Finnhub fetch error:", error);
    return null;
  }
}

/**
 * Analyze sentiment from headline/summary text (simple heuristic)
 */
function analyzeSentiment(text: string): "bullish" | "bearish" | "neutral" | "mixed" {
  const lowerText = text.toLowerCase();
  
  const bullishKeywords = [
    "surge", "soar", "rally", "gain", "rise", "jump", "climb", "bullish",
    "outperform", "beat", "upgrade", "strong", "growth", "profit", "record",
    "breakthrough", "innovation", "optimistic", "positive", "buy"
  ];
  
  const bearishKeywords = [
    "fall", "drop", "decline", "plunge", "crash", "bearish", "miss",
    "downgrade", "weak", "loss", "concern", "warning", "risk", "sell",
    "cut", "layoff", "recession", "negative", "disappointing"
  ];
  
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (const word of bullishKeywords) {
    if (lowerText.includes(word)) bullishCount++;
  }
  
  for (const word of bearishKeywords) {
    if (lowerText.includes(word)) bearishCount++;
  }
  
  if (bullishCount > 0 && bearishCount > 0) return "mixed";
  if (bullishCount > bearishCount) return "bullish";
  if (bearishCount > bullishCount) return "bearish";
  return "neutral";
}

/**
 * Determine importance based on source and content
 */
function determineImportance(item: FinnhubNewsItem): "high" | "medium" | "low" {
  const highImportanceSources = ["Reuters", "Bloomberg", "WSJ", "CNBC", "Financial Times"];
  const highImportanceKeywords = ["earnings", "revenue", "acquisition", "merger", "FDA", "SEC", "lawsuit"];
  
  const source = item.source.toLowerCase();
  const text = (item.headline + " " + item.summary).toLowerCase();
  
  if (highImportanceSources.some(s => source.includes(s.toLowerCase()))) return "high";
  if (highImportanceKeywords.some(k => text.includes(k))) return "high";
  if (item.related && item.related.split(",").length > 3) return "medium";
  
  return "low";
}

/**
 * Get company news by ticker
 */
export async function getCompanyNews(
  ticker: string,
  options?: {
    limit?: number;
    sentiment?: "bullish" | "bearish" | "neutral" | "mixed";
    importance?: "high" | "medium" | "low";
  }
): Promise<NewsArticle[]> {
  const cacheKey = `news:company:${ticker.toUpperCase()}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) {
    // Apply filters to cached data
    return applyNewsFilters(cached, options);
  }

  // Get news from last 7 days
  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const data = await fetchFinnhub<FinnhubNewsItem[]>("/company-news", {
    symbol: ticker.toUpperCase(),
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  });

  if (!data || !Array.isArray(data)) return [];

  const articles: NewsArticle[] = data.slice(0, 50).map((item, index) => ({
    id: `finnhub-${item.id || index}`,
    headline: item.headline,
    summary: item.summary,
    body: "", // Finnhub doesn't provide full body
    source: item.source,
    publishedAt: new Date(item.datetime * 1000).toISOString(),
    tickers: item.related ? item.related.split(",").map(t => t.trim()) : [ticker.toUpperCase()],
    sentiment: analyzeSentiment(item.headline + " " + item.summary),
    tags: [item.category].filter(Boolean),
    importance: determineImportance(item),
  }));

  cache.set(cacheKey, articles, CACHE_TTL.NEWS);
  return applyNewsFilters(articles, options);
}

/**
 * Get general market news
 */
export async function getMarketNews(
  options?: {
    limit?: number;
    sentiment?: "bullish" | "bearish" | "neutral" | "mixed";
    importance?: "high" | "medium" | "low";
  }
): Promise<NewsArticle[]> {
  const cacheKey = "news:market:general";
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) {
    return applyNewsFilters(cached, options);
  }

  const data = await fetchFinnhub<FinnhubNewsItem[]>("/news", {
    category: "general",
  });

  if (!data || !Array.isArray(data)) return [];

  const articles: NewsArticle[] = data.slice(0, 50).map((item, index) => ({
    id: `finnhub-market-${item.id || index}`,
    headline: item.headline,
    summary: item.summary,
    body: "",
    source: item.source,
    publishedAt: new Date(item.datetime * 1000).toISOString(),
    tickers: item.related ? item.related.split(",").map(t => t.trim()) : [],
    sentiment: analyzeSentiment(item.headline + " " + item.summary),
    tags: ["market", item.category].filter(Boolean),
    importance: determineImportance(item),
  }));

  cache.set(cacheKey, articles, CACHE_TTL.NEWS);
  return applyNewsFilters(articles, options);
}

/**
 * Apply filters to news articles
 */
function applyNewsFilters(
  articles: NewsArticle[],
  options?: {
    limit?: number;
    sentiment?: "bullish" | "bearish" | "neutral" | "mixed";
    importance?: "high" | "medium" | "low";
  }
): NewsArticle[] {
  let filtered = [...articles];

  if (options?.sentiment) {
    filtered = filtered.filter(a => a.sentiment === options.sentiment);
  }

  if (options?.importance) {
    filtered = filtered.filter(a => a.importance === options.importance);
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

/**
 * Get earnings calendar
 */
export async function getEarningsCalendar(options?: {
  ticker?: string;
  from?: string;
  to?: string;
}): Promise<EarningsEvent[]> {
  const ticker = options?.ticker?.toUpperCase();
  const cacheKey = `earnings:${ticker || "all"}`;
  const cached = cache.get<EarningsEvent[]>(cacheKey);
  if (cached) return cached;

  // Default to next 30 days
  const from = options?.from || new Date().toISOString().split("T")[0];
  const to = options?.to || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const params: Record<string, string> = { from, to };
  if (ticker) {
    params.symbol = ticker;
  }

  const data = await fetchFinnhub<{ earningsCalendar: FinnhubEarningsItem[] }>("/calendar/earnings", params);

  if (!data?.earningsCalendar) return [];

  const events: EarningsEvent[] = data.earningsCalendar.map((item, index) => ({
    id: `earnings-${item.symbol}-${item.date}-${index}`,
    ticker: item.symbol,
    company: item.symbol, // Finnhub doesn't provide company name in this endpoint
    eventTime: `${item.date}T${item.hour === "bmo" ? "09:00:00" : item.hour === "amc" ? "16:30:00" : "12:00:00"}Z`,
    estimate: item.epsEstimate || 0,
    actual: item.epsActual,
    surprise: item.epsActual && item.epsEstimate 
      ? Number((item.epsActual - item.epsEstimate).toFixed(4))
      : null,
    quarter: `Q${item.quarter} ${item.year}`,
  }));

  cache.set(cacheKey, events, CACHE_TTL.EARNINGS);
  return events;
}

/**
 * Get company profile (for enriching data)
 */
export async function getCompanyProfile(ticker: string): Promise<{
  name: string;
  industry: string;
  sector: string;
  country: string;
  marketCap: number;
  logo: string;
} | null> {
  const cacheKey = `profile:${ticker.toUpperCase()}`;
  const cached = cache.get<{
    name: string;
    industry: string;
    sector: string;
    country: string;
    marketCap: number;
    logo: string;
  }>(cacheKey);
  if (cached) return cached;

  interface ProfileData {
    name: string;
    finnhubIndustry: string;
    country: string;
    marketCapitalization: number;
    logo: string;
  }

  const data = await fetchFinnhub<ProfileData>("/stock/profile2", {
    symbol: ticker.toUpperCase(),
  });

  if (!data || !data.name) return null;

  const profile = {
    name: data.name,
    industry: data.finnhubIndustry || "Unknown",
    sector: data.finnhubIndustry || "Unknown", // Finnhub uses same field
    country: data.country || "US",
    marketCap: (data.marketCapitalization || 0) * 1000000, // Finnhub returns in millions
    logo: data.logo || "",
  };

  cache.set(cacheKey, profile, CACHE_TTL.FUNDAMENTALS);
  return profile;
}

/**
 * Get basic metrics for a stock
 */
export async function getBasicMetrics(ticker: string): Promise<{
  pe: number;
  eps: number;
  beta: number;
  high52Week: number;
  low52Week: number;
} | null> {
  const cacheKey = `metrics:${ticker.toUpperCase()}`;
  const cached = cache.get<{
    pe: number;
    eps: number;
    beta: number;
    high52Week: number;
    low52Week: number;
  }>(cacheKey);
  if (cached) return cached;

  interface MetricData {
    metric: {
      peBasicExclExtraTTM?: number;
      epsBasicExclExtraItemsTTM?: number;
      beta?: number;
      "52WeekHigh"?: number;
      "52WeekLow"?: number;
    };
  }

  const data = await fetchFinnhub<MetricData>("/stock/metric", {
    symbol: ticker.toUpperCase(),
    metric: "all",
  });

  if (!data?.metric) return null;

  const metrics = {
    pe: data.metric.peBasicExclExtraTTM || 0,
    eps: data.metric.epsBasicExclExtraItemsTTM || 0,
    beta: data.metric.beta || 1,
    high52Week: data.metric["52WeekHigh"] || 0,
    low52Week: data.metric["52WeekLow"] || 0,
  };

  cache.set(cacheKey, metrics, CACHE_TTL.FUNDAMENTALS);
  return metrics;
}
