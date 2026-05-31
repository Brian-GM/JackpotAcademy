// Thin wrapper around the native app-blocker module. Syncs our settings
// (blockedApps / allowedApps / strictMode) into Android SharedPreferences so the
// AccessibilityService can read them while the app process is dead.

import { useEffect } from "react";

import { StudyCasinoBlocker } from "../../modules/study-casino-blocker";

import { useGameStore } from "@/src/store/game-store";

export function useAppBlockerSync() {
  const { state } = useGameStore();

  // Keep the native module in sync whenever the settings change.
  useEffect(() => {
    if (!StudyCasinoBlocker.isAvailable) return;
    StudyCasinoBlocker.setBlocklist(state.settings.blockedApps.map((a) => a.package));
    StudyCasinoBlocker.setAllowlist(state.settings.allowedApps.map((a) => a.package));
    StudyCasinoBlocker.setStrictMode(state.settings.blockerStrictMode);
  }, [state.settings.blockedApps, state.settings.allowedApps, state.settings.blockerStrictMode]);
}

export function startBlockingSession(durationSeconds?: number) {
  if (!StudyCasinoBlocker.isAvailable) return;
  StudyCasinoBlocker.setActive(true);
  // Start the native timer service with countdown notification
  if (durationSeconds && durationSeconds > 0) {
    StudyCasinoBlocker.startPomodoroTimer(durationSeconds);
  }
}

export function stopBlockingSession() {
  if (!StudyCasinoBlocker.isAvailable) return;
  StudyCasinoBlocker.setActive(false);
  StudyCasinoBlocker.stopPomodoroTimer();
}

// Get remaining time from native timer (useful for syncing on app resume)
export function getNativeRemainingTime(): number {
  if (!StudyCasinoBlocker.isAvailable) return 0;
  return StudyCasinoBlocker.getRemainingTime();
}

// Check if native timer is running
export function isNativeTimerRunning(): boolean {
  if (!StudyCasinoBlocker.isAvailable) return false;
  return StudyCasinoBlocker.isTimerRunning();
}

// Check if overlay permission is granted
export function canDrawOverlays(): boolean {
  if (!StudyCasinoBlocker.isAvailable) return false;
  return StudyCasinoBlocker.canDrawOverlays();
}

// Open overlay settings
export function openOverlaySettings() {
  if (!StudyCasinoBlocker.isAvailable) return;
  StudyCasinoBlocker.openOverlaySettings();
}

export const isBlockerAvailable = StudyCasinoBlocker.isAvailable;
export const isAccessibilityEnabled = () => StudyCasinoBlocker.isAccessibilityEnabled();
export const openAccessibilitySettings = () => StudyCasinoBlocker.openAccessibilitySettings();
export const getInstalledApps = () => StudyCasinoBlocker.getInstalledApps();
