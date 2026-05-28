// PREMIOS — Inventory of earned rewards + customizable catalog (drop pool for the casino).

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

import { CasinoMascot } from "@/src/components/CasinoMascot";
import { CoinBadge } from "@/src/components/CoinBadge";
import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import { Rarity, RARITY_ORDER, Reward } from "@/src/store/types";
import { cartoonShadow, colors, fonts, goldBorder, inkBorder, radii, rarityColor, rarityLabel } from "@/src/theme";

const LOCKED = require("../../assets/images/locked-ticket.png");
const RACHA_ICON = require("../../assets/images/racha-icon.png");
const MASCOT_PREMIOS = require("../../assets/images/mascot-premios.png");

const EMOJI_OPTIONS = [
  "🤣", "📱", "🎮", "📺", "🎬", "☕", "🍪", "🍫", "🎵", "🍕", "🏃", "💤", "📷", "🎨",
];

function defaultReward(): Reward {
  return {
    id: "",
    name: "",
    icon: "🎁",
    durationMin: 10,
    rarity: "comun",
    cooldownMin: 30,
    category: "Personalizado",
  };
}

export default function PremiosScreen() {
  const { state, useEarnedReward, upsertReward, deleteReward } = useGameStore();
  const { play } = useSounds();
  const [editing, setEditing] = useState<Reward | null>(null);
  const [tab, setTab] = useState<"inventario" | "catalogo">("inventario");
  const [, force] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const inventory = state.rewards.filter((r) => (r.earnedCount ?? 0) > 0);
  const totalEarned = inventory.reduce((s, r) => s + (r.earnedCount ?? 0), 0);

  const tryUse = (r: Reward) => {
    const ok = useEarnedReward(r.id);
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
      let reason = "No disponible";
      if ((r.earnedCount ?? 0) <= 0) reason = "Gana este premio en el casino primero";
      else if (r.lastUsedAt && now - r.lastUsedAt < r.cooldownMin * 60 * 1000) {
        reason = "Aún está en cooldown";
      } else if (r.dailyLimit) {
        reason = "Límite diario alcanzado";
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
          <SignTitle title="GALERÍA DE PREMIOS" subtitle="Tu dopamina ganada" />

          {/* Stats Row - Fichas + Racha */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>FICHAS</Text>
              <CoinBadge amount={state.coins} size={32} />
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>RACHA</Text>
              <View style={styles.streakRow}>
                <Image source={RACHA_ICON} style={styles.rachaImage} resizeMode="contain" />
                <Text style={styles.streakNum}>{state.streak}</Text>
              </View>
              <Text style={styles.streakHint}>{state.streak === 1 ? "día" : "días"}</Text>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => {
                play("click");
                setTab("inventario");
              }}
              style={[styles.tabBtn, tab === "inventario" && styles.tabBtnActive]}
              testID="tab-inventario"
            >
              <Text style={[styles.tabText, tab === "inventario" && styles.tabTextActive]}>
                🎟️ Ganados ({totalEarned})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                play("click");
                setTab("catalogo");
              }}
              style={[styles.tabBtn, tab === "catalogo" && styles.tabBtnActive]}
              testID="tab-catalogo"
            >
              <Text style={[styles.tabText, tab === "catalogo" && styles.tabTextActive]}>
                📋 Catálogo
              </Text>
            </Pressable>
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

          {tab === "inventario" ? (
            inventory.length === 0 ? (
              <VintageCard style={styles.emptyCard}>
                <Image source={MASCOT_PREMIOS} style={styles.mascotImage} resizeMode="contain" />
                <Text style={styles.emptyTitle}>Inventario vacío</Text>
                <Text style={styles.emptyBody}>
                  Estudia para ganar fichas y prueba suerte en el casino. Cada giro o caja te puede
                  dar un premio aleatorio de esta galería.
                </Text>
              </VintageCard>
            ) : (
              inventory.map((r) => (
                <InventoryItem
                  key={r.id}
                  reward={r}
                  onUse={() => tryUse(r)}
                  onEdit={() => setEditing(r)}
                />
              ))
            )
          ) : (
            <>
              <Text style={styles.catalogTagline}>
                ✨ El casino sortea premios de este catálogo. Edita los nombres y rarezas.
              </Text>
              <VintageButton
                label="+ Nuevo Premio"
                variant="gold"
                onPress={() => setEditing(defaultReward())}
                testID="add-reward-button"
                style={{ marginBottom: 8 }}
              />
              {state.rewards.map((r) => (
                <CatalogItem key={r.id} reward={r} onEdit={() => setEditing(r)} />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <EditModal
        reward={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          play("click");
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

function InventoryItem({
  reward,
  onUse,
  onEdit,
}: {
  reward: Reward;
  onUse: () => void;
  onEdit: () => void;
}) {
  const now = Date.now();
  const onCooldown = !!(
    reward.lastUsedAt && now - reward.lastUsedAt < reward.cooldownMin * 60 * 1000
  );
  const cooldownMin = onCooldown
    ? Math.ceil((reward.cooldownMin * 60 * 1000 - (now - (reward.lastUsedAt ?? 0))) / 60000)
    : 0;
  const today = new Date().toISOString().slice(0, 10);
  const usedToday = reward.usedDate === today ? reward.usedToday ?? 0 : 0;
  const limitReached = !!(reward.dailyLimit && usedToday >= reward.dailyLimit);
  const disabled = onCooldown || limitReached;

  return (
    <VintageCard
      tint={onCooldown ? colors.paperPrimary : colors.cream}
      style={styles.rewardCard}
      testID={`reward-${reward.id}`}
    >
      <View style={styles.rewardRow}>
        <View style={[styles.iconBubble, { borderColor: rarityColor(reward.rarity) }]}>
          <Text style={styles.iconText}>{reward.icon}</Text>
          {onCooldown && (
            <Image source={LOCKED} style={styles.lockedOverlay} pointerEvents="none" />
          )}
          {(reward.earnedCount ?? 0) > 1 && (
            <View style={styles.stackBadge}>
              <Text style={styles.stackBadgeText}>×{reward.earnedCount}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardName} numberOfLines={1}>
            {reward.name}
          </Text>
          <View style={styles.tagsRow}>
            <View style={[styles.rarityTag, { backgroundColor: rarityColor(reward.rarity) }]}>
              <Text style={styles.rarityText}>{rarityLabel(reward.rarity)}</Text>
            </View>
            <Text style={styles.metaText}>⏱ {reward.durationMin} min</Text>
          </View>
          {onCooldown && (
            <Text style={styles.cooldownText}>🔒 Cooldown: {cooldownMin} min</Text>
          )}
          {limitReached && <Text style={styles.cooldownText}>📅 Límite diario alcanzado</Text>}
        </View>
      </View>
      <View style={styles.rewardActions}>
        <VintageButton
          label={onCooldown ? "BLOQUEADO" : "USAR"}
          variant="red"
          size="sm"
          disabled={disabled}
          onPress={onUse}
          testID={`redeem-${reward.id}`}
          style={{ flex: 1 }}
        />
        <VintageButton label="Editar" variant="cream" size="sm" onPress={onEdit} testID={`edit-${reward.id}`} />
      </View>
    </VintageCard>
  );
}

function CatalogItem({ reward, onEdit }: { reward: Reward; onEdit: () => void }) {
  return (
    <VintageCard tint={colors.paperHighlight} style={styles.catalogCard}>
      <View style={styles.rewardRow}>
        <View
          style={[
            styles.iconBubble,
            { borderColor: rarityColor(reward.rarity), width: 52, height: 52, borderRadius: 26 },
          ]}
        >
          <Text style={{ fontSize: 26 }}>{reward.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rewardName} numberOfLines={1}>
            {reward.name}
          </Text>
          <View style={styles.tagsRow}>
            <View style={[styles.rarityTag, { backgroundColor: rarityColor(reward.rarity) }]}>
              <Text style={styles.rarityText}>{rarityLabel(reward.rarity)}</Text>
            </View>
            <Text style={styles.metaText}>⏱ {reward.durationMin}m</Text>
            <Text style={styles.metaText}>🔄 {reward.cooldownMin}m</Text>
            {(reward.totalEarned ?? 0) > 0 && (
              <Text style={styles.metaText}>🏆 ×{reward.totalEarned}</Text>
            )}
          </View>
        </View>
        <Pressable onPress={onEdit} style={styles.iconBtn} testID={`edit-${reward.id}`}>
          <FontAwesome5 name="pen" color={colors.ink} size={14} />
        </Pressable>
      </View>
    </VintageCard>
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
            <Text style={styles.editTitle}>{draft.id ? "Editar premio" : "Nuevo premio"}</Text>

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

            <Text style={styles.fieldLabel}>Rareza (define qué símbolos lo desbloquean)</Text>
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
                <Text style={styles.fieldLabel}>Duración (min)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.durationMin)}
                  onChangeText={(t) => update("durationMin", Math.max(1, parseInt(t, 10) || 0))}
                  style={styles.input}
                />
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>Cooldown (min)</Text>
                <TextInput
                  keyboardType="number-pad"
                  value={String(draft.cooldownMin)}
                  onChangeText={(t) => update("cooldownMin", Math.max(0, parseInt(t, 10) || 0))}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.gridRow}>
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
              <View style={styles.gridCol}>
                <Text style={styles.fieldLabel}>En inventario</Text>
                <View style={[styles.input, { alignItems: "center", justifyContent: "center" }]}>
                  <Text style={{ fontFamily: fonts.numbers, color: colors.vintageRed }}>
                    ×{draft.earnedCount ?? 0}
                  </Text>
                </View>
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
  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    alignItems: "center",
    paddingVertical: 12,
    ...cartoonShadow(3),
  },
  statLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.antiqueGold,
    letterSpacing: 2,
    marginBottom: 6,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rachaImage: { width: 36, height: 36 },
  streakNum: { 
    fontFamily: fonts.numbers, 
    fontSize: 26, 
    color: colors.antiqueGold,
    textShadowColor: colors.bgDark,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  streakHint: { 
    fontFamily: fonts.body, 
    fontSize: 10, 
    color: colors.cream, 
    marginTop: 2 
  },
  tabRow: {
    flexDirection: "row",
    gap: 4,
    ...goldBorder(2),
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.bgPanel,
  },
  tabBtn: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: colors.vintageRed },
  tabText: { fontFamily: fonts.subheading, fontSize: 11, color: colors.cream, letterSpacing: 1 },
  tabTextActive: { color: colors.paperHighlight },
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
  emptyCard: { padding: 22, alignItems: "center" },
  mascotImage: { width: 120, height: 140 },
  emptyTitle: {
    fontFamily: fonts.heading,
    color: colors.ink,
    fontSize: 20,
    letterSpacing: 1,
    marginTop: 8,
  },
  emptyBody: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  catalogTagline: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 12,
  },
  rewardCard: { padding: 12 },
  catalogCard: { padding: 10 },
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
    overflow: "visible",
  },
  iconText: { fontSize: 32 },
  lockedOverlay: {
    position: "absolute",
    width: 64,
    height: 64,
    opacity: 0.85,
    resizeMode: "cover",
    borderRadius: 32,
  },
  stackBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: colors.vintageRed,
    ...inkBorder(2),
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 24,
    alignItems: "center",
  },
  stackBadgeText: {
    fontFamily: fonts.numbers,
    color: colors.paperHighlight,
    fontSize: 12,
  },
  rewardName: { fontFamily: fonts.heading, fontSize: 18, color: colors.ink, letterSpacing: 1 },
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
  cooldownText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.vintageRed,
    fontStyle: "italic",
    marginTop: 4,
  },
  rewardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    ...inkBorder(2),
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
  rarityChipText: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 12, letterSpacing: 1 },
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
