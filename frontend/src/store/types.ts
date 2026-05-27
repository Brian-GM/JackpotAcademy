// Game data types for Study Casino. Persisted via AsyncStorage.

export type Rarity = "comun" | "raro" | "epico" | "legendario";

export type Topic = {
  id: string;
  name: string;
  weight: number; // weighted random
  enabled: boolean;
  category?: string;
  lastStudiedAt?: number;
};

export type Reward = {
  id: string;
  name: string;
  icon: string; // emoji
  cost: number;
  durationMin: number;
  rarity: Rarity;
  cooldownMin: number;
  category?: string;
  lastUsedAt?: number;
  dailyLimit?: number;
  usedToday?: number;
  usedDate?: string;
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
  appBlurFailSec: number; // seconds before backgrounding fails session
  // Reward boxes
  bronzeBoxCost: number;
  silverBoxCost: number;
  goldBoxCost: number;
  // Audio
  soundsEnabled: boolean;
  soundsVolume: number; // 0..1
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
  lastStudyDate: string | null; // ISO yyyy-mm-dd
  casinoClosedUntil: number | null; // epoch ms
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
};

export const DEFAULT_TOPICS: Topic[] = [
  { id: "t1", name: "Matemáticas", weight: 1, enabled: true, category: "Ciencias" },
  { id: "t2", name: "Historia", weight: 1, enabled: true, category: "Humanidades" },
  { id: "t3", name: "Ciencias Naturales", weight: 1, enabled: true, category: "Ciencias" },
  { id: "t4", name: "Inglés", weight: 1, enabled: true, category: "Idiomas" },
  { id: "t5", name: "Programación", weight: 1, enabled: true, category: "Tecnología" },
  { id: "t6", name: "Literatura", weight: 1, enabled: true, category: "Humanidades" },
];

export const DEFAULT_REWARDS: Reward[] = [
  {
    id: "r1",
    name: "5 min de memes",
    icon: "🤣",
    cost: 10,
    durationMin: 5,
    rarity: "comun",
    cooldownMin: 30,
    category: "Redes sociales",
  },
  {
    id: "r2",
    name: "Café",
    icon: "☕",
    cost: 8,
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 60,
    category: "Snacks",
  },
  {
    id: "r3",
    name: "1 partida online",
    icon: "🎮",
    cost: 15,
    durationMin: 20,
    rarity: "raro",
    cooldownMin: 60,
    category: "Videojuegos",
  },
  {
    id: "r4",
    name: "10 min TikTok",
    icon: "📱",
    cost: 20,
    durationMin: 10,
    rarity: "raro",
    cooldownMin: 90,
    category: "Redes sociales",
  },
  {
    id: "r5",
    name: "Snack favorito",
    icon: "🍪",
    cost: 12,
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 90,
    category: "Snacks",
  },
  {
    id: "r6",
    name: "15 min YouTube",
    icon: "📺",
    cost: 25,
    durationMin: 15,
    rarity: "epico",
    cooldownMin: 120,
    category: "Entretenimiento",
  },
  {
    id: "r7",
    name: "Episodio de serie",
    icon: "🎬",
    cost: 40,
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
