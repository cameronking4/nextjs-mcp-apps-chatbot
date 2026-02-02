/**
 * Bloomberg Terminal MCP Server API Route
 * 
 * Exposes Bloomberg Terminal tools with interactive UI resources:
 * - equity_quote: Real-time stock quotes with price charts
 * - equity_fundamentals: Company fundamentals and financial metrics
 * - equity_historical: Historical price data with charts
 * - financial_news: Financial news headlines and articles
 * - create_chart: Interactive price charts
 * - company_research: Comprehensive company research
 * - screener: Stock screening with filters
 * - watchlist_create: Create and manage watchlists
 * - watchlist_view: View watchlist with current prices
 * - order_place: Place mock trading orders
 * - order_status: Check order status
 * - analytics_compare: Compare multiple securities
 * - analytics_ratios: Financial ratios analysis
 * - market_snapshot: Market indices and sector performance
 * - security_search: Search for securities by name or ticker
 * - earnings_calendar: Upcoming earnings announcements
 */

import { NextResponse } from "next/server";

// Real data providers (yahoo-finance2 + Finnhub + Firecrawl)
import {
  getQuote,
  getQuotes,
  getFundamentals as getRealFundamentals,
  getHistoricalPrices as getRealHistoricalPrices,
  generateSparklineData as getRealSparklineData,
  searchSecurities,
  getScreenerResults,
  getIndices as getRealIndices,
  screenEquities as screenRealEquities,
  getCompanyNews,
  getMarketNews,
  getEarningsCalendar as getRealEarningsCalendar,
  // Firecrawl providers for article scraping and search
  isFirecrawlConfigured,
  scrapeArticleContent,
  searchNews,
  getTrendingNews,
  storeArticleUrl,
} from "@/lib/mcp/bloomberg-server/providers";

// Mock data for watchlists, orders (kept as simulated)
import {
  getWatchlists,
  getWatchlist,
  createWatchlist,
  getWatchlistWithPrices,
  getOrders,
  getOrder,
  placeOrder,
  cancelOrder,
  getSectorPerformance,
} from "@/lib/mcp/bloomberg-server/mock-data/utils";
import { getEquityQuoteViewHtml } from "@/lib/mcp/bloomberg-server/ui/equity-quote-view";
import { getNewsFeedViewHtml } from "@/lib/mcp/bloomberg-server/ui/news-feed-view";
import { getNewsArticleViewHtml } from "@/lib/mcp/bloomberg-server/ui/news-article-view";
import { getChartViewHtml } from "@/lib/mcp/bloomberg-server/ui/chart-view";
import { getWatchlistViewHtml } from "@/lib/mcp/bloomberg-server/ui/watchlist-view";
import { getScreenerViewHtml } from "@/lib/mcp/bloomberg-server/ui/screener-view";
import { getOrderFormViewHtml } from "@/lib/mcp/bloomberg-server/ui/order-form-view";
import { getMarketSnapshotViewHtml } from "@/lib/mcp/bloomberg-server/ui/market-snapshot-view";
import { getComparisonViewHtml } from "@/lib/mcp/bloomberg-server/ui/comparison-view";
import { getResearchViewHtml } from "@/lib/mcp/bloomberg-server/ui/research-view";
import { getEarningsCalendarViewHtml } from "@/lib/mcp/bloomberg-server/ui/earnings-calendar-view";
import { getRatiosViewHtml } from "@/lib/mcp/bloomberg-server/ui/ratios-view";
import { getFundamentalsViewHtml } from "@/lib/mcp/bloomberg-server/ui/fundamentals-view";

const SERVER_INFO = {
  name: "bloomberg-terminal",
  version: "1.0.0",
};

const PROTOCOL_VERSION = "2024-11-05";

