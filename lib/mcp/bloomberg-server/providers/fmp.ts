/**
 * Financial Modeling Prep (FMP) Provider
 *
 * Fallback screener API when Finviz is unavailable.
 * Free tier: 250 calls/day
 */

import type { Equity } from "../types";
import { buildFmpParams, type ScreenerFilters } from "./screener-meta";
import { cache, CACHE_TTL } from "./cache";

const FMP_API_KEY = process.env.FMP_API_KEY || "";
// Use stable API (v3 is legacy, stable is current)
const FMP_BASE_URL = "https://financialmodelingprep.com/stable";

interface FmpScreenerResult {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  beta: number;
  price: number;
  lastAnnualDividend: number;
  volume: number;
  exchange: string;
  exchangeShortName: string;
  country: string;
  isEtf: boolean;
  isFund: boolean;
  isActivelyTrading: boolean;
}

interface FmpQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

/**
 * Check if FMP API key is configured
 */
export function isFmpConfigured(): boolean {
  return FMP_API_KEY.length > 0;
}

/**
 * Fetch from FMP API with error handling
 */
async function fetchFmp<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  if (!isFmpConfigured()) {
    console.warn("[FMP] API key not configured");
    return null;
  }

  const url = new URL(`${FMP_BASE_URL}${endpoint}`);
  url.searchParams.set("apikey", FMP_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`[FMP] HTTP ${response.status}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    // FMP returns error messages in response body
    if (data && typeof data === "object" && "Error Message" in data) {
      console.error("[FMP] API Error:", data["Error Message"]);
      return null;
    }

    return data as T;
  } catch (error) {
    console.error("[FMP] Fetch error:", error);
    return null;
  }
}

/**
 * Get screener results from FMP
 */
export async function getFmpScreenerResults(
  filters: ScreenerFilters
): Promise<Equity[]> {
  if (!isFmpConfigured()) {
    console.log("[FMP] Skipping - no API key");
    return [];
  }

  // Check cache
  const cacheKey = `fmp:screener:${JSON.stringify(filters)}`;
  const cached = cache.get<Equity[]>(cacheKey);
  if (cached) {
    console.log("[FMP] Cache hit");
    return cached;
  }

  const params = buildFmpParams(filters);
  console.log("[FMP] Screener params:", params);

  const data = await fetchFmp<FmpScreenerResult[]>("/company-screener", params);

  if (!data || !Array.isArray(data)) {
    console.warn("[FMP] No screener results");
    return [];
  }

  // Get symbols for quote lookup
  const symbols = data
    .filter((item) => item.isActivelyTrading && !item.isEtf && !item.isFund)
    .slice(0, filters.limit || 50)
    .map((item) => item.symbol);

  if (symbols.length === 0) {
    return [];
  }

  // Get detailed quotes for the screened stocks
  const quotes = await getFmpQuotes(symbols);

  // Map to Equity type
  const equities: Equity[] = quotes.map((q) => ({
    ticker: q.symbol,
    name: q.name || q.symbol,
    exchange: q.exchange || "UNKNOWN",
    sector: findSectorForSymbol(data, q.symbol),
    industry: findIndustryForSymbol(data, q.symbol),
    currency: "USD",
    price: q.price,
    change: q.change,
    changePercent: q.changesPercentage,
    open: q.open,
    high: q.dayHigh,
    low: q.dayLow,
    volume: q.volume,
    avgVolume: q.avgVolume,
    marketCap: q.marketCap,
    sharesOutstanding: q.sharesOutstanding,
    beta: 1, // FMP quote doesn't include beta
    pe: q.pe || 0,
    eps: q.eps || 0,
    dividend: 0,
    dividendYield: 0,
    lastUpdated: new Date().toISOString(),
  }));

  cache.set(cacheKey, equities, CACHE_TTL.SCREENER);
  console.log(`[FMP] Returned ${equities.length} equities`);

  return equities;
}

/**
 * Get quotes for multiple symbols from FMP
 */
async function getFmpQuotes(symbols: string[]): Promise<FmpQuote[]> {
  if (symbols.length === 0) return [];

  // FMP supports batch quotes
  const symbolList = symbols.join(",");
  const data = await fetchFmp<FmpQuote[]>(`/quote/${symbolList}`);

  return data || [];
}

/**
 * Helper to find sector from screener results
 */
function findSectorForSymbol(
  results: FmpScreenerResult[],
  symbol: string
): string {
  const item = results.find((r) => r.symbol === symbol);
  return item?.sector || "Unknown";
}

/**
 * Helper to find industry from screener results
 */
function findIndustryForSymbol(
  results: FmpScreenerResult[],
  symbol: string
): string {
  const item = results.find((r) => r.symbol === symbol);
  return item?.industry || "Unknown";
}

/**
 * Get sector performance from FMP (bonus endpoint)
 */
export async function getFmpSectorPerformance(): Promise<
  Array<{ sector: string; changesPercentage: number }>
> {
  const data = await fetchFmp<
    Array<{ sector: string; changesPercentage: string }>
  >("/sector-performance");

  if (!data) return [];

  return data.map((item) => ({
    sector: item.sector,
    changesPercentage: parseFloat(item.changesPercentage) || 0,
  }));
}
