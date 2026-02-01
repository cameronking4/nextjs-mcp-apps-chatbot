/**
 * Screener Metadata and Normalization
 *
 * Provides LLM-friendly sector aliases, market cap mappings, and URL builders
 * for Finviz and FMP APIs. The LLM can pass simple terms like "energy" or "tech"
 * and this module handles the translation.
 */

export interface ScreenerFilters {
  sector?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minDividendYield?: number;
  maxDividendYield?: number;
  minVolume?: number;
  limit?: number;
}

/**
 * Sector aliases - LLM can use any of these natural language terms
 * Maps to Finviz filter parameter (sec_*)
 */
const SECTOR_TO_FINVIZ: Record<string, string> = {
  // Energy
  energy: "sec_energy",
  oil: "sec_energy",
  "oil & gas": "sec_energy",
  "oil and gas": "sec_energy",
  petroleum: "sec_energy",

  // Technology
  technology: "sec_technology",
  tech: "sec_technology",
  software: "sec_technology",
  it: "sec_technology",
  "information technology": "sec_technology",

  // Healthcare
  healthcare: "sec_healthcare",
  health: "sec_healthcare",
  "health care": "sec_healthcare",
  pharma: "sec_healthcare",
  pharmaceutical: "sec_healthcare",
  biotech: "sec_healthcare",
  biotechnology: "sec_healthcare",
  medical: "sec_healthcare",

  // Financials
  financials: "sec_financial",
  financial: "sec_financial",
  finance: "sec_financial",
  banks: "sec_financial",
  banking: "sec_financial",
  insurance: "sec_financial",

  // Consumer Discretionary / Cyclical
  "consumer discretionary": "sec_consumercyclical",
  "consumer cyclical": "sec_consumercyclical",
  retail: "sec_consumercyclical",
  discretionary: "sec_consumercyclical",
  automotive: "sec_consumercyclical",
  auto: "sec_consumercyclical",

  // Consumer Staples / Defensive
  "consumer staples": "sec_consumerdefensive",
  "consumer defensive": "sec_consumerdefensive",
  staples: "sec_consumerdefensive",
  defensive: "sec_consumerdefensive",
  food: "sec_consumerdefensive",
  beverage: "sec_consumerdefensive",

  // Industrials
  industrials: "sec_industrials",
  industrial: "sec_industrials",
  manufacturing: "sec_industrials",
  aerospace: "sec_industrials",
  defense: "sec_industrials",

  // Materials
  materials: "sec_basicmaterials",
  "basic materials": "sec_basicmaterials",
  mining: "sec_basicmaterials",
  metals: "sec_basicmaterials",
  chemicals: "sec_basicmaterials",

  // Utilities
  utilities: "sec_utilities",
  utility: "sec_utilities",
  electric: "sec_utilities",
  power: "sec_utilities",

  // Real Estate
  "real estate": "sec_realestate",
  realestate: "sec_realestate",
  reits: "sec_realestate",
  reit: "sec_realestate",
  property: "sec_realestate",

  // Communication Services
  "communication services": "sec_communicationservices",
  communications: "sec_communicationservices",
  communication: "sec_communicationservices",
  telecom: "sec_communicationservices",
  telecommunications: "sec_communicationservices",
  media: "sec_communicationservices",
  entertainment: "sec_communicationservices",
};

/**
 * Sector mapping to FMP API sector names
 */
