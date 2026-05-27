// Centralized game store with reducer-style actions, persisted to AsyncStorage.
// All economy logic flows through these helpers so screens stay declarative.

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from "react";

import { storage } from "@/src/utils/storage";

import {
  DEFAULT_STATE,
  GameState,
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
  }) => { coinsEarned: number; newStreak: number };
  failStudySession: (params: { highRiskBet?: number }) => { coinsLost: number };
  // casino
  recordSpin: (jackpot: boolean) => void;
  // rewards
  redeemReward: (id: string) => boolean;
  upsertReward: (reward: Reward) => void;
  deleteReward: (id: string) => void;
  // topics
  upsertTopic: (topic: Topic) => void;
  deleteTopic: (id: string) => void;
  toggleTopic: (id: string) => void;
  markTopicStudied: (id: string) => void;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
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

  // hydrate
  useEffect(() => {
    (async () => {
      const raw = await storage.getItem<string>(STORAGE_KEY, "");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GameState;
          // soft-merge with defaults to add new fields when app updates
          setState({
            ...DEFAULT_STATE,
            ...parsed,
            settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
            stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
            topics: parsed.topics?.length ? parsed.topics : DEFAULT_STATE.topics,
            rewards: parsed.rewards?.length ? parsed.rewards : DEFAULT_STATE.rewards,
          });
        } catch {
          // ignore
        }
      }
      setLoading(false);
    })();
  }, []);

  // persist on every change after initial load
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

  const completeStudySession = useCallback<StoreApi["completeStudySession"]>(
    ({ minutes, pauses, highRiskBet = 0 }) => {
      let coinsEarned = 0;
      let newStreak = 0;
      setState((s) => {
        const { coinsPerMinute, noPauseBonus, longSessionBonus, streakBonus, highRiskMultiplier } =
          s.settings;
        const base = Math.floor(minutes * coinsPerMinute);
        const bonusNoPause = pauses === 0 ? noPauseBonus : 0;
        const bonusLong = minutes >= 50 ? longSessionBonus : 0;
        const today = todayISO();
        // streak: if last study was yesterday -> +1; if today already -> keep; else reset to 1
        const yesterday = (() => {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          return d.toISOString().slice(0, 10);
        })();
        let streak = s.streak;
        if (s.lastStudyDate === today) {
          // already studied today, do not bump streak again
        } else if (s.lastStudyDate === yesterday) {
          streak = s.streak + 1;
        } else {
          streak = 1;
        }
        const bonusStreak = streak * streakBonus;
        let earned = base + bonusNoPause + bonusLong + bonusStreak;
        if (highRiskBet > 0) {
          // user wins highRiskBet * multiplier (net = bet*multiplier; bet was already spent)
          earned += highRiskBet * highRiskMultiplier;
        }
        coinsEarned = earned;
        newStreak = streak;
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
        };
      });
      return { coinsEarned, newStreak };
    },
    [],
  );

  const failStudySession = useCallback<StoreApi["failStudySession"]>(
    ({ highRiskBet = 0 }) => {
      let coinsLost = 0;
      setState((s) => {
        const penalty = s.settings.failPenaltyCoins + highRiskBet; // bet already spent counts as additional loss visualization
        const closeUntil = Date.now() + s.settings.casinoClosedMin * 60 * 1000;
        coinsLost = Math.min(penalty, s.coins) + highRiskBet;
        return {
          ...s,
          coins: Math.max(0, s.coins - s.settings.failPenaltyCoins),
          streak: 0,
          casinoClosedUntil: closeUntil,
          stats: {
            ...s.stats,
            sessionsFailed: s.stats.sessionsFailed + 1,
          },
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

  const redeemReward = useCallback((id: string) => {
    let ok = false;
    setState((s) => {
      const r = s.rewards.find((x) => x.id === id);
      if (!r) return s;
      if (s.coins < r.cost) return s;
      const now = Date.now();
      if (r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000) return s;
      const today = todayISO();
      const usedToday = r.usedDate === today ? r.usedToday ?? 0 : 0;
      if (r.dailyLimit && usedToday >= r.dailyLimit) return s;
      ok = true;
      return {
        ...s,
        coins: s.coins - r.cost,
        stats: { ...s.stats, rewardsRedeemed: s.stats.rewardsRedeemed + 1 },
        rewards: s.rewards.map((x) =>
          x.id === id
            ? {
                ...x,
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
      const exists = s.rewards.some((r) => r.id === reward.id);
      const finalReward = reward.id ? reward : { ...reward, id: genId("r") };
      if (exists) {
        return {
          ...s,
          rewards: s.rewards.map((r) => (r.id === finalReward.id ? finalReward : r)),
        };
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
      topics: s.topics.map((t) => (t.id === id ? { ...t, lastStudiedAt: Date.now() } : t)),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
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
    completeStudySession,
    failStudySession,
    recordSpin,
    redeemReward,
    upsertReward,
    deleteReward,
    upsertTopic,
    deleteTopic,
    toggleTopic,
    markTopicStudied,
    updateSettings,
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
