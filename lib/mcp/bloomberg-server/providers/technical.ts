/**
 * Technical Analysis Provider
 * Calculates technical indicators from historical price data
 */

import type { TechnicalIndicators } from "../types";
import { getHistoricalPrices, type HistoricalTimeframe } from "./yahoo-finance";

const SUPPORTED_TIMEFRAMES: HistoricalTimeframe[] = [
  "1D",
  "1W",
  "1M",
  "3M",
  "6M",
  "1Y",
  "5Y",
  "YTD",
];

export async function calculateTechnicalIndicators(
  ticker: string,
  indicators: string[],
  period: string = "1M"
): Promise<TechnicalIndicators> {
  const timeframe = SUPPORTED_TIMEFRAMES.includes(period as HistoricalTimeframe)
    ? (period as HistoricalTimeframe)
    : "1M";

  const history = await getHistoricalPrices(ticker, timeframe);
  const prices = history.map((p) => p.close);
  const timestamps = history.map((p) => p.ts);

  const response: TechnicalIndicators = {
    ticker: ticker.toUpperCase(),
    period: timeframe,
    indicators: {},
    timestamps,
  };

  const normalized = indicators.map((i) => i.toLowerCase());

  if (normalized.includes("rsi")) {
    response.indicators.rsi = calculateRSI(prices);
  }

  if (normalized.includes("macd")) {
    response.indicators.macd = calculateMACD(prices);
  }

  const smaPeriods = normalized
    .filter((i) => i.startsWith("sma"))
    .map((i) => Number(i.replace("sma", "")))
    .filter((p) => Number.isFinite(p) && p > 0);
  if (normalized.includes("sma") && smaPeriods.length === 0) smaPeriods.push(20);
  if (smaPeriods.length > 0) {
    response.indicators.sma = {};
    for (const p of smaPeriods) {
      response.indicators.sma[p] = calculateSMA(prices, p);
    }
  }

  const emaPeriods = normalized
    .filter((i) => i.startsWith("ema"))
    .map((i) => Number(i.replace("ema", "")))
    .filter((p) => Number.isFinite(p) && p > 0);
  if (normalized.includes("ema") && emaPeriods.length === 0) emaPeriods.push(20);
  if (emaPeriods.length > 0) {
    response.indicators.ema = {};
    for (const p of emaPeriods) {
      response.indicators.ema[p] = calculateEMA(prices, p);
    }
  }

  if (normalized.includes("bollinger") || normalized.includes("bollingerbands")) {
    response.indicators.bollingerBands = calculateBollingerBands(prices);
  }

  return response;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length === 0) return [];
  const rsi: number[] = Array(prices.length).fill(0);
  if (prices.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i += 1) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  gains /= period;
  losses /= period;

  rsi[period] = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);

  for (let i = period + 1; i < prices.length; i += 1) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    gains = (gains * (period - 1) + gain) / period;
    losses = (losses * (period - 1) + loss) / period;

    rsi[i] = losses === 0 ? 100 : 100 - 100 / (1 + gains / losses);
  }

  return rsi.map((value) => Number(value.toFixed(2)));
}

function calculateMACD(prices: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = prices.map((_, i) => ema12[i] - ema26[i]);
  const signal = calculateEMA(macd, 9);
  const histogram = macd.map((value, i) => value - signal[i]);

  return {
    macd: macd.map((v) => Number(v.toFixed(4))),
    signal: signal.map((v) => Number(v.toFixed(4))),
    histogram: histogram.map((v) => Number(v.toFixed(4))),
  };
}

function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const sma: number[] = Array(prices.length).fill(0);

  for (let i = period - 1; i < prices.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += prices[j];
    sma[i] = sum / period;
  }

  return sma.map((value) => Number(value.toFixed(4)));
}

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  const ema: number[] = Array(prices.length).fill(0);
  const multiplier = 2 / (period + 1);

  ema[0] = prices[0];
  for (let i = 1; i < prices.length; i += 1) {
    ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
  }

  return ema.map((value) => Number(value.toFixed(4)));
}

function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(prices, period);
  const upper: number[] = Array(prices.length).fill(0);
  const lower: number[] = Array(prices.length).fill(0);

  for (let i = period - 1; i < prices.length; i += 1) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j += 1) sum += prices[j];
    const mean = sum / period;

    let variance = 0;
    for (let j = i - period + 1; j <= i; j += 1) {
      variance += (prices[j] - mean) ** 2;
    }

    const deviation = Math.sqrt(variance / period);
    upper[i] = mean + stdDev * deviation;
    lower[i] = mean - stdDev * deviation;
  }

  return {
    upper: upper.map((v) => Number(v.toFixed(4))),
    middle: middle.map((v) => Number(v.toFixed(4))),
    lower: lower.map((v) => Number(v.toFixed(4))),
  };
}
