// Local notifications helper for Pomodoro persistent timer + end-of-session alert.
// Falls back gracefully on web preview.

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

let configured = false;
const TIMER_NOTIF_ID = "study-casino-pomodoro-timer";
const END_NOTIF_ID = "study-casino-pomodoro-end";

async function ensureConfig() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("pomodoro", {
        name: "Sesiones Pomodoro",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        showBadge: false,
      });
    } catch {
      // ignore
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureConfig();
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (!settings.canAskAgain) return false;
    const res = await Notifications.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export async function startSessionNotification(opts: {
  durationMinutes: number;
  topicName: string | null;
}): Promise<void> {
  await ensureConfig();
  const endAt = new Date(Date.now() + opts.durationMinutes * 60 * 1000);
  const hh = String(endAt.getHours()).padStart(2, "0");
  const mm = String(endAt.getMinutes()).padStart(2, "0");
  const topicSuffix = opts.topicName ? ` · ${opts.topicName}` : "";

  // Persistent ongoing notification (Android only — iOS doesn't support ongoing)
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: TIMER_NOTIF_ID,
      content: {
        title: "📚 Estudiando en Study Casino",
        body: `Termina a las ${hh}:${mm}${topicSuffix}`,
        sticky: true,
        autoDismiss: false,
        ...(Platform.OS === "android"
          ? { channelId: "pomodoro", color: "#A62C2B" }
          : {}),
      },
      trigger: null, // fire immediately
    });
  } catch {
    // ignore
  }

  // Scheduled end-of-session notification with vintage sound bell
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: END_NOTIF_ID,
      content: {
        title: "🎰 ¡Sesión completa!",
        body: `Bien hecho. Reclama tu giro en el casino${topicSuffix}.`,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "pomodoro" } : {}),
      },
      trigger:
        Platform.OS === "ios"
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: opts.durationMinutes * 60 }
          : { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: opts.durationMinutes * 60, channelId: "pomodoro" },
    });
  } catch {
    // ignore
  }
}

export async function clearSessionNotifications(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(END_NOTIF_ID);
  } catch {
    // ignore
  }
  try {
    await Notifications.dismissNotificationAsync(TIMER_NOTIF_ID);
  } catch {
    // ignore
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIF_ID);
  } catch {
    // ignore
  }
}

export async function showFailNotification(reason: string, coinsLost?: number): Promise<void> {
  await ensureConfig();
  try {
    const lostText = coinsLost ? ` Has perdido ${coinsLost} fichas.` : "";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💀 SESIÓN FALLIDA",
        body: `${reason}.${lostText}`,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "pomodoro" } : {}),
      },
      trigger: null,
    });
  } catch {
    // ignore
  }
}

export async function showSuccessNotification(coins: number): Promise<void> {
  await ensureConfig();
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎉 ¡JACKPOT DE ESTUDIO!",
        body: `Ganaste ${coins} fichas. Apuéstalas en el casino.`,
        sound: "default",
        ...(Platform.OS === "android" ? { channelId: "pomodoro" } : {}),
      },
      trigger: null,
    });
  } catch {
    // ignore
  }
}
