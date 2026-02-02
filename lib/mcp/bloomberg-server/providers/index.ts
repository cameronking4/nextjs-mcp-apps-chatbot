/**
 * Bloomberg Data Providers
 *
 * Main entry point for real market data.
 * Uses a multi-provider architecture:
 * - yahoo-finance2 (no API key) for quotes, fundamentals, historical
 * - Finviz (scraping) for sector-based screening
 * - FMP (API key optional) as screener fallback
 * - Finnhub (API key) for news and earnings
 */

// Yahoo Finance exports (primary data source - no API key needed)
export {
  getQuote,
  getQuotes,
  getFundamentals,
  getHistoricalPrices,
  generateSparklineData,
  searchSecurities,
  getScreenerResults,
  getIndices,
  screenEquities,
} from "./yahoo-finance";

// Finviz exports (sector screening - no API key needed)
export { getFinvizTickers, isFinvizAvailable } from "./finviz";

// FMP exports (screener fallback - API key optional)
export {
  getFmpScreenerResults,
  getFmpSectorPerformance,
  isFmpConfigured,
} from "./fmp";

// Finnhub exports (news and earnings - requires API key)
export {
  getCompanyNews,
  getMarketNews,
  getEarningsCalendar,
  getCompanyProfile,
  getBasicMetrics,
} from "./finnhub";

// Firecrawl exports (article scraping and search - requires API key)
export {
  isFirecrawlConfigured,
  scrapeArticleContent,
  searchNews,
  getTrendingNews,
  storeArticleUrl,
  getArticleUrl,
  getArticleById,
} from "./firecrawl";

// Screener metadata and utilities
export {
  getSupportedSectors,
  getSectorFinvizFilter,
  getSectorFmpName,
  normalizeSectorInput,
  buildFinvizUrl,
  buildFmpParams,
  type ScreenerFilters,
} from "./screener-meta";

// Cache utilities
export { cache, CACHE_TTL } from "./cache";

// Re-export types
export type {
  Equity,
  Fundamentals,
  HistoricalPoint,
  NewsArticle,
  Index,
  Mover,
  EarningsEvent,
} from "../types";
