"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RentalSession, SessionStatus, PaymentType } from "@/types";

// Названия типов оплаты
const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  cash: "💵 Наличные",
  card: "💳 Карта",
  transfer: "📱 Перевод",
};
import { sessions } from "@/lib/api";

// Форматирование цены
function formatPrice(amount: number | null): string {
  if (amount === null) return "—";
  return amount.toLocaleString("ru-RU") + " сум";
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessionsList, setSessionsList] = useState<RentalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchSessions = async () => {
      setLoading(true);
      try {
        const params: { status?: string } = {};
        if (filter !== "all") {
          params.status = filter;
        }
        const data = await sessions.list(params);
        setSessionsList(data);

        // Считаем общую выручку
        const revenue = data.reduce(
          (sum: number, s: RentalSession) => sum + (s.total_cost || 0),
          0
        );
        setTotalRevenue(revenue);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [filter, router]);

  const formatDuration = (minutes: number | null) => {
    if (minutes === null) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ч ${mins} мин`;
    }
    return `${mins} мин`;
  };

  const getStatusBadge = (status: SessionStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
            Активна
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
            Завершена
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
            Отменена
          </span>
        );
      case "expired":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
            Истекла
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">История сессий</h1>
            {totalRevenue > 0 && (
              <p className="text-yellow-400 mt-1">
                Общая выручка: {formatPrice(totalRevenue)}
              </p>
            )}
          </div>

          {/* Фильтр */}
          <div className="flex gap-2">
            {[
              { value: "all", label: "Все" },
              { value: "completed", label: "Завершённые" },
              { value: "cancelled", label: "Отменённые" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === option.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : sessionsList.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-lg">История пуста</div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Объект
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Категория
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Начало
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Конец
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Длительность
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Стоимость
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Оплата
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessionsList.map((session) => (
                  <tr
                    key={session.id}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30"
                  >
                    <td className="px-6 py-4 text-white font-medium">
                      {session.asset_name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {session.category_name}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {format(new Date(session.started_at), "dd MMM yyyy, HH:mm", {
                        locale: ru,
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {session.ended_at
                        ? format(new Date(session.ended_at), "HH:mm", {
                            locale: ru,
                          })
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {formatDuration(session.actual_duration)}
                    </td>
                    <td className="px-6 py-4 text-yellow-400 font-medium">
                      {formatPrice(session.total_cost)}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {session.payment_type ? PAYMENT_TYPE_LABELS[session.payment_type] : "—"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(session.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
