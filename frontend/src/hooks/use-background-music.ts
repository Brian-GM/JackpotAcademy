// Hook para manejar la música de fondo de la app
// Se reproduce en loop y respeta la configuración de volumen del usuario

import { useEffect, useRef, useCallback } from "react";
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from "expo-audio";
import { AppState, AppStateStatus } from "react-native";

import { useGameStore } from "@/src/store/game-store";

const MUSIC_FILE = require("../../assets/sounds/musica-fondo.mp3");

let musicPlayer: AudioPlayer | null = null;
let musicInitialized = false;

async function initMusicPlayer(): Promise<AudioPlayer | null> {
  if (musicPlayer) return musicPlayer;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
    musicPlayer = createAudioPlayer(MUSIC_FILE);
    musicPlayer.loop = true;
    return musicPlayer;
  } catch {
    return null;
  }
}

export function useBackgroundMusic() {
  const { state, updateSettings } = useGameStore();
  const musicEnabled = state.settings.musicEnabled ?? true;
  const musicVolume = Math.max(0, Math.min(1, state.settings.musicVolume ?? 0.3));
  
  const enabledRef = useRef(musicEnabled);
  const volumeRef = useRef(musicVolume);
  const isPlayingRef = useRef(false);
  
  enabledRef.current = musicEnabled;
  volumeRef.current = musicVolume;

  // Inicializar y reproducir música
  const startMusic = useCallback(async () => {
    if (!enabledRef.current) return;
    const player = await initMusicPlayer();
    if (!player) return;
    try {
      player.volume = volumeRef.current;
      if (!isPlayingRef.current) {
        player.play();
        isPlayingRef.current = true;
      }
    } catch {
      // ignore
    }
  }, []);

  // Pausar música
  const pauseMusic = useCallback(() => {
    if (!musicPlayer) return;
    try {
      musicPlayer.pause();
      isPlayingRef.current = false;
    } catch {
      // ignore
    }
  }, []);

  // Actualizar volumen
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    if (musicPlayer) {
      try {
        musicPlayer.volume = clampedVol;
      } catch {
        // ignore
      }
    }
    updateSettings({ musicVolume: clampedVol });
  }, [updateSettings]);

  // Toggle música on/off
  const toggleMusic = useCallback((enabled: boolean) => {
    updateSettings({ musicEnabled: enabled });
    if (enabled) {
      startMusic();
    } else {
      pauseMusic();
    }
  }, [startMusic, pauseMusic, updateSettings]);

  // Efecto para iniciar/parar música según configuración
  useEffect(() => {
    if (musicEnabled) {
      startMusic();
    } else {
      pauseMusic();
    }
  }, [musicEnabled, startMusic, pauseMusic]);

  // Efecto para actualizar volumen cuando cambia
  useEffect(() => {
    if (musicPlayer && musicEnabled) {
      try {
        musicPlayer.volume = musicVolume;
      } catch {
        // ignore
      }
    }
  }, [musicVolume, musicEnabled]);

  // Pausar cuando la app va a background, reanudar cuando vuelve
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && enabledRef.current) {
        startMusic();
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        pauseMusic();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [startMusic, pauseMusic]);

  return {
    isPlaying: isPlayingRef.current,
    musicEnabled,
    musicVolume,
    startMusic,
    pauseMusic,
    setVolume,
    toggleMusic,
  };
}
