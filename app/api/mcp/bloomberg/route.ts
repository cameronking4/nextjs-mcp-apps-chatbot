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
import {
  getEquity,
  getEquities,
  searchEquities,
  getFundamentals,
  compareFundamentals,
  getHistoricalPrices,
  generateSparklineData,
  getNews,
  getNewsArticle,
  getIndices,
  getSectorPerformance,
  getMarketMovers,
  getMarketSnapshot,
  getWatchlists,
  getWatchlist,
  createWatchlist,
  getWatchlistWithPrices,
  getOrders,
  getOrder,
  placeOrder,
  cancelOrder,
  screenEquities,
  getEarningsCalendar,
  getEconomicCalendar,
  compareSecurities,
  calculateRatios,
} from "@/lib/mcp/bloomberg-server/mock-data/utils";
import { getEquityQuoteViewHtml } from "@/lib/mcp/bloomberg-server/ui/equity-quote-view";
import { getNewsFeedViewHtml } from "@/lib/mcp/bloomberg-server/ui/news-feed-view";
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
        initialHeight: 280,
        resizable: false,
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
    description: "Get financial news headlines. Can filter by ticker, sentiment, or importance level.",
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "Filter news by ticker symbol (optional)",
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
        limit: {
          type: "number",
          description: "Maximum number of articles to return (default: 10)",
        },
      },
    },
    _meta: {
      ui: {
        resourceUri: "ui://bloomberg/news-feed",
        initialHeight: 380,
        resizable: true,
      },
    },
  },
  {
    name: "news_article",
    description: "Get full content of a specific news article by ID.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "News article ID",
        },
      },
      required: ["id"],
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
      const equity = getEquity(ticker);
      
      if (!equity) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      const sparkline = generateSparklineData(ticker);
      
      return {
        content: [{ type: "text", text: JSON.stringify({ ...equity, sparkline }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/equity-quote",
            initialHeight: 280,
          },
        },
      };
    }

    case "equity_fundamentals": {
      const ticker = args.ticker as string;
      const fundamentals = getFundamentals(ticker);
      const equity = getEquity(ticker);
      
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
      const points = getHistoricalPrices(ticker, timeframe);
      const equity = getEquity(ticker);
      
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
      const points = getHistoricalPrices(ticker, timeframe);
      const equity = getEquity(ticker);
      
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
      const articles = getNews({
        ticker: args.ticker as string | undefined,
        sentiment: args.sentiment as "bullish" | "bearish" | "neutral" | "mixed" | undefined,
        importance: args.importance as "high" | "medium" | "low" | undefined,
        limit: (args.limit as number) || 10,
      });
      
      return {
        content: [{ type: "text", text: JSON.stringify({ articles }) }],
        _meta: {
          ui: {
            resourceUri: "ui://bloomberg/news-feed",
            initialHeight: 380,
          },
        },
      };
    }

    case "news_article": {
      const article = getNewsArticle(args.id as string);
      
      if (!article) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "Article not found" }) }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify(article) }],
      };
    }

    // Research Tools
    case "company_research": {
      const ticker = args.ticker as string;
      const equity = getEquity(ticker);
      const fundamentals = getFundamentals(ticker);
      const recentNews = getNews({ ticker, limit: 5 });
      const earnings = getEarningsCalendar({ ticker });
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
      const results = screenEquities({
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
      const results = searchEquities(args.query as string);
      
      return {
        content: [{ type: "text", text: JSON.stringify({ query: args.query, results }) }],
      };
    }

    // Watchlist Tools
    case "watchlist_create": {
      const watchlist = createWatchlist(
        args.name as string,
        (args.description as string) || "",
        args.tickers as string[]
      );
      
      // Get full watchlist data with prices for UI
      const watchlistData = getWatchlistWithPrices(watchlist.id);
      const equitiesWithSparklines = watchlistData?.equities.map(eq => ({
        ...eq,
        sparkline: generateSparklineData(eq.ticker),
      })) || [];
      
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
        const data = getWatchlistWithPrices(id);
        if (!data) {
          return {
            content: [{ type: "text", text: JSON.stringify({ error: "Watchlist not found" }) }],
          };
        }
        
        // Add sparklines to each equity
        const equitiesWithSparklines = data.equities.map(eq => ({
          ...eq,
          sparkline: generateSparklineData(eq.ticker),
        }));
        
        return {
          content: [{ type: "text", text: JSON.stringify({ watchlist: data.watchlist, equities: equitiesWithSparklines }) }],
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

    // Trading Tools
    case "order_place": {
      const order = placeOrder({
        ticker: args.ticker as string,
        side: args.side as "buy" | "sell",
        type: args.type as "market" | "limit" | "stop",
        qty: args.qty as number,
        price: args.price as number | undefined,
      });
      
      return {
        content: [{ type: "text", text: JSON.stringify(order) }],
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
          content: [{ type: "text", text: JSON.stringify(order) }],
        };
      }
      
      const orders = getOrders(args.status as "pending" | "filled" | "cancelled" | undefined);
      return {
        content: [{ type: "text", text: JSON.stringify({ orders }) }],
      };
    }

    // Analytics Tools
    case "analytics_compare": {
      const tickers = args.tickers as string[];
      const data = compareSecurities(tickers);
      
      return {
        content: [{ type: "text", text: JSON.stringify(data) }],
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
      const ratios = calculateRatios(ticker);
      const equity = getEquity(ticker);
      
      if (!ratios) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Ticker ${ticker} not found` }) }],
        };
      }
      
      return {
        content: [{ type: "text", text: JSON.stringify({ 
          ...ratios,
          companyName: equity?.name || ticker,
        }) }],
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
      const snapshot = getMarketSnapshot();
      
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
      
      // Get all earnings (don't filter by start date to show upcoming events)
      const rawEarnings = getEarningsCalendar({
        ticker: args.ticker as string | undefined,
        endDate: endDate.toISOString(),
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
