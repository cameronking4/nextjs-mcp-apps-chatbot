# Bloomberg MCP Server - 18 New Tools Implementation Plan

## Executive Summary

This document outlines the implementation plan for adding 18 new professional-grade tools to the Bloomberg MCP server, expanding coverage from 20 to 38 tools. The new tools fill critical gaps in options analysis, analyst data, economic indicators, corporate actions, forex/commodities, ETFs, technical analysis, and ESG metrics.

## Current State Analysis

### Existing Infrastructure (20 Tools)

**Current Tools:**
- Equity data: `equity_quote`, `equity_fundamentals`, `equity_historical`, `create_chart`
- News: `financial_news`, `news_article`, `news_search`, `trending_news`
- Research: `company_research`, `screener`, `security_search`
- Watchlists: `watchlist_create`, `watchlist_view`
- Trading (mock): `order_place`, `order_status`
- Analytics: `analytics_compare`, `analytics_ratios`
- Market: `market_snapshot`, `earnings_calendar`

**Current Providers:**
- `yahoo-finance.ts` - Primary data source (no API key)
- `finnhub.ts` - News, earnings, company profiles (API key required)
- `finviz.ts` - Sector screening (scraping, no API key)
- `fmp.ts` - Screener fallback (API key optional)
- `firecrawl.ts` - Article scraping (API key required)

**Current UI Views (13):**
- equity-quote, fundamentals, chart, news-feed, news-article
- watchlist, screener, order-form, market-snapshot
- comparison, research, earnings-calendar, ratios

---

## New Tools Overview (18 Total)

### Group 1: Options Analysis (2 tools)
1. **options_chain** - Options chain with Greeks, strikes, expirations
2. **options_unusual_activity** - Unusual volume/OI detection

### Group 2: Analyst & Institutional Data (4 tools)
3. **analyst_ratings** - Buy/hold/sell ratings and consensus
4. **price_targets** - Analyst price targets (high/low/mean)
5. **insider_transactions** - Insider buying/selling activity
6. **institutional_ownership** - Top institutional holders, 13F data

### Group 3: Economic Data (2 tools)
7. **economic_calendar** - Upcoming economic events (GDP, CPI, FOMC)
8. **economic_indicators** - Key indicators (GDP, inflation, unemployment)

### Group 4: Corporate Actions (3 tools)
9. **dividend_calendar** - Ex-dividend dates and history
10. **stock_splits** - Upcoming and historical splits
11. **ipo_calendar** - IPO filings and pricing

### Group 5: Forex & Commodities (2 tools)
12. **forex_quote** - Currency pair quotes (EUR/USD, etc.)
13. **commodities_prices** - Commodity prices (gold, oil, gas)

### Group 6: ETF Analysis (1 tool)
14. **etf_holdings** - ETF holdings, sector breakdown, expense ratio

### Group 7: Technical Analysis (1 tool)
15. **technical_indicators** - RSI, MACD, SMA, EMA, Bollinger Bands

### Group 8: Company Intelligence (2 tools)
16. **company_peers** - Comparable companies in same industry
17. **supply_chain** - Suppliers and customers with revenue exposure

### Group 9: ESG & Sustainability (1 tool)
18. **esg_scores** - Environmental, social, governance scores

---

## Implementation Architecture

### Phase 1: High Impact, Existing Providers (6 tools)
**Timeline:** Week 1
**Complexity:** Low - uses existing Yahoo Finance + Finnhub providers

#### Tools:
1. **analyst_ratings** (Yahoo Finance `quoteSummary.recommendationTrend` + Finnhub `/stock/recommendation`)
2. **insider_transactions** (Yahoo Finance `quoteSummary.insiderTransactions` + Finnhub `/stock/insider-transactions`)
3. **institutional_ownership** (Yahoo Finance `quoteSummary.institutionOwnership`)
4. **options_chain** (Yahoo Finance `options()` module)
5. **company_peers** (Finnhub `/stock/peers` + Yahoo Finance)
6. **esg_scores** (Yahoo Finance `quoteSummary.esgScores`)

