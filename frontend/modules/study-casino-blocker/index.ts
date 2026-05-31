// JS API for the native Android module that blocks distracting apps via
// AccessibilityService. Falls back to a safe no-op on the web preview and iOS.

import { requireOptionalNativeModule } from "expo-modules-core";

type Native = {
  isAccessibilityEnabled: () => boolean;
  openAccessibilitySettings: () => void;
  canDrawOverlays: () => boolean;
  openOverlaySettings: () => void;
  setBlocklist: (packages: string[]) => void;
  setAllowlist: (packages: string[]) => void;
  setStrictMode: (strict: boolean) => void;
  setActive: (active: boolean) => void;
  isActive: () => boolean;
  startPomodoroTimer: (durationSeconds: number) => void;
  stopPomodoroTimer: () => void;
  getRemainingTime: () => number;
  isTimerRunning: () => boolean;
  getInstalledApps: () => Promise<{ label: string; package: string }[]>;
};

let native: Native | null = null;
try {
  native = requireOptionalNativeModule<Native>("StudyCasinoBlocker");
} catch {
  // module not registered (web preview / iOS / Expo Go) — keep as null
  native = null;
}

// Helper: returns whether the native module is actually available
// (i.e. running on a development/production Android build, NOT Expo Go or web).
export const isNativeBlockerAvailable = !!native;

export const StudyCasinoBlocker = {
  isAvailable: isNativeBlockerAvailable,
  isAccessibilityEnabled(): boolean {
    if (!native) return false;
    try {
      return native.isAccessibilityEnabled();
    } catch {
      return false;
    }
  },
  openAccessibilitySettings(): void {
    if (!native) return;
    try {
      native.openAccessibilitySettings();
    } catch {
      // ignore
    }
  },
  canDrawOverlays(): boolean {
    if (!native) return false;
    try {
      return native.canDrawOverlays();
    } catch {
      return false;
    }
  },
  openOverlaySettings(): void {
    if (!native) return;
    try {
      native.openOverlaySettings();
    } catch {
      // ignore
    }
  },
  setBlocklist(packages: string[]): void {
    if (!native) return;
    try {
      native.setBlocklist(packages);
    } catch {
      // ignore
    }
  },
  setAllowlist(packages: string[]): void {
    if (!native) return;
    try {
      native.setAllowlist(packages);
    } catch {
      // ignore
    }
  },
  setStrictMode(strict: boolean): void {
    if (!native) return;
    try {
      native.setStrictMode(strict);
    } catch {
      // ignore
    }
  },
  setActive(active: boolean): void {
    if (!native) return;
    try {
      native.setActive(active);
    } catch {
      // ignore
    }
  },
  isActive(): boolean {
    if (!native) return false;
    try {
      return native.isActive();
    } catch {
      return false;
    }
  },
  // Start native foreground timer with countdown notification
  startPomodoroTimer(durationSeconds: number): void {
    if (!native) return;
    try {
      native.startPomodoroTimer(durationSeconds);
    } catch {
      // ignore
    }
  },
  // Stop native timer service
  stopPomodoroTimer(): void {
    if (!native) return;
    try {
      native.stopPomodoroTimer();
    } catch {
      // ignore
    }
  },
  // Get remaining time in seconds from native timer
  getRemainingTime(): number {
    if (!native) return 0;
    try {
      return native.getRemainingTime();
    } catch {
      return 0;
    }
  },
  // Check if native timer service is running
  isTimerRunning(): boolean {
    if (!native) return false;
    try {
      return native.isTimerRunning();
    } catch {
      return false;
    }
  },
  async getInstalledApps(): Promise<{ label: string; package: string }[]> {
    if (!native) return [];
    try {
      return await native.getInstalledApps();
    } catch {
      return [];
    }
  },
};
