// TEMAS — Topic catalog. Smart priority view + categories + full CRUD + study history.
// (No roulette wheel here — the spin moved to Estudio screen.)

import { useEffect, useMemo, useState } from "react";
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
import { useSounds } from "@/src/hooks/use-sounds";
import { useGameStore } from "@/src/store/game-store";
import {
  Difficulty,
  DIFFICULTY_EMOJI,
  DIFFICULTY_LABEL,
  Mastery,
  MASTERY_COLOR,
  MASTERY_EMOJI,
  MASTERY_LABEL,
  Topic,
} from "@/src/store/types";
import { cartoonShadow, colors, fonts, goldBorder, inkBorder, radii } from "@/src/theme";

// Mastery icons - clown states
const MASTERY_ICONS: Record<Mastery, any> = {
  0: require("../../assets/images/dominio-nada.png"),      // Nada → Payaso triste
  1: require("../../assets/images/dominio-regular.png"),   // Regular → Payaso neutral
  2: require("../../assets/images/dominio-bien.png"),      // Bien → Payaso feliz
  3: require("../../assets/images/dominio-controlado.png"), // Controlado → Payaso brillante
};

const RACHA_ICON = require("../../assets/images/racha-icon.png");

function formatLastStudied(ts?: number): string {
  if (!ts) return "Nunca";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "Hace un instante";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

function emptyTopic(): Topic {
  return {
    id: "",
    name: "",
    weight: 1,
    enabled: true,
    category: "",
    difficulty: 2,
    mastery: 1,
    reviewCount: 0,
  };
}

export default function TemasScreen() {
  const {
    state,
    toggleTopic,
    toggleCategory,
    setTopicMastery,
    computeTopicPriority,
    upsertTopic,
    deleteTopic,
  } = useGameStore();
  const { play } = useSounds();

  const [section, setSection] = useState<"lista" | "historial">("lista");
  const [editing, setEditing] = useState<Topic | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.topics.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort();
  }, [state.topics]);

  const disabledCats = state.settings.disabledCategories ?? [];

  const pool = useMemo(
    () =>
      state.topics.filter(
        (t) => t.enabled && (!t.category || !disabledCats.includes(t.category)),
      ),
    [state.topics, disabledCats],
  );

  const poolWithPriority = useMemo(() => {
    const items = pool.map((t) => ({ topic: t, priority: computeTopicPriority(t) }));
    const total = items.reduce((s, x) => s + x.priority, 0);
    return { items, total };
  }, [pool, computeTopicPriority]);

  const excluded = state.topics.filter(
    (t) => !t.enabled || (t.category && disabledCats.includes(t.category)),
  );

  const history = useMemo(() => {
    return [...state.topics]
      .filter((t) => t.reviewCount && t.reviewCount > 0)
      .sort((a, b) => (b.lastStudiedAt ?? 0) - (a.lastStudiedAt ?? 0));
  }, [state.topics]);

  const neverStudied = state.topics.filter((t) => !t.reviewCount);

  const tryDelete = (id: string) => {
    deleteTopic(id);
    setEditing(null);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // ignore
    }
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="TEMAS" subtitle="Catálogo · Prioridad · Historial" />

          <View style={styles.topRow}>
            <CoinBadge amount={state.coins} size={28} />
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => {
                  play("click");
                  setSection("lista");
                }}
                style={[styles.tabBtn, section === "lista" && styles.tabBtnActive]}
                testID="tab-lista"
              >
                <Text style={[styles.tabText, section === "lista" && styles.tabTextActive]}>
                  📋 Lista
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  play("click");
                  setSection("historial");
                }}
                style={[styles.tabBtn, section === "historial" && styles.tabBtnActive]}
                testID="tab-history"
              >
                <Text style={[styles.tabText, section === "historial" && styles.tabTextActive]}>
                  📜 Historial
                </Text>
              </Pressable>
            </View>
          </View>

          {section === "lista" ? (
            <>
              <VintageButton
                label="+ AÑADIR TEMA"
                variant="green"
                icon="plus"
                onPress={() => {
                  play("click");
                  setEditing(emptyTopic());
                }}
                testID="add-topic-button"
              />

              {/* Categories */}
              {categories.length > 0 && (
                <Card title="📁 Categorías">
                  <Text style={styles.helpText}>
                    Activa o desactiva categorías completas (afecta a Estudio y Ruleta).
                  </Text>
                  <View style={styles.chipGrid}>
                    {categories.map((cat) => {
                      const off = disabledCats.includes(cat);
                      const count = state.topics.filter((t) => t.category === cat).length;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => {
                            play("click");
                            toggleCategory(cat);
                          }}
                          style={[styles.catChip, !off && styles.catChipActive]}
                          testID={`category-${cat}`}
                        >
                          <Text style={[styles.catChipText, !off && styles.catChipTextActive]}>
                            {off ? "○" : "●"} {cat} · {count}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              )}

              {/* Smart priority */}
              <Card title="🎯 Prioridad inteligente">
                <Text style={styles.helpText}>
                  Importancia × (1 − dominio) × tiempo desde último repaso
                </Text>
                {poolWithPriority.items
                  .slice()
                  .sort((a, b) => b.priority - a.priority)
                  .map((item) => {
                    const pct =
                      poolWithPriority.total > 0
                        ? (item.priority / poolWithPriority.total) * 100
                        : 0;
                    return (
                      <TopicRow
                        key={item.topic.id}
                        topic={item.topic}
                        pct={pct}
                        onToggle={() => toggleTopic(item.topic.id)}
                        onMastery={(m) => setTopicMastery(item.topic.id, m)}
                        onEdit={() => setEditing(item.topic)}
                      />
                    );
                  })}
              </Card>

              {excluded.length > 0 && (
                <Card title="🔇 Excluidos">
                  {excluded.map((t) => (
                    <View key={t.id} style={[styles.topicRow, { opacity: 0.55 }]}>
                      <Pressable
                        onPress={() => toggleTopic(t.id)}
                        style={styles.topicCheckbox}
                        testID={`topic-${t.id}`}
                      >
                        <Text style={styles.topicCheck}>{t.enabled ? "✓" : ""}</Text>
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topicName}>{t.name}</Text>
                        <Text style={styles.helpText}>
                          {!t.enabled
                            ? "Desactivado individualmente"
                            : `Categoría "${t.category}" desactivada`}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setEditing(t)}
                        style={styles.editIconBtn}
                        testID={`edit-topic-${t.id}`}
                      >
                        <FontAwesome5 name="pen" color={colors.antiqueGold} size={12} />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              )}
            </>
          ) : (
            <>
              <Card title="📜 Historial de repasos">
                {history.length === 0 ? (
                  <Text style={styles.empty}>
                    Aún no has estudiado ningún tema. Empieza una sesión Pomodoro para registrar
                    tu primer repaso.
                  </Text>
                ) : (
                  history.map((t) => (
                    <HistoryRow
                      key={t.id}
                      topic={t}
                      onMastery={(m) => setTopicMastery(t.id, m)}
                      onEdit={() => setEditing(t)}
                    />
                  ))
                )}
              </Card>

              {neverStudied.length > 0 && (
                <Card title="🆕 Aún sin estudiar">
                  {neverStudied.map((t) => (
                    <View key={t.id} style={styles.historyRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.topicName}>{t.name}</Text>
                        <Text style={styles.helpText}>
                          {DIFFICULTY_EMOJI[t.difficulty]} {DIFFICULTY_LABEL[t.difficulty]} ·{" "}
                          {t.category ?? "—"}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setEditing(t)}
                        style={styles.editIconBtn}
                        testID={`edit-topic-${t.id}`}
                      >
                        <FontAwesome5 name="pen" color={colors.antiqueGold} size={12} />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <TopicEditModal
        topic={editing}
        onClose={() => setEditing(null)}
        onSave={(t) => {
          upsertTopic(t);
          setEditing(null);
          play("click");
        }}
        onDelete={tryDelete}
      />
    </PaperBackground>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function TopicRow({
  topic,
  pct,
  onToggle,
  onMastery,
  onEdit,
}: {
  topic: Topic;
  pct: number;
  onToggle: () => void;
  onMastery: (m: Mastery) => void;
  onEdit: () => void;
}) {
  const mastery = (topic.mastery ?? 1) as Mastery;
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.topicRow}>
      <Pressable onPress={onToggle} style={styles.topicCheckbox} testID={`topic-${topic.id}`}>
        <Text style={styles.topicCheck}>{topic.enabled ? "✓" : ""}</Text>
      </Pressable>
      <Pressable style={styles.topicMain} onPress={() => setOpen((o) => !o)}>
        <View style={styles.topicTopLine}>
          <Text style={styles.topicName} numberOfLines={1}>
            {DIFFICULTY_EMOJI[topic.difficulty]} {topic.name}
          </Text>
          <Text style={styles.topicPct}>{pct.toFixed(0)}%</Text>
        </View>
        <View style={styles.topicMetaLine}>
          <Text style={[styles.topicMastery, { color: MASTERY_COLOR[mastery] }]}>
            {MASTERY_EMOJI[mastery]} {MASTERY_LABEL[mastery]}
          </Text>
          <Text style={styles.topicMeta}>· {formatLastStudied(topic.lastStudiedAt)}</Text>
          {topic.reviewCount ? (
            <Text style={styles.topicMeta}>· ×{topic.reviewCount}</Text>
          ) : null}
        </View>
        <View style={styles.barOuter}>
          <View style={[styles.barFill, { width: `${Math.min(100, pct)}%` }]} />
        </View>
        {open && (
          <View style={styles.masteryRow}>
            <Text style={styles.helpText}>Dominio:</Text>
            {([0, 1, 2, 3] as Mastery[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => onMastery(m)}
                style={[
                  styles.masteryChip,
                  mastery === m && { backgroundColor: MASTERY_COLOR[m] },
                ]}
                testID={`mastery-${topic.id}-${m}`}
              >
                <Image source={MASTERY_ICONS[m]} style={styles.masteryIcon} resizeMode="contain" />
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
      <Pressable onPress={onEdit} style={styles.editIconBtn} testID={`edit-topic-${topic.id}`}>
        <FontAwesome5 name="pen" color={colors.antiqueGold} size={12} />
      </Pressable>
    </View>
  );
}

function HistoryRow({
  topic,
  onMastery,
  onEdit,
}: {
  topic: Topic;
  onMastery: (m: Mastery) => void;
  onEdit: () => void;
}) {
  const mastery = (topic.mastery ?? 1) as Mastery;
  return (
    <View style={styles.historyRow}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.topicName}>{topic.name}</Text>
          <Pressable onPress={onEdit} style={styles.editIconBtn} testID={`edit-topic-${topic.id}`}>
            <FontAwesome5 name="pen" color={colors.antiqueGold} size={12} />
          </Pressable>
        </View>
        <Text style={styles.helpText}>
          {topic.category ?? "—"} · {formatLastStudied(topic.lastStudiedAt)} · ×
          {topic.reviewCount ?? 0} repasos
        </Text>
        <View style={styles.masteryRowCompact}>
          {([0, 1, 2, 3] as Mastery[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => onMastery(m)}
              style={[
                styles.masteryChipCompact,
                mastery === m && { backgroundColor: MASTERY_COLOR[m] },
              ]}
              testID={`history-mastery-${topic.id}-${m}`}
            >
              <Image source={MASTERY_ICONS[m]} style={styles.masteryIconSmall} resizeMode="contain" />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

function TopicEditModal({
  topic,
  onClose,
  onSave,
  onDelete,
}: {
  topic: Topic | null;
  onClose: () => void;
  onSave: (t: Topic) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Topic>(emptyTopic());
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (topic) {
      setDraft({ ...topic });
      setConfirmDelete(false);
    }
  }, [topic]);

  if (!topic) return null;

  return (
    <Modal visible={!!topic} transparent animationType="slide">
      <View style={styles.modalBackdrop}>
        <View style={styles.editModal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.editTitle}>{draft.id ? "Editar tema" : "Nuevo tema"}</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft({ ...draft, name: t })}
              style={styles.input}
              placeholder="Ej: Termodinámica"
              placeholderTextColor="#A89A7C"
              testID="topic-name-input"
            />

            <Text style={styles.fieldLabel}>Categoría</Text>
            <TextInput
              value={draft.category ?? ""}
              onChangeText={(t) => setDraft({ ...draft, category: t })}
              style={styles.input}
              placeholder="Ej: Ciencias"
              placeholderTextColor="#A89A7C"
            />

            <Text style={styles.fieldLabel}>Dificultad (multiplica fichas ganadas)</Text>
            <View style={styles.optionRow}>
              {([1, 2, 3] as Difficulty[]).map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDraft({ ...draft, difficulty: d })}
                  style={[styles.optionChip, draft.difficulty === d && styles.optionChipActive]}
                  testID={`topic-diff-${d}`}
                >
                  <Text style={styles.optionEmoji}>{DIFFICULTY_EMOJI[d]}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      draft.difficulty === d && { color: colors.paperHighlight },
                    ]}
                  >
                    {DIFFICULTY_LABEL[d]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Importancia / peso (0.1 – 5)</Text>
            <Text style={styles.fieldHelp}>
              Cuanto más alto, más probabilidad de salir en la ruleta inteligente.
            </Text>
            <TextInput
              value={String(draft.weight)}
              onChangeText={(t) =>
                setDraft({ ...draft, weight: Math.max(0.1, Math.min(5, parseFloat(t) || 0.1)) })
              }
              keyboardType="decimal-pad"
              style={styles.input}
              testID="topic-weight-input"
            />

            <Text style={styles.fieldLabel}>Nivel de dominio actual</Text>
            <View style={styles.optionRow}>
              {([0, 1, 2, 3] as Mastery[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setDraft({ ...draft, mastery: m })}
                  style={[
                    styles.optionChip,
                    (draft.mastery ?? 1) === m && {
                      backgroundColor: MASTERY_COLOR[m],
                      borderColor: colors.antiqueGold,
                    },
                  ]}
                  testID={`topic-mastery-${m}`}
                >
                  <Text style={styles.optionEmoji}>{MASTERY_EMOJI[m]}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      (draft.mastery ?? 1) === m && { color: colors.paperHighlight },
                    ]}
                  >
                    {MASTERY_LABEL[m]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalActions}>
              <VintageButton
                label="GUARDAR"
                variant="green"
                onPress={() => draft.name.trim() && onSave(draft)}
                style={{ flex: 1 }}
                testID="save-topic"
              />
              <VintageButton
                label="Cancelar"
                variant="cream"
                onPress={onClose}
                style={{ flex: 1 }}
              />
            </View>

            {!!draft.id && (
              <View style={{ marginTop: 14 }}>
                {!confirmDelete ? (
                  <Pressable
                    onPress={() => setConfirmDelete(true)}
                    style={styles.deleteBtn}
                    testID="delete-topic-button"
                  >
                    <FontAwesome5 name="trash" color={colors.vintageRed} size={14} />
                    <Text style={styles.deleteText}>Eliminar tema</Text>
                  </Pressable>
                ) : (
                  <View style={styles.confirmDeleteWrap}>
                    <Text style={styles.confirmDeleteText}>¿Eliminar “{draft.name}”?</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <VintageButton
                        label="SÍ"
                        variant="red"
                        size="sm"
                        onPress={() => onDelete(draft.id)}
                        style={{ flex: 1 }}
                        testID="confirm-delete-topic"
                      />
                      <VintageButton
                        label="No"
                        variant="cream"
                        size="sm"
                        onPress={() => setConfirmDelete(false)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 14 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    flexWrap: "wrap",
    gap: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 4,
    ...goldBorder(2),
    borderRadius: radii.pill,
    overflow: "hidden",
    backgroundColor: colors.bgPanel,
  },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  tabBtnActive: { backgroundColor: colors.vintageRed },
  tabText: {
    fontFamily: fonts.subheading,
    fontSize: 11,
    color: colors.cream,
    letterSpacing: 1,
  },
  tabTextActive: { color: colors.paperHighlight },
  card: {
    backgroundColor: colors.bgPanel,
    ...goldBorder(2),
    borderRadius: radii.md,
    overflow: "hidden",
    ...cartoonShadow(3),
  },
  cardHeader: {
    backgroundColor: colors.bgPanelLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.antiqueGold,
  },
  cardTitle: {
    fontFamily: fonts.heading,
    color: colors.antiqueGold,
    fontSize: 15,
    letterSpacing: 2,
  },
  cardContent: { padding: 12 },
  helpText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "#A89A7C",
    fontStyle: "italic",
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...inkBorder(2),
    borderColor: colors.brassDark,
    borderRadius: radii.pill,
    backgroundColor: colors.bgPanelLight,
  },
  catChipActive: { backgroundColor: colors.vintageGreen, borderColor: colors.antiqueGold },
  catChipText: { fontFamily: fonts.subheading, color: "#A89A7C", fontSize: 12, letterSpacing: 1 },
  catChipTextActive: { color: colors.paperHighlight },
  topicRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,154,60,0.15)",
  },
  topicCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    ...goldBorder(2),
    backgroundColor: colors.bgDark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  topicCheck: { color: colors.antiqueGold, fontFamily: fonts.heading, fontSize: 14 },
  topicMain: { flex: 1 },
  topicTopLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  topicName: {
    fontFamily: fonts.subheading,
    color: colors.cream,
    fontSize: 15,
    letterSpacing: 1,
    flex: 1,
  },
  topicPct: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14 },
  topicMetaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  topicMastery: { fontFamily: fonts.subheading, fontSize: 11, letterSpacing: 1 },
  topicMeta: { fontFamily: fonts.body, fontSize: 11, color: "#A89A7C" },
  barOuter: {
    height: 6,
    backgroundColor: colors.bgDark,
    borderRadius: 3,
    marginTop: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.brassDark,
  },
  barFill: { height: "100%", backgroundColor: colors.vintageRed },
  masteryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    flexWrap: "wrap",
  },
  masteryChip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    ...inkBorder(1),
    borderColor: colors.brassDark,
    backgroundColor: colors.bgPanelLight,
  },
  masteryIcon: {
    width: 24,
    height: 24,
  },
  masteryChipText: { fontFamily: fonts.body, color: colors.cream, fontSize: 11 },
  masteryRowCompact: { flexDirection: "row", gap: 6, marginTop: 8 },
  masteryChipCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
    ...goldBorder(2),
    backgroundColor: colors.bgPanelLight,
    alignItems: "center",
    justifyContent: "center",
  },
  masteryIconSmall: {
    width: 24,
    height: 24,
  },
  editIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    ...goldBorder(2),
    backgroundColor: colors.bgDark,
    alignItems: "center",
    justifyContent: "center",
  },
  historyRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(201,154,60,0.15)",
  },
  empty: {
    fontFamily: fonts.body,
    color: "#A89A7C",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 14,
  },
  // Edit modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  editModal: {
    maxHeight: "85%",
    backgroundColor: colors.bgPanel,
    ...goldBorder(3),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    padding: 16,
  },
  editTitle: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.antiqueGold,
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: fonts.subheading,
    fontSize: 12,
    color: colors.cream,
    letterSpacing: 2,
    marginTop: 12,
    marginBottom: 4,
  },
  fieldHelp: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: "#A89A7C",
    fontStyle: "italic",
    marginBottom: 4,
  },
  input: {
    ...inkBorder(2),
    borderColor: colors.brassDark,
    backgroundColor: colors.bgDark,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    color: colors.cream,
    fontSize: 14,
  },
  optionRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  optionChip: {
    flex: 1,
    minWidth: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...inkBorder(2),
    borderColor: colors.brassDark,
    borderRadius: radii.sm,
    backgroundColor: colors.bgPanelLight,
  },
  optionChipActive: {
    backgroundColor: colors.vintageRed,
    borderColor: colors.antiqueGold,
  },
  optionEmoji: { fontSize: 14 },
  optionLabel: { fontFamily: fonts.subheading, color: colors.cream, fontSize: 12, letterSpacing: 1 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  deleteBtn: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  deleteText: { fontFamily: fonts.body, color: colors.vintageRed, fontSize: 13 },
  confirmDeleteWrap: {
    ...inkBorder(2),
    borderColor: colors.vintageRed,
    backgroundColor: colors.bgDark,
    padding: 10,
    borderRadius: radii.sm,
  },
  confirmDeleteText: {
    fontFamily: fonts.body,
    color: colors.cream,
    textAlign: "center",
  },
});