#### Implementation Steps:
1. Add new functions to `lib/mcp/bloomberg-server/providers/yahoo-finance.ts`:
   - `getAnalystRatings(ticker)` - Extract from quoteSummary
   - `getInsiderTransactions(ticker, limit)` - Extract from quoteSummary
   - `getInstitutionalOwnership(ticker)` - Extract from quoteSummary
   - `getOptionsChain(ticker, expiration?)` - Use yahoo-finance2 options module
   - `getEsgScores(ticker)` - Extract from quoteSummary

2. Add new functions to `lib/mcp/bloomberg-server/providers/finnhub.ts`:
   - `getAnalystRecommendations(ticker)` - GET `/stock/recommendation`
   - `getInsiderTransactions(ticker, from, to)` - GET `/stock/insider-transactions`
   - `getCompanyPeers(ticker)` - GET `/stock/peers`

3. Create UI views in `lib/mcp/bloomberg-server/ui/`:
   - `analyst-ratings-view.ts` - Rating distribution chart + price targets
   - `insider-activity-view.ts` - Transaction timeline
   - `options-chain-view.ts` - Calls/puts table with Greeks
   - `esg-scores-view.ts` - ESG breakdown visualization

4. Add tools to `app/api/mcp/bloomberg/route.ts` TOOLS array
5. Add tool execution cases to `executeTool()` function
6. Register UI resources in RESOURCES array and `readResource()` function

---

### Phase 2: High Impact, Minor Extensions (5 tools)
**Timeline:** Week 2
**Complexity:** Low-Medium - extends existing providers

#### Tools:
7. **forex_quote** (Yahoo Finance with currency pair format: `EURUSD=X`)
8. **commodities_prices** (Yahoo Finance with commodity tickers: `GC=F`, `CL=F`, `NG=F`)
9. **etf_holdings** (Yahoo Finance `quoteSummary.topHoldings`)
10. **dividend_calendar** (Yahoo Finance historical dividends + Finnhub `/calendar/ipo`)
11. **ipo_calendar** (Finnhub `/calendar/ipo`)

#### Implementation Steps:
1. Add to `lib/mcp/bloomberg-server/providers/yahoo-finance.ts`:
   - `getForexQuote(pair)` - Convert pair to Yahoo format (EUR/USD → EURUSD=X)
   - `getCommodityPrices(commodities[])` - Map to Yahoo tickers
   - `getEtfHoldings(ticker)` - Extract from quoteSummary.topHoldings
   - `getDividendHistory(ticker, from, to)` - Use historical module

2. Add to `lib/mcp/bloomberg-server/providers/finnhub.ts`:
   - `getIpoCalendar(from, to)` - GET `/calendar/ipo`

3. Create UI views:
   - `forex-dashboard-view.ts` - Currency pairs matrix
   - `commodities-dashboard-view.ts` - Commodity prices grid
   - `dividend-calendar-view.ts` - Dividend schedule

4. Add tools and execution logic to route.ts

---

### Phase 3: New Provider Integration (5 tools)
**Timeline:** Week 3
**Complexity:** Medium - requires new provider files

#### Tools:
12. **economic_calendar** (Finnhub `/calendar/economic`)
13. **price_targets** (Finnhub `/stock/price-target`)
14. **supply_chain** (Finnhub `/stock/supply-chain`)
15. **technical_indicators** (Calculate from Yahoo Finance historical data)
16. **stock_splits** (Yahoo Finance historical splits)

#### Implementation Steps:

