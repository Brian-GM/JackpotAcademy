// SETTINGS — deep customization for economy, rules, topics & reset.

import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";

import { PaperBackground } from "@/src/components/PaperBackground";
import { SignTitle } from "@/src/components/SignTitle";
import { VintageButton } from "@/src/components/VintageButton";
import { VintageCard } from "@/src/components/VintageCard";
import { useGameStore } from "@/src/store/game-store";
import { Settings, Topic } from "@/src/store/types";
import { colors, fonts, inkBorder, radii } from "@/src/theme";

type FieldConfig = {
  key: keyof Settings;
  label: string;
  help: string;
  isFloat?: boolean;
  min?: number;
  max?: number;
};

const ECONOMY_FIELDS: FieldConfig[] = [
  { key: "pomodoroDuration", label: "Duración Pomodoro (min)", help: "Sesión por defecto", min: 1 },
  { key: "breakDuration", label: "Descanso (min)", help: "Tiempo entre sesiones", min: 1 },
  { key: "coinsPerMinute", label: "Fichas por minuto", help: "Recompensa base", min: 0 },
  { key: "noPauseBonus", label: "Bonus sin pausa", help: "Si completas sin pausar", min: 0 },
  { key: "longSessionBonus", label: "Bonus sesión larga", help: "Si dura ≥ 50 min", min: 0 },
  { key: "streakBonus", label: "Bonus por nivel de racha", help: "Por cada día consecutivo", min: 0 },
  { key: "slotSpinCost", label: "Costo tragamonedas", help: "Por giro", min: 1 },
  { key: "rouletteSpinCost", label: "Costo ruleta de temas", help: "Por giro", min: 0 },
  {
    key: "jackpotProbability",
    label: "Probabilidad jackpot",
    help: "Entre 0 y 1 (ej: 0.03 = 3%)",
    min: 0,
    max: 1,
    isFloat: true,
  },
  { key: "failPenaltyCoins", label: "Penalización por fallo", help: "Fichas perdidas", min: 0 },
  { key: "casinoClosedMin", label: "Cierre casino tras fallo (min)", help: "Duración del castigo", min: 0 },
  { key: "maxPauses", label: "Pausas máximas", help: "Antes de fallar", min: 0 },
  { key: "highRiskMultiplier", label: "Multiplicador alto riesgo", help: "Ganancias × N si completas", min: 1 },
  { key: "appBlurFailSec", label: "Salir de app (seg)", help: "Tolerancia antes de fallar", min: 0 },
];

