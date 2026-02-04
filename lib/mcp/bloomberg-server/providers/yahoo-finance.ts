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
  OptionsChain,
  OptionContract,
  UnusualOptionsActivity,
  AnalystRatings,
  PriceTarget,
  InsiderTransaction,
  InsiderSummary,
  InstitutionalOwnership,
  InstitutionalHolder,
  EsgScores,
  ForexQuote,
  CommodityPrice,
  EtfHoldings,
  EtfHolding,
  EtfSectorBreakdown,
  DividendEvent,
  DividendHistory,
  StockSplit,
} from "../types";
import { cache, CACHE_TTL } from "./cache";

const yahooFinance = new YahooFinance();

const toNumber = (val: unknown): number => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = Number(val);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toIsoDate = (val: unknown): string => {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "number") {
    const ms = val < 1e12 ? val * 1000 : val;
    return new Date(ms).toISOString();
  }
  if (typeof val === "string") {
    const date = new Date(val);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString();
  }
  return "";
};

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
 * Timeframe type for historical data
 */
export type HistoricalTimeframe = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y" | "5Y" | "YTD";

/**
 * Get historical price data with extended timeframe support
 */
export async function getHistoricalPrices(
  ticker: string,
  timeframe: HistoricalTimeframe
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
      case "3M":
        period1 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        interval = "1d";
        break;
      case "6M":
        period1 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        interval = "1d";
        break;
      case "1Y":
        period1 = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        interval = "1d";
        break;
      case "5Y":
        period1 = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        interval = "1wk";
        break;
      case "YTD":
        period1 = new Date(now.getFullYear(), 0, 1); // January 1st of current year
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

    // Cache TTL based on timeframe
    const ttl =
      timeframe === "1D"
        ? CACHE_TTL.HISTORICAL_1D
        : timeframe === "1W"
          ? CACHE_TTL.HISTORICAL_1W
          : timeframe === "1M" || timeframe === "3M" || timeframe === "YTD"
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
 * Get 52-week high/low for a ticker
 */
export async function get52WeekRange(ticker: string): Promise<{ high: number; low: number } | null> {
  const cacheKey = `52week:${ticker.toUpperCase()}`;
  const cached = cache.get<{ high: number; low: number }>(cacheKey);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(ticker);
    if (!quote) return null;

    const result = {
      high: quote.fiftyTwoWeekHigh || 0,
      low: quote.fiftyTwoWeekLow || 0,
    };

    cache.set(cacheKey, result, CACHE_TTL.QUOTE);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance 52-week error for ${ticker}:`, error);
    return null;
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

// ============================================
// New Bloomberg MCP Tools
// ============================================

export async function getAnalystRatings(ticker: string): Promise<AnalystRatings | null> {
  const cacheKey = `analyst:ratings:${ticker.toUpperCase()}`;
  const cached = cache.get<AnalystRatings>(cacheKey);
  if (cached) return cached;

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["recommendationTrend", "financialData"],
    });

    const trend = summary.recommendationTrend?.trend?.[0] || {};
    const strongBuy = toNumber(trend.strongBuy);
    const buy = toNumber(trend.buy);
    const hold = toNumber(trend.hold);
    const sell = toNumber(trend.sell);
    const strongSell = toNumber(trend.strongSell);

    const total = strongBuy + buy + hold + sell + strongSell;
    const recommendationKey = typeof summary.financialData?.recommendationKey === "string"
      ? summary.financialData.recommendationKey
      : "";

    let consensus: AnalystRatings["consensus"] = "Hold";
    const keyMap: Record<string, AnalystRatings["consensus"]> = {
      strong_buy: "Strong Buy",
      buy: "Buy",
      hold: "Hold",
      sell: "Sell",
      strong_sell: "Strong Sell",
    };

    if (recommendationKey && keyMap[recommendationKey]) {
      consensus = keyMap[recommendationKey];
    } else if (total > 0) {
      const score =
        (strongBuy * 1 + buy * 2 + hold * 3 + sell * 4 + strongSell * 5) / total;
      if (score <= 1.5) consensus = "Strong Buy";
      else if (score <= 2.5) consensus = "Buy";
      else if (score <= 3.5) consensus = "Hold";
      else if (score <= 4.5) consensus = "Sell";
      else consensus = "Strong Sell";
    }

    const ratings: AnalystRatings = {
      ticker: ticker.toUpperCase(),
      strongBuy,
      buy,
      hold,
      sell,
      strongSell,
      consensus,
      priceTarget: toNumber(summary.financialData?.targetMeanPrice),
      numberOfAnalysts: total || toNumber(summary.financialData?.numberOfAnalystOpinions),
    };

    cache.set(cacheKey, ratings, CACHE_TTL.FUNDAMENTALS);
    return ratings;
  } catch (error) {
    console.error(`Yahoo Finance analyst ratings error for ${ticker}:`, error);
    return null;
  }
}

export async function getInsiderTransactions(
  ticker: string,
  limit = 50
): Promise<{ transactions: InsiderTransaction[]; summary: InsiderSummary }> {
  const cacheKey = `insider:transactions:${ticker.toUpperCase()}:${limit}`;
  const cached = cache.get<{ transactions: InsiderTransaction[]; summary: InsiderSummary }>(
    cacheKey
  );
  if (cached) return cached;

  const summaryResult: InsiderSummary = {
    netShares: 0,
    netValue: 0,
    buys: 0,
    sells: 0,
  };

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["insiderTransactions"],
    });

    const raw = summary.insiderTransactions?.transactions || [];
    const transactions: InsiderTransaction[] = raw.slice(0, limit).map((t: any) => {
      const transactionText = typeof t.transactionText === "string" ? t.transactionText : "";
      const normalizedText = transactionText.toLowerCase();
      let transactionType: InsiderTransaction["transactionType"] = "Other";
      if (normalizedText.includes("purchase") || normalizedText.includes("buy")) transactionType = "Buy";
      else if (normalizedText.includes("sale") || normalizedText.includes("sell")) transactionType = "Sell";
      else if (normalizedText.includes("exercise")) transactionType = "Option Exercise";
      else if (normalizedText.includes("gift")) transactionType = "Gift";

      const shares = toNumber(t.shares);
      const totalValue = toNumber(t.value);
      const pricePerShare = shares > 0 ? totalValue / shares : toNumber(t.price);

      if (transactionType === "Buy") {
        summaryResult.buys += 1;
        summaryResult.netShares += shares;
        summaryResult.netValue += totalValue;
      } else if (transactionType === "Sell") {
        summaryResult.sells += 1;
        summaryResult.netShares -= shares;
        summaryResult.netValue -= totalValue;
      }

      return {
        name: t.filerName || t.insider?.name || "Unknown",
        title: t.filerRelation || t.insider?.title || "Insider",
        transactionDate: toIsoDate(t.startDate) || toIsoDate(t.transactionDate),
        transactionType,
        shares,
        pricePerShare,
        totalValue,
        sharesOwned: toNumber(t.sharesOwnedFollowingTransaction || t.sharesOwned),
      };
    });

    const result = { transactions, summary: summaryResult };
    cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance insider transactions error for ${ticker}:`, error);
    return { transactions: [], summary: summaryResult };
  }
}

