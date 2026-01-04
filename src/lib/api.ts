/**
 * API клиент для Django backend
 */

import type { Category, Asset, AssetWithSession, RentalSession } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Токены хранятся в localStorage
const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
};

const getRefreshToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
};

const getTenantId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("tenant_id");
};

// Сохранение токенов
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
};

export const setTenantId = (tenantId: string) => {
  localStorage.setItem("tenant_id", tenantId);
};

export const clearAuth = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("tenant_id");
};

// Базовый fetch с авторизацией
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();
  const tenantId = getTenantId();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  if (tenantId) {
    (headers as Record<string, string>)["X-Tenant-ID"] = tenantId;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Если 401 - пробуем обновить токен
  if (response.status === 401) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTokens(data.access, data.refresh || refreshToken);

        // Повторяем запрос с новым токеном
        (headers as Record<string, string>)["Authorization"] = `Bearer ${data.access}`;
        return fetch(`${API_URL}${endpoint}`, { ...options, headers });
      }
    }

    // Если обновить не удалось - выходим
    clearAuth();
    window.location.href = "/login";
  }

  return response;
}

// ==================== AUTH ====================

export const auth = {
  async login(username: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Ошибка авторизации");
    }

    const data = await response.json();
    setTokens(data.access, data.refresh);

    // Автоматически выбираем первое заведение
    if (data.tenants?.length > 0) {
      setTenantId(data.tenants[0].id);
    }

    return data;
  },

  async me() {
    const response = await fetchWithAuth("/auth/me/");
    if (!response.ok) throw new Error("Не авторизован");
    return response.json();
  },

  logout() {
    clearAuth();
    window.location.href = "/login";
  },
};

// ==================== TENANTS ====================

export const tenants = {
  async list() {
    const response = await fetchWithAuth("/tenants/");
    return response.json();
  },

  async get(id: number) {
    const response = await fetchWithAuth(`/tenants/${id}/`);
    return response.json();
  },

  async getSettings() {
    const tenantId = getTenantId();
    const response = await fetchWithAuth(`/tenants/${tenantId}/settings/`);
    return response.json();
  },

  async updateSettings(data: Record<string, unknown>) {
    const tenantId = getTenantId();
    const response = await fetchWithAuth(`/tenants/${tenantId}/settings/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

// ==================== CATEGORIES ====================

// Хелпер для обработки пагинированных ответов
function extractResults<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : (data.results || []);
}

export const categories = {
  async list(): Promise<Category[]> {
    const response = await fetchWithAuth("/categories/");
    const data = await response.json();
    return extractResults<Category>(data);
  },

  async get(id: number) {
    const response = await fetchWithAuth(`/categories/${id}/`);
    return response.json();
  },

  async create(data: Record<string, unknown>) {
    const response = await fetchWithAuth("/categories/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async update(id: number, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`/categories/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(id: number) {
    await fetchWithAuth(`/categories/${id}/`, { method: "DELETE" });
  },
};

// ==================== ASSETS ====================

export const assets = {
  async list(params?: { category?: number; active?: boolean }): Promise<AssetWithSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set("category", String(params.category));
    if (params?.active !== undefined) searchParams.set("active", String(params.active));

    const query = searchParams.toString();
    const response = await fetchWithAuth(`/assets/${query ? `?${query}` : ""}`);
    const data = await response.json();
    return extractResults<AssetWithSession>(data);
  },

  async get(id: number) {
    const response = await fetchWithAuth(`/assets/${id}/`);
    return response.json();
  },

  async create(data: Record<string, unknown>) {
    const response = await fetchWithAuth("/assets/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async update(id: number, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`/assets/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async delete(id: number) {
    await fetchWithAuth(`/assets/${id}/`, { method: "DELETE" });
  },

  async getSessions(id: number) {
    const response = await fetchWithAuth(`/assets/${id}/sessions/`);
    return response.json();
  },
};

// ==================== SESSIONS ====================

export const sessions = {
  async list(params?: { asset?: number; status?: string; from?: string; to?: string }): Promise<RentalSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.asset) searchParams.set("asset", String(params.asset));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const query = searchParams.toString();
    const response = await fetchWithAuth(`/sessions/${query ? `?${query}` : ""}`);
    const data = await response.json();
    return extractResults<RentalSession>(data);
  },

  async start(assetId: number, plannedDuration?: number, fixedPrice?: number) {
    const response = await fetchWithAuth("/sessions/start/", {
      method: "POST",
      body: JSON.stringify({
        asset_id: assetId,
        planned_duration: plannedDuration,
        fixed_price: fixedPrice,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Ошибка запуска сессии");
    }

    return response.json();
  },

  async stop(id: string, paymentType: "cash" | "card" | "transfer", promotionCode?: string) {
    const response = await fetchWithAuth(`/sessions/${id}/stop/`, {
      method: "POST",
      body: JSON.stringify({
        payment_type: paymentType,
        promotion_code: promotionCode
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Ошибка завершения сессии");
    }

    return response.json();
  },

  async cancel(id: string) {
    const response = await fetchWithAuth(`/sessions/${id}/cancel/`, {
      method: "POST",
    });
    return response.json();
  },
};

// ==================== PRICING ====================

export const pricing = {
  async listRules() {
    const response = await fetchWithAuth("/pricing/rules/");
    return response.json();
  },

  async createRule(data: Record<string, unknown>) {
    const response = await fetchWithAuth("/pricing/rules/", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateRule(id: number, data: Record<string, unknown>) {
    const response = await fetchWithAuth(`/pricing/rules/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteRule(id: number) {
    await fetchWithAuth(`/pricing/rules/${id}/`, { method: "DELETE" });
  },
};

// ==================== PROMOTIONS ====================

export const promotions = {
  async list() {
    const response = await fetchWithAuth("/promotions/");
    return response.json();
  },

  async validate(code: string) {
    const response = await fetchWithAuth("/promotions/validate/", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    return response.json();
  },
};

// ==================== REPORTS ====================

export const reports = {
  async summary(params?: { from?: string; to?: string; groupBy?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.groupBy) searchParams.set("groupBy", params.groupBy);

    const query = searchParams.toString();
    const response = await fetchWithAuth(`/reports/summary/${query ? `?${query}` : ""}`);
    return response.json();
  },

  async revenue(params?: { from?: string; to?: string; groupBy?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.groupBy) searchParams.set("groupBy", params.groupBy);

    const query = searchParams.toString();
    const response = await fetchWithAuth(`/reports/revenue/${query ? `?${query}` : ""}`);
    return response.json();
  },

  async assets(params?: { from?: string; to?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    const query = searchParams.toString();
    const response = await fetchWithAuth(`/reports/assets/${query ? `?${query}` : ""}`);
    return response.json();
  },

  getExportUrl(format: "xlsx" | "pdf", params?: { from?: string; to?: string }) {
    const searchParams = new URLSearchParams();
    searchParams.set("format", format);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);

    return `${API_URL}/reports/export/?${searchParams.toString()}`;
  },
};

// ==================== IOT ====================

export const iot = {
  async listDevices() {
    const response = await fetchWithAuth("/iot/devices/");
    return response.json();
  },

  async sendCommand(deviceId: number, action: "on" | "off", gpioPin?: number) {
    const response = await fetchWithAuth(`/iot/devices/${deviceId}/command/`, {
      method: "POST",
      body: JSON.stringify({ action, gpio_pin: gpioPin || 2 }),
    });
    return response.json();
  },

  async getDeviceStatus(deviceId: number) {
    const response = await fetchWithAuth(`/iot/devices/${deviceId}/status/`);
    return response.json();
  },
};
