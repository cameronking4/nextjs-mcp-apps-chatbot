/**
 * Finnhub Provider
 * Uses Finnhub API for news with sentiment and earnings calendar
 */

import type {
  NewsArticle,
  EarningsEvent,
  AnalystRatings,
  InsiderTransaction,
  CompanyPeers,
  EconomicEvent,
  PriceTarget,
  SupplyChainData,
  IpoEvent,
} from "../types";
import { cache, CACHE_TTL } from "./cache";

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || "";
const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export function isFinnhubConfigured(): boolean {
  return Boolean(FINNHUB_API_KEY);
}

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

interface FinnhubRecommendation {
  period: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
}

interface FinnhubInsiderTransactionItem {
  name: string;
  share: number;
  change: number;
  transactionDate: string;
  transactionCode: string;
  transactionPrice: number;
  currency?: string;
}

interface FinnhubIpoCalendarResponse {
  ipoCalendar?: Array<{
    symbol: string;
    companyName: string;
    date: string;
    price: string;
    numberOfShares: number;
    totalSharesValue: number;
    exchange: string;
  }>;
}

interface FinnhubEconomicCalendarResponse {
  economicCalendar?: Array<{
    actual: number | null;
    country: string;
    estimate: number | null;
    event: string;
    impact: "high" | "medium" | "low";
    previous: number | null;
    time: string;
    unit?: string;
  }>;
}

