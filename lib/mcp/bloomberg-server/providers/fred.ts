/**
 * FRED (Federal Reserve Economic Data) Provider
 */

import type { EconomicIndicator } from "../types";
import { cache, CACHE_TTL } from "./cache";

const FRED_API_KEY = process.env.FRED_API_KEY || "";
const FRED_BASE_URL = "https://api.stlouisfed.org/fred";

export function isFredConfigured(): boolean {
  return Boolean(FRED_API_KEY);
}

async function fetchFred<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  if (!FRED_API_KEY) {
    console.warn("FRED_API_KEY not set, skipping FRED request");
    return null;
  }

  const url = new URL(`${FRED_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", FRED_API_KEY);
  url.searchParams.set("file_type", "json");

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error(`FRED API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("FRED fetch error:", error);
    return null;
  }
}

const parseValue = (value: string): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function getEconomicIndicator(
  indicator: string,
  country: string = "US"
): Promise<EconomicIndicator | null> {
  const cacheKey = `fred:${indicator}:${country}`;
  const cached = cache.get<EconomicIndicator>(cacheKey);
  if (cached) return cached;

  const [series, observations] = await Promise.all([
    fetchFred<{ seriess: Array<{ title: string; units: string; frequency: string }> }>(
      "/series",
      { series_id: indicator }
    ),
    fetchFred<{ observations: Array<{ date: string; value: string }> }>(
      "/series/observations",
      {
        series_id: indicator,
        sort_order: "asc",
        limit: "200",
      }
    ),
  ]);

  if (!observations?.observations?.length) return null;

  const history = observations.observations
    .map((obs) => ({ date: obs.date, value: parseValue(obs.value) }))
    .filter((obs): obs is { date: string; value: number } => obs.value !== null);

  if (history.length === 0) return null;

  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const change = previous ? latest.value - previous.value : 0;
  const changePercent = previous && previous.value !== 0 ? (change / previous.value) * 100 : 0;

  const result: EconomicIndicator = {
    indicator,
    name: series?.seriess?.[0]?.title || indicator,
    value: latest.value,
    date: latest.date,
    unit: series?.seriess?.[0]?.units || "",
    frequency: series?.seriess?.[0]?.frequency || "",
    change,
    changePercent,
    history,
  };

  cache.set(cacheKey, result, CACHE_TTL.FUNDAMENTALS);
  return result;
}
