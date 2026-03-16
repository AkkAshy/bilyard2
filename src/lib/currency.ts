"use client";

import { useState, useEffect } from "react";
import { tenants } from "./api";

// Кэш символа валюты (чтобы не дёргать API на каждом рендере)
let cachedSymbol: string = "";
let fetchPromise: Promise<string> | null = null;

/**
 * Загружает currency_symbol из настроек тенанта (с кэшированием)
 */
async function loadCurrencySymbol(): Promise<string> {
  if (cachedSymbol !== "") return cachedSymbol;

  // Если уже загружаем — ждём тот же промис
  if (fetchPromise) return fetchPromise;

  fetchPromise = tenants
    .getSettings()
    .then((settings) => {
      cachedSymbol = settings.currency_symbol || "сум";
      return cachedSymbol;
    })
    .catch(() => {
      return "сум"; // fallback
    })
    .finally(() => {
      fetchPromise = null;
    });

  return fetchPromise;
}

/**
 * Сбросить кэш (вызвать после смены валюты в настройках)
 */
export function resetCurrencyCache() {
  cachedSymbol = "";
}

/**
 * Хук для получения символа валюты
 */
export function useCurrencySymbol(): string {
  const [symbol, setSymbol] = useState(cachedSymbol || "...");

  useEffect(() => {
    loadCurrencySymbol().then(setSymbol);
  }, []);

  return symbol;
}

/**
 * Форматирование цены с символом валюты
 */
export function formatPrice(amount: number | undefined | null, symbol: string): string {
  if (amount === undefined || amount === null) return "—";
  return amount.toLocaleString("ru-RU") + " " + symbol;
}