##### 1. Create `lib/mcp/bloomberg-server/providers/technical.ts`
```typescript
/**
 * Technical Analysis Provider
 * Calculates technical indicators from historical price data
 */

export interface TechnicalIndicators {
  ticker: string;
  period: string;
  indicators: {
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
    sma?: { [period: number]: number[] };
    ema?: { [period: number]: number[] };
    bollingerBands?: { upper: number[]; middle: number[]; lower: number[] };
  };
  timestamps: string[];
}

export async function calculateTechnicalIndicators(
  ticker: string,
  indicators: string[],
  period: string = "1M"
): Promise<TechnicalIndicators>

// Helper functions:
function calculateRSI(prices: number[], period: number = 14): number[]
function calculateMACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] }
function calculateSMA(prices: number[], period: number): number[]
function calculateEMA(prices: number[], period: number): number[]
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2)
```

##### 2. Extend `lib/mcp/bloomberg-server/providers/finnhub.ts`
```typescript
// Add economic calendar
export async function getEconomicCalendar(
  country: string = "US",
  from?: string,
  to?: string
): Promise<EconomicEvent[]>

// Add price targets
export async function getPriceTargets(ticker: string): Promise<PriceTarget>

// Add supply chain
export async function getSupplyChain(ticker: string): Promise<SupplyChainData>
```

##### 3. Extend `lib/mcp/bloomberg-server/providers/yahoo-finance.ts`
```typescript
// Add stock splits
export async function getStockSplits(
  ticker: string,
  from?: string,
  to?: string
): Promise<StockSplit[]>
```

##### 4. Create UI views:
   - `economic-calendar-view.ts` - Calendar view of economic events
   - `technical-chart-view.ts` - Chart with technical indicators overlay

##### 5. Add to types.ts:
```typescript
export interface EconomicEvent {
  id: string;
  country: string;
  event: string;
  date: string;
  actual?: number;
  estimate?: number;
  previous?: number;
  impact: "high" | "medium" | "low";
}

export interface PriceTarget {
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  lastUpdated: string;
}

export interface SupplyChainData {
  ticker: string;
  suppliers: Array<{ name: string; ticker?: string; exposure: number }>;
  customers: Array<{ name: string; ticker?: string; exposure: number }>;
}

export interface StockSplit {
  date: string;
  ratio: string;
  fromFactor: number;
  toFactor: number;
}
```

---

### Phase 4: Advanced Features (2 tools)
**Timeline:** Week 4
**Complexity:** High - requires complex calculations

#### Tools:
17. **options_unusual_activity** - Analyze options volume/OI patterns
18. **economic_indicators** - FRED API integration for economic data

#### Implementation Steps:

##### 1. Extend `lib/mcp/bloomberg-server/providers/yahoo-finance.ts`
```typescript
export async function getUnusualOptionsActivity(
  ticker: string,
  minVolume: number = 1000
): Promise<UnusualOptionsActivity[]> {
  // 1. Get options chain
  // 2. Calculate volume/OI ratios
  // 3. Identify unusual patterns (volume > 2x avg OI)
  // 4. Return sorted by unusualness score
}
```

##### 2. Create `lib/mcp/bloomberg-server/providers/fred.ts`
```typescript
/**
 * FRED (Federal Reserve Economic Data) Provider
 * Free API for economic indicators
 * Register at: https://fred.stlouisfed.org/docs/api/api_key.html
 */

export interface EconomicIndicator {
  indicator: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  frequency: string;
  history: Array<{ date: string; value: number }>;
}

export async function getEconomicIndicator(
  indicator: string,
  country: string = "US"
): Promise<EconomicIndicator>

// Supported indicators:
// - GDP: Gross Domestic Product
// - CPIAUCSL: Consumer Price Index
// - UNRATE: Unemployment Rate
// - FEDFUNDS: Federal Funds Rate
// - DGS10: 10-Year Treasury Rate
```

##### 3. Add FRED API key to `.env.example`:
```
# FRED API (optional - for economic indicators)
FRED_API_KEY=your_fred_api_key_here
```

---

## New UI Views Required