// Bloomberg Terminal Tools
const TOOLS = [
  // Equity Tools
  {
    name: "equity_quote",
    description: "Get real-time stock quote with price, change, volume, and key metrics. Use this for current price information.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)",
        },
      },
      required: ["ticker"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/equity-quote",
        initialHeight: 420,
        resizable: true,
      },
    },
  },
  {
    name: "equity_fundamentals",
    description: "Get company fundamentals including P/E, EPS, margins, ROE, ROA, debt ratios, and other financial metrics.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
      },
      required: ["ticker"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/fundamentals",
        initialHeight: 420,
        resizable: true,
      },
    },
  },
  {
    name: "equity_historical",
    description: "Get historical OHLCV price data for charting. Supports timeframes: 1D, 1W, 1M, 1Y.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
        timeframe: {
          type: "string",
          enum: ["1D", "1W", "1M", "1Y"],
          description: "Time period for historical data",
        },
      },
      required: ["ticker", "timeframe"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/chart",
        initialHeight: 320,
        resizable: true,
      },
    },
  },

  // Chart Tool
  {
    name: "create_chart",
    description: "Create an interactive price chart for a stock. Shows price history with hover interactions.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
        timeframe: {
          type: "string",
          enum: ["1D", "1W", "1M", "1Y"],
          description: "Time period for the chart (default: 1M)",
        },
        type: {
          type: "string",
          enum: ["line", "candlestick", "area"],
          description: "Chart type (default: line)",
        },
      },
      required: ["ticker"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/chart",
        initialHeight: 320,
        resizable: true,
      },
    },
  },

  // News Tools
  {
    name: "financial_news",
    description: "Get financial news headlines with full details. Can filter by ticker, sentiment, importance, date range, and category. Returns article URLs and images.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Filter news by ticker symbol (optional). When provided, returns company-specific news.",
        },
        sentiment: {
          type: "string",
          enum: ["bullish", "bearish", "neutral", "mixed"],
          description: "Filter by sentiment (optional)",
        },
        importance: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "Filter by importance level (optional)",
        },
        category: {
          type: "string",
          enum: ["general", "forex", "crypto", "merger"],
          description: "News category filter - only applies when no ticker specified (optional)",
        },
        limit: {
          type: "number",
          description: "Maximum number of articles to return (default: 25, max: 100)",
        },
        offset: {
          type: "number",
          description: "Number of articles to skip for pagination (default: 0)",
        },
        from: {
          type: "string",
          description: "Start date in YYYY-MM-DD format (optional)",
        },
        to: {
          type: "string",
          description: "End date in YYYY-MM-DD format (optional)",
        },
        days: {
          type: "number",
          description: "Number of days back to fetch news (default: 30). Alternative to from/to.",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/news-feed",
        initialHeight: 450,
        resizable: true,
      },
    },
  },
  {
    name: "news_article",
    description: "Get full content of a news article by URL. Uses Firecrawl to scrape and extract the main article content. If the URL is blocked, it will search for the article by headline.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the news article to fetch full content from",
        },
        headline: {
          type: "string",
          description: "The article headline (optional, used as fallback if URL scraping fails)",
        },
      },
      required: ["url"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/news-article",
        initialHeight: 500,
        resizable: true,
      },
    },
  },
  {
    name: "news_search",
    description: "Search financial news across the web by keywords. Combines Firecrawl web search with Finnhub news API for comprehensive coverage. Supports search operators like site:, intitle:, -exclude.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keywords. Supports operators: site:reuters.com, intitle:earnings, -layoffs, \"exact phrase\"",
        },
        tickers: {
          type: "array",
          items: { type: "string" },
          description: "Filter results to include these ticker symbols. Also fetches ticker-specific news from Finnhub for better coverage.",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 25, max: 50)",
        },
        scrapeContent: {
          type: "boolean",
          description: "Also fetch full article content for each result (slower, default: false)",
        },
      },
      required: ["query"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/news-feed",
        initialHeight: 450,
        resizable: true,
      },
    },
  },
  {
    name: "trending_news",
    description: "Get trending and breaking financial news stories by category. Uses multiple search queries across top financial news sources (Reuters, Bloomberg, CNBC, WSJ, etc.) for comprehensive coverage.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["all", "earnings", "mergers", "ipo", "crypto", "economy", "fed", "tech"],
          description: "News category to filter by (default: all)",
        },
        limit: {
          type: "number",
          description: "Maximum number of articles (default: 25, max: 50)",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/news-feed",
        initialHeight: 450,
        resizable: true,
      },
    },
  },

  // Research Tools
  {
    name: "company_research",
    description: "Get comprehensive company research including overview, fundamentals, recent news, and upcoming earnings.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
      },
      required: ["ticker"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/research",
        initialHeight: 420,
        resizable: true,
      },
    },
  },
  {
    name: "screener",
    description: "Screen stocks based on filters like sector, market cap, P/E ratio, and dividend yield.",
    inputSchema: {
      type: "object",
      properties: {
        sector: {
          type: "string",
          description: "Sector filter (e.g., technology, healthcare, financials)",
        },
        minMarketCap: {
          type: "number",
          description: "Minimum market cap in dollars",
        },
        maxMarketCap: {
          type: "number",
          description: "Maximum market cap in dollars",
        },
        minPe: {
          type: "number",
          description: "Minimum P/E ratio",
        },
        maxPe: {
          type: "number",
          description: "Maximum P/E ratio",
        },
        minDividendYield: {
          type: "number",
          description: "Minimum dividend yield percentage",
        },
        maxDividendYield: {
          type: "number",
          description: "Maximum dividend yield percentage",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/screener",
        initialHeight: 380,
        resizable: true,
      },
    },
  },
  {
    name: "security_search",
    description: "Search for securities by name or ticker symbol.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (ticker or company name)",
        },
      },
      required: ["query"],
    },
  },

  // Watchlist Tools
  {
    name: "watchlist_create",
    description: "Create a new watchlist with specified stocks.",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Watchlist name",
        },
        description: {
          type: "string",
          description: "Watchlist description (optional)",
        },
        tickers: {
          type: "array",
          items: { type: "string" },
          description: "Array of ticker symbols to add",
        },
      },
      required: ["name", "tickers"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/watchlist",
        initialHeight: 320,
        resizable: true,
      },
    },
  },
  {
    name: "watchlist_view",
    description: "View a watchlist with current prices for all stocks.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Watchlist ID (optional - lists all if not provided)",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/watchlist",
        initialHeight: 320,
        resizable: true,
      },
    },
  },

  // Trading Tools (Mock)
  {
    name: "order_place",
    description: "Place a mock trading order. Supports market, limit, and stop orders.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
        side: {
          type: "string",
          enum: ["buy", "sell"],
          description: "Order side",
        },
        type: {
          type: "string",
          enum: ["market", "limit", "stop"],
          description: "Order type",
        },
        qty: {
          type: "number",
          description: "Number of shares",
        },
        price: {
          type: "number",
          description: "Limit/stop price (required for limit and stop orders)",
        },
      },
      required: ["ticker", "side", "type", "qty"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/order-form",
        initialHeight: 420,
        resizable: false,
      },
    },
  },
  {
    name: "order_status",
    description: "Check the status of an order or list all orders.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Order ID (optional - lists all orders if not provided)",
        },
        status: {
          type: "string",
          enum: ["pending", "filled", "cancelled"],
          description: "Filter by status (optional)",
        },
      },
    },
  },

  // Analytics Tools
  {
    name: "analytics_compare",
    description: "Compare multiple securities side by side on key metrics.",
    inputSchema: {
      type: "object",
      properties: {
        tickers: {
          type: "array",
          items: { type: "string" },
          description: "Array of ticker symbols to compare (2-5 tickers)",
          minItems: 2,
          maxItems: 5,
        },
      },
      required: ["tickers"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/comparison",
        initialHeight: 450,
        resizable: true,
      },
    },
  },
  {
    name: "analytics_ratios",
    description: "Get detailed financial ratios for a company including valuation, profitability, and leverage metrics.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Stock ticker symbol",
        },
      },
      required: ["ticker"],
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/ratios",
        initialHeight: 400,
        resizable: true,
      },
    },
  },

  // Market Overview Tools
  {
    name: "market_snapshot",
    description: "Get current market snapshot including indices, sector performance, and top movers.",
    inputSchema: {
      type: "object",
      properties: {},
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/market-snapshot",
        initialHeight: 450,
        resizable: true,
      },
    },
  },

  // Calendar Tools
  {
    name: "earnings_calendar",
    description: "Get upcoming earnings announcements. Can filter by ticker or date range.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Filter by ticker symbol (optional)",
        },
        days: {
          type: "number",
          description: "Number of days to look ahead (default: 7)",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/earnings-calendar",
        initialHeight: 350,
        resizable: true,
      },
    },
  },
];