export default function AjustesScreen() {
  const { state, updateSettings, upsertTopic, deleteTopic, resetAll } = useGameStore();
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = (k: keyof Settings, raw: string, isFloat?: boolean) => {
    const num = isFloat ? parseFloat(raw) : parseInt(raw, 10);
    const safe = Number.isFinite(num) ? num : 0;
    updateSettings({ [k]: safe } as Partial<Settings>);
  };

  return (
    <PaperBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <SignTitle title="AJUSTES DEL CASINO" subtitle="Edita las reglas" />

          {/* Economy */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Economía y reglas</Text>
            {ECONOMY_FIELDS.map((f) => (
              <View key={f.key} style={styles.fieldRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                  <Text style={styles.fieldHelp}>{f.help}</Text>
                </View>
                <TextInput
                  testID={`setting-${f.key}`}
                  keyboardType={f.isFloat ? "decimal-pad" : "number-pad"}
                  value={String(state.settings[f.key])}
                  onChangeText={(t) => set(f.key, t, f.isFloat)}
                  style={styles.input}
                />
              </View>
            ))}
          </VintageCard>

          {/* Topics CRUD */}
          <VintageCard style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📚 Temas de estudio</Text>
              <VintageButton
                label="+ Tema"
                variant="gold"
                size="sm"
                onPress={() =>
                  setEditingTopic({
                    id: "",
                    name: "",
                    weight: 1,
                    enabled: true,
                    category: "",
                  })
                }
                testID="add-topic-button"
              />
            </View>
            {state.topics.map((t) => (
              <View key={t.id} style={styles.topicRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicName}>{t.name}</Text>
                  {!!t.category && <Text style={styles.fieldHelp}>{t.category}</Text>}
                </View>
                <Text style={styles.weightLabel}>×{t.weight}</Text>
                <Pressable onPress={() => setEditingTopic(t)} style={styles.iconBtn}>
                  <FontAwesome5 name="pen" color={colors.ink} size={14} />
                </Pressable>
              </View>
            ))}
          </VintageCard>

          {/* Stats / Reset */}
          <VintageCard style={styles.section} tint={colors.paperHighlight}>
            <Text style={styles.sectionTitle}>⚠️ Zona peligrosa</Text>
            <Text style={styles.fieldHelp}>
              Reinicia toda tu progresión: fichas, racha, premios, temas y ajustes vuelven al
              estado inicial.
            </Text>
            <VintageButton
              label="REINICIAR TODO"
              variant="red"
              onPress={() => setConfirmReset(true)}
              style={{ marginTop: 12 }}
              testID="reset-all-button"
            />
          </VintageCard>

          <Text style={styles.footer}>Study Casino · v1 · est. 1932</Text>
        </ScrollView>
      </SafeAreaView>

      <TopicModal
        topic={editingTopic}
        onClose={() => setEditingTopic(null)}
        onSave={(t) => {
          upsertTopic(t);
          setEditingTopic(null);
        }}
        onDelete={(id) => {
          deleteTopic(id);
          setEditingTopic(null);
        }}
      />

      <Modal visible={confirmReset} transparent animationType="fade">
        <View style={styles.confirmBackdrop}>
          <VintageCard tint={colors.vintageRedDark} style={styles.confirmCard}>
            <Text style={[styles.sectionTitle, { color: colors.paperHighlight, textAlign: "center" }]}>
              ¿Reiniciar TODO?
            </Text>
            <Text style={[styles.fieldHelp, { color: colors.cream, textAlign: "center" }]}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <VintageButton
                label="Cancelar"
                variant="cream"
                onPress={() => setConfirmReset(false)}
                style={{ flex: 1 }}
              />
              <VintageButton
                label="SÍ, REINICIAR"
                variant="gold"
                onPress={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
                style={{ flex: 1 }}
                testID="confirm-reset-button"
              />
            </View>
          </VintageCard>
        </View>
      </Modal>
    </PaperBackground>
  );
}

function TopicModal({
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
  const [draft, setDraft] = useState<Topic>({
    id: "",
    name: "",
    weight: 1,
    enabled: true,
    category: "",
  });

  useEffect(() => {
    if (topic) setDraft({ ...topic });
  }, [topic]);

  if (!topic) return null;

  return (
    <Modal visible={!!topic} transparent animationType="slide">
      <View style={styles.confirmBackdrop}>
        <VintageCard tint={colors.paperHighlight} style={styles.topicModal}>
          <Text style={styles.sectionTitle}>
            {draft.id ? "Editar tema" : "Nuevo tema"}
          </Text>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            value={draft.name}
            onChangeText={(t) => setDraft({ ...draft, name: t })}
            style={styles.input}
            testID="topic-name-input"
          />
          <Text style={styles.fieldLabel}>Categoría</Text>
          <TextInput
            value={draft.category ?? ""}
            onChangeText={(t) => setDraft({ ...draft, category: t })}
            style={styles.input}
          />
          <Text style={styles.fieldLabel}>Peso (probabilidad)</Text>
          <TextInput
            value={String(draft.weight)}
            onChangeText={(t) =>
              setDraft({ ...draft, weight: Math.max(0.1, parseFloat(t) || 0.1) })
            }
            keyboardType="decimal-pad"
            style={styles.input}
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <VintageButton
              label="GUARDAR"
              variant="red"
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
            <Pressable
              onPress={() => onDelete(draft.id)}
              style={{ alignItems: "center", paddingVertical: 12 }}
            >
              <Text style={{ color: colors.vintageRed, fontFamily: fonts.body }}>
                Eliminar tema
              </Text>
            </Pressable>
          )}
        </VintageCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32, gap: 12 },
  section: { padding: 14 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: fonts.heading,
    fontSize: 17,
    color: colors.ink,
    letterSpacing: 1,
  },
  fieldRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  fieldLabel: {
    fontFamily: fonts.subheading,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 1,
    flex: 1,
  },
  fieldHelp: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    fontStyle: "italic",
  },
  input: {
    ...inkBorder(2),
    backgroundColor: colors.paperHighlight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: fonts.numbers,
    color: colors.ink,
    minWidth: 90,
    maxWidth: 130,
    textAlign: "center",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  topicName: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 14, letterSpacing: 1 },
  weightLabel: { fontFamily: fonts.numbers, color: colors.vintageRed, fontSize: 14 },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    ...inkBorder(2),
  },
  footer: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 11,
    marginTop: 6,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(44,30,22,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: { padding: 22, minWidth: 280 },
  topicModal: { padding: 18, minWidth: 300 },
});
