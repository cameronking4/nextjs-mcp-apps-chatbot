import type { Equity, Fundamentals, HistoricalPoint, NewsArticle, Index, Watchlist, Order, EarningsEvent, EconomicEvent } from '../types';

// Import mock data
import equitiesData from './equities.json';
import fundamentalsData from './fundamentals.json';
import historicalsData from './historicals.json';
import newsData from './news.json';
import indicesData from './indices.json';
import watchlistsData from './watchlists.json';
import ordersData from './orders.json';
import calendarsData from './calendars.json';
import sectorsData from './sectors.json';

// Type assertions
const equities = equitiesData.equities as Equity[];
const fundamentals = fundamentalsData.fundamentals as Fundamentals[];
const historicals = historicalsData.prices as Record<string, Record<string, HistoricalPoint[]>>;
const articles = newsData.articles as NewsArticle[];
const indices = indicesData.indices as Index[];
const sectors = indicesData.sectors;
const movers = indicesData.movers;
const watchlists = watchlistsData.watchlists as Watchlist[];
const orders = ordersData.orders as Order[];
const earnings = calendarsData.earnings as EarningsEvent[];
const economic = calendarsData.economic as EconomicEvent[];
const sectorDefinitions = sectorsData.sectors;

// State for watchlists and orders
let watchlistsState = [...watchlists];
let ordersState = [...orders];
let nextWatchlistId = Number.parseInt(watchlistsData.nextId.replace('wl-', ''));
let nextOrderId = ordersData.nextOrderId;

// ============================================
// Utility Functions
// ============================================

/**
 * Format currency with locale
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format large numbers with abbreviations
 */
