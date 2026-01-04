"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ReportSummary } from "@/types";
import { reports } from "@/lib/api";

// Форматирование цены
function formatPrice(amount: number): string {
  return amount.toLocaleString("ru-RU") + " сум";
}

// Форматирование даты для input
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month" | "year">("day");

  // Фильтры по дате
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatDateForInput(d);
  });
  const [toDate, setToDate] = useState(() => formatDateForInput(new Date()));

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await reports.summary({
          from: fromDate,
          to: toDate,
          groupBy,
        });
        setData(result);
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate, groupBy, router]);

  // Экспорт
  const handleExport = async (format: "xlsx" | "pdf") => {
    const token = localStorage.getItem("access_token");
    const tenantId = localStorage.getItem("tenant_id");

    if (!token || !tenantId) {
      alert("Не авторизован");
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const url = `${API_URL}/reports/export/?format=${format}&from=${fromDate}&to=${toDate}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-Tenant-ID": tenantId,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка экспорта");
      }

      // Скачиваем файл
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `report_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export error:", error);
      alert("Ошибка при экспорте отчёта");
    }
  };

  // Максимальное значение для графика
  const maxRevenue = data?.by_period?.length
    ? Math.max(...data.by_period.map(p => p.revenue || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Отчёты</h1>

          {/* Экспорт */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExport("xlsx")}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">От</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">До</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Группировка</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="day">По дням</option>
                <option value="week">По неделям</option>
                <option value="month">По месяцам</option>
                <option value="year">По годам</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            {/* Сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-900/40 to-gray-800 rounded-xl p-5 border border-green-500/30">
                <div className="text-sm text-gray-400 mb-1">Выручка</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatPrice(data.totals.revenue)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Сессий</div>
                <div className="text-2xl font-bold text-white">
                  {data.totals.sessions}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Средний чек</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {formatPrice(data.totals.avg_check)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Ср. длительность</div>
                <div className="text-2xl font-bold text-blue-400">
                  {Math.round(data.totals.avg_duration)} мин
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700/50">
                <div className="text-sm text-gray-400 mb-1">Загрузка</div>
                <div className="text-2xl font-bold text-purple-400">
                  {data.totals.occupancy_rate}%
                </div>
              </div>
            </div>

            {/* График */}
            {data.by_period && data.by_period.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700/50">
                <h2 className="text-lg font-semibold text-white mb-4">Выручка по периодам</h2>
                <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                  {data.by_period.map((period, i) => {
                    const height = maxRevenue > 0
                      ? ((period.revenue || 0) / maxRevenue) * 100
                      : 0;
                    return (
                      <div key={i} className="flex flex-col items-center min-w-[60px]">
                        <div className="text-xs text-gray-400 mb-1">
                          {formatPrice(period.revenue || 0)}
                        </div>
                        <div
                          className="w-10 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
                          {period.period ? new Date(period.period).toLocaleDateString("ru-RU", {
                            day: "2-digit",
                            month: "short"
                          }) : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Топ объектов и категорий */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Топ объектов */}
              {data.top_assets && data.top_assets.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                  <h2 className="text-lg font-semibold text-white mb-4">Топ объектов</h2>
                  <div className="space-y-3">
                    {data.top_assets.map((asset, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm font-bold text-gray-400">
                            {i + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">{asset.asset__name}</div>
                            <div className="text-xs text-gray-500">{asset.asset__category__name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">{formatPrice(asset.revenue)}</div>
                          <div className="text-xs text-gray-500">{asset.sessions} сессий</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Топ категорий */}
              {data.top_categories && data.top_categories.length > 0 && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700/50">
                  <h2 className="text-lg font-semibold text-white mb-4">Топ категорий</h2>
                  <div className="space-y-3">
                    {data.top_categories.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm font-bold text-gray-400">
                            {i + 1}
                          </div>
                          <div className="text-white font-medium">{cat.asset__category__name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium">{formatPrice(cat.revenue)}</div>
                          <div className="text-xs text-gray-500">{cat.sessions} сессий</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            Нет данных для отображения
          </div>
        )}
      </main>
    </div>
  );
}
