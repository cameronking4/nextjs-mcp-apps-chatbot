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
  eventTime?: string;
  date?: string;
  country?: string;
  estimate?: number | string;
  actual?: number | string | null;
  previous?: number | string;
  importance?: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  unit?: string;
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

// ============================================
// Options Types
// ============================================

export interface OptionsChain {
  ticker: string;
  underlyingPrice: number;
  expirations?: string[];
  selectedExpiration?: string;
  expiration?: string;
  availableExpirations?: string[];
  calls: OptionContract[];
  puts: OptionContract[];
}

export interface OptionContract {
  contractSymbol?: string;
  strike: number;
  expiration?: string;
  type?: 'call' | 'put';
  last?: number;
  lastPrice?: number;
  bid: number;
  ask: number;
  change?: number;
  changePercent?: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  inTheMoney: boolean;
}

export interface UnusualOptionsActivity {
  ticker: string;
  contractSymbol?: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  volume: number;
  openInterest: number;
  volumeOiRatio: number;
  unusualScore: number;
  lastPrice: number;
  underlyingPrice?: number;
}

// ============================================
// Analyst & Institutional Types
// ============================================

export interface AnalystRatings {
  ticker: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  totalAnalysts?: number;
  numberOfAnalysts?: number;
  consensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  averageScore?: number; // 1-5 scale
  priceTarget?: number;
}

export interface PriceTarget {
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  currentPrice?: number;
  numberOfAnalysts: number;
  upside?: number; // percentage
  lastUpdated: string;
}

export interface InsiderTransaction {
  ticker?: string;
  name: string;
  title: string;
  transactionDate: string;
  transactionType: 'Buy' | 'Sell' | 'Option Exercise' | 'Gift' | 'Other';
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned: number;
  filingDate?: string;
}

export interface InsiderSummary {
  ticker?: string;
  transactions?: InsiderTransaction[];
  netShares: number;
  netValue: number;
  buyCount?: number;
  sellCount?: number;
  sentiment?: 'Bullish' | 'Bearish' | 'Neutral';
  buys?: number;
  sells?: number;
}

export interface InstitutionalHolder {
  name: string;
  shares: number;
  value: number;
  percentOwned: number;
  changeShares?: number;
  changePercent?: number;
  dateReported: string;
}

export interface InstitutionalOwnership {
  ticker: string;
  totalInstitutionalShares?: number;
  totalInstitutionalValue?: number;
  percentInstitutional?: number;
  numberOfHolders?: number;
  topHolders?: InstitutionalHolder[];
  totalShares?: number;
  totalValue?: number;
  percentOwned?: number;
  holders?: InstitutionalHolder[];
}

// ============================================
// Economic Data Types
// ============================================

export interface EconomicCalendarEvent {
  id: string;
  country: string;
  event: string;
  date: string;
  time: string;
  actual?: number | string;
  estimate?: number | string;
  previous?: number | string;
  impact: 'high' | 'medium' | 'low';
  unit?: string;
  currency?: string;
}

export interface EconomicIndicator {
  id?: string;
  indicator: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  frequency: string;
  change: number;
  changePercent: number;
  history: Array<{ date: string; value: number }>;
  country?: string;
}

// ============================================
// Corporate Actions Types
// ============================================

export interface DividendEvent {
  ticker: string;
  company?: string;
  exDate: string;
  paymentDate?: string;
  recordDate?: string;
  declarationDate?: string;
  amount: number;
  frequency: string;
  yield: number;
  currency?: string;
}

export interface DividendHistory {
  date: string;
  amount: number;
}

export interface StockSplit {
  ticker: string;
  company?: string;
  date: string;
  ratio: string;
  fromFactor: number;
  toFactor: number;
  announcementDate?: string;
}

export interface IpoEvent {
  ticker?: string;
  company: string;
  date: string;
  priceRangeLow?: number;
  priceRangeHigh?: number;
  priceRange?: string;
  price?: number;
  shares: number;
  expectedValue: number;
  exchange: string;
  status?: 'Filed' | 'Priced' | 'Withdrawn' | 'Scheduled';
  underwriters?: string[];
}

