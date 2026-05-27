// REWARDS — inventory of dopamine rewards. Redeem with coins; full CRUD.

import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { FontAwesome5 } from "@expo/vector-icons";

import { CoinBadge } from "@/src/components/CoinBadge";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { Rarity, RARITY_ORDER, Reward } from "@/src/store/types";
import { cartoonShadow, colors, fonts, inkBorder, radii, rarityColor, rarityLabel } from "@/src/theme";

const LOCKED = require("../../assets/images/locked-ticket.png");

const EMOJI_OPTIONS = [
  "🤣",
  "📱",
  "🎮",
  "📺",
  "🎬",
  "☕",
  "🍪",
  "🍫",
  "🎵",
  "🍕",
  "🏃",
  "💤",
  "📷",
  "🎨",
];

function defaultReward(): Reward {
  return {
    id: "",
    name: "",
    icon: "🎁",
    cost: 10,
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 30,
    category: "Personalizado",
  };
}

export default function PremiosScreen() {
  const { state, redeemReward, upsertReward, deleteReward } = useGameStore();
  const { play } = useSounds();
  const [editing, setEditing] = useState<Reward | null>(null);
  const [, force] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const tryRedeem = (r: Reward) => {
    const ok = redeemReward(r.id);
    if (ok) {
      setFeedback({ ok: true, msg: `Disfruta: ${r.name}` });
      play("coin");
      setTimeout(() => play("bell", { volume: 0.5 }), 200);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // ignore
      }
    } else {
      const now = Date.now();
      let reason = `Necesitas ${r.cost} fichas`;
      if (state.coins >= r.cost) {
        if (r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000) {
          reason = "Aún está en cooldown";
        } else if (r.dailyLimit) {
          reason = "Límite diario alcanzado";
        }
      }
      setFeedback({ ok: false, msg: reason });
      play("fail", { volume: 0.4 });
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {
        // ignore
      }
    }
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="GALERÍA DE PREMIOS" subtitle="Tu dopamina, ganada" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <VintageButton
              label="+ Nuevo"
              variant="gold"
              size="sm"
              onPress={() => setEditing(defaultReward())}
              testID="add-reward-button"
            />
          </View>

          {feedback && (
            <View
              style={[
                styles.feedback,
                { backgroundColor: feedback.ok ? colors.successGreen : colors.vintageRedDark },
              ]}
            >
              <Text style={styles.feedbackText}>{feedback.msg}</Text>
            </View>
          )}

          {state.rewards.length === 0 && (
            <Text style={styles.empty}>No tienes premios. Crea uno con el botón “+ Nuevo”.</Text>
          )}

          {state.rewards.map((r) => {
            const now = Date.now();
            const onCooldown = !!(r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000);
            const cooldownMin = onCooldown
              ? Math.ceil((r.cooldownMin * 60 * 1000 - (now - (r.lastUsedAt ?? 0))) / 60000)
              : 0;
            const canAfford = state.coins >= r.cost;
            const today = new Date().toISOString().slice(0, 10);
            const usedToday = r.usedDate === today ? r.usedToday ?? 0 : 0;
            const limitReached = !!(r.dailyLimit && usedToday >= r.dailyLimit);
            const disabled = onCooldown || !canAfford || limitReached;

            return (
              <VintageCard
                key={r.id}
                tint={onCooldown ? colors.paperPrimary : colors.paperHighlight}
                style={styles.rewardCard}
                testID={`reward-${r.id}`}
              >
                <View style={styles.rewardRow}>
                  <View
                    style={[
                      styles.iconBubble,
                      { borderColor: rarityColor(r.rarity) },
                    ]}
                  >
                    <Text style={styles.iconText}>{r.icon}</Text>
                    {onCooldown && (
                      <Image source={LOCKED} style={styles.lockedOverlay} pointerEvents="none" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rewardName} numberOfLines={1}>
                      {r.name}
                    </Text>
                    <View style={styles.tagsRow}>
                      <View
                        style={[
                          styles.rarityTag,
                          { backgroundColor: rarityColor(r.rarity) },
                        ]}
                      >
                        <Text style={styles.rarityText}>{rarityLabel(r.rarity)}</Text>
                      </View>
                      <Text style={styles.metaText}>⏱ {r.durationMin} min</Text>
                      <Text style={styles.metaText}>🪙 {r.cost}</Text>
                    </View>
                    {!!r.category && <Text style={styles.catText}>{r.category}</Text>}
                    {onCooldown && (
                      <Text style={styles.cooldownText}>
                        🔒 Cooldown: {cooldownMin} min
                      </Text>
                    )}
                    {limitReached && (
                      <Text style={styles.cooldownText}>📅 Límite diario alcanzado</Text>
                    )}
                  </View>
                </View>
                <View style={styles.rewardActions}>
                  <VintageButton
                    label={onCooldown ? "BLOQUEADO" : "COBRAR"}
                    variant="red"
                    size="sm"
                    disabled={disabled}
                    onPress={() => tryRedeem(r)}
                    testID={`redeem-${r.id}`}
                    style={{ flex: 1 }}
                  />
                  <VintageButton
                    label="Editar"
                    variant="cream"
                    size="sm"
                    onPress={() => setEditing(r)}
                    testID={`edit-${r.id}`}
                  />
                </View>
              </VintageCard>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <EditModal
        reward={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          upsertReward(r);
          setEditing(null);
        }}
        onDelete={(id) => {
          deleteReward(id);
          setEditing(null);
        }}
      />
    </PaperBackground>
  );
}

function EditModal({
  reward,
  onClose,
  onSave,
  onDelete,
}: {
  reward: Reward | null;
  onClose: () => void;
  onSave: (r: Reward) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Reward>(defaultReward());

  useEffect(() => {
    if (reward) setDraft({ ...reward });
  }, [reward]);

  if (!reward) return null;

  const update = <K extends keyof Reward>(k: K, v: Reward[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <Modal visible={!!reward} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <VintageCard tint={colors.paperHighlight} style={styles.editModal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.editTitle}>
              {draft.id ? "Editar premio" : "Nuevo premio"}
            </Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={draft.name}
              onChangeText={(t) => update("name", t)}
              style={styles.input}
              placeholder="Ej: 10 min TikTok"
              placeholderTextColor={colors.inkSoft}
              testID="reward-name-input"
            />

            <Text style={styles.fieldLabel}>Ícono</Text>
            <View style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => update("icon", e)}
                  style={[styles.emojiBtn, draft.icon === e && styles.emojiBtnActive]}
                >
                  <Text style={styles.emojiTxt}>{e}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Categoría</Text>
            <TextInput
              value={draft.category}
              onChangeText={(t) => update("category", t)}
              style={styles.input}
              placeholder="Ej: Redes sociales"
              placeholderTextColor={colors.inkSoft}
            />

            <Text style={styles.fieldLabel}>Rareza</Text>
            <View style={styles.rarityRow}>
              {RARITY_ORDER.map((rar) => (
                <Pressable
                  key={rar}
                  onPress={() => update("rarity", rar as Rarity)}
                  style={[
                    styles.rarityChip,
                    draft.rarity === rar && { backgroundColor: rarityColor(rar) },
                  ]}
                >
                  <Text
                    style={[
                      styles.rarityChipText,
                      draft.rarity === rar && { color: colors.paperHighlight },
                    ]}
                  >
                    {rarityLabel(rar)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Costo (🪙)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.cost)}
                  onChangeText={(t) => update("cost", Math.max(1, parseInt(t, 10) || 0))}
                  style={styles.input}
                  testID="reward-cost-input"
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Duración (min)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.durationMin)}
                  onChangeText={(t) =>
                    update("durationMin", Math.max(1, parseInt(t, 10) || 0))
                  }
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Cooldown (min)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.cooldownMin)}
                  onChangeText={(t) =>
                    update("cooldownMin", Math.max(0, parseInt(t, 10) || 0))
                  }
                  style={styles.input}
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Límite diario</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.dailyLimit ?? 0)}
                  onChangeText={(t) => {
                    const n = Math.max(0, parseInt(t, 10) || 0);
                    update("dailyLimit", n === 0 ? undefined : n);
                  }}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <VintageButton
                label="GUARDAR"
                variant="red"
                onPress={() => {
                  if (!draft.name.trim()) return;
                  onSave(draft);
                }}
                style={{ flex: 1 }}
                testID="save-reward"
              />
              <VintageButton
                label="Cancelar"
                variant="cream"
                onPress={onClose}
                style={{ flex: 1 }}
              />
            </View>
            {!!draft.id && (
              <Pressable onPress={() => onDelete(draft.id)} style={styles.deleteRow}>
                <FontAwesome5 name="trash" color={colors.vintageRed} size={14} />
                <Text style={styles.deleteText}>Eliminar premio</Text>
              </Pressable>
            )}
          </ScrollView>
        </VintageCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  empty: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 12,
  },
  feedback: {
    padding: 12,
    borderRadius: radii.md,
    ...inkBorder(2),
  },
  feedbackText: {
    fontFamily: fonts.subheading,
    color: colors.paperHighlight,
    letterSpacing: 1,
    textAlign: "center",
  },
  rewardCard: { padding: 12 },
  rewardRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    ...cartoonShadow(2),
    overflow: "hidden",
  },
  iconText: { fontSize: 32 },
  lockedOverlay: {
    position: "absolute",
    width: 64,
    height: 64,
    opacity: 0.85,
    resizeMode: "cover",
  },
  rewardName: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 1,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  rarityTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    ...inkBorder(1),
  },
  rarityText: {
    fontFamily: fonts.subheading,
    fontSize: 10,
    color: colors.paperHighlight,
    letterSpacing: 1,
  },
  metaText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft },
  catText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  cooldownText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.vintageRed,
    fontStyle: "italic",
    marginTop: 4,
  },
  rewardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,30,22,0.7)",
    justifyContent: "flex-end",
  },
  editModal: {
    maxHeight: "85%",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  editTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.inkSoft,
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    ...inkBorder(2),
    backgroundColor: colors.paperPrimary,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 14,
  },
  emojiRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  emojiBtn: {
    width: 40,
    height: 40,
    ...inkBorder(2),
    borderRadius: radii.sm,
    backgroundColor: colors.paperPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnActive: { backgroundColor: colors.antiqueGold },
  emojiTxt: { fontSize: 22 },
  rarityRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  rarityChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    ...inkBorder(2),
    backgroundColor: colors.paperPrimary,
  },
  rarityChipText: {
    fontFamily: fonts.subheading,
    color: colors.ink,
    fontSize: 12,
    letterSpacing: 1,
  },
  gridRow: { flexDirection: "row", gap: 10 },
  gridCol: { flex: 1 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  deleteRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  deleteText: { fontFamily: fonts.body, color: colors.vintageRed, fontSize: 13 },
});
