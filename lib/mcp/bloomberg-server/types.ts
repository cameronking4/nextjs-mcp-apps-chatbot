// ============================================
// Equity Types
// ============================================

export interface Equity {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  sharesOutstanding: number;
  beta: number;
  pe: number;
  eps: number;
  dividend: number;
  dividendYield: number;
  lastUpdated: string;
}

// ============================================
// Fundamentals Types
// ============================================

export interface Fundamentals {
  ticker: string;
  pe: number;
  forwardPe: number;
  peg: number;
  eps: number;
  epsGrowth: number;
  revenue: number;
  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  ebitda: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  roe: number;
  roa: number;
  freeCashFlow: number;
  bookValue: number;
  priceToBook: number;
  priceToSales: number;
  dividendYield: number;
  payoutRatio: number;
  ttm: boolean;
  fiscalYearEnd: string;
}

// ============================================
// Historical Data Types
// ============================================

export interface HistoricalPoint {
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1D' | '1W' | '1M' | '1Y' | '5Y';

// ============================================
// News Types
// ============================================

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  body: string;
  source: string;
  publishedAt: string;
  tickers: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  sentimentScore?: number; // -1 (bearish) to 1 (bullish)
  tags: string[];
  importance: 'high' | 'medium' | 'low';
  url: string; // Article URL for reading full content
  imageUrl?: string; // Thumbnail image
}

// ============================================
// Index Types
// ============================================

export interface Index {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  ytdChange: number;
  lastUpdated: string;
}

export interface SectorPerformance {
  name: string;
  change: number;
  leaders: string[];
  laggards: string[];
}

export interface MarketMovers {
  gainers: Mover[];
  losers: Mover[];
  mostActive: Mover[];
}

export interface Mover {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

// ============================================
// Watchlist Types
// ============================================

export interface Watchlist {
  id: string;
  name: string;
  description: string;
  tickers: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Order Types
// ============================================

export interface Order {
  id: string;
  ticker: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  qty: number;
  price: number | null;
  filledPrice: number | null;
  status: 'pending' | 'filled' | 'cancelled';
  createdAt: string;
  filledAt: string | null;
  fills: OrderFill[];
}

export interface OrderFill {
  qty: number;
  price: number;
  time: string;
}

// ============================================
// Calendar Types
// ============================================

export interface EarningsEvent {
  id: string;
  ticker: string;
  company: string;
  eventTime: string;
  estimate: number;
  actual: number | null;
  surprise: number | null;
  quarter: string;
}

export interface EconomicEvent {
  id: string;
  event: string;
  eventTime: string;
  estimate: string;
  actual: string | null;
  previous: string;
  importance: 'high' | 'medium' | 'low';
}

// ============================================
// Sector Types
// ============================================

export interface Sector {
  id: string;
  name: string;
  industries: string[];
}

// ============================================
// Tool Response Types
// ============================================

export interface ToolContent {
  type: 'text';
  text: string;
}

export interface ToolResponse {
  content: ToolContent[];
  _meta?: {
    ui?: {
      resourceUri: string;
      width?: number;
      height?: number;
      visibility?: ('model' | 'app')[];
    };
  };
}

// ============================================
// Screener Filter Types
// ============================================

export interface ScreenerFilters {
  sector?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
}

// ============================================
// Chart Types
// ============================================

export type ChartType = 'line' | 'candlestick' | 'bar' | 'area';

export interface ChartConfig {
  ticker: string;
  timeframe: Timeframe;
  type: ChartType;
  indicators?: string[];
}

// ============================================
// Research Types
// ============================================

export interface CompanyResearch {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  equity: Equity;
  fundamentals: Fundamentals;
  recentNews: NewsArticle[];
  upcomingEarnings: EarningsEvent | null;
}