interface FinnhubSupplyChainResponse {
  data?: Array<{
    symbol: string;
    suppliers?: Array<{ name: string; symbol?: string; proportion?: number }>;
    customers?: Array<{ name: string; symbol?: string; proportion?: number }>;
  }>;
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
 * Analyze sentiment from headline/summary text with score
 * Returns both categorical sentiment and numeric score (-1 to 1)
 */
function analyzeSentimentWithScore(text: string): { 
  sentiment: "bullish" | "bearish" | "neutral" | "mixed"; 
  score: number;
} {
  const lowerText = text.toLowerCase();
  
  // Weighted keywords for better sentiment detection
  const bullishKeywords: Record<string, number> = {
    "surge": 0.8, "soar": 0.9, "rally": 0.7, "gain": 0.5, "rise": 0.4, 
    "jump": 0.6, "climb": 0.5, "bullish": 0.9, "outperform": 0.7, 
    "beat": 0.6, "upgrade": 0.7, "strong": 0.5, "growth": 0.5, 
    "profit": 0.6, "record": 0.7, "breakthrough": 0.8, "innovation": 0.5,
    "optimistic": 0.6, "positive": 0.5, "buy": 0.6, "boom": 0.8,
    "breakout": 0.7, "bullrun": 0.9, "upside": 0.6, "momentum": 0.5
  };
  
  const bearishKeywords: Record<string, number> = {
    "fall": 0.5, "drop": 0.6, "decline": 0.5, "plunge": 0.8, "crash": 0.9,
    "bearish": 0.9, "miss": 0.6, "downgrade": 0.7, "weak": 0.5, 
    "loss": 0.6, "concern": 0.4, "warning": 0.5, "risk": 0.4, 
    "sell": 0.6, "cut": 0.5, "layoff": 0.7, "recession": 0.8,
    "negative": 0.5, "disappointing": 0.6, "slump": 0.7, "tumble": 0.7,
    "selloff": 0.8, "downturn": 0.7, "crisis": 0.8, "fear": 0.6
  };
  
  let bullishScore = 0;
  let bearishScore = 0;
  let bullishCount = 0;
  let bearishCount = 0;
  
  for (const [word, weight] of Object.entries(bullishKeywords)) {
    if (lowerText.includes(word)) {
      bullishScore += weight;
      bullishCount++;
    }
  }
  
  for (const [word, weight] of Object.entries(bearishKeywords)) {
    if (lowerText.includes(word)) {
      bearishScore += weight;
      bearishCount++;
    }
  }
  
  // Calculate normalized score (-1 to 1)
  const totalScore = bullishScore - bearishScore;
  const maxPossible = Math.max(bullishScore + bearishScore, 1);
  const normalizedScore = Math.max(-1, Math.min(1, totalScore / maxPossible));
  
  // Determine categorical sentiment
  let sentiment: "bullish" | "bearish" | "neutral" | "mixed";
  if (bullishCount > 0 && bearishCount > 0) {
    sentiment = "mixed";
  } else if (bullishScore > bearishScore) {
    sentiment = "bullish";
  } else if (bearishScore > bullishScore) {
    sentiment = "bearish";
  } else {
    sentiment = "neutral";
  }
  
  return { sentiment, score: Number(normalizedScore.toFixed(2)) };
}

/**
 * Legacy function for backward compatibility
 */
function analyzeSentiment(text: string): "bullish" | "bearish" | "neutral" | "mixed" {
  return analyzeSentimentWithScore(text).sentiment;
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
    from?: string; // YYYY-MM-DD format
    to?: string; // YYYY-MM-DD format
    days?: number; // Alternative: number of days back
  }
): Promise<NewsArticle[]> {
  // Calculate date range
  const toDate = options?.to ? new Date(options.to) : new Date();
  let fromDate: Date;
  
  if (options?.from) {
    fromDate = new Date(options.from);
  } else if (options?.days) {
    fromDate = new Date(toDate.getTime() - options.days * 24 * 60 * 60 * 1000);
  } else {
    // Default: last 30 days (increased from 7)
    fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const fromStr = fromDate.toISOString().split("T")[0];
  const toStr = toDate.toISOString().split("T")[0];
  
  const cacheKey = `news:company:${ticker.toUpperCase()}:${fromStr}:${toStr}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) {
    // Apply filters to cached data
    return applyNewsFilters(cached, options);
  }

  // Use calculated date range
  const to = toDate;
  const from = fromDate;
  
  const data = await fetchFinnhub<FinnhubNewsItem[]>("/company-news", {
    symbol: ticker.toUpperCase(),
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  });

  if (!data || !Array.isArray(data)) return [];

  const articles: NewsArticle[] = data.slice(0, 100).map((item, index) => {
    const sentimentResult = analyzeSentimentWithScore(item.headline + " " + item.summary);
    return {
      id: `finnhub-${item.id || index}`,
      headline: item.headline,
      summary: item.summary,
      body: "", // Finnhub doesn't provide full body - use news_article tool to fetch via Firecrawl
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      tickers: item.related ? item.related.split(",").map(t => t.trim()) : [ticker.toUpperCase()],
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      tags: [item.category].filter(Boolean),
      importance: determineImportance(item),
      url: item.url,
      imageUrl: item.image || undefined,
    };
  });

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
    category?: "general" | "forex" | "crypto" | "merger";
  }
): Promise<NewsArticle[]> {
  const category = options?.category || "general";
  const cacheKey = `news:market:${category}`;
  const cached = cache.get<NewsArticle[]>(cacheKey);
  if (cached) {
    return applyNewsFilters(cached, options);
  }

  const data = await fetchFinnhub<FinnhubNewsItem[]>("/news", {
    category,
  });

  if (!data || !Array.isArray(data)) return [];

  const articles: NewsArticle[] = data.slice(0, 100).map((item, index) => {
    const sentimentResult = analyzeSentimentWithScore(item.headline + " " + item.summary);
    return {
      id: `finnhub-market-${item.id || index}`,
      headline: item.headline,
      summary: item.summary,
      body: "", // Use news_article tool to fetch via Firecrawl
      source: item.source,
      publishedAt: new Date(item.datetime * 1000).toISOString(),
      tickers: item.related ? item.related.split(",").map(t => t.trim()) : [],
      sentiment: sentimentResult.sentiment,
      sentimentScore: sentimentResult.score,
      tags: ["market", item.category].filter(Boolean),
      importance: determineImportance(item),
      url: item.url,
      imageUrl: item.image || undefined,
    };
  });

  cache.set(cacheKey, articles, CACHE_TTL.NEWS);
  return applyNewsFilters(articles, options);
}

// ============================================
// New Bloomberg MCP Provider Functions
// ============================================

export async function getAnalystRecommendations(ticker: string): Promise<AnalystRatings | null> {
  const cacheKey = `finnhub:analyst:${ticker.toUpperCase()}`;
  const cached = cache.get<AnalystRatings>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<FinnhubRecommendation[]>("/stock/recommendation", {
    symbol: ticker.toUpperCase(),
  });

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const latest = data[0];
  const total =
    latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell;
  const score =
    total > 0
      ? (latest.strongBuy * 1 +
          latest.buy * 2 +
          latest.hold * 3 +
          latest.sell * 4 +
          latest.strongSell * 5) /
        total
      : 3;

  let consensus: AnalystRatings["consensus"] = "Hold";
  if (score <= 1.5) consensus = "Strong Buy";
  else if (score <= 2.5) consensus = "Buy";
  else if (score <= 3.5) consensus = "Hold";
  else if (score <= 4.5) consensus = "Sell";
  else consensus = "Strong Sell";

  const ratings: AnalystRatings = {
    ticker: ticker.toUpperCase(),
    strongBuy: latest.strongBuy,
    buy: latest.buy,
    hold: latest.hold,
    sell: latest.sell,
    strongSell: latest.strongSell,
    consensus,
    numberOfAnalysts: total,
  };

  cache.set(cacheKey, ratings, CACHE_TTL.FUNDAMENTALS);
  return ratings;
}

export async function getInsiderTransactions(
  ticker: string,
  from?: string,
  to?: string
): Promise<InsiderTransaction[]> {
  const cacheKey = `finnhub:insider:${ticker.toUpperCase()}:${from || "start"}:${to || "now"}`;
  const cached = cache.get<InsiderTransaction[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<{ data: FinnhubInsiderTransactionItem[] }>(
    "/stock/insider-transactions",
    {
      symbol: ticker.toUpperCase(),
      from: from || "",
      to: to || "",
    }
  );

  if (!data || !Array.isArray(data.data)) return [];

  const transactions: InsiderTransaction[] = data.data.map((item) => ({
    name: item.name || "Insider",
    title: "Insider",
    transactionDate: item.transactionDate,
    transactionType: item.change >= 0 ? "Buy" : "Sell",
    shares: Math.abs(item.share),
    pricePerShare: item.transactionPrice || 0,
    totalValue: Math.abs(item.share) * (item.transactionPrice || 0),
    sharesOwned: 0,
  }));

  cache.set(cacheKey, transactions, CACHE_TTL.FUNDAMENTALS);
  return transactions;
}

export async function getCompanyPeers(ticker: string): Promise<CompanyPeers | null> {
  const cacheKey = `finnhub:peers:${ticker.toUpperCase()}`;
  const cached = cache.get<CompanyPeers>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<string[]>("/stock/peers", {
    symbol: ticker.toUpperCase(),
  });

  if (!data || !Array.isArray(data)) return null;

  const result: CompanyPeers = {
    ticker: ticker.toUpperCase(),
    peers: data.filter((p) => typeof p === "string"),
  };

  cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
  return result;
}

export async function getEconomicCalendar(
  country: string = "US",
  from?: string,
  to?: string
): Promise<EconomicEvent[]> {
  const cacheKey = `finnhub:economic:${country}:${from || "start"}:${to || "now"}`;
  const cached = cache.get<EconomicEvent[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<FinnhubEconomicCalendarResponse>("/calendar/economic", {
    from: from || "",
    to: to || "",
    country,
  });

  const events: EconomicEvent[] = (data?.economicCalendar || []).map((event, idx) => ({
    id: `${country}-${event.event}-${event.time}-${idx}`,
    country: event.country,
    event: event.event,
    date: event.time,
    actual: event.actual ?? null,
    estimate: event.estimate ?? undefined,
    previous: event.previous ?? undefined,
    impact: event.impact,
    unit: event.unit,
  }));

  cache.set(cacheKey, events, CACHE_TTL.FUNDAMENTALS);
  return events;
}

export async function getPriceTargets(ticker: string): Promise<PriceTarget | null> {
  const cacheKey = `finnhub:price-target:${ticker.toUpperCase()}`;
  const cached = cache.get<PriceTarget>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<{
    targetHigh: number;
    targetLow: number;
    targetMean: number;
    targetMedian: number;
    lastUpdated: string;
    numberOfAnalysts: number;
  }>("/stock/price-target", {
    symbol: ticker.toUpperCase(),
  });

  if (!data) return null;

  const result: PriceTarget = {
    ticker: ticker.toUpperCase(),
    targetHigh: data.targetHigh,
    targetLow: data.targetLow,
    targetMean: data.targetMean,
    targetMedian: data.targetMedian,
    numberOfAnalysts: data.numberOfAnalysts,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };

  cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
  return result;
}

export async function getSupplyChain(ticker: string): Promise<SupplyChainData | null> {
  const cacheKey = `finnhub:supply-chain:${ticker.toUpperCase()}`;
  const cached = cache.get<SupplyChainData>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<FinnhubSupplyChainResponse>("/stock/supply-chain", {
    symbol: ticker.toUpperCase(),
  });

  const entry = data?.data?.[0];
  if (!entry) return null;

  const suppliers = (entry.suppliers || []).map((s) => ({
    name: s.name,
    ticker: s.symbol,
    exposure: s.proportion || 0,
  }));

  const customers = (entry.customers || []).map((c) => ({
    name: c.name,
    ticker: c.symbol,
    exposure: c.proportion || 0,
  }));

  const result: SupplyChainData = {
    ticker: entry.symbol || ticker.toUpperCase(),
    suppliers,
    customers,
  };

  cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
  return result;
}

export async function getIpoCalendar(from?: string, to?: string): Promise<IpoEvent[]> {
  const cacheKey = `finnhub:ipo:${from || "start"}:${to || "now"}`;
  const cached = cache.get<IpoEvent[]>(cacheKey);
  if (cached) return cached;

  const data = await fetchFinnhub<FinnhubIpoCalendarResponse>("/calendar/ipo", {
    from: from || "",
    to: to || "",
  });

  const events: IpoEvent[] = (data?.ipoCalendar || []).map((ipo) => ({
    ticker: ipo.symbol,
    company: ipo.companyName,
    date: ipo.date,
    priceRange: ipo.price,
    shares: ipo.numberOfShares,
    expectedValue: ipo.totalSharesValue,
    exchange: ipo.exchange,
  }));

  cache.set(cacheKey, events, CACHE_TTL.FUNDAMENTALS);
  return events;
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