const SECTOR_TO_FMP: Record<string, string> = {
  energy: "Energy",
  oil: "Energy",
  "oil & gas": "Energy",
  "oil and gas": "Energy",
  petroleum: "Energy",

  technology: "Technology",
  tech: "Technology",
  software: "Technology",
  it: "Technology",
  "information technology": "Technology",

  healthcare: "Healthcare",
  health: "Healthcare",
  "health care": "Healthcare",
  pharma: "Healthcare",
  pharmaceutical: "Healthcare",
  biotech: "Healthcare",
  biotechnology: "Healthcare",
  medical: "Healthcare",

  financials: "Financial Services",
  financial: "Financial Services",
  finance: "Financial Services",
  banks: "Financial Services",
  banking: "Financial Services",
  insurance: "Financial Services",

  "consumer discretionary": "Consumer Cyclical",
  "consumer cyclical": "Consumer Cyclical",
  retail: "Consumer Cyclical",
  discretionary: "Consumer Cyclical",
  automotive: "Consumer Cyclical",
  auto: "Consumer Cyclical",

  "consumer staples": "Consumer Defensive",
  "consumer defensive": "Consumer Defensive",
  staples: "Consumer Defensive",
  defensive: "Consumer Defensive",
  food: "Consumer Defensive",
  beverage: "Consumer Defensive",

  industrials: "Industrials",
  industrial: "Industrials",
  manufacturing: "Industrials",
  aerospace: "Industrials",
  defense: "Industrials",

  materials: "Basic Materials",
  "basic materials": "Basic Materials",
  mining: "Basic Materials",
  metals: "Basic Materials",
  chemicals: "Basic Materials",

  utilities: "Utilities",
  utility: "Utilities",
  electric: "Utilities",
  power: "Utilities",

  "real estate": "Real Estate",
  realestate: "Real Estate",
  reits: "Real Estate",
  reit: "Real Estate",
  property: "Real Estate",

  "communication services": "Communication Services",
  communications: "Communication Services",
  communication: "Communication Services",
  telecom: "Communication Services",
  telecommunications: "Communication Services",
  media: "Communication Services",
  entertainment: "Communication Services",
};

/**
 * Market cap ranges with Finviz filter names
 */
interface MarketCapRange {
  min?: number;
  max?: number;
  finviz: string;
}

const MARKET_CAP_RANGES: MarketCapRange[] = [
  { max: 50_000_000, finviz: "cap_nano" },
  { min: 50_000_000, max: 300_000_000, finviz: "cap_micro" },
  { min: 300_000_000, max: 2_000_000_000, finviz: "cap_small" },
  { min: 2_000_000_000, max: 10_000_000_000, finviz: "cap_mid" },
  { min: 10_000_000_000, max: 200_000_000_000, finviz: "cap_large" },
  { min: 200_000_000_000, finviz: "cap_mega" },
];

/**
 * P/E ratio ranges for Finviz
 */
const PE_FILTERS: Record<string, string> = {
  low: "fa_pe_low", // < 15
  profitable: "fa_pe_profitable", // > 0
  high: "fa_pe_high", // > 50
};

/**
 * Dividend yield ranges for Finviz
 */
const DIVIDEND_FILTERS: Record<string, string> = {
  positive: "fa_div_pos", // > 0%
  high: "fa_div_high", // > 5%
  veryhigh: "fa_div_veryhigh", // > 10%
};

/**
 * Normalize sector input to lowercase for lookup
 */
export function normalizeSectorInput(input: string): string {
  return input.toLowerCase().trim();
}

/**
 * Get Finviz sector filter from natural language input
 */
export function getSectorFinvizFilter(sector: string): string | null {
  const normalized = normalizeSectorInput(sector);
  return SECTOR_TO_FINVIZ[normalized] || null;
}

/**
 * Get FMP sector name from natural language input
 */
export function getSectorFmpName(sector: string): string | null {
  const normalized = normalizeSectorInput(sector);
  return SECTOR_TO_FMP[normalized] || null;
}

/**
 * Get best matching Finviz market cap filter based on min/max values
 */
