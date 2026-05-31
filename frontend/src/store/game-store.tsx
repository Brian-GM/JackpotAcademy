// Centralized game store with reducer-style actions, persisted to AsyncStorage.

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";

import { storage } from "@/src/utils/storage";

import {
  BlockedApp,
  DEFAULT_STATE,
  DIFFICULTY_MULTIPLIER,
  GameState,
  Mastery,
  Rarity,
  Reward,
  Settings,
  Topic,
} from "./types";

const STORAGE_KEY = "study_casino_state_v1";

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type StoreApi = {
  state: GameState;
  loading: boolean;
  // economy
  addCoins: (n: number) => void;
  spendCoins: (n: number) => boolean;
  // pomodoro lifecycle
  completeStudySession: (params: {
    minutes: number;
    pauses: number;
    highRiskBet?: number;
    topicId?: string | null;
  }) => { coinsEarned: number; newStreak: number; difficultyLabel: string; multiplier: number };
  failStudySession: (params: { highRiskBet?: number }) => { coinsLost: number };
  setCurrentTopic: (id: string | null) => void;
  // casino — slot now grants rewards rather than coins
  recordSpin: (jackpot: boolean) => void;
  grantRewardOfRarity: (rarity: Rarity) => Reward | null;
  // rewards
  useEarnedReward: (id: string) => boolean;
  upsertReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  // topics
  upsertTopic: (topic: Topic) => void;
  deleteTopic: (id: string) => void;
  toggleTopic: (id: string) => void;
  markTopicStudied: (id: string) => void;
  setTopicMastery: (id: string, mastery: Mastery) => void;
  toggleCategory: (category: string) => void;
  computeTopicPriority: (topic: Topic) => number;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  // blocker
  addBlockedApp: (app: BlockedApp) => void;
  removeBlockedApp: (pkg: string) => void;
  addAllowedApp: (app: BlockedApp) => void;
  removeAllowedApp: (pkg: string) => void;
  // misc
  resetAll: () => void;
  // helpers
  isCasinoClosed: () => boolean;
  casinoClosedRemainingSec: () => number;
};

