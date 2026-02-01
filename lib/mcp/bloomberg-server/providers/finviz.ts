/**
 * Finviz Screener Provider
 *
 * Scrapes Finviz stock screener for filtered results.
 * Primary provider for sector-based screening (no API key needed).
 * Uses native fetch + HTML parsing instead of npm package.
 */

import { buildFinvizUrl, type ScreenerFilters } from "./screener-meta";
import { cache, CACHE_TTL } from "./cache";

// Regex to extract tickers from Finviz HTML
// Finviz uses links like: <a href="quote.ashx?t=XOM&ty=c&p=d&b=1"...>
const TICKER_REGEX = /href="quote\.ashx\?t=([A-Z.]+)&/g;

/**
 * Scrape Finviz screener page and extract tickers
 */
async function scrapeFinvizPage(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      console.error(`[Finviz] HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Extract unique tickers from the page
    const tickers = new Set<string>();
    let match;

    while ((match = TICKER_REGEX.exec(html)) !== null) {
      const ticker = match[1];
      // Filter out common non-stock links
      if (
        ticker &&
        ticker.length <= 5 &&
        !["HOME", "NEWS", "BLOG", "MAPS", "HELP"].includes(ticker)
      ) {
        tickers.add(ticker);
      }
    }

    return Array.from(tickers);
  } catch (error) {
    console.error("[Finviz] Fetch error:", error);
    return [];
  }
}

/**
 * Get stock tickers from Finviz screener
 * Returns empty array on failure (triggers fallback)
 */
export async function getFinvizTickers(
  filters: ScreenerFilters
): Promise<string[]> {
  // Generate cache key from filters
  const cacheKey = `finviz:${JSON.stringify(filters)}`;
  const cached = cache.get<string[]>(cacheKey);
  if (cached) {
    console.log("[Finviz] Cache hit");
    return cached;
  }

  const url = buildFinvizUrl(filters);
  console.log("[Finviz] Scraping URL:", url);

  try {
    const tickers = await scrapeFinvizPage(url);

    if (tickers.length === 0) {
      console.warn("[Finviz] No tickers found on page");
      return [];
    }

    // Limit results and cache
    const limitedTickers = tickers.slice(0, filters.limit || 50);
    cache.set(cacheKey, limitedTickers, CACHE_TTL.SCREENER);

    console.log(`[Finviz] Found ${limitedTickers.length} tickers`);
    return limitedTickers;
  } catch (error) {
    console.error("[Finviz] Scrape failed:", error);
    return [];
  }
}

/**
 * Check if Finviz is available and working
 */
export async function isFinvizAvailable(): Promise<boolean> {
  try {
    const response = await fetch("https://finviz.com/screener.ashx?v=111", {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible)",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