// ============================================
// Forex & Commodities Types
// ============================================

export interface ForexQuote {
  pair: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  rate: number;
  bid: number;
  ask: number;
  spread?: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open?: number;
  previousClose?: number;
  timestamp: string;
}

export interface CommodityPrice {
  symbol: string;
  name: string;
  category: 'metals' | 'energy' | 'agriculture' | 'livestock';
  price: number;
  change: number;
  changePercent: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  unit: string;
  currency?: string;
  timestamp: string;
}

// ============================================
// ETF Types
// ============================================

export interface EtfHolding {
  ticker: string;
  name: string;
  weight: number;
  shares?: number;
  value?: number;
}

export interface EtfSectorBreakdown {
  sector: string;
  weight: number;
}

export interface EtfHoldings {
  ticker: string;
  name: string;
  expenseRatio: number;
  aum: number;
  nav?: number;
  inceptionDate?: string;
  category?: string;
  holdings: EtfHolding[];
  totalHoldings?: number;
  sectorBreakdown: EtfSectorBreakdown[];
  topCountries?: Array<{ country: string; weight: number }>;
}

// ============================================
// Technical Analysis Types
// ============================================

export interface TechnicalIndicatorValue {
  timestamp: string;
  value: number;
}

export interface MACDValue {
  timestamp: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerBandsValue {
  timestamp: string;
  upper: number;
  middle: number;
  lower: number;
}

export interface TechnicalIndicators {
  ticker: string;
  period: string;
  currentPrice?: number;
  indicators: {
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
    sma?: { [period: number]: number[] };
    ema?: { [period: number]: number[] };
    bollingerBands?: { upper: number[]; middle: number[]; lower: number[] };
  };
  timestamps: string[];
  rsi?: {
    value: number;
    signal: 'Overbought' | 'Oversold' | 'Neutral';
    history: TechnicalIndicatorValue[];
  };
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
    trend: 'Bullish' | 'Bearish' | 'Neutral';
    history: MACDValue[];
  };
  sma?: {
    [period: number]: {
      value: number;
      history: TechnicalIndicatorValue[];
    };
  };
  ema?: {
    [period: number]: {
      value: number;
      history: TechnicalIndicatorValue[];
    };
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
    history: BollingerBandsValue[];
  };
  atr?: {
    value: number;
    history: TechnicalIndicatorValue[];
  };
  stochastic?: {
    k: number;
    d: number;
    signal: 'Overbought' | 'Oversold' | 'Neutral';
  };
}

// ============================================
// Company Intelligence Types
// ============================================

export interface CompanyPeer {
  ticker: string;
  name: string;
  marketCap?: number;
  sector?: string;
  industry?: string;
}

export interface CompanyPeers {
  ticker: string;
  company?: string;
  sector?: string;
  industry?: string;
  peers: Array<string | CompanyPeer>;
}

export interface SupplyChainRelation {
  ticker?: string;
  name: string;
  relationship?: 'supplier' | 'customer';
  exposure?: number; // percentage of revenue
  country?: string;
}

export interface SupplyChainData {
  ticker: string;
  company?: string;
  suppliers: SupplyChainRelation[];
  customers: SupplyChainRelation[];
}

// ============================================
// ESG Types
// ============================================

export interface EsgScores {
  ticker: string;
  company?: string;
  totalScore: number;
  environmentScore: number;
  socialScore: number;
  governanceScore: number;
  environmentGrade?: string;
  socialGrade?: string;
  governanceGrade?: string;
  controversyLevel: number; // 0-5, 5 being most severe
  peerGroup: string;
  peerAverage?: number;
  peerRank?: number;
  peerCount?: number;
  lastUpdated: string;
  highlights?: {
    strengths: string[];
    weaknesses: string[];
  };
}
