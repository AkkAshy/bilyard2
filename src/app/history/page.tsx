"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RentalSession, SessionStatus, PaymentType, Asset } from "@/types";
import { sessions, assets } from "@/lib/api";
import { useCurrencySymbol, formatPrice } from "@/lib/currency";

// Названия типов оплаты
const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: "💵 Наличные",
  card: "💳 Карта",
  transfer: "📱 Перевод",
};

// Форматирование даты+времени для input
function formatDateTimeForInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const router = useRouter();
  const currencySymbol = useCurrencySymbol();
  const [sessionsList, setSessionsList] = useState<RentalSession[]>([]);
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [assetFilter, setAssetFilter] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return formatDateTimeForInput(d);
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return formatDateTimeForInput(d);
  });

  // Итоги по всей выборке (с бэкенда)
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [avgDuration, setAvgDuration] = useState(0);

  // Загрузка списка объектов (один раз)
  useEffect(() => {
    assets.list().then(setAssetsList).catch(console.error);
  }, []);

  // Параметры фильтрации (без page)
  const filterParams = useCallback(() => {
    const params: { status?: string; asset?: number; from?: string; to?: string } = {};
    if (statusFilter !== "all") params.status = statusFilter;
    if (assetFilter) params.asset = assetFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    return params;
  }, [statusFilter, assetFilter, fromDate, toDate]);

  // Загрузка сессий + итогов
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterParams();

      // Параллельно: страница данных + итоги по всей выборке
      const [data, summaryData] = await Promise.all([
        sessions.listPaginated({ ...params, page }),
        sessions.summary(params),
      ]);

      setSessionsList(data.results || []);
      setTotalCount(summaryData.count || 0);
      setTotalRevenue(summaryData.total_revenue || 0);
      setAvgDuration(summaryData.avg_duration || 0);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  }, [filterParams, page]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchSessions();
  }, [fetchSessions, router]);

  // Сброс на первую страницу при смене фильтров
  const handleFilterChange = (setter: () => void) => {
    setter();
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours} ч ${mins} мин`;
    return `${mins} мин`;
  };

  const getStatusBadge = (status: SessionStatus) => {
    const styles: Record<string, string> = {
      active: "bg-green-500/20 text-green-400",
      completed: "bg-blue-500/20 text-blue-400",
      cancelled: "bg-red-500/20 text-red-400",
      expired: "bg-yellow-500/20 text-yellow-400",
    };
    const labels: Record<string, string> = {
      active: "Активна",
      completed: "Завершена",
      cancelled: "Отменена",
      expired: "Истекла",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || ""}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">История сессий</h1>

        {/* Фильтры */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">От</label>
              <input
                type="datetime-local"
                value={fromDate}
                onChange={(e) => handleFilterChange(() => setFromDate(e.target.value))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">До</label>
              <input
                type="datetime-local"
                value={toDate}
                onChange={(e) => handleFilterChange(() => setToDate(e.target.value))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Объект</label>
              <select
                value={assetFilter || ""}
                onChange={(e) => handleFilterChange(() => setAssetFilter(e.target.value ? Number(e.target.value) : null))}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Все объекты</option>
                {assetsList.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {[
                { value: "all", label: "Все" },
                { value: "completed", label: "Завершённые" },
                { value: "cancelled", label: "Отменённые" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(() => setStatusFilter(option.value as typeof statusFilter))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    statusFilter === option.value
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Итоговые карточки */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
            <div className="text-sm text-gray-400 mb-1">Сессий</div>
            <div className="text-2xl font-bold text-white">{totalCount}</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-gray-800 rounded-xl p-4 border border-green-500/30">
            <div className="text-sm text-gray-400 mb-1">Выручка (на стр.)</div>
            <div className="text-2xl font-bold text-green-400">{formatPrice(totalRevenue, currencySymbol)}</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700/50">
            <div className="text-sm text-gray-400 mb-1">Ср. длительность</div>
            <div className="text-2xl font-bold text-blue-400">{formatDuration(avgDuration)}</div>
          </div>
        </div>

        {/* Таблица */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : sessionsList.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg">Сессии не найдены</div>
            <div className="text-gray-500 text-sm mt-1">Попробуйте изменить фильтры</div>
          </div>
        ) : (
          <>
            <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Объект</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Начало</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Конец</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Длительность</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Стоимость</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Оплата</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionsList.map((session) => (
                    <tr key={session.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="text-white font-medium">{session.asset_name}</div>
                        <div className="text-xs text-gray-500">{session.category_name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {format(new Date(session.started_at), "dd MMM, HH:mm", { locale: ru })}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {session.ended_at
                          ? format(new Date(session.ended_at), "HH:mm", { locale: ru })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {formatDuration(session.actual_duration)}
                      </td>
                      <td className="px-4 py-3 text-green-400 font-medium text-sm">
                        {formatPrice(session.total_cost, currencySymbol)}
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">
                        {session.payment_type ? PAYMENT_TYPE_LABELS[session.payment_type] : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(session.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Стр. {page} из {totalPages} ({totalCount} записей)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Вперёд →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