// UI Resources
const RESOURCES = [
  { uri: "ui://bloomberg/equity-quote", name: "equity-quote.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/chart", name: "chart.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/news-feed", name: "news-feed.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/news-article", name: "news-article.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/watchlist", name: "watchlist.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/screener", name: "screener.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/order-form", name: "order-form.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/market-snapshot", name: "market-snapshot.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/comparison", name: "comparison.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/research", name: "research.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/earnings-calendar", name: "earnings-calendar.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/ratios", name: "ratios.html", mimeType: "text/html" },
  { uri: "ui://bloomberg/fundamentals", name: "fundamentals.html", mimeType: "text/html" },
];

// Tool execution
async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ content: Array<{ type: string; text: string }>; _meta?: unknown }> {
  switch (name) {
    // Equity Tools
    case "equity_quote": {
      const ticker = args.ticker as string;
      const [equity, yearHistory, dayHistory] = await Promise.all([
        getQuote(ticker),
        getRealHistoricalPrices(ticker, "1Y"),
        getRealHistoricalPrices(ticker, "1D"),
      ]);
      
      if (!equity) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      // Calculate 52-week high/low from 1Y historical data
      let fiftyTwoWeekHigh = equity.high;
      let fiftyTwoWeekLow = equity.low;
      if (yearHistory.length > 0) {
        const yearHighs = yearHistory.map(p => p.high);
        const yearLows = yearHistory.map(p => p.low);
        fiftyTwoWeekHigh = Math.max(...yearHighs);
        fiftyTwoWeekLow = Math.min(...yearLows);
      }
      
      // Calculate previous close from price and change
      const prevClose = equity.price - equity.change;
      
      // Create sparkline with timestamps for interactive chart
      // Use 1D data if available, otherwise fall back to recent 1Y data
      const sparklineSource = dayHistory.length > 0 ? dayHistory : yearHistory.slice(-30);
      const sparkline = sparklineSource.map(p => ({
        ts: p.ts,
        close: p.close,
        volume: p.volume,
      }));
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          ...equity, 
          sparkline,
          fiftyTwoWeekHigh,
          fiftyTwoWeekLow,
          prevClose,
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/equity-quote",
            initialHeight: 420,
          },
        },
      };
    }

    case "equity_fundamentals": {
      const ticker = args.ticker as string;
      const [fundamentals, equity] = await Promise.all([
        getRealFundamentals(ticker),
        getQuote(ticker),
      ]);
      
      if (!fundamentals && !equity) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ equity, fundamentals }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/fundamentals",
            initialHeight: 420,
          },
        },
      };
    }

    case "equity_historical": {
      const ticker = args.ticker as string;
      const timeframe = (args.timeframe as "1D" | "1W" | "1M" | "1Y") || "1M";
      const [points, equity] = await Promise.all([
        getRealHistoricalPrices(ticker, timeframe),
        getQuote(ticker),
      ]);
      
      return {
        content: [{ type: "text", text: JSON.stringify({ ticker, timeframe, points, equity }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/chart",
            initialHeight: 320,
          },
        },
      };
    }

    // Chart Tool
    case "create_chart": {
      const ticker = args.ticker as string;
      const timeframe = (args.timeframe as "1D" | "1W" | "1M" | "1Y") || "1M";
      const [points, equity] = await Promise.all([
        getRealHistoricalPrices(ticker, timeframe),
        getQuote(ticker),
      ]);
      
      return {
        content: [{ type: "text", text: JSON.stringify({ ticker, timeframe, points, equity }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/chart",
            initialHeight: 320,
          },
        },
      };
    }

    // News Tools
    case "financial_news": {
      const ticker = args.ticker as string | undefined;
      const limit = Math.min((args.limit as number) || 25, 100); // Default 25, max 100
      const offset = (args.offset as number) || 0;
      
      const options = {
        sentiment: args.sentiment as "bullish" | "bearish" | "neutral" | "mixed" | undefined,
        importance: args.importance as "high" | "medium" | "low" | undefined,
        limit: limit + offset, // Fetch enough for pagination
        from: args.from as string | undefined,
        to: args.to as string | undefined,
        days: args.days as number | undefined,
        category: args.category as "general" | "forex" | "crypto" | "merger" | undefined,
      };
      
      // Use company news if ticker provided, otherwise market news
      let articles = ticker
        ? await getCompanyNews(ticker, options)
        : await getMarketNews(options);
      
      // Apply pagination offset
      if (offset > 0) {
        articles = articles.slice(offset, offset + limit);
      } else {
        articles = articles.slice(0, limit);
      }
      
      // Store URLs for later retrieval via news_article
      for (const article of articles) {
        if (article.url) {
          storeArticleUrl(article.id, article.url);
        }
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          articles,
          pagination: {
            offset,
            limit,
            total: articles.length,
            hasMore: articles.length === limit,
          }
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/news-feed",
            initialHeight: 450,
          },
        },
      };
    }

    case "news_article": {
      const url = args.url as string;
      const headline = args.headline as string | undefined;
      
      if (!isFirecrawlConfigured()) {
        return {
          content: [{ type: "text", text: JSON.stringify({ 
            error: "Firecrawl API key not configured. Please set FIRECRAWL_API_KEY environment variable.",
          }) }],
        };
      }
      
      // Pass headline for fallback search if direct scraping fails
      const articleContent = await scrapeArticleContent(url, headline);
      
      if (!articleContent) {
        return {
          content: [{ type: "text", text: JSON.stringify({ 
            error: "Failed to fetch article content. The URL may be blocked by paywall or anti-scraping measures. Try providing the original article URL directly.",
            url,
            suggestion: headline ? "Search for this headline manually to find an accessible source." : "Provide the article headline for a search-based fallback.",
          }) }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          url: articleContent.sourceUrl || url,
          title: articleContent.title,
          author: articleContent.author,
          publishedDate: articleContent.publishedDate,
          imageUrl: articleContent.imageUrl,
          content: articleContent.content,
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/news-article",
            initialHeight: 500,
          },
        },
      };
    }

    case "news_search": {
      const query = args.query as string;
      const limit = Math.min((args.limit as number) || 25, 50); // Increased default to 25, max to 50
      const tickers = args.tickers as string[] | undefined;
      const scrapeContent = args.scrapeContent as boolean | undefined;
      
      // Combine multiple sources for better coverage
      const allArticles: Array<{ id: string; headline: string; summary: string; body: string; source: string; publishedAt: string; tickers: string[]; sentiment: string; sentimentScore?: number; tags: string[]; importance: string; url: string; imageUrl?: string }> = [];
      const seenUrls = new Set<string>();
      
      // Source 1: If tickers provided, also get Finnhub news for those tickers
      if (tickers?.length) {
        const finnhubPromises = tickers.slice(0, 3).map(ticker => 
          getCompanyNews(ticker, { limit: Math.ceil(limit / 3), days: 14 })
        );
        const finnhubResults = await Promise.all(finnhubPromises);
        
        for (const articles of finnhubResults) {
          for (const article of articles) {
            // Filter by query relevance
            const text = (article.headline + " " + article.summary).toLowerCase();
            const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
            const isRelevant = queryWords.some(word => text.includes(word));
            
            if (isRelevant && !seenUrls.has(article.url)) {
              seenUrls.add(article.url);
              allArticles.push(article);
            }
          }
        }
      }
      
      // Source 2: Firecrawl search (primary source)
      if (isFirecrawlConfigured()) {
        const firecrawlLimit = Math.max(limit - allArticles.length, Math.ceil(limit * 0.7));
        const firecrawlArticles = await searchNews(query, { 
          limit: firecrawlLimit, 
          tickers, 
          scrapeContent,
          includeGeneral: true, // Include broader search
        });
        
        for (const article of firecrawlArticles) {
          if (!seenUrls.has(article.url)) {
            seenUrls.add(article.url);
            allArticles.push(article);
          }
        }
      } else if (allArticles.length === 0) {
        // No Firecrawl and no Finnhub results
        return {
          content: [{ type: "text", text: JSON.stringify({ 
            error: "Firecrawl API key not configured and no ticker-specific news available. Please set FIRECRAWL_API_KEY environment variable for broader news search.",
          }) }],
        };
      }
      
      // Sort by date (most recent first)
      allArticles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      
      const finalArticles = allArticles.slice(0, limit);
      
      // Store URLs for later retrieval
      for (const article of finalArticles) {
        if (article.url) {
          storeArticleUrl(article.id, article.url);
        }
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          articles: finalArticles,
          query,
          sources: isFirecrawlConfigured() ? ["finnhub", "firecrawl"] : ["finnhub"],
          total: finalArticles.length,
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/news-feed",
            initialHeight: 450,
          },
        },
      };
    }

    case "trending_news": {
      const category = (args.category as "all" | "earnings" | "mergers" | "ipo" | "crypto" | "economy" | "fed" | "tech") || "all";
      const limit = Math.min((args.limit as number) || 25, 50); // Increased default to 25
      
      if (!isFirecrawlConfigured()) {
        // Fall back to Finnhub market news if Firecrawl not available
        const finnhubCategory = category === "all" ? "general" 
          : category === "crypto" ? "crypto" 
          : category === "mergers" ? "merger" 
          : "general";
        
        const articles = await getMarketNews({ 
          limit, 
          category: finnhubCategory as "general" | "forex" | "crypto" | "merger",
        });
        
        for (const article of articles) {
          if (article.url) {
            storeArticleUrl(article.id, article.url);
          }
        }
        
        return {
          content: [{ type: "text", text: JSON.stringify({ 
            articles,
            category,
            source: "finnhub",
            note: "Using Finnhub as Firecrawl API key not configured.",
          }) }],
          _meta: {
            ui: {
              resourceUri: "ui://bloomberg/news-feed",
              initialHeight: 450,
            },
          },
        };
      }
      
      const articles = await getTrendingNews(category, limit);
      
      // Store URLs for later retrieval
      for (const article of articles) {
        if (article.url) {
          storeArticleUrl(article.id, article.url);
        }
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          articles,
          category,
          source: "firecrawl-trending",
          total: articles.length,
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/news-feed",
            initialHeight: 450,
          },
        },
      };
    }

    // Research Tools
    case "company_research": {
      const ticker = args.ticker as string;
      const [equity, fundamentals, recentNews, earnings] = await Promise.all([
        getQuote(ticker),
        getRealFundamentals(ticker),
        getCompanyNews(ticker, { limit: 5 }),
        getRealEarningsCalendar({ ticker }),
      ]);
      const upcomingEarnings = earnings.length > 0 ? earnings[0] : null;
      
      if (!equity) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({
          ticker,
          name: equity.name,
          sector: equity.sector,
          industry: equity.industry,
          equity,
          fundamentals,
          recentNews,
          upcomingEarnings,
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/research",
            initialHeight: 420,
          },
        },
      };
    }

    case "screener": {
      const results = await screenRealEquities({
        sector: args.sector as string | undefined,
        minMarketCap: args.minMarketCap as number | undefined,
        maxMarketCap: args.maxMarketCap as number | undefined,
        minPe: args.minPe as number | undefined,
        maxPe: args.maxPe as number | undefined,
        minDividendYield: args.minDividendYield as number | undefined,
        maxDividendYield: args.maxDividendYield as number | undefined,
      });
      
      return {
        content: [{ type: "text", text: JSON.stringify({ filters: args, results }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/screener",
            initialHeight: 380,
          },
        },
      };
    }

    case "security_search": {
      const results = await searchSecurities(args.query as string);
      
      return {
        content: [{ type: "text", text: JSON.stringify({ query: args.query, results }) }],
      };
    }

    // Watchlist Tools
    case "watchlist_create": {
      const tickers = args.tickers as string[];
      const watchlist = createWatchlist(
        args.name as string,
        (args.description as string) || "",
        tickers
      );
      
      // Get real quotes for the tickers
      const equities = await getQuotes(tickers);
      const equitiesWithSparklines = await Promise.all(
        equities.map(async (eq) => ({
          ...eq,
          sparkline: await getRealSparklineData(eq.ticker),
        }))
      );
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          message: "Watchlist created", 
          watchlist,
          equities: equitiesWithSparklines 
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/watchlist",
            initialHeight: 320,
          },
        },
      };
    }

    case "watchlist_view": {
      const id = args.id as string | undefined;
      
      if (id) {
        const watchlist = getWatchlist(id);
        if (!watchlist) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Watchlist not found" }) }],
          };
        }
        
        // Get real quotes for the watchlist tickers
        const equities = await getQuotes(watchlist.tickers);
        const equitiesWithSparklines = await Promise.all(
          equities.map(async (eq) => ({
            ...eq,
            sparkline: await getRealSparklineData(eq.ticker),
          }))
        );
        
        return {
          content: [{ type: "text", text: JSON.stringify({ watchlist, equities: equitiesWithSparklines }) }],
          _meta: {
            ui: {
              resourceUri: "ui://bloomberg/watchlist",
              initialHeight: 320,
            },
          },
        };
      }
      
      const watchlists = getWatchlists();
      return {
        content: [{ type: "text", text: JSON.stringify({ watchlists }) }],
      };
    }

    // Trading Tools (SIMULATED - not connected to real broker)
    case "order_place": {
      const order = placeOrder({
        ticker: args.ticker as string,
        side: args.side as "buy" | "sell",
        type: args.type as "market" | "limit" | "stop",
        qty: args.qty as number,
        price: args.price as number | undefined,
      });
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          ...order, 
          _simulated: true,
          _note: "This is a simulated order for demonstration purposes only." 
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/order-form",
            initialHeight: 420,
          },
        },
      };
    }

    case "order_status": {
      const id = args.id as string | undefined;
      
      if (id) {
        const order = getOrder(id);
        if (!order) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Order not found" }) }],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify({ ...order, _simulated: true }) }],
        };
      }
      
      const orders = getOrders(args.status as "pending" | "filled" | "cancelled" | undefined);
      return {
        content: [{ type: "text", text: JSON.stringify({ orders, _simulated: true }) }],
      };
    }

    // Analytics Tools
    case "analytics_compare": {
      const tickers = args.tickers as string[];
      const [equities, fundamentalsList] = await Promise.all([
        getQuotes(tickers),
        Promise.all(tickers.map(t => getRealFundamentals(t))),
      ]);
      
      // Return data in format expected by comparison view:
      // { equities: [...], fundamentals: [...] }
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          equities, 
          fundamentals: fundamentalsList 
        }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/comparison",
            initialHeight: 450,
          },
        },
      };
    }

    case "analytics_ratios": {
      const ticker = args.ticker as string;
      const [fundamentals, equity] = await Promise.all([
        getRealFundamentals(ticker),
        getQuote(ticker),
      ]);
      
      if (!fundamentals && !equity) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      // Build ratios from fundamentals
      const ratios = {
        ticker,
        companyName: equity?.name || ticker,
        valuation: {
          pe: fundamentals?.pe || equity?.pe || 0,
          forwardPe: fundamentals?.forwardPe || 0,
          peg: fundamentals?.peg || 0,
          priceToBook: fundamentals?.priceToBook || 0,
          priceToSales: fundamentals?.priceToSales || 0,
        },
        profitability: {
          grossMargin: fundamentals?.grossMargin || 0,
          operatingMargin: fundamentals?.operatingMargin || 0,
          netMargin: fundamentals?.netMargin || 0,
          roe: fundamentals?.roe || 0,
          roa: fundamentals?.roa || 0,
        },
        liquidity: {
          currentRatio: fundamentals?.currentRatio || 0,
          quickRatio: fundamentals?.quickRatio || 0,
          debtToEquity: fundamentals?.debtToEquity || 0,
        },
        growth: {
          revenueGrowth: fundamentals?.revenueGrowth || 0,
          epsGrowth: fundamentals?.epsGrowth || 0,
        },
      };
      
      return {
        content: [{ type: "text", text: JSON.stringify(ratios) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/ratios",
            initialHeight: 400,
          },
        },
      };
    }

    // Market Overview
    case "market_snapshot": {
      const [indices, gainers, losers, mostActive, sectors] = await Promise.all([
        getRealIndices(),
        getScreenerResults("day_gainers", 5),
        getScreenerResults("day_losers", 5),
        getScreenerResults("most_actives", 5),
        getSectorPerformance(), // Keep mock for sector performance
      ]);
      
      const snapshot = {
        indices,
        sectors,
        movers: {
          gainers,
          losers,
          mostActive,
        },
        lastUpdated: new Date().toISOString(),
      };
      
      return {
        content: [{ type: "text", text: JSON.stringify(snapshot) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/market-snapshot",
            initialHeight: 450,
          },
        },
      };
    }

    // Calendar
    case "earnings_calendar": {
      const days = (args.days as number) || 14;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);
      
      // Get earnings from Finnhub
      const rawEarnings = await getRealEarningsCalendar({
        ticker: args.ticker as string | undefined,
        to: endDate.toISOString().split("T")[0],
      });
      
      // Transform to UI-expected format
      const earnings = rawEarnings.map(e => ({
        id: e.id,
        ticker: e.ticker,
        company: e.company,
        date: e.eventTime,
        period: e.quarter,
        epsEstimate: e.estimate,
        epsActual: e.actual,
        surprise: e.surprise,
      }));
      
      return {
        content: [{ type: "text", text: JSON.stringify({ earnings }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/earnings-calendar",
            initialHeight: 350,
          },
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Resource reading
function readResource(uri: string): {
  contents: Array<{ uri: string; mimeType: string; text: string }>;
} {
  switch (uri) {
    case "ui://bloomberg/equity-quote":
      return { contents: [{ uri, mimeType: "text/html", text: getEquityQuoteViewHtml() }] };
    case "ui://bloomberg/chart":
      return { contents: [{ uri, mimeType: "text/html", text: getChartViewHtml() }] };
    case "ui://bloomberg/news-feed":
      return { contents: [{ uri, mimeType: "text/html", text: getNewsFeedViewHtml() }] };
    case "ui://bloomberg/news-article":
      return { contents: [{ uri, mimeType: "text/html", text: getNewsArticleViewHtml() }] };
    case "ui://bloomberg/watchlist":
      return { contents: [{ uri, mimeType: "text/html", text: getWatchlistViewHtml() }] };
    case "ui://bloomberg/screener":
      return { contents: [{ uri, mimeType: "text/html", text: getScreenerViewHtml() }] };
    case "ui://bloomberg/order-form":
      return { contents: [{ uri, mimeType: "text/html", text: getOrderFormViewHtml() }] };
    case "ui://bloomberg/market-snapshot":
      return { contents: [{ uri, mimeType: "text/html", text: getMarketSnapshotViewHtml() }] };
    case "ui://bloomberg/comparison":
      return { contents: [{ uri, mimeType: "text/html", text: getComparisonViewHtml() }] };
    case "ui://bloomberg/research":
      return { contents: [{ uri, mimeType: "text/html", text: getResearchViewHtml() }] };
    case "ui://bloomberg/earnings-calendar":
      return { contents: [{ uri, mimeType: "text/html", text: getEarningsCalendarViewHtml() }] };
    case "ui://bloomberg/ratios":
      return { contents: [{ uri, mimeType: "text/html", text: getRatiosViewHtml() }] };
    case "ui://bloomberg/fundamentals":
      return { contents: [{ uri, mimeType: "text/html", text: getFundamentalsViewHtml() }] };
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}

// JSON-RPC handler
async function handleJsonRpcRequest(request: {
  jsonrpc: string;
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}): Promise<{
  jsonrpc: string;
  id?: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}> {
  const { id, method, params } = request;

  try {
    switch (method) {
      case "initialize":
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            serverInfo: SERVER_INFO,
            capabilities: {
              tools: {},
              resources: {},
            },
          },
        };
      case "tools/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { tools: TOOLS },
        };
      case "tools/call": {
        const toolParams = params as {
          name: string;
          arguments?: Record<string, unknown>;
        };
        const result = await executeTool(toolParams.name, toolParams.arguments ?? {});
        return {
          jsonrpc: "2.0",
          id,
          result,
        };
      }
      case "resources/list":
        return {
          jsonrpc: "2.0",
          id,
          result: { resources: RESOURCES },
        };
      case "resources/read": {
        const resourceParams = params as { uri: string };
        const result = readResource(resourceParams.uri);
        return {
          jsonrpc: "2.0",
          id,
          result,
        };
      }
      case "ping":
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      default:
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32_601,
            message: `Method not found: ${method}`,
          },
        };
    }
  } catch (caughtError) {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code: -32_603,
        message: caughtError instanceof Error ? caughtError.message : "Internal error",
      },
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const responses = await Promise.all(body.map(handleJsonRpcRequest));
      return NextResponse.json(responses);
    }

    const response = await handleJsonRpcRequest(body);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32_700,
          message: "Parse error",
        },
        id: null,
      },
      { status: 400 }
    );
  }
}

export function GET() {
  return NextResponse.json({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    status: "running",
    capabilities: ["tools", "resources"],
    description: "Bloomberg Terminal MCP server with financial data tools and interactive UIs",
    toolCount: TOOLS.length,
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