export async function getInstitutionalOwnership(
  ticker: string
): Promise<InstitutionalOwnership | null> {
  const cacheKey = `institutional:${ticker.toUpperCase()}`;
  const cached = cache.get<InstitutionalOwnership>(cacheKey);
  if (cached) return cached;

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["institutionOwnership"],
    });

    const list = summary.institutionOwnership?.ownershipList || [];
    const holders: InstitutionalHolder[] = list.map((holder: any) => ({
      name: holder.organization || holder.holder || "Unknown",
      shares: toNumber(holder.position),
      value: toNumber(holder.value),
      percentOwned: toNumber(holder.pctHeld) * 100,
      dateReported: toIsoDate(holder.reportDate),
    }));

    const totalShares = holders.reduce((sum, h) => sum + h.shares, 0);
    const totalValue = holders.reduce((sum, h) => sum + h.value, 0);
    const percentOwned = holders.reduce((sum, h) => sum + h.percentOwned, 0);

    const ownership: InstitutionalOwnership = {
      ticker: ticker.toUpperCase(),
      totalShares,
      totalValue,
      percentOwned,
      holders,
    };

    cache.set(cacheKey, ownership, CACHE_TTL.FUNDAMENTALS);
    return ownership;
  } catch (error) {
    console.error(`Yahoo Finance institutional ownership error for ${ticker}:`, error);
    return null;
  }
}

