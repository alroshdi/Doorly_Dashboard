"use client";

import { useEffect, useState } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
}

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check localStorage for snow preference
    const snowPreference = localStorage.getItem("doorly_snow_enabled");
    if (snowPreference === "true") {
      setEnabled(true);
    }

    // Listen for snow toggle events
    const handleSnowToggle = (e: CustomEvent) => {
      setEnabled(e.detail.enabled);
    };

    window.addEventListener("snowToggle" as any, handleSnowToggle as EventListener);

    return () => {
      window.removeEventListener("snowToggle" as any, handleSnowToggle as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setSnowflakes([]);
      return;
    }

    // Create snowflakes
    const count = 50; // Number of snowflakes
    const flakes: Snowflake[] = [];

    for (let i = 0; i < count; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 3 + Math.random() * 5, // 3-8 seconds
        animationDelay: Math.random() * 5,
        size: 5 + Math.random() * 5, // 5-10px
        opacity: 0.3 + Math.random() * 0.7, // 0.3-1.0
      });
    }

    setSnowflakes(flakes);
  }, [enabled]);

  if (!enabled || snowflakes.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-0 text-white select-none"
          style={{
            left: `${flake.left}%`,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.animationDuration}s linear infinite`,
            animationDelay: `${flake.animationDelay}s`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}

// Function to toggle snow effect
export function toggleSnow(enabled: boolean) {
  localStorage.setItem("doorly_snow_enabled", enabled.toString());
  window.dispatchEvent(
    new CustomEvent("snowToggle", { detail: { enabled } })
  );
}