### 1. Options Chain View (`ui/options-chain-view.ts`)
**Resource URI:** `ui://bloomberg/options-chain`
**Features:**
- Split view: Calls on left, Puts on right
- Columns: Strike, Last, Bid, Ask, Volume, OI, IV, Greeks (Delta, Gamma, Theta, Vega)
- Highlight ITM/OTM strikes
- Expiration date selector
- Color-coded by moneyness

### 2. Analyst Ratings View (`ui/analyst-ratings-view.ts`)
**Resource URI:** `ui://bloomberg/analyst-ratings`
**Features:**
- Rating distribution pie chart (Buy/Hold/Sell)
- Price target range visualization
- Analyst consensus trend over time
- Recent rating changes table

### 3. Insider Activity View (`ui/insider-activity-view.ts`)
**Resource URI:** `ui://bloomberg/insider-activity`
**Features:**
- Timeline of transactions
- Buy vs Sell volume chart
- Insider details (name, title, shares, value)
- Net insider sentiment indicator

### 4. Economic Calendar View (`ui/economic-calendar-view.ts`)
**Resource URI:** `ui://bloomberg/economic-calendar`
**Features:**
- Calendar grid view
- Event cards with actual/estimate/previous
- Impact level indicators (high/medium/low)
- Filter by country and event type

### 5. Dividend Calendar View (`ui/dividend-calendar-view.ts`)
**Resource URI:** `ui://bloomberg/dividend-calendar`
**Features:**
- Upcoming ex-dividend dates
- Dividend history chart
- Yield and payout ratio
- Payment schedule

### 6. Forex Dashboard View (`ui/forex-dashboard-view.ts`)
**Resource URI:** `ui://bloomberg/forex-dashboard`
**Features:**
- Currency pairs matrix
- Real-time quotes with sparklines
- Major pairs (EUR/USD, GBP/USD, USD/JPY, etc.)
- Cross rates calculator

### 7. Commodities Dashboard View (`ui/commodities-dashboard-view.ts`)
**Resource URI:** `ui://bloomberg/commodities-dashboard`
**Features:**
- Commodity prices grid
- Categories: Metals, Energy, Agriculture
- Price charts with % change
- Correlation matrix

### 8. Technical Chart View (`ui/technical-chart-view.ts`)
**Resource URI:** `ui://bloomberg/technical-chart`
**Features:**
- Price chart with indicator overlays
- Toggle indicators (RSI, MACD, Bollinger Bands, SMA, EMA)
- Multi-panel layout (price + volume + indicators)
- Crosshair with values

### 9. ESG Scores View (`ui/esg-scores-view.ts`)
**Resource URI:** `ui://bloomberg/esg-scores`
**Features:**
- ESG score breakdown (E, S, G components)
- Peer comparison
- Controversy level indicator
- Score trend over time

---

## Data Provider Mapping

| Tool | Primary Source | Fallback | API Key Required |
|------|---------------|----------|------------------|
| options_chain | Yahoo Finance | - | No |
| options_unusual_activity | Yahoo Finance | - | No |
| analyst_ratings | Yahoo Finance | Finnhub | No (Finnhub: Yes) |
| price_targets | Finnhub | Yahoo Finance | Yes |
| insider_transactions | Yahoo Finance | Finnhub | No (Finnhub: Yes) |
| institutional_ownership | Yahoo Finance | - | No |
| economic_calendar | Finnhub | - | Yes |
| economic_indicators | FRED API | - | Yes (free) |
| dividend_calendar | Yahoo Finance | Finnhub | No |
| stock_splits | Yahoo Finance | - | No |
| ipo_calendar | Finnhub | - | Yes |
| forex_quote | Yahoo Finance | - | No |
| commodities_prices | Yahoo Finance | - | No |
| etf_holdings | Yahoo Finance | - | No |
| technical_indicators | Calculated | - | No |
| company_peers | Finnhub | Yahoo Finance | Yes |
| supply_chain | Finnhub | - | Yes |
| esg_scores | Yahoo Finance | - | No |

