"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TimerProps {
  startedAt: string; // ISO строка даты
  duration: number | null; // минуты, null = без лимита
  onExpired?: () => void;
}

export default function Timer({ startedAt, duration, onExpired }: TimerProps) {
  const [timeDisplay, setTimeDisplay] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const hasPlayedSound = useRef(false);

  // Звук уведомления
  const playNotificationSound = useCallback(() => {
    if (hasPlayedSound.current) return;
    hasPlayedSound.current = true;

    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.value = 0.3;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);

      // Второй бип
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioContext.currentTime + 0.5);
      }, 600);
    } catch {
      // Браузер не поддерживает Web Audio API
    }
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const start = new Date(startedAt);
      const elapsedMs = now.getTime() - start.getTime();
      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000);

      if (duration === null) {
        // Без лимита - показываем сколько прошло
        const hours = Math.floor(elapsedMinutes / 60);
        const mins = elapsedMinutes % 60;
        setTimeDisplay(
          `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${elapsedSeconds.toString().padStart(2, "0")}`
        );
      } else {
        // С ограничением - показываем обратный отсчёт
        const totalSeconds = duration * 60;
        const elapsedTotalSeconds = Math.floor(elapsedMs / 1000);
        const remainingSeconds = totalSeconds - elapsedTotalSeconds;

        if (remainingSeconds <= 0) {
          setTimeDisplay("00:00:00");
          if (!isExpired) {
            setIsExpired(true);
            playNotificationSound();
            onExpired?.();
          }
        } else {
          const hours = Math.floor(remainingSeconds / 3600);
          const mins = Math.floor((remainingSeconds % 3600) / 60);
          const secs = remainingSeconds % 60;
          setTimeDisplay(
            `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
          );

          // Предупреждение за 5 минут
          if (remainingSeconds <= 300 && remainingSeconds > 0) {
            setIsWarning(true);
          }
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt, duration, isExpired, onExpired, playNotificationSound]);

  return (
    <div className="text-center">
      <div
        className={`text-4xl font-mono font-bold ${
          isExpired
            ? "text-red-500 animate-pulse"
            : isWarning
            ? "text-yellow-500"
            : "text-green-400"
        }`}
      >
        {timeDisplay}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        {duration === null ? "Без лимита" : isExpired ? "Время истекло!" : "Осталось"}
      </div>
    </div>
  );
}
