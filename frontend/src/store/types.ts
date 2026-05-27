// Game data types for Study Casino. Persisted via AsyncStorage.

export type Rarity = "comun" | "raro" | "epico" | "legendario";

export type Difficulty = 1 | 2 | 3; // 1=fácil, 2=medio, 3=difícil

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  1: 1.0,
  2: 1.5,
  3: 2.2,
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Fácil",
  2: "Medio",
  3: "Difícil",
};

export const DIFFICULTY_EMOJI: Record<Difficulty, string> = {
  1: "🟢",
  2: "🟡",
  3: "🔴",
};

export type Topic = {
  id: string;
  name: string;
  weight: number; // weighted random
  enabled: boolean;
  category?: string;
  difficulty: Difficulty;
  lastStudiedAt?: number;
};

export type Reward = {
  id: string;
  name: string;
  icon: string; // emoji
  // legacy "cost" kept for backwards compat — UI hidden now that rewards drop from slot
  cost?: number;
  durationMin: number;
  rarity: Rarity;
  cooldownMin: number;
  category?: string;
  lastUsedAt?: number;
  dailyLimit?: number;
  usedToday?: number;
  usedDate?: string;
  // NEW: inventory counter — how many of this reward the player has earned and not yet consumed
  earnedCount?: number;
  // total ever earned (lifetime)
  totalEarned?: number;
};

export type BlockedApp = {
  package: string; // android package id (e.g. com.zhiliaoapp.musically for TikTok)
  label: string; // human-readable name
};

export type Settings = {
  pomodoroDuration: number; // minutes
  breakDuration: number;
  coinsPerMinute: number;
  noPauseBonus: number;
  longSessionBonus: number;
  streakBonus: number;
  slotSpinCost: number;
  rouletteSpinCost: number;
  jackpotProbability: number; // 0..1
  failPenaltyCoins: number;
  casinoClosedMin: number;
  maxPauses: number;
  highRiskMultiplier: number;
  appBlurFailSec: number;
  // Reward boxes
  bronzeBoxCost: number;
  silverBoxCost: number;
  goldBoxCost: number;
  // Audio
  soundsEnabled: boolean;
  soundsVolume: number; // 0..1
  // Notifications
  notificationsEnabled: boolean;
  endSessionSound: boolean;
  // App blocking (requires native APK build + Accessibility Service)
  appBlockerEnabled: boolean;
  blockedApps: BlockedApp[];
  allowedApps: BlockedApp[]; // whitelist — when set, ONLY these apps allowed during study
  blockerStrictMode: boolean; // true = whitelist mode, false = blacklist mode
};

export type Stats = {
  totalStudyMinutes: number;
  totalSpins: number;
  totalJackpots: number;
  sessionsCompleted: number;
  sessionsFailed: number;
  rewardsRedeemed: number;
};

export type GameState = {
  coins: number;
  streak: number;
  lastStudyDate: string | null;
  casinoClosedUntil: number | null;
  currentTopicId: string | null; // selected topic for next/current study session
  stats: Stats;
  topics: Topic[];
  rewards: Reward[];
  settings: Settings;
};

export const DEFAULT_SETTINGS: Settings = {
  pomodoroDuration: 25,
  breakDuration: 5,
  coinsPerMinute: 1,
  noPauseBonus: 5,
  longSessionBonus: 10,
  streakBonus: 2,
  slotSpinCost: 5,
  rouletteSpinCost: 3,
  jackpotProbability: 0.03,
  failPenaltyCoins: 10,
  casinoClosedMin: 30,
  maxPauses: 3,
  highRiskMultiplier: 3,
  appBlurFailSec: 30,
  bronzeBoxCost: 15,
  silverBoxCost: 40,
  goldBoxCost: 100,
  soundsEnabled: true,
  soundsVolume: 0.7,
  notificationsEnabled: true,
  endSessionSound: true,
  appBlockerEnabled: false,
  blockedApps: [
    { package: "com.zhiliaoapp.musically", label: "TikTok" },
    { package: "com.instagram.android", label: "Instagram" },
    { package: "com.google.android.youtube", label: "YouTube" },
    { package: "com.twitter.android", label: "X (Twitter)" },
    { package: "com.facebook.katana", label: "Facebook" },
  ],
  allowedApps: [],
  blockerStrictMode: false,
};

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: "t1",
    name: "Matemáticas",
    weight: 1,
    enabled: true,
    category: "Ciencias",
    difficulty: 3,
  },
  { id: "t2", name: "Historia", weight: 1, enabled: true, category: "Humanidades", difficulty: 2 },
  {
    id: "t3",
    name: "Ciencias Naturales",
    weight: 1,
    enabled: true,
    category: "Ciencias",
    difficulty: 2,
  },
  { id: "t4", name: "Inglés", weight: 1, enabled: true, category: "Idiomas", difficulty: 2 },
  {
    id: "t5",
    name: "Programación",
    weight: 1,
    enabled: true,
    category: "Tecnología",
    difficulty: 3,
  },
  {
    id: "t6",
    name: "Literatura",
    weight: 1,
    enabled: true,
    category: "Humanidades",
    difficulty: 1,
  },
];

export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "r1",
    name: "5 min de memes",
    icon: "🤣",
    durationMin: 5,
    rarity: "comun",
    cooldownMin: 30,
    category: "Redes sociales",
  },
  {
    id: "r2",
    name: "Café",
    icon: "☕",
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 60,
    category: "Snacks",
  },
  {
    id: "r3",
    name: "1 partida online",
    icon: "🎮",
    durationMin: 20,
    rarity: "raro",
    cooldownMin: 60,
    category: "Videojuegos",
  },
  {
    id: "r4",
    name: "10 min TikTok",
    icon: "📱",
    durationMin: 10,
    rarity: "raro",
    cooldownMin: 90,
    category: "Redes sociales",
  },
  {
    id: "r5",
    name: "Snack favorito",
    icon: "🍪",
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 90,
    category: "Snacks",
  },
  {
    id: "r6",
    name: "15 min YouTube",
    icon: "📺",
    durationMin: 15,
    rarity: "epico",
    cooldownMin: 120,
    category: "Entretenimiento",
  },
  {
    id: "r7",
    name: "Episodio de serie",
    icon: "🎬",
    durationMin: 30,
    rarity: "legendario",
    cooldownMin: 180,
    category: "Entretenimiento",
  },
];

export const DEFAULT_STATE: GameState = {
  coins: 0,
  streak: 0,
  lastStudyDate: null,
  casinoClosedUntil: null,
  currentTopicId: null,
  stats: {
    totalStudyMinutes: 0,
    totalSpins: 0,
    totalJackpots: 0,
    sessionsCompleted: 0,
    sessionsFailed: 0,
    rewardsRedeemed: 0,
  },
  topics: DEFAULT_TOPICS,
  rewards: DEFAULT_REWARDS,
  settings: DEFAULT_SETTINGS,
};

export const RARITY_ORDER: Rarity[] = ["comun", "raro", "epico", "legendario"];