export function formatLargeNumber(value: number): string {
  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format volume
 */
export function formatVolume(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Generate deterministic price update based on ticker
 */
export function generatePriceUpdate(ticker: string, basePrice: number, seed?: number): number {
  const tickerSeed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const timeSeed = seed ?? Date.now();
  const randomFactor = Math.sin(tickerSeed + timeSeed) * 0.5 + 0.5;
  const changePercent = (randomFactor - 0.5) * 0.02; // ±1% max change
  return Number((basePrice * (1 + changePercent)).toFixed(2));
}

/**
 * Simulate real-time quote with small random changes
 */
export function simulateRealtimeQuote(equity: Equity): Equity {
  const newPrice = generatePriceUpdate(equity.ticker, equity.price);
  const change = Number((newPrice - (equity.price - equity.change)).toFixed(2));
  const changePercent = Number(((change / (newPrice - change)) * 100).toFixed(2));
  
  return {
    ...equity,
    price: newPrice,
    change,
    changePercent,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================
// Equity Functions
// ============================================

export function getEquity(ticker: string): Equity | undefined {
  return equities.find(e => e.ticker.toUpperCase() === ticker.toUpperCase());
}

export function getEquities(tickers?: string[]): Equity[] {
  if (!tickers || tickers.length === 0) {
    return equities;
  }
  const upperTickers = tickers.map(t => t.toUpperCase());
  return equities.filter(e => upperTickers.includes(e.ticker.toUpperCase()));
}

export function searchEquities(query: string): Equity[] {
  const lowerQuery = query.toLowerCase();
  return equities.filter(e => 
    e.ticker.toLowerCase().includes(lowerQuery) ||
    e.name.toLowerCase().includes(lowerQuery)
  );
}

export function getEquitiesBySector(sectorId: string): Equity[] {
  return equities.filter(e => e.sector === sectorId);
}

export function screenEquities(filters: {
  sector?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
}): Equity[] {
  return equities.filter(e => {
    if (filters.sector && e.sector !== filters.sector) return false;
    if (filters.minMarketCap && e.marketCap < filters.minMarketCap) return false;
    if (filters.maxMarketCap && e.marketCap > filters.maxMarketCap) return false;
    if (filters.minPe && e.pe < filters.minPe) return false;
    if (filters.maxPe && e.pe > filters.maxPe) return false;
    if (filters.minDividendYield && e.dividendYield < filters.minDividendYield) return false;
    if (filters.maxDividendYield && e.dividendYield > filters.maxDividendYield) return false;
    if (filters.minChangePercent && e.changePercent < filters.minChangePercent) return false;
    if (filters.maxChangePercent && e.changePercent > filters.maxChangePercent) return false;
    return true;
  });
}

// ============================================
// Fundamentals Functions
// ============================================

export function getFundamentals(ticker: string): Fundamentals | undefined {
  return fundamentals.find(f => f.ticker.toUpperCase() === ticker.toUpperCase());
}

export function compareFundamentals(tickers: string[]): Fundamentals[] {
  const upperTickers = tickers.map(t => t.toUpperCase());
  return fundamentals.filter(f => upperTickers.includes(f.ticker.toUpperCase()));
}

// ============================================
// Historical Data Functions
// ============================================

export function getHistoricalPrices(ticker: string, timeframe: '1D' | '1W' | '1M' | '1Y'): HistoricalPoint[] {
  const tickerData = historicals[ticker.toUpperCase()];
  if (!tickerData) return [];
  return tickerData[timeframe] || [];
}

export function generateSparklineData(ticker: string, points = 20): number[] {
  const data = getHistoricalPrices(ticker, '1D');
  if (data.length === 0) {
    const equity = getEquity(ticker);
    if (!equity) return [];
    // Generate synthetic sparkline
    const basePrice = equity.price;
    return Array.from({ length: points }, (_, i) => {
      const variation = Math.sin(i * 0.5) * (basePrice * 0.02);
      return Number((basePrice + variation).toFixed(2));
    });
  }
  return data.slice(-points).map(p => p.close);
}

// ============================================
// News Functions
// ============================================

export function getNews(options?: {
  ticker?: string;
  limit?: number;
  sentiment?: 'bullish' | 'bearish' | 'neutral' | 'mixed';
  importance?: 'high' | 'medium' | 'low';
}): NewsArticle[] {
  let filtered = [...articles];
  
  if (options?.ticker) {
    filtered = filtered.filter(a => a.tickers.includes(options.ticker!.toUpperCase()));
  }
  if (options?.sentiment) {
    filtered = filtered.filter(a => a.sentiment === options.sentiment);
  }
  if (options?.importance) {
    filtered = filtered.filter(a => a.importance === options.importance);
  }
  
  // Sort by date descending
  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }
  
  return filtered;
}

export function getNewsArticle(id: string): NewsArticle | undefined {
  return articles.find(a => a.id === id);
}

// ============================================
// Index Functions
// ============================================

export function getIndices(): Index[] {
  return indices;
}

export function getIndex(symbol: string): Index | undefined {
  return indices.find(i => i.symbol.toUpperCase() === symbol.toUpperCase());
}

export function getSectorPerformance() {
  return sectors;
}

export function getMarketMovers() {
  return movers;
}

// ============================================
// Watchlist Functions
// ============================================

export function getWatchlists(): Watchlist[] {
  return watchlistsState;
}

export function getWatchlist(id: string): Watchlist | undefined {
  return watchlistsState.find(w => w.id === id);
}

export function createWatchlist(name: string, description: string, tickers: string[]): Watchlist {
  const newWatchlist: Watchlist = {
    id: `wl-${String(nextWatchlistId).padStart(3, '0')}`,
    name,
    description,
    tickers: tickers.map(t => t.toUpperCase()),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  nextWatchlistId++;
  watchlistsState.push(newWatchlist);
  return newWatchlist;
}

export function updateWatchlist(id: string, updates: { name?: string; description?: string; tickers?: string[] }): Watchlist | undefined {
  const index = watchlistsState.findIndex(w => w.id === id);
  if (index === -1) return undefined;
  
  watchlistsState[index] = {
    ...watchlistsState[index],
    ...updates,
    tickers: updates.tickers?.map(t => t.toUpperCase()) ?? watchlistsState[index].tickers,
    updatedAt: new Date().toISOString(),
  };
  
  return watchlistsState[index];
}

export function deleteWatchlist(id: string): boolean {
  const index = watchlistsState.findIndex(w => w.id === id);
  if (index === -1) return false;
  watchlistsState.splice(index, 1);
  return true;
}

export function getWatchlistWithPrices(id: string): { watchlist: Watchlist; equities: Equity[] } | undefined {
  const watchlist = getWatchlist(id);
  if (!watchlist) return undefined;
  const watchlistEquities = getEquities(watchlist.tickers);
  return { watchlist, equities: watchlistEquities };
}

// ============================================
// Order Functions
// ============================================

export function getOrders(status?: 'pending' | 'filled' | 'cancelled'): Order[] {
  if (status) {
    return ordersState.filter(o => o.status === status);
  }
  return ordersState;
}

export function getOrder(id: string): Order | undefined {
  return ordersState.find(o => o.id === id);
}

export function placeOrder(order: {
  ticker: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  qty: number;
  price?: number;
}): Order {
  const equity = getEquity(order.ticker);
  const currentPrice = equity?.price ?? 100;
  
  const isMarketOrder = order.type === 'market';
  const fillPrice = isMarketOrder ? currentPrice : null;
  const status = isMarketOrder ? 'filled' : 'pending';
  const now = new Date().toISOString();
  
  const newOrder: Order = {
    id: `ord-${String(nextOrderId).padStart(3, '0')}`,
    ticker: order.ticker.toUpperCase(),
    side: order.side,
    type: order.type,
    qty: order.qty,
    price: order.price ?? null,
    filledPrice: fillPrice,
    status,
    createdAt: now,
    filledAt: isMarketOrder ? now : null,
    fills: isMarketOrder ? [{ qty: order.qty, price: currentPrice, time: now }] : [],
  };
  
  nextOrderId++;
  ordersState.push(newOrder);
  return newOrder;
}

export function cancelOrder(id: string): Order | undefined {
  const index = ordersState.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  if (ordersState[index].status !== 'pending') return undefined;
  
  ordersState[index] = {
    ...ordersState[index],
    status: 'cancelled',
  };
  
  return ordersState[index];
}

// ============================================
// Calendar Functions
// ============================================

export function getEarningsCalendar(options?: {
  ticker?: string;
  startDate?: string;
  endDate?: string;
}): EarningsEvent[] {
  let filtered = [...earnings];
  
  if (options?.ticker) {
    filtered = filtered.filter(e => e.ticker.toUpperCase() === options.ticker!.toUpperCase());
  }
  if (options?.startDate) {
    filtered = filtered.filter(e => new Date(e.eventTime) >= new Date(options.startDate!));
  }
  if (options?.endDate) {
    filtered = filtered.filter(e => new Date(e.eventTime) <= new Date(options.endDate!));
  }
  
  filtered.sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());
  return filtered;
}

export function getEconomicCalendar(options?: {
  importance?: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
}): EconomicEvent[] {
  let filtered = [...economic];
  
  if (options?.importance) {
    filtered = filtered.filter(e => e.importance === options.importance);
  }
  if (options?.startDate) {
    filtered = filtered.filter(e => {
      const date = e.eventTime || e.date;
      return date ? new Date(date) >= new Date(options.startDate!) : false;
    });
  }
  if (options?.endDate) {
    filtered = filtered.filter(e => {
      const date = e.eventTime || e.date;
      return date ? new Date(date) <= new Date(options.endDate!) : false;
    });
  }
  
  filtered.sort((a, b) => {
    const aDate = new Date(a.eventTime || a.date || 0).getTime();
    const bDate = new Date(b.eventTime || b.date || 0).getTime();
    return aDate - bDate;
  });
  return filtered;
}

// ============================================
// Sector Functions
// ============================================

export function getSectors() {
  return sectorDefinitions;
}

export function getSector(id: string) {
  return sectorDefinitions.find(s => s.id === id);
}

// ============================================
// Analytics Functions
// ============================================

export function compareSecurities(tickers: string[]): {
  equities: Equity[];
  fundamentals: Fundamentals[];
} {
  return {
    equities: getEquities(tickers),
    fundamentals: compareFundamentals(tickers),
  };
}

export function calculateRatios(ticker: string): {
  ticker: string;
  valuation: { pe: number; forwardPe: number; peg: number; priceToBook: number; priceToSales: number };
  profitability: { grossMargin: number; operatingMargin: number; netMargin: number; roe: number; roa: number };
  liquidity: { currentRatio: number; quickRatio: number };
  leverage: { debtToEquity: number };
} | undefined {
  const fund = getFundamentals(ticker);
  if (!fund) return undefined;
  
  return {
    ticker: fund.ticker,
    valuation: {
      pe: fund.pe,
      forwardPe: fund.forwardPe,
      peg: fund.peg,
      priceToBook: fund.priceToBook,
      priceToSales: fund.priceToSales,
    },
    profitability: {
      grossMargin: fund.grossMargin,
      operatingMargin: fund.operatingMargin,
      netMargin: fund.netMargin,
      roe: fund.roe,
      roa: fund.roa,
    },
    liquidity: {
      currentRatio: fund.currentRatio,
      quickRatio: fund.quickRatio,
    },
    leverage: {
      debtToEquity: fund.debtToEquity,
    },
  };
}

// ============================================
// Market Snapshot
// ============================================

export function getMarketSnapshot() {
  return {
    indices: getIndices(),
    sectors: getSectorPerformance(),
    movers: getMarketMovers(),
    lastUpdated: new Date().toISOString(),
  };
}