export function getMarketCapFinvizFilter(
  minCap?: number,
  maxCap?: number
): string | null {
  if (!minCap && !maxCap) return null;

  // Find the best matching range
  for (const range of MARKET_CAP_RANGES) {
    const matchesMin = !minCap || (range.min !== undefined && range.min >= minCap);
    const matchesMax = !maxCap || (range.max !== undefined && range.max <= maxCap);

    // For min market cap filter, find ranges that start at or above
    if (minCap && !maxCap) {
      if (range.min !== undefined && range.min >= minCap * 0.5) {
        return range.finviz;
      }
    }

    // For max market cap filter, find ranges that end at or below
    if (maxCap && !minCap) {
      if (range.max !== undefined && range.max <= maxCap * 1.5) {
        return range.finviz;
      }
    }

    // For both, find overlapping range
    if (minCap && maxCap && matchesMin && matchesMax) {
      return range.finviz;
    }
  }

  // Default to large cap for high min values
  if (minCap && minCap >= 10_000_000_000) {
    return "cap_largeover"; // $10B+
  }

  return null;
}

/**
 * Build Finviz screener URL from filters
 */
export function buildFinvizUrl(filters: ScreenerFilters): string {
  const baseUrl = "https://finviz.com/screener.ashx";
  const filterParts: string[] = [];

  // Add sector filter
  if (filters.sector) {
    const sectorFilter = getSectorFinvizFilter(filters.sector);
    if (sectorFilter) {
      filterParts.push(sectorFilter);
    }
  }

  // Add market cap filter
  const capFilter = getMarketCapFinvizFilter(
    filters.minMarketCap,
    filters.maxMarketCap
  );
  if (capFilter) {
    filterParts.push(capFilter);
  }

  // Add P/E filter (approximate)
  if (filters.maxPe && filters.maxPe <= 15) {
    filterParts.push(PE_FILTERS.low);
  } else if (filters.minPe && filters.minPe > 0) {
    filterParts.push(PE_FILTERS.profitable);
  }

  // Add dividend filter
  if (filters.minDividendYield) {
    if (filters.minDividendYield >= 10) {
      filterParts.push(DIVIDEND_FILTERS.veryhigh);
    } else if (filters.minDividendYield >= 5) {
      filterParts.push(DIVIDEND_FILTERS.high);
    } else if (filters.minDividendYield > 0) {
      filterParts.push(DIVIDEND_FILTERS.positive);
    }
  }

  // Build URL
  const params = new URLSearchParams({
    v: "111", // Overview view
    f: filterParts.join(","),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Build FMP API query parameters from filters
 */
export function buildFmpParams(
  filters: ScreenerFilters
): Record<string, string> {
  const params: Record<string, string> = {
    limit: String(filters.limit || 50),
  };

  // Add sector
  if (filters.sector) {
    const fmpSector = getSectorFmpName(filters.sector);
    if (fmpSector) {
      params.sector = fmpSector;
    }
  }

  // Add market cap range
  if (filters.minMarketCap) {
    params.marketCapMoreThan = String(filters.minMarketCap);
  }
  if (filters.maxMarketCap) {
    params.marketCapLowerThan = String(filters.maxMarketCap);
  }

  // Add P/E range
  if (filters.minPe) {
    params.priceEarningsRatioMoreThan = String(filters.minPe);
  }
  if (filters.maxPe) {
    params.priceEarningsRatioLowerThan = String(filters.maxPe);
  }

  // Add dividend yield
  if (filters.minDividendYield) {
    params.dividendMoreThan = String(filters.minDividendYield / 100); // FMP uses decimal
  }
  if (filters.maxDividendYield) {
    params.dividendLowerThan = String(filters.maxDividendYield / 100);
  }

  // Add volume filter
  if (filters.minVolume) {
    params.volumeMoreThan = String(filters.minVolume);
  }

  return params;
}

/**
 * Get list of supported sector names for documentation
 */
export function getSupportedSectors(): string[] {
  return [
    "Energy (oil, petroleum)",
    "Technology (tech, software, IT)",
    "Healthcare (health, pharma, biotech)",
    "Financials (banks, insurance)",
    "Consumer Discretionary (retail, automotive)",
    "Consumer Staples (food, beverage)",
    "Industrials (manufacturing, aerospace)",
    "Materials (mining, metals, chemicals)",
    "Utilities (electric, power)",
    "Real Estate (REITs, property)",
    "Communication Services (telecom, media)",
  ];
}
