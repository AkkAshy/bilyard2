"use client";

import { useState, useEffect } from "react";
import Timer from "./Timer";
import StartGameModal from "./StartGameModal";
import { AssetWithSession, RentalSession } from "@/types";
import { sessions } from "@/lib/api";

interface AssetCardProps {
  asset: AssetWithSession;
  onRefresh: () => void;
}

// Форматирование цены (будет использовать настройки tenant)
function formatPrice(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "—";
  return amount.toLocaleString("ru-RU") + " сум";
}

// Расчёт текущей стоимости
function calculateCurrentCost(startedAt: string, pricePerHour: number): number {
  const now = new Date();
  const start = new Date(startedAt);
  const durationMinutes = (now.getTime() - start.getTime()) / 60000;
  return Math.round((durationMinutes / 60) * pricePerHour);
}

export default function AssetCard({ asset, onRefresh }: AssetCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentCost, setCurrentCost] = useState(0);

  const isActive = asset.active_session !== null;
  const activeSession = asset.active_session;

  // Обновление текущей стоимости каждую секунду
  useEffect(() => {
    if (!isActive || !activeSession) {
      setCurrentCost(0);
      return;
    }

    const updateCost = () => {
      const cost = calculateCurrentCost(
        activeSession.started_at,
        activeSession.price_snapshot
      );
      setCurrentCost(cost);
    };

    updateCost();
    const interval = setInterval(updateCost, 1000);
    return () => clearInterval(interval);
  }, [isActive, activeSession]);

  // Запуск сессии
  const handleStart = async (duration: number | null) => {
    try {
      await sessions.start(asset.id, duration || undefined);
      setIsModalOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error starting session:", error);
      alert(error instanceof Error ? error.message : "Ошибка запуска");
    }
  };

  // Завершение сессии
  const handleStop = async () => {
    if (!activeSession) return;

    setLoading(true);
    try {
      const result = await sessions.stop(activeSession.id);
      alert(`Сессия завершена!\n\nИтого: ${formatPrice(result.total_cost)}`);
      onRefresh();
    } catch (error) {
      console.error("Error stopping session:", error);
      alert(error instanceof Error ? error.message : "Ошибка завершения");
    } finally {
      setLoading(false);
    }
  };

  // Получаем цену за час из активной сессии или из метаданных
  const hourlyRate = activeSession?.price_snapshot || 0;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
          isActive
            ? "bg-gradient-to-br from-green-900/40 via-green-800/20 to-gray-800 border-2 border-green-500/40 shadow-xl shadow-green-500/10"
            : "bg-gradient-to-br from-gray-800 to-gray-800/50 border border-gray-700/50 hover:border-gray-600 shadow-lg hover:shadow-xl"
        }`}
      >
        {/* Decorative glow */}
        {isActive && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        )}

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{asset.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full">
                  {asset.category_name}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              isActive ? "bg-green-500/20" : "bg-gray-700/50"
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
              }`} />
              <span className={`text-xs font-medium ${
                isActive ? "text-green-400" : "text-gray-400"
              }`}>
                {isActive ? "Занят" : "Свободен"}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-4">
            {isActive && activeSession ? (
              <Timer
                startedAt={activeSession.started_at}
                duration={activeSession.planned_duration}
                onExpired={onRefresh}
              />
            ) : (
              <div className="text-center py-2">
                <div className="text-4xl font-mono font-bold text-gray-600">00:00:00</div>
                <div className="text-xs text-gray-500 mt-1">Ожидание</div>
              </div>
            )}
          </div>

          {/* Current Cost */}
          {isActive && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 mb-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-gray-400">Текущая стоимость</span>
                </div>
                <span className="text-xl font-bold text-yellow-400">
                  {formatPrice(currentCost)}
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          {isActive ? (
            <button
              onClick={handleStop}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-red-800 disabled:to-red-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                  Завершить
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Начать
            </button>
          )}
        </div>
      </div>

      <StartGameModal
        assetName={asset.name}
        categoryName={asset.category_name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStart={handleStart}
      />
    </>
  );
}
