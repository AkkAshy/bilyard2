"use client";

import { useState } from "react";

interface StartGameModalProps {
  assetName: string;
  categoryName: string;
  isOpen: boolean;
  onClose: () => void;
  onStart: (duration: number | null) => void;
}

const presetTimes = [
  { label: "30 мин", value: 30, icon: "30" },
  { label: "1 час", value: 60, icon: "1ч" },
  { label: "1.5 часа", value: 90, icon: "1.5" },
  { label: "2 часа", value: 120, icon: "2ч" },
];

export default function StartGameModal({
  assetName,
  categoryName,
  isOpen,
  onClose,
  onStart,
}: StartGameModalProps) {
  const [mode, setMode] = useState<"free" | "timed">("free");
  const [customMinutes, setCustomMinutes] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleStart = async () => {
    setLoading(true);
    try {
      if (mode === "free") {
        // Безлимит - цена берётся из настроек объекта
        await onStart(null);
      } else {
        const duration = selectedPreset || parseInt(customMinutes) || 60;
        await onStart(duration);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMode("free");
    setCustomMinutes("");
    setSelectedPreset(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl w-full max-w-md shadow-2xl border border-gray-700/50 overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-gray-700/50">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Запустить сессию
                </h2>
                <p className="text-gray-400">{assetName}</p>
                <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {categoryName}
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-700/50 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("free")}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                mode === "free"
                  ? "border-green-500 bg-green-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                mode === "free" ? "bg-green-500/20" : "bg-gray-700/50"
              }`}>
                <svg className={`w-5 h-5 ${mode === "free" ? "text-green-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`font-medium ${mode === "free" ? "text-white" : "text-gray-400"}`}>
                Без лимита
              </span>
              {mode === "free" && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>

            <button
              onClick={() => setMode("timed")}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                mode === "timed"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                mode === "timed" ? "bg-blue-500/20" : "bg-gray-700/50"
              }`}>
                <svg className={`w-5 h-5 ${mode === "timed" ? "text-blue-400" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className={`font-medium ${mode === "timed" ? "text-white" : "text-gray-400"}`}>
                По времени
              </span>
              {mode === "timed" && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          {/* Time Selection */}
          {mode === "timed" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {presetTimes.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => {
                      setSelectedPreset(preset.value);
                      setCustomMinutes("");
                    }}
                    className={`p-3 rounded-xl font-medium transition-all flex flex-col items-center ${
                      selectedPreset === preset.value
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <span className="text-lg font-bold">{preset.icon}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  placeholder="Другое время (мин)"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    setSelectedPreset(null);
                  }}
                  className="w-full px-4 py-3.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  мин
                </span>
              </div>
            </div>
          )}

          {/* Free Mode Info */}
          {mode === "free" && (
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-300 font-medium">Оплата по факту</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Стоимость рассчитывается по цене объекта при завершении
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleStart}
            disabled={loading || (mode === "timed" && !selectedPreset && !customMinutes)}
            className="flex-1 py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:shadow-none"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Запустить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