export async function getOptionsChain(
  ticker: string,
  expiration?: string
): Promise<OptionsChain | null> {
  const cacheKey = `options:${ticker.toUpperCase()}:${expiration || "all"}`;
  const cached = cache.get<OptionsChain>(cacheKey);
  if (cached) return cached;

  try {
    const optionsResult = await yahooFinance.options(ticker, expiration
      ? { date: new Date(expiration) }
      : undefined
    );

    const expirationDates = (optionsResult.expirationDates || []).map((d) =>
      toIsoDate(d).split("T")[0]
    );
    const optionSet = optionsResult.options?.[0];
    if (!optionSet) return null;

    const toContract = (opt: any): OptionContract => ({
      strike: toNumber(opt.strike),
      last: toNumber(opt.lastPrice),
      bid: toNumber(opt.bid),
      ask: toNumber(opt.ask),
      volume: toNumber(opt.volume),
      openInterest: toNumber(opt.openInterest),
      impliedVolatility: toNumber(opt.impliedVolatility),
      delta: typeof opt.delta === "number" ? opt.delta : undefined,
      gamma: typeof opt.gamma === "number" ? opt.gamma : undefined,
      theta: typeof opt.theta === "number" ? opt.theta : undefined,
      vega: typeof opt.vega === "number" ? opt.vega : undefined,
      inTheMoney: Boolean(opt.inTheMoney),
    });

    const chain: OptionsChain = {
      ticker: ticker.toUpperCase(),
      expiration: toIsoDate(optionSet.expirationDate).split("T")[0],
      calls: (optionSet.calls || []).map(toContract),
      puts: (optionSet.puts || []).map(toContract),
      underlyingPrice: toNumber(optionsResult.quote?.regularMarketPrice),
      availableExpirations: expirationDates,
    };

    cache.set(cacheKey, chain, CACHE_TTL.QUOTE);
    return chain;
  } catch (error) {
    console.error(`Yahoo Finance options chain error for ${ticker}:`, error);
    return null;
  }
}

export async function getUnusualOptionsActivity(
  ticker: string,
  minVolume = 1000
): Promise<UnusualOptionsActivity[]> {
  const cacheKey = `options:unusual:${ticker.toUpperCase()}:${minVolume}`;
  const cached = cache.get<UnusualOptionsActivity[]>(cacheKey);
  if (cached) return cached;

  try {
    const optionsResult = await yahooFinance.options(ticker);
    const underlying = toNumber(optionsResult.quote?.regularMarketPrice);
    const unusual: UnusualOptionsActivity[] = [];

    for (const expiry of optionsResult.options || []) {
      const expiration = toIsoDate(expiry.expirationDate).split("T")[0];
      const pushOption = (opt: any, type: "call" | "put") => {
        const volume = toNumber(opt.volume);
        const openInterest = toNumber(opt.openInterest);
        if (volume < minVolume) return;
        const ratio = openInterest > 0 ? volume / openInterest : volume;
        const unusualScore = ratio * Math.log10(volume + 1);
        unusual.push({
          ticker: ticker.toUpperCase(),
          strike: toNumber(opt.strike),
          expiration,
          type,
          volume,
          openInterest,
          volumeOiRatio: ratio,
          unusualScore,
          lastPrice: toNumber(opt.lastPrice) || underlying,
        });
      };

      for (const call of expiry.calls || []) pushOption(call, "call");
      for (const put of expiry.puts || []) pushOption(put, "put");
    }

    unusual.sort((a, b) => b.unusualScore - a.unusualScore);
    const result = unusual.slice(0, 50);
    cache.set(cacheKey, result, CACHE_TTL.QUOTE);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance unusual options error for ${ticker}:`, error);
    return [];
  }
}

export async function getEsgScores(ticker: string): Promise<EsgScores | null> {
  const cacheKey = `esg:${ticker.toUpperCase()}`;
  const cached = cache.get<EsgScores>(cacheKey);
  if (cached) return cached;

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["esgScores"],
    });

    const scores = summary.esgScores;
    if (!scores) return null;

    const lastUpdated =
      typeof scores.ratingYear === "number"
        ? new Date(scores.ratingYear, 0, 1).toISOString()
        : new Date().toISOString();

    const result: EsgScores = {
      ticker: ticker.toUpperCase(),
      totalScore: toNumber(scores.totalEsg),
      environmentScore: toNumber(scores.environmentScore),
      socialScore: toNumber(scores.socialScore),
      governanceScore: toNumber(scores.governanceScore),
      controversyLevel: toNumber(scores.controversyLevel),
      peerGroup: scores.peerGroup || "Unknown",
      peerAverage: toNumber(scores.peerGroupAvg),
      lastUpdated,
    };

    cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance ESG scores error for ${ticker}:`, error);
    return null;
  }
}

