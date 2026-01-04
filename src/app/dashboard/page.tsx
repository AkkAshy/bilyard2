"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import AssetCard from "@/components/AssetCard";
import { AssetWithSession, Category } from "@/types";
import { assets, categories as categoriesApi } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [assetsList, setAssetsList] = useState<AssetWithSession[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Загрузка данных
  const fetchData = useCallback(async () => {
    try {
      const [assetsData, categoriesData] = await Promise.all([
        assets.list({ category: selectedCategory || undefined }),
        categoriesApi.list()
      ]);
      setAssetsList(assetsData);
      setCategoriesList(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Если ошибка авторизации - редирект на логин
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, router]);

  useEffect(() => {
    // Проверяем авторизацию
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 10000); // Обновление каждые 10 сек
    return () => clearInterval(interval);
  }, [fetchData, router]);

  // Фильтрация объектов
  const activeAssets = assetsList.filter((a) => a.active_session !== null);
  const freeAssets = assetsList.filter((a) => a.active_session === null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Assets */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{assetsList.length}</div>
              <div className="text-sm text-gray-400">Всего объектов</div>
            </div>
          </div>

          {/* Active */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-5 border border-green-500/30 shadow-xl shadow-green-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                {activeAssets.length > 0 && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                )}
              </div>
              <div className="text-3xl font-bold text-green-400">{activeAssets.length}</div>
              <div className="text-sm text-gray-400">Активных</div>
            </div>
          </div>

          {/* Free */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-5 border border-gray-700/50 shadow-xl">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-300">{freeAssets.length}</div>
              <div className="text-sm text-gray-400">Свободных</div>
            </div>
          </div>

          {/* Load Percentage */}
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl p-5 border border-yellow-500/30 shadow-xl shadow-yellow-500/5">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {assetsList.length > 0 ? Math.round((activeAssets.length / assetsList.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-400">Загрузка</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {categoriesList.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === null
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Все
            </button>
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Загрузка...</p>
          </div>
        ) : (
          <>
            {/* Active Assets */}
            {activeAssets.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-green-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-white">
                    Активные
                  </h2>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                    {activeAssets.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {activeAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onRefresh={fetchData}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Free Assets */}
            {freeAssets.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-gray-500 rounded-full" />
                  <h2 className="text-lg font-semibold text-white">
                    Свободные
                  </h2>
                  <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-sm font-medium rounded-full">
                    {freeAssets.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {freeAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onRefresh={fetchData}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Assets */}
            {assetsList.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="text-gray-400 text-lg mb-2">Объекты не найдены</div>
                <div className="text-gray-500 text-sm">
                  Добавьте объекты в разделе &quot;Настройки&quot;
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
