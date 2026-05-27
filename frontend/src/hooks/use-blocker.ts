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

export function startBlockingSession() {
  if (!StudyCasinoBlocker.isAvailable) return;
  StudyCasinoBlocker.setActive(true);
}

export function stopBlockingSession() {
  if (!StudyCasinoBlocker.isAvailable) return;
  StudyCasinoBlocker.setActive(false);
}

export const isBlockerAvailable = StudyCasinoBlocker.isAvailable;
export const isAccessibilityEnabled = () => StudyCasinoBlocker.isAccessibilityEnabled();
export const openAccessibilitySettings = () => StudyCasinoBlocker.openAccessibilitySettings();
export const getInstalledApps = () => StudyCasinoBlocker.getInstalledApps();