export async function getForexQuote(pair: string): Promise<ForexQuote | null> {
  const normalized = pair.toUpperCase().replace("/", "").replace("-", "");
  const symbol = normalized.endsWith("=X") ? normalized : `${normalized}=X`;
  const cacheKey = `forex:${symbol}`;
  const cached = cache.get<ForexQuote>(cacheKey);
  if (cached) return cached;

  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote || quote.regularMarketPrice === undefined) return null;

    const result: ForexQuote = {
      pair: normalized.includes("=X") ? normalized.replace("=X", "") : normalized,
      rate: toNumber(quote.regularMarketPrice),
      bid: toNumber(quote.bid),
      ask: toNumber(quote.ask),
      change: toNumber(quote.regularMarketChange),
      changePercent: toNumber(quote.regularMarketChangePercent),
      high: toNumber(quote.regularMarketDayHigh),
      low: toNumber(quote.regularMarketDayLow),
      timestamp: new Date().toISOString(),
    };

    cache.set(cacheKey, result, CACHE_TTL.QUOTE);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance forex quote error for ${pair}:`, error);
    return null;
  }
}

const COMMODITY_MAP: Record<string, { symbol: string; name: string; category: CommodityPrice["category"]; unit: string }> = {
  gold: { symbol: "GC=F", name: "Gold", category: "metals", unit: "USD/oz" },
  silver: { symbol: "SI=F", name: "Silver", category: "metals", unit: "USD/oz" },
  copper: { symbol: "HG=F", name: "Copper", category: "metals", unit: "USD/lb" },
  platinum: { symbol: "PL=F", name: "Platinum", category: "metals", unit: "USD/oz" },
  oil: { symbol: "CL=F", name: "Crude Oil", category: "energy", unit: "USD/bbl" },
  wti: { symbol: "CL=F", name: "Crude Oil", category: "energy", unit: "USD/bbl" },
  brent: { symbol: "BZ=F", name: "Brent Oil", category: "energy", unit: "USD/bbl" },
  gas: { symbol: "NG=F", name: "Natural Gas", category: "energy", unit: "USD/MMBtu" },
  naturalgas: { symbol: "NG=F", name: "Natural Gas", category: "energy", unit: "USD/MMBtu" },
  corn: { symbol: "ZC=F", name: "Corn", category: "agriculture", unit: "USD/bushel" },
  wheat: { symbol: "ZW=F", name: "Wheat", category: "agriculture", unit: "USD/bushel" },
  soybeans: { symbol: "ZS=F", name: "Soybeans", category: "agriculture", unit: "USD/bushel" },
  coffee: { symbol: "KC=F", name: "Coffee", category: "agriculture", unit: "USD/lb" },
  sugar: { symbol: "SB=F", name: "Sugar", category: "agriculture", unit: "USD/lb" },
};

export async function getCommodityPrices(
  commodities: string[]
): Promise<CommodityPrice[]> {
  const normalized = commodities.length > 0 ? commodities : Object.keys(COMMODITY_MAP);
  const symbols = normalized.map((c) => {
    const key = c.toLowerCase().replace(/\s+/g, "");
    return COMMODITY_MAP[key]?.symbol || c;
  });

  const cacheKey = `commodities:${symbols.join(",")}`;
  const cached = cache.get<CommodityPrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const quotes = await yahooFinance.quote(symbols);
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    const results: CommodityPrice[] = quotesArray.map((q) => {
      const symbol = q.symbol || "";
      const mapEntry = Object.values(COMMODITY_MAP).find((m) => m.symbol === symbol);
      return {
        symbol,
        name: mapEntry?.name || q.shortName || symbol,
        category: mapEntry?.category || "energy",
        price: toNumber(q.regularMarketPrice),
        change: toNumber(q.regularMarketChange),
        changePercent: toNumber(q.regularMarketChangePercent),
        unit: mapEntry?.unit || "USD",
        timestamp: new Date().toISOString(),
      };
    });

    cache.set(cacheKey, results, CACHE_TTL.QUOTE);
    return results;
  } catch (error) {
    console.error("Yahoo Finance commodities error:", error);
    return [];
  }
}

export async function getEtfHoldings(ticker: string): Promise<EtfHoldings | null> {
  const cacheKey = `etf:holdings:${ticker.toUpperCase()}`;
  const cached = cache.get<EtfHoldings>(cacheKey);
  if (cached) return cached;

  try {
    const summary = await yahooFinance.quoteSummary(ticker, {
      modules: ["topHoldings", "fundProfile", "summaryDetail"],
    });

    const topHoldings = summary.topHoldings;
    const fundProfile = summary.fundProfile;
    const summaryDetail = summary.summaryDetail;

    if (!topHoldings && !fundProfile && !summaryDetail) return null;

    const holdings: EtfHolding[] = (topHoldings?.holdings || []).map((h: any) => ({
      ticker: h.symbol || "",
      name: h.holdingName || h.name || h.symbol || "Holding",
      weight: toNumber(h.holdingPercent) * 100,
    }));

    const sectorBreakdown: EtfSectorBreakdown[] = (topHoldings?.sectorWeightings || []).flatMap(
      (entry: Record<string, number>) =>
        Object.entries(entry).map(([sector, weight]) => ({
          sector,
          weight: toNumber(weight) * 100,
        }))
    );

    const expenseRatio =
      toNumber(fundProfile?.feesExpensesInvestment?.annualReportExpenseRatio) ||
      toNumber(topHoldings?.expenseRatio) ||
      toNumber(summaryDetail?.expenseRatio);

    const aum = toNumber(summaryDetail?.totalAssets || fundProfile?.totalAssets);

    const result: EtfHoldings = {
      ticker: ticker.toUpperCase(),
      name: summaryDetail?.shortName || summaryDetail?.longName || ticker.toUpperCase(),
      expenseRatio,
      aum,
      holdings,
      sectorBreakdown,
    };

    cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
    return result;
  } catch (error) {
    console.error(`Yahoo Finance ETF holdings error for ${ticker}:`, error);
    return null;
  }
}

export async function getDividendHistory(
  ticker: string,
  from?: string,
  to?: string
): Promise<DividendHistory[]> {
  const cacheKey = `dividends:${ticker.toUpperCase()}:${from || "start"}:${to || "now"}`;
  const cached = cache.get<DividendHistory[]>(cacheKey);
  if (cached) return cached;

  try {
    const period1 = from ? new Date(from) : new Date(new Date().getFullYear() - 5, 0, 1);
    const period2 = to ? new Date(to) : new Date();
    const chart = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: "1d",
      events: "dividends",
      return: "array",
    });

    const dividends = chart.events?.dividends;
    const dividendArray = Array.isArray(dividends) ? dividends : Object.values(dividends || {});

    const history: DividendHistory[] = dividendArray.map((div) => ({
      date: toIsoDate(div.date).split("T")[0],
      amount: toNumber(div.amount),
    }));

    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    cache.set(cacheKey, history, CACHE_TTL.FUNDAMENTALS);
    return history;
  } catch (error) {
    console.error(`Yahoo Finance dividend history error for ${ticker}:`, error);
    return [];
  }
}

export async function getStockSplits(
  ticker: string,
  from?: string,
  to?: string
): Promise<StockSplit[]> {
  const cacheKey = `splits:${ticker.toUpperCase()}:${from || "start"}:${to || "now"}`;
  const cached = cache.get<StockSplit[]>(cacheKey);
  if (cached) return cached;

  try {
    const period1 = from ? new Date(from) : new Date(new Date().getFullYear() - 10, 0, 1);
    const period2 = to ? new Date(to) : new Date();
    const chart = await yahooFinance.chart(ticker, {
      period1,
      period2,
      interval: "1d",
      events: "splits",
      return: "array",
    });

    const splits = chart.events?.splits;
    const splitsArray = Array.isArray(splits) ? splits : Object.values(splits || {});

    const results: StockSplit[] = splitsArray.map((split) => ({
      ticker: ticker.toUpperCase(),
      date: toIsoDate(split.date).split("T")[0],
      ratio: split.splitRatio || `${split.numerator}:${split.denominator}`,
      fromFactor: toNumber(split.denominator),
      toFactor: toNumber(split.numerator),
    }));

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    cache.set(cacheKey, results, CACHE_TTL.FUNDAMENTALS);
    return results;
  } catch (error) {
    console.error(`Yahoo Finance stock splits error for ${ticker}:`, error);
    return [];
  }
}
