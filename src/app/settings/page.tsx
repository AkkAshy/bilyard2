"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Asset, Category } from "@/types";
import { assets, categories as categoriesApi } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [assetsList, setAssetsList] = useState<Asset[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assets" | "categories">("assets");

  // Модалка
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"asset" | "category">("asset");
  const [editingItem, setEditingItem] = useState<Asset | Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Форма для объекта
  const [assetForm, setAssetForm] = useState({
    name: "",
    description: "",
    category: "",
    sort_order: "0",
    is_active: true,
    hourly_rate: "",
  });

  // Форма для категории
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "🎱",
    description: "",
    sort_order: "0",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [assetsData, categoriesData] = await Promise.all([
        assets.list(),
        categoriesApi.list()
      ]);
      setAssetsList(assetsData);
      setCategoriesList(categoriesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Открыть модалку для объекта
  const openAssetModal = (asset?: Asset) => {
    setModalType("asset");
    if (asset) {
      setEditingItem(asset);
      setAssetForm({
        name: asset.name,
        description: asset.description || "",
        category: String(asset.category),
        sort_order: String(asset.sort_order),
        is_active: asset.is_active,
        hourly_rate: asset.hourly_rate ? String(asset.hourly_rate) : "",
      });
    } else {
      setEditingItem(null);
      setAssetForm({
        name: "",
        description: "",
        category: categoriesList[0]?.id ? String(categoriesList[0].id) : "",
        sort_order: "0",
        is_active: true,
        hourly_rate: "",
      });
    }
    setIsModalOpen(true);
  };

  // Открыть модалку для категории
  const openCategoryModal = (category?: Category) => {
    setModalType("category");
    if (category) {
      setEditingItem(category);
      setCategoryForm({
        name: category.name,
        icon: category.icon || "🎱",
        description: category.description || "",
        sort_order: String(category.sort_order),
      });
    } else {
      setEditingItem(null);
      setCategoryForm({
        name: "",
        icon: "🎱",
        description: "",
        sort_order: "0",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Сохранение объекта
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data: Record<string, unknown> = {
        name: assetForm.name,
        description: assetForm.description || "",
        category: parseInt(assetForm.category),
        sort_order: parseInt(assetForm.sort_order),
        is_active: assetForm.is_active,
        hourly_rate: assetForm.hourly_rate ? parseInt(assetForm.hourly_rate) : null,
      };

      if (editingItem) {
        await assets.update((editingItem as Asset).id, data);
      } else {
        await assets.create(data);
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving asset:", error);
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Сохранение категории
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: categoryForm.name,
        icon: categoryForm.icon,
        description: categoryForm.description || "",
        sort_order: parseInt(categoryForm.sort_order),
      };

      if (editingItem) {
        await categoriesApi.update((editingItem as Category).id, data);
      } else {
        await categoriesApi.create(data);
      }

      closeModal();
      fetchData();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  // Удаление объекта
  const handleDeleteAsset = async (asset: Asset) => {
    if (!confirm(`Удалить "${asset.name}"?`)) return;

    try {
      await assets.delete(asset.id);
      fetchData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ошибка удаления";
      alert(msg);
    }
  };

  // Удаление категории
  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Удалить категорию "${category.name}"?`)) return;

    try {
      await categoriesApi.delete(category.id);
      fetchData();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Ошибка удаления";
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "assets"
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Объекты
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === "categories"
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Категории
          </button>

          <div className="flex-1" />

          <button
            onClick={() => activeTab === "assets" ? openAssetModal() : openCategoryModal()}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
          >
            + Добавить {activeTab === "assets" ? "объект" : "категорию"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Assets Table */}
            {activeTab === "assets" && (
              <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Категория</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Статус</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assetsList.map((asset) => (
                      <tr key={asset.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-6 py-4 text-gray-300">{asset.id}</td>
                        <td className="px-6 py-4 text-white font-medium">{asset.name}</td>
                        <td className="px-6 py-4 text-gray-300">{asset.category_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            asset.is_active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {asset.is_active ? "Активен" : "Неактивен"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openAssetModal(asset)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg mr-2 transition"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(asset)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {assetsList.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    Объекты не найдены. Нажмите &quot;Добавить объект&quot; чтобы создать первый.
                  </div>
                )}
              </div>
            )}

            {/* Categories Table */}
            {activeTab === "categories" && (
              <div className="bg-gray-800 rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">ID</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Иконка</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Название</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Объектов</th>
                      <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriesList.map((category) => (
                      <tr key={category.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                        <td className="px-6 py-4 text-gray-300">{category.id}</td>
                        <td className="px-6 py-4 text-2xl">{category.icon}</td>
                        <td className="px-6 py-4 text-white font-medium">{category.name}</td>
                        <td className="px-6 py-4 text-gray-300">{category.assets_count}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => openCategoryModal(category)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg mr-2 transition"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
                          >
                            Удалить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {categoriesList.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    Категории не найдены. Нажмите &quot;Добавить категорию&quot; чтобы создать первую.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingItem ? "Редактировать" : "Добавить"} {modalType === "asset" ? "объект" : "категорию"}
            </h2>

            {modalType === "asset" ? (
              <form onSubmit={handleSaveAsset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Название</label>
                  <input
                    type="text"
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Стол 1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Категория</label>
                  <select
                    value={assetForm.category}
                    onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
                  <input
                    type="text"
                    value={assetForm.description}
                    onChange={(e) => setAssetForm({ ...assetForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Описание объекта"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Цена за час (сум)</label>
                  <input
                    type="number"
                    value={assetForm.hourly_rate}
                    onChange={(e) => setAssetForm({ ...assetForm, hourly_rate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Например: 50000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Оставьте пустым для использования цены по умолчанию</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={assetForm.is_active}
                    onChange={(e) => setAssetForm({ ...assetForm, is_active: e.target.checked })}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                  />
                  <label htmlFor="is_active" className="text-gray-300">Активен</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Название</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Бильярд"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Иконка (эмодзи)</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-2xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="🎱"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Примеры: 🎱 🎾 🎳 🎤 🎮 🏊 🎯
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Описание</label>
                  <input
                    type="text"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Описание категории"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center justify-center"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Сохранить"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