---

## API Keys Required

### Already Configured:
- ✅ **Finnhub** - `FINNHUB_API_KEY` (news, earnings, company data)
- ✅ **Firecrawl** - `FIRECRAWL_API_KEY` (article scraping)

### New (Optional):
- 🆕 **FRED** - `FRED_API_KEY` (economic indicators)
  - Free registration: https://fred.stlouisfed.org/docs/api/api_key.html
  - Rate limit: 120 requests/minute
  - No cost

---

## Type Definitions to Add

Add to `lib/mcp/bloomberg-server/types.ts`:

```typescript
// Options
export interface OptionsChain {
  ticker: string;
  expiration: string;
  calls: OptionContract[];
  puts: OptionContract[];
  underlyingPrice: number;
}

export interface OptionContract {
  strike: number;
  last: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  inTheMoney: boolean;
}

export interface UnusualOptionsActivity {
  ticker: string;
  strike: number;
  expiration: string;
  type: "call" | "put";
  volume: number;
  openInterest: number;
  volumeOiRatio: number;
  unusualScore: number;
  lastPrice: number;
}

// Analyst Data
export interface AnalystRatings {
  ticker: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
  consensus: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell";
  priceTarget?: number;
  numberOfAnalysts: number;
}

export interface PriceTarget {
  ticker: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  lastUpdated: string;
}

export interface InsiderTransaction {
  name: string;
  title: string;
  transactionDate: string;
  transactionType: "Buy" | "Sell" | "Option Exercise" | "Gift";
  shares: number;
  pricePerShare: number;
  totalValue: number;
  sharesOwned: number;
}

export interface InstitutionalOwnership {
  ticker: string;
  totalShares: number;
  totalValue: number;
  percentOwned: number;
  holders: Array<{
    name: string;
    shares: number;
    value: number;
    percentOwned: number;
    dateReported: string;
  }>;
}

// Economic Data
export interface EconomicEvent {
  id: string;
  country: string;
  event: string;
  date: string;
  actual?: number;
  estimate?: number;
  previous?: number;
  impact: "high" | "medium" | "low";
  unit?: string;
}

export interface EconomicIndicator {
  indicator: string;
  name: string;
  value: number;
  date: string;
  unit: string;
  frequency: string;
  change: number;
  changePercent: number;
  history: Array<{ date: string; value: number }>;
}

// Corporate Actions
export interface DividendEvent {
  ticker: string;
  exDate: string;
  paymentDate: string;
  recordDate: string;
  amount: number;
  frequency: string;
  yield: number;
}

export interface StockSplit {
  ticker: string;
  date: string;
  ratio: string;
  fromFactor: number;
  toFactor: number;
}

export interface IpoEvent {
  ticker: string;
  company: string;
  date: string;
  priceRange: string;
  shares: number;
  expectedValue: number;
  exchange: string;
}

// Forex & Commodities
export interface ForexQuote {
  pair: string;
  rate: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  timestamp: string;
}

export interface CommodityPrice {
  symbol: string;
  name: string;
  category: "metals" | "energy" | "agriculture";
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  timestamp: string;
}

// ETF
export interface EtfHoldings {
  ticker: string;
  name: string;
  expenseRatio: number;
  aum: number;
  holdings: Array<{
    ticker: string;
    name: string;
    weight: number;
  }>;
  sectorBreakdown: Array<{
    sector: string;
    weight: number;
  }>;
}

// Technical Analysis
export interface TechnicalIndicators {
  ticker: string;
  period: string;
  indicators: {
    rsi?: number[];
    macd?: { macd: number[]; signal: number[]; histogram: number[] };
    sma?: { [period: number]: number[] };
    ema?: { [period: number]: number[] };
    bollingerBands?: { upper: number[]; middle: number[]; lower: number[] };
  };
  timestamps: string[];
}

// Company Intelligence
export interface CompanyPeers {
  ticker: string;
  peers: string[];
}

export interface SupplyChainData {
  ticker: string;
  suppliers: Array<{
    name: string;
    ticker?: string;
    exposure: number;
  }>;
  customers: Array<{
    name: string;
    ticker?: string;
    exposure: number;
  }>;
}

// ESG
export interface EsgScores {
  ticker: string;
  totalScore: number;
  environmentScore: number;
  socialScore: number;
  governanceScore: number;
  controversyLevel: number;
  peerGroup: string;
  peerAverage: number;
  lastUpdated: string;
}
```