const StoreContext = createContext<StoreApi | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(STORAGE_KEY, "");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GameState;
          // ensure topics have difficulty (legacy users)
          const topics = (parsed.topics?.length ? parsed.topics : DEFAULT_STATE.topics).map(
            (t) => ({ ...t, difficulty: t.difficulty ?? 2 }) as Topic,
          );
          setState({
            ...DEFAULT_STATE,
            ...parsed,
            settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
            stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
            topics,
            rewards: parsed.rewards?.length ? parsed.rewards : DEFAULT_STATE.rewards,
          });
        } catch {
          // ignore
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, loading]);

  const addCoins = useCallback((n: number) => {
    setState((s) => ({ ...s, coins: Math.max(0, s.coins + n) }));
  }, []);

  const spendCoins = useCallback((n: number) => {
    let ok = false;
    setState((s) => {
      if (s.coins < n) return s;
      ok = true;
      return { ...s, coins: s.coins - n };
    });
    return ok;
  }, []);

  const setCurrentTopic = useCallback((id: string | null) => {
    setState((s) => ({ ...s, currentTopicId: id }));
  }, []);

  const completeStudySession = useCallback<StoreApi["completeStudySession"]>(
    ({ minutes, pauses, highRiskBet = 0, topicId }) => {
      let coinsEarned = 0;
      let newStreak = 0;
      let difficultyLabel = "Medio";
      let multiplier = 1.5;
      setState((s) => {
        const { coinsPerMinute, noPauseBonus, longSessionBonus, streakBonus, highRiskMultiplier } =
          s.settings;
        // Topic-based difficulty multiplier (key change in this iteration)
        const tid = topicId ?? s.currentTopicId;
        const topic = tid ? s.topics.find((t) => t.id === tid) : null;
        const diff = topic?.difficulty ?? 2;
        const diffMult = DIFFICULTY_MULTIPLIER[diff];
        const baseRaw = minutes * coinsPerMinute * diffMult;
        const base = Math.floor(baseRaw);
        const bonusNoPause = pauses === 0 ? noPauseBonus : 0;
        const bonusLong = minutes >= 50 ? longSessionBonus : 0;
        const today = todayISO();
        const yesterday = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return d.toISOString().slice(0, 10);
        })();
        let streak = s.streak;
        if (s.lastStudyDate === today) {
          // same day — don't bump
        } else if (s.lastStudyDate === yesterday) {
          streak = s.streak + 1;
        } else {
          streak = 1;
        }
        const bonusStreak = streak * streakBonus;
        let earned = base + bonusNoPause + bonusLong + bonusStreak;
        if (highRiskBet > 0) {
          earned += highRiskBet * highRiskMultiplier;
        }
        coinsEarned = earned;
        newStreak = streak;
        difficultyLabel =
          diff === 1 ? "Fácil" : diff === 2 ? "Medio" : "Difícil";
        multiplier = diffMult;
        // mark topic studied if any — bump both timestamp and review counter
        const topics = topic
          ? s.topics.map((t) =>
              t.id === topic.id
                ? {
                    ...t,
                    lastStudiedAt: Date.now(),
                    reviewCount: (t.reviewCount ?? 0) + 1,
                  }
                : t,
            )
          : s.topics;
        return {
          ...s,
          coins: s.coins + earned,
          streak,
          lastStudyDate: today,
          stats: {
            ...s.stats,
            totalStudyMinutes: s.stats.totalStudyMinutes + minutes,
            sessionsCompleted: s.stats.sessionsCompleted + 1,
          },
          topics,
        };
      });
      return { coinsEarned, newStreak, difficultyLabel, multiplier };
    },
    [],
  );

  const failStudySession = useCallback<StoreApi["failStudySession"]>(
    ({ highRiskBet = 0 }) => {
      let coinsLost = 0;
      setState((s) => {
        // Penalización: quitar fichas pero NO cerrar el casino
        const penalty = s.settings.failPenaltyCoins + highRiskBet;
        coinsLost = Math.min(penalty, s.coins);
        return {
          ...s,
          coins: Math.max(0, s.coins - penalty),
          streak: 0,
          // Ya no cerramos el casino: casinoClosedUntil permanece igual
          stats: { ...s.stats, sessionsFailed: s.stats.sessionsFailed + 1 },
        };
      });
      return { coinsLost };
    },
    [],
  );

  const recordSpin = useCallback((jackpot: boolean) => {
    setState((s) => ({
      ...s,
      stats: {
        ...s.stats,
        totalSpins: s.stats.totalSpins + 1,
        totalJackpots: s.stats.totalJackpots + (jackpot ? 1 : 0),
      },
    }));
  }, []);

  // Grant a random reward of the given rarity (or fallback to lower rarity if empty).
  const grantRewardOfRarity = useCallback<StoreApi["grantRewardOfRarity"]>((rarity) => {
    let granted: Reward | null = null;
    const order: Rarity[] = ["legendario", "epico", "raro", "comun"];
    setState((s) => {
      // Find rewards at requested rarity first, then lower if empty
      const requestedIdx = order.indexOf(rarity);
      let pool: Reward[] = [];
      for (let i = requestedIdx; i < order.length; i++) {
        pool = s.rewards.filter((r) => r.rarity === order[i]);
        if (pool.length > 0) break;
      }
      if (pool.length === 0) pool = s.rewards;
      if (pool.length === 0) return s;
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      granted = chosen;
      return {
        ...s,
        rewards: s.rewards.map((r) =>
          r.id === chosen.id
            ? {
                ...r,
                earnedCount: (r.earnedCount ?? 0) + 1,
                totalEarned: (r.totalEarned ?? 0) + 1,
              }
            : r,
        ),
      };
    });
    return granted;
  }, []);

  const useEarnedReward = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      const r = s.rewards.find((x) => x.id === id);
      if (!r) return s;
      if ((r.earnedCount ?? 0) <= 0) return s;
      const now = Date.now();
      if (r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000) return s;
      const today = todayISO();
      const usedToday = r.usedDate === today ? r.usedToday ?? 0 : 0;
      if (r.dailyLimit && usedToday >= r.dailyLimit) return s;
      ok = true;
      return {
        ...s,
        stats: { ...s.stats, rewardsRedeemed: s.stats.rewardsRedeemed + 1 },
        rewards: s.rewards.map((x) =>
          x.id === id
            ? {
                ...x,
                earnedCount: (x.earnedCount ?? 0) - 1,
                lastUsedAt: now,
                usedDate: today,
                usedToday: usedToday + 1,
              }
            : x,
        ),
      };
    });
    return ok;
  }, []);

  const upsertReward = useCallback((reward: Reward) => {
    setState((s) => {
      const finalReward = reward.id ? reward : { ...reward, id: genId("r") };
      const exists = s.rewards.some((r) => r.id === finalReward.id);
      if (exists) {
        return { ...s, rewards: s.rewards.map((r) => (r.id === finalReward.id ? finalReward : r)) };
      }
      return { ...s, rewards: [...s.rewards, finalReward] };
    });
  }, []);

  const deleteReward = useCallback((id: string) => {
    setState((s) => ({ ...s, rewards: s.rewards.filter((r) => r.id !== id) }));
  }, []);

  const upsertTopic = useCallback((topic: Topic) => {
    setState((s) => {
      const finalTopic = topic.id ? topic : { ...topic, id: genId("t") };
      const exists = s.topics.some((t) => t.id === finalTopic.id);
      if (exists) {
        return { ...s, topics: s.topics.map((t) => (t.id === finalTopic.id ? finalTopic : t)) };
      }
      return { ...s, topics: [...s.topics, finalTopic] };
    });
  }, []);

  const deleteTopic = useCallback((id: string) => {
    setState((s) => ({ ...s, topics: s.topics.filter((t) => t.id !== id) }));
  }, []);

  const toggleTopic = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      topics: s.topics.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)),
    }));
  }, []);

  const markTopicStudied = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      topics: s.topics.map((t) =>
        t.id === id
          ? {
              ...t,
              lastStudiedAt: Date.now(),
              reviewCount: (t.reviewCount ?? 0) + 1,
            }
          : t,
      ),
    }));
  }, []);

  const setTopicMastery = useCallback((id: string, mastery: Mastery) => {
    setState((s) => ({
      ...s,
      topics: s.topics.map((t) => (t.id === id ? { ...t, mastery } : t)),
    }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setState((s) => {
      const disabled = s.settings.disabledCategories ?? [];
      const next = disabled.includes(category)
        ? disabled.filter((c) => c !== category)
        : [...disabled, category];
      return { ...s, settings: { ...s.settings, disabledCategories: next } };
    });
  }, []);

  // Smart roulette priority — higher = more likely.
  //   importance (weight)  ×  (1 - mastery/3)  ×  (1 + daysSinceStudied / 3) clamped 1..5
  const computeTopicPriority = useCallback((topic: Topic): number => {
    const mastery = topic.mastery ?? 1;
    const masteryFactor = (3 - mastery) / 3; // 1 nada, 0.66 regular, 0.33 bien, 0 controlado
    const baseMastery = Math.max(0.1, masteryFactor); // floor so controlled topics still appear rarely
    const weight = Math.max(0.1, topic.weight);
    const last = topic.lastStudiedAt;
    const days = last ? (Date.now() - last) / 86400000 : 30;
    const timeFactor = Math.min(5, 1 + days / 3);
    return Math.max(0.05, weight * baseMastery * timeFactor);
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const addBlockedApp = useCallback((app: BlockedApp) => {
    setState((s) => {
      if (s.settings.blockedApps.some((a) => a.package === app.package)) return s;
      return {
        ...s,
        settings: { ...s.settings, blockedApps: [...s.settings.blockedApps, app] },
      };
    });
  }, []);

  const removeBlockedApp = useCallback((pkg: string) => {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        blockedApps: s.settings.blockedApps.filter((a) => a.package !== pkg),
      },
    }));
  }, []);

  const addAllowedApp = useCallback((app: BlockedApp) => {
    setState((s) => {
      if (s.settings.allowedApps.some((a) => a.package === app.package)) return s;
      return {
        ...s,
        settings: { ...s.settings, allowedApps: [...s.settings.allowedApps, app] },
      };
    });
  }, []);

  const removeAllowedApp = useCallback((pkg: string) => {
    setState((s) => ({
      ...s,
      settings: {
        ...s.settings,
        allowedApps: s.settings.allowedApps.filter((a) => a.package !== pkg),
      },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const isCasinoClosed = useCallback(() => {
    const until = state.casinoClosedUntil;
    return !!(until && until > Date.now());
  }, [state.casinoClosedUntil]);

  const casinoClosedRemainingSec = useCallback(() => {
    if (!state.casinoClosedUntil) return 0;
    return Math.max(0, Math.floor((state.casinoClosedUntil - Date.now()) / 1000));
  }, [state.casinoClosedUntil]);

  const value: StoreApi = {
    state,
    loading,
    addCoins,
    spendCoins,
    setCurrentTopic,
    completeStudySession,
    failStudySession,
    recordSpin,
    grantRewardOfRarity,
    useEarnedReward,
    upsertReward,
    deleteReward,
    upsertTopic,
    deleteTopic,
    toggleTopic,
    markTopicStudied,
    setTopicMastery,
    toggleCategory,
    computeTopicPriority,
    updateSettings,
    addBlockedApp,
    removeBlockedApp,
    addAllowedApp,
    removeAllowedApp,
    resetAll,
    isCasinoClosed,
    casinoClosedRemainingSec,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useGameStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useGameStore must be used inside GameStoreProvider");
  }
  return ctx;
}

export { genId };
