// Centralized vintage sound effects using expo-audio.
// Each sound is preloaded once and replayed via `playSound(name)`.
// Volume + enabled state is persisted via the game-store settings.

import { useEffect, useRef, useCallback } from "react";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";

import { useGameStore } from "@/src/store/game-store";

const SOUND_FILES = {
  // Sonidos de UI/botones
  coin: require("../../assets/sounds/coin.mp3"),
  bell: require("../../assets/sounds/bell.mp3"),
  click: require("../../assets/sounds/click.mp3"),
  tick: require("../../assets/sounds/tick.mp3"),
  buttonTap: require("../../assets/sounds/button-tap.wav"),
  
  // Sonidos de casino - tragaperras
  lever: require("../../assets/sounds/lever.mp3"),
  spinning: require("../../assets/sounds/spinning.mp3"),
  jackpot: require("../../assets/sounds/jackpot.mp3"),
  fail: require("../../assets/sounds/fail.mp3"),
  win: require("../../assets/sounds/win.mp3"),
  slotsPlay: require("../../assets/sounds/slots-play.mp3"),
  slotsLose: require("../../assets/sounds/slots-lose.mp3"),
  
  // Sonidos de casino - cajas y ruleta
  box_open: require("../../assets/sounds/box_open.mp3"),
  boxOpen: require("../../assets/sounds/box-open.wav"),
  ruletaSpin: require("../../assets/sounds/ruleta-spin.mp3"),
  
  // Sonidos de estudio/pomodoro
  pomodoroAlarm: require("../../assets/sounds/pomodoro-alarm.mp3"),
  
  // Música de fondo
  backgroundMusic: require("../../assets/sounds/background-music.mp3"),
} as const;

export type SoundName = keyof typeof SOUND_FILES;

type PlayerMap = Partial<Record<SoundName, AudioPlayer>>;

// Single shared player map across the app — initialized lazily.
const players: PlayerMap = {};
let mixerConfigured = false;

async function ensureMixer() {
  if (mixerConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
    mixerConfigured = true;
  } catch {
    // best-effort — audio still plays without explicit mode
  }
}

function getPlayer(name: SoundName): AudioPlayer | null {
  if (players[name]) return players[name] ?? null;
  try {
    const p = createAudioPlayer(SOUND_FILES[name]);
    players[name] = p;
    return p;
  } catch {
    return null;
  }
}

export function useSounds() {
  const { state } = useGameStore();
  const enabled = state.settings.soundsEnabled ?? true;
  const volume = Math.max(0, Math.min(1, state.settings.soundsVolume ?? 0.7));
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  enabledRef.current = enabled;
  volumeRef.current = volume;

  useEffect(() => {
    ensureMixer();
  }, []);

  const play = useCallback((name: SoundName, opts?: { volume?: number }) => {
    if (!enabledRef.current) return;
    const p = getPlayer(name);
    if (!p) return;
    try {
      // expo-audio supports replay by seeking to 0 + play
      const v = (opts?.volume ?? 1) * volumeRef.current;
      p.volume = v;
      // seekTo accepts seconds in expo-audio
      try {
        p.seekTo(0);
      } catch {
        // ignore
      }
      p.play();
    } catch {
      // ignore
    }
  }, []);

  return { play };
}

// Hook variant that does NOT depend on store (used in the game-store itself / early boot).
export function getPlayerStatic(name: SoundName): AudioPlayer | null {
  return getPlayer(name);
}