---

## Testing Strategy

### Unit Tests
- Test each provider function independently
- Mock API responses
- Validate data transformations

### Integration Tests
- Test tool execution end-to-end
- Verify UI resource generation
- Test error handling and fallbacks

### Manual Testing Checklist
- [ ] All 18 new tools return valid data
- [ ] UI views render correctly
- [ ] Caching works properly
- [ ] Error messages are user-friendly
- [ ] API rate limits are respected
- [ ] Fallback providers work when primary fails

---

## Documentation Updates

### 1. Update README.md
- Add new tools to feature list
- Document new API keys (FRED)
- Update tool count (20 → 38)

### 2. Create Tool Documentation
- Add examples for each new tool
- Document parameters and return types
- Include Bloomberg Terminal equivalents

### 3. Update .env.example
```bash
# FRED API (optional - for economic indicators)
FRED_API_KEY=your_fred_api_key_here
```

---

## Success Metrics

- ✅ 38 total tools (20 existing + 18 new)
- ✅ 22 UI views (13 existing + 9 new)
- ✅ 95%+ uptime for data providers
- ✅ <2s average response time
- ✅ Comprehensive error handling
- ✅ Full TypeScript type coverage

---

## Risk Mitigation

### API Rate Limits
- Implement aggressive caching (already in place)
- Use fallback providers
- Respect rate limits with exponential backoff

### Data Quality
- Validate all API responses
- Handle missing/null data gracefully
- Provide clear error messages

### Maintenance
- Monitor API changes
- Keep dependencies updated
- Document provider quirks

---

## Get Started Dialog
Update table and example prompts with latest capabilities

---

## Next Steps

1. ✅ Review and approve this implementation plan
2. ⏳ Begin Phase 1 implementation
3. ⏳ Set up FRED API key (optional)
4. ⏳ Create feature branch: `feature/bloomberg-new-tools`
5. ⏳ Implement tools incrementally with testing
6. ⏳ Update Get Started Dialog
7. ⏳ Create PR

---

## Appendix: Bloomberg Terminal Command Reference

| New Tool | Bloomberg Command | Description |
|----------|------------------|-------------|
| options_chain | OMON | Options Monitor |
| options_unusual_activity | MOST | Most Active Options |
| analyst_ratings | ANR | Analyst Recommendations |
| price_targets | PT | Price Target |
| insider_transactions | INSD | Insider Trading |
| institutional_ownership | HDS, OWNR | Holders, Ownership |
| economic_calendar | ECO | Economic Calendar |
| economic_indicators | ECST | Economic Statistics |
| dividend_calendar | DVA, DVD | Dividend Analysis/Calendar |
| stock_splits | CACT | Corporate Actions |
| ipo_calendar | IPO | IPO Calendar |
| forex_quote | WCR, FXFC | World Currency Rates |
| commodities_prices | CMD | Commodity Dashboard |
| etf_holdings | MEMB, HLD | Index Members, Holdings |
| technical_indicators | GP, TECH | Graph with indicators |
| company_peers | PEER | Peer Analysis |
| supply_chain | SPLC | Supply Chain |
| esg_scores | ESG | ESG Data |

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-03  
**Author:** Bloomberg MCP Development Team
