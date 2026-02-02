/**
 * Yahoo Finance Provider
 * Uses yahoo-finance2 package for real market data (no API key required)
 */

import YahooFinance from "yahoo-finance2";
import type {
  Equity,
  Fundamentals,
  HistoricalPoint,
  NewsArticle,
  Index,
  Mover,
} from "../types";
import { cache, CACHE_TTL } from "./cache";

const yahooFinance = new YahooFinance();

/**
 * Get real-time quote for a ticker
 */
export async function getQuote(ticker: string): Promise<Equity | null> {
  const cacheKey = `quote:${ticker.toUpperCase()}`;
  const cached = cache.get<Equity>(cacheKey);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(ticker);
    if (!quote || !quote.regularMarketPrice) return null;

    const equity: Equity = {
      ticker: quote.symbol || ticker.toUpperCase(),
      name: quote.shortName || quote.longName || ticker,
      exchange: quote.exchange || "UNKNOWN",
      sector: quote.sector || "Unknown",
      industry: quote.industry || "Unknown",
      currency: quote.currency || "USD",
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      open: quote.regularMarketOpen || quote.regularMarketPrice,
      high: quote.regularMarketDayHigh || quote.regularMarketPrice,
      low: quote.regularMarketDayLow || quote.regularMarketPrice,
      volume: quote.regularMarketVolume || 0,
      avgVolume: quote.averageDailyVolume3Month || quote.averageDailyVolume10Day || 0,
      marketCap: quote.marketCap || 0,
      sharesOutstanding: quote.sharesOutstanding || 0,
      beta: quote.beta || 1,
      pe: quote.trailingPE || 0,
      eps: quote.trailingEps || 0,
      dividend: quote.dividendRate || 0,
      dividendYield: (quote.dividendYield || 0) * 100, // Convert to percentage
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, equity, CACHE_TTL.QUOTE);
    return equity;
  } catch (error) {
    console.error(`Yahoo Finance quote error for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get multiple quotes at once
 */
export async function getQuotes(tickers: string[]): Promise<Equity[]> {
  const results = await Promise.all(tickers.map((t) => getQuote(t)));
  return results.filter((r): r is Equity => r !== null);
}

/**
 * Get fundamentals using quoteSummary
 */
export async function getFundamentals(
  ticker: string
): Promise<Fundamentals | null> {
  const cacheKey = `fundamentals:${ticker.toUpperCase()}`;
  const cached = cache.get<Fundamentals>(cacheKey);
  if (cached) return cached;

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["financialData", "defaultKeyStatistics", "summaryDetail"],
    });

    const fd = summary.financialData;
    const ks = summary.defaultKeyStatistics;
    const sd = summary.summaryDetail;

    if (!fd && !ks && !sd) return null;

    // Helper to safely extract numeric values (yahoo-finance2 sometimes returns {} for missing data)
    const num = (val: unknown): number => (typeof val === "number" ? val : 0);

    const fundamentals: Fundamentals = {
      ticker: ticker.toUpperCase(),
      pe: num(sd?.trailingPE),
      forwardPe: num(sd?.forwardPE) || num(ks?.forwardPE),
      peg: num(ks?.pegRatio),
      eps: num(ks?.trailingEps),
      epsGrowth: num(ks?.earningsQuarterlyGrowth) * 100,
      revenue: num(fd?.totalRevenue),
      revenueGrowth: num(fd?.revenueGrowth) * 100,
      grossMargin: num(fd?.grossMargins) * 100,
      operatingMargin: num(fd?.operatingMargins) * 100,
      netMargin: num(fd?.profitMargins) * 100,
      ebitda: num(fd?.ebitda),
      debtToEquity: num(fd?.debtToEquity),
      currentRatio: num(fd?.currentRatio),
      quickRatio: num(fd?.quickRatio),
      roe: num(fd?.returnOnEquity) * 100,
      roa: num(fd?.returnOnAssets) * 100,
      freeCashFlow: num(fd?.freeCashflow),
      bookValue: num(ks?.bookValue),
      priceToBook: num(ks?.priceToBook) || num(sd?.priceToBook),
      priceToSales: num(sd?.priceToSalesTrailing12Months),
      dividendYield: num(sd?.dividendYield) * 100,
      payoutRatio: num(sd?.payoutRatio) * 100,
      ttm: true,
      fiscalYearEnd: "December", // Yahoo doesn't always provide this
    };

    cache.set(cacheKey, fundamentals, CACHE_TTL.FUNDAMENTALS);
    return fundamentals;
  } catch (error) {
    console.error(`Yahoo Finance fundamentals error for ${ticker}:`, error);
    return null;
  }
}

/**
 * Get historical price data
 */
export async function getHistoricalPrices(
  ticker: string,
  timeframe: "1D" | "1W" | "1M" | "1Y"
): Promise<HistoricalPoint[]> {
  const cacheKey = `historical:${ticker.toUpperCase()}:${timeframe}`;
  const cached = cache.get<HistoricalPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const now = new Date();
    let period1: Date;
    let interval: "1d" | "1wk" | "1mo" | "5m" | "15m" | "1h";

    switch (timeframe) {
      case "1D":
        period1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        interval = "5m";
        break;
      case "1W":
        period1 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        interval = "15m";
        break;
      case "1M":
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = "1d";
        break;
      case "1Y":
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = "1d";
        break;
      default:
        period1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        interval = "1d";
    }

    const chart = await yahooFinance.chart(ticker, {
      period1,
      period2: now,
      interval,
    });

    if (!chart.quotes || chart.quotes.length === 0) return [];

    const points: HistoricalPoint[] = chart.quotes
      .filter((q) => q.close !== null && q.close !== undefined)
      .map((q) => ({
        ts: q.date.toISOString(),
        open: q.open || q.close || 0,
        high: q.high || q.close || 0,
        low: q.low || q.close || 0,
        close: q.close || 0,
        volume: q.volume || 0,
      }));

    const ttl =
      timeframe === "1D"
        ? CACHE_TTL.HISTORICAL_1D
        : timeframe === "1W"
          ? CACHE_TTL.HISTORICAL_1W
          : timeframe === "1M"
            ? CACHE_TTL.HISTORICAL_1M
            : CACHE_TTL.HISTORICAL_1Y;

    cache.set(cacheKey, points, ttl);
    return points;
  } catch (error) {
    console.error(`Yahoo Finance historical error for ${ticker}:`, error);
    return [];
  }
}

/**
 * Generate sparkline data from historical prices
 */
export async function generateSparklineData(
  ticker: string,
  points = 20
): Promise<number[]> {
  const historical = await getHistoricalPrices(ticker, "1D");
  if (historical.length === 0) {
    // Try 1M data if 1D fails (markets might be closed)
    const monthlyData = await getHistoricalPrices(ticker, "1M");
    return monthlyData.slice(-points).map((p) => p.close);
  }
  return historical.slice(-points).map((p) => p.close);
}

/**
 * Search for securities
 */
export async function searchSecurities(
  query: string
): Promise<Array<{ ticker: string; name: string; type: string; exchange: string }>> {
  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = cache.get<
    Array<{ ticker: string; name: string; type: string; exchange: string }>
  >(cacheKey);
  if (cached) return cached;

  try {
    const results = await yahooFinance.search(query, {
      quotesCount: 20,
      newsCount: 0,
    });

    // Helper to safely extract string values (yahoo-finance2 sometimes returns {} for missing data)
    const str = (val: unknown): string => (typeof val === "string" ? val : "");

    const securities = results.quotes
      .filter((q) => "symbol" in q && typeof q.symbol === "string" && q.symbol)
      .map((q) => ({
        ticker: str(q.symbol),
        name: str("shortname" in q ? q.shortname : "") || str("longname" in q ? q.longname : "") || str(q.symbol),
        type: str("quoteType" in q ? q.quoteType : "") || "EQUITY",
        exchange: str("exchange" in q ? q.exchange : "") || "UNKNOWN",
      }));

    cache.set(cacheKey, securities, CACHE_TTL.SEARCH);
    return securities;
  } catch (error) {
    console.error(`Yahoo Finance search error for ${query}:`, error);
    return [];
  }
}

/**
 * Get screener results (gainers, losers, most active, etc.)
 */
export async function getScreenerResults(
  screenerId:
    | "day_gainers"
    | "day_losers"
    | "most_actives"
    | "undervalued_large_caps"
    | "growth_technology_stocks",
  count = 10
): Promise<Mover[]> {
  const cacheKey = `screener:${screenerId}:${count}`;
  const cached = cache.get<Mover[]>(cacheKey);
  if (cached) return cached;

  try {
    const results = await yahooFinance.screener({ scrIds: screenerId, count });

    const movers: Mover[] = results.quotes.map((q) => ({
      ticker: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      volume: q.regularMarketVolume || 0,
    }));

    cache.set(cacheKey, movers, CACHE_TTL.SCREENER);
    return movers;
  } catch (error) {
    console.error(`Yahoo Finance screener error for ${screenerId}:`, error);
    return [];
  }
}

/**
 * Get index quotes (S&P 500, Dow, Nasdaq)
 */
export async function getIndices(): Promise<Index[]> {
  const cacheKey = "indices";
  const cached = cache.get<Index[]>(cacheKey);
  if (cached) return cached;

  const indexSymbols = ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"];
  const indexNames: Record<string, string> = {
    "^GSPC": "S&P 500",
    "^DJI": "Dow Jones",
    "^IXIC": "NASDAQ",
    "^RUT": "Russell 2000",
    "^VIX": "VIX",
  };

  try {
    const quotes = await yahooFinance.quote(indexSymbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const indices: Index[] = quotesArray
      .filter((q) => q && q.regularMarketPrice)
      .map((q) => ({
        symbol: q.symbol || "",
        name: indexNames[q.symbol || ""] || q.shortName || q.symbol || "",
        value: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        open: q.regularMarketOpen || q.regularMarketPrice || 0,
        high: q.regularMarketDayHigh || q.regularMarketPrice || 0,
        low: q.regularMarketDayLow || q.regularMarketPrice || 0,
        previousClose: q.regularMarketPreviousClose || 0,
        ytdChange: q.ytdReturn || 0,
        lastUpdated: new Date().toISOString(),
      }));

    cache.set(cacheKey, indices, CACHE_TTL.QUOTE);
    return indices;
  } catch (error) {
    console.error("Yahoo Finance indices error:", error);
    return [];
  }
}

/**
 * Apply numeric filters to equities
 */
function applyNumericFilters(
  equities: Equity[],
  filters: {
    minMarketCap?: number;
    maxMarketCap?: number;
    minPe?: number;
    maxPe?: number;
    minDividendYield?: number;
    maxDividendYield?: number;
  }
): Equity[] {
  return equities.filter((e) => {
    if (filters.minMarketCap && e.marketCap < filters.minMarketCap) return false;
    if (filters.maxMarketCap && e.marketCap > filters.maxMarketCap) return false;
    if (filters.minPe && e.pe > 0 && e.pe < filters.minPe) return false;
    if (filters.maxPe && e.pe > 0 && e.pe > filters.maxPe) return false;
    if (filters.minDividendYield && e.dividendYield < filters.minDividendYield) return false;
    if (filters.maxDividendYield && e.dividendYield > filters.maxDividendYield) return false;
    return true;
  });
}

/**
 * Screen equities with filters using Finviz -> FMP -> Yahoo fallback chain
 *
 * LLM can pass simple sector names like "energy", "tech", "healthcare"
 * The system handles normalization and provider fallback automatically.
 */
export async function screenEquities(filters: {
  sector?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  limit?: number;
}): Promise<Equity[]> {
  // Import providers dynamically to avoid circular dependencies
  const { getFinvizTickers } = await import("./finviz");
  const { getFmpScreenerResults } = await import("./fmp");

  const cacheKey = `screen:${JSON.stringify(filters)}`;
  const cached = cache.get<Equity[]>(cacheKey);
  if (cached) {
    console.log("[Screener] Cache hit");
    return cached;
  }

  const limit = filters.limit || 25;
  let results: Equity[] = [];
  let source = "none";

  // STEP 1: Try Finviz (primary - no API key needed)
  console.log("[Screener] Step 1: Trying Finviz...");
  try {
    const finvizTickers = await getFinvizTickers({
      ...filters,
      limit: limit + 10, // Get extra in case some fail quote lookup
    });

    if (finvizTickers.length > 0) {
      console.log(`[Screener] Finviz returned ${finvizTickers.length} tickers`);
      const equities = await getQuotes(finvizTickers.slice(0, limit + 10));
      results = applyNumericFilters(equities, filters).slice(0, limit);
      source = "finviz";

      if (results.length > 0) {
        console.log(`[Screener] Finviz success: ${results.length} results`);
        cache.set(cacheKey, results, CACHE_TTL.SCREENER);
        return results;
      }
    }
  } catch (error) {
    console.error("[Screener] Finviz error:", error);
  }

  // STEP 2: Finviz failed or empty, try FMP (fallback - needs API key)
  console.log("[Screener] Step 2: Trying FMP...");
  try {
    const fmpResults = await getFmpScreenerResults({
      ...filters,
      limit: limit + 10,
    });

    if (fmpResults.length > 0) {
      results = applyNumericFilters(fmpResults, filters).slice(0, limit);
      source = "fmp";

      if (results.length > 0) {
        console.log(`[Screener] FMP success: ${results.length} results`);
        cache.set(cacheKey, results, CACHE_TTL.SCREENER);
        return results;
      }
    }
  } catch (error) {
    console.error("[Screener] FMP error:", error);
  }

  // STEP 3: All external sources failed, fall back to Yahoo trending
  console.log("[Screener] Step 3: Falling back to Yahoo trending...");
  try {
    const [gainers, losers, active] = await Promise.all([
      getScreenerResults("day_gainers", 25),
      getScreenerResults("day_losers", 25),
      getScreenerResults("most_actives", 25),
    ]);

    // Combine and deduplicate tickers
    const allTickers = [
      ...new Set([
        ...gainers.map((m) => m.ticker),
        ...losers.map((m) => m.ticker),
        ...active.map((m) => m.ticker),
      ]),
    ];

    // Get full quotes
    const equities = await getQuotes(allTickers.slice(0, 50));

    // Apply all filters including sector (exact match for Yahoo data)
    const filtered = equities.filter((e) => {
      // For sector, do case-insensitive partial match
      if (filters.sector) {
        const sectorLower = filters.sector.toLowerCase();
        const equitySectorLower = (e.sector || "").toLowerCase();
        if (!equitySectorLower.includes(sectorLower) && !sectorLower.includes(equitySectorLower)) {
          return false;
        }
      }
      return true;
    });

    results = applyNumericFilters(filtered, filters).slice(0, limit);
    source = "yahoo-trending";

    if (results.length > 0) {
      console.log(`[Screener] Yahoo fallback: ${results.length} results`);
    } else {
      console.warn("[Screener] Yahoo fallback returned no matching results");
    }
  } catch (error) {
    console.error("[Screener] Yahoo fallback error:", error);
  }

  // Cache whatever we got (even empty) to avoid hammering APIs
  cache.set(cacheKey, results, CACHE_TTL.SCREENER);

  console.log(`[Screener] Final: ${results.length} results from ${source}`);
  return results;
}
