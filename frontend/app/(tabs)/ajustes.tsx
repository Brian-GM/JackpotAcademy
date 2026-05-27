// SETTINGS — deep customization for economy, audio, notifications, app blocker, topics & reset.

import { useEffect, useState, useCallback } from "react";
import {
  Linking,
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
import {
  getInstalledApps,
  isAccessibilityEnabled,
  isBlockerAvailable,
  openAccessibilitySettings,
  useAppBlockerSync,
} from "@/src/hooks/use-blocker";
import { useGameStore } from "@/src/store/game-store";
import {
  BlockedApp,
  Difficulty,
  DIFFICULTY_EMOJI,
  DIFFICULTY_LABEL,
  Settings,
  Topic,
} from "@/src/store/types";
import { colors, fonts, inkBorder, radii } from "@/src/theme";

type FieldConfig = {
  key: keyof Settings;
  label: string;
  help: string;
  isFloat?: boolean;
};

const ECONOMY_FIELDS: FieldConfig[] = [
  { key: "pomodoroDuration", label: "Duración Pomodoro (min)", help: "Sesión por defecto" },
  { key: "breakDuration", label: "Descanso (min)", help: "Tiempo entre sesiones" },
  { key: "coinsPerMinute", label: "Fichas por minuto", help: "Multiplica × dificultad del tema", isFloat: true },
  { key: "noPauseBonus", label: "Bonus sin pausa", help: "Si completas sin pausar" },
  { key: "longSessionBonus", label: "Bonus sesión larga", help: "Si dura ≥ 50 min" },
  { key: "streakBonus", label: "Bonus por nivel de racha", help: "Por cada día consecutivo" },
  { key: "slotSpinCost", label: "Costo tragamonedas", help: "Por giro" },
  { key: "rouletteSpinCost", label: "Costo ruleta de temas", help: "Por giro" },
  {
    key: "jackpotProbability",
    label: "Probabilidad jackpot",
    help: "0 a 1 (ej: 0.03 = 3%)",
    isFloat: true,
  },
  { key: "failPenaltyCoins", label: "Penalización por fallo", help: "Fichas perdidas" },
  { key: "casinoClosedMin", label: "Cierre casino tras fallo (min)", help: "Duración del castigo" },
  { key: "maxPauses", label: "Pausas máximas", help: "Antes de fallar" },
  { key: "highRiskMultiplier", label: "Multiplicador alto riesgo", help: "Ganancias × N si completas" },
  { key: "appBlurFailSec", label: "Salir de app (seg)", help: "Tolerancia antes de fallar" },
  { key: "bronzeBoxCost", label: "Costo Caja de Bronce", help: "Premio común mayormente" },
  { key: "silverBoxCost", label: "Costo Caja de Plata", help: "Mezcla de raro y épico" },
  { key: "goldBoxCost", label: "Costo Caja de Oro", help: "Mayor chance de legendario" },
];

export default function AjustesScreen() {
  const { state, updateSettings, upsertTopic, deleteTopic, addBlockedApp, removeBlockedApp, addAllowedApp, removeAllowedApp, resetAll } = useGameStore();
  useAppBlockerSync();
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAppPicker, setShowAppPicker] = useState<"block" | "allow" | null>(null);
  const [accessibilityOn, setAccessibilityOn] = useState(false);

  // Poll accessibility status (native only)
  useEffect(() => {
    if (!isBlockerAvailable) return;
    const check = () => setAccessibilityOn(isAccessibilityEnabled());
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, []);

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

          {/* Audio */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>🔊 Audio del casino</Text>
            <ToggleRow
              label="Sonidos activados"
              help="Campanas, monedas, palanca y jackpot"
              value={state.settings.soundsEnabled}
              onToggle={() => updateSettings({ soundsEnabled: !state.settings.soundsEnabled })}
              testID="toggle-sounds"
            />
            <View style={styles.volumeRow}>
              <Text style={styles.fieldLabel}>Volumen</Text>
              <View style={styles.volumeBtns}>
                {[0.2, 0.4, 0.6, 0.8, 1].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => updateSettings({ soundsVolume: v })}
                    style={[
                      styles.volChip,
                      Math.abs(state.settings.soundsVolume - v) < 0.05 && styles.volChipActive,
                    ]}
                    testID={`vol-${Math.round(v * 100)}`}
                  >
                    <Text
                      style={[
                        styles.volChipText,
                        Math.abs(state.settings.soundsVolume - v) < 0.05 && {
                          color: colors.paperHighlight,
                        },
                      ]}
                    >
                      {Math.round(v * 100)}%
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </VintageCard>

          {/* Notifications */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 Notificaciones</Text>
            <ToggleRow
              label="Notificación persistente"
              help="Cuenta atrás del Pomodoro en la barra"
              value={state.settings.notificationsEnabled}
              onToggle={() =>
                updateSettings({ notificationsEnabled: !state.settings.notificationsEnabled })
              }
              testID="toggle-notifications"
            />
            <ToggleRow
              label="Sonido al terminar sesión"
              help="Aviso audible cuando completes el Pomodoro"
              value={state.settings.endSessionSound}
              onToggle={() =>
                updateSettings({ endSessionSound: !state.settings.endSessionSound })
              }
              testID="toggle-end-sound"
            />
          </VintageCard>

          {/* App Blocker */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>📵 Bloqueador de apps (Android)</Text>
            <Text style={styles.fieldHelp}>
              Bloquea apps distractoras durante el Pomodoro. Cuando intentas abrirlas, te devuelve a
              Study Casino con un aviso.
            </Text>

            {!isBlockerAvailable ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Build nativo requerido</Text>
                <Text style={styles.warningBody}>
                  Esta función solo funciona en un APK Android instalado, no en Expo Go ni en el
                  preview web. Publica la app desde el botón “Publish” para generar el APK con el
                  módulo nativo de bloqueo.
                </Text>
                <Text style={styles.warningBody}>
                  Después de instalar, deberás activar manualmente el servicio en
                  Ajustes Android → Accesibilidad → Study Casino Blocker.
                </Text>
              </View>
            ) : (
              <>
                <ToggleRow
                  label="Activar bloqueador durante Pomodoro"
                  help="Solo funciona con permiso de Accesibilidad concedido"
                  value={state.settings.appBlockerEnabled}
                  onToggle={() =>
                    updateSettings({ appBlockerEnabled: !state.settings.appBlockerEnabled })
                  }
                  testID="toggle-blocker"
                />
                <View style={styles.accessRow}>
                  <Text style={styles.fieldLabel}>
                    Permiso de Accesibilidad: {accessibilityOn ? "✅ activo" : "❌ desactivado"}
                  </Text>
                  <VintageButton
                    label="Abrir Ajustes"
                    variant="gold"
                    size="sm"
                    onPress={() => openAccessibilitySettings()}
                  />
                </View>
                <ToggleRow
                  label="Modo estricto (whitelist)"
                  help="Solo permite las apps en la lista blanca; bloquea el resto"
                  value={state.settings.blockerStrictMode}
                  onToggle={() =>
                    updateSettings({ blockerStrictMode: !state.settings.blockerStrictMode })
                  }
                  testID="toggle-strict"
                />
              </>
            )}

            {/* Blocked apps list */}
            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionTitle}>🚫 Apps bloqueadas</Text>
                <VintageButton
                  label="+ Añadir"
                  variant="red"
                  size="sm"
                  onPress={() => setShowAppPicker("block")}
                  testID="add-blocked"
                />
              </View>
              {state.settings.blockedApps.length === 0 ? (
                <Text style={styles.emptyMini}>Sin apps bloqueadas</Text>
              ) : (
                state.settings.blockedApps.map((a) => (
                  <AppRow key={a.package} app={a} onRemove={() => removeBlockedApp(a.package)} />
                ))
              )}
            </View>

            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionTitle}>✅ Apps permitidas (whitelist)</Text>
                <VintageButton
                  label="+ Añadir"
                  variant="gold"
                  size="sm"
                  onPress={() => setShowAppPicker("allow")}
                  testID="add-allowed"
                />
              </View>
              {state.settings.allowedApps.length === 0 ? (
                <Text style={styles.emptyMini}>Vacía (solo aplica en modo estricto)</Text>
              ) : (
                state.settings.allowedApps.map((a) => (
                  <AppRow key={a.package} app={a} onRemove={() => removeAllowedApp(a.package)} />
                ))
              )}
            </View>
          </VintageCard>

          {/* Economy */}
          <VintageCard style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Economía y reglas</Text>
            {ECONOMY_FIELDS.map((f) => (
              <View key={f.key} style={styles.fieldRow}>
                <View style={styles.fieldHeader}>
                  <Text style={styles.fieldLabel} numberOfLines={1}>
                    {f.label}
                  </Text>
                  <TextInput
                    testID={`setting-${f.key}`}
                    keyboardType={f.isFloat ? "decimal-pad" : "number-pad"}
                    value={String(state.settings[f.key])}
                    onChangeText={(t) => set(f.key, t, f.isFloat)}
                    style={styles.input}
                  />
                </View>
                <Text style={styles.fieldHelp}>{f.help}</Text>
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
                    difficulty: 2,
                  })
                }
                testID="add-topic-button"
              />
            </View>
            {state.topics.map((t) => (
              <View key={t.id} style={styles.topicRow}>
                <Text style={styles.topicDiff}>{DIFFICULTY_EMOJI[t.difficulty]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topicName}>{t.name}</Text>
                  <Text style={styles.fieldHelp}>
                    {DIFFICULTY_LABEL[t.difficulty]} · {t.category ?? "Sin categoría"} · peso ×
                    {t.weight}
                  </Text>
                </View>
                <Pressable onPress={() => setEditingTopic(t)} style={styles.iconBtn}>
                  <FontAwesome5 name="pen" color={colors.ink} size={14} />
                </Pressable>
              </View>
            ))}
          </VintageCard>

          {/* Reset */}
          <VintageCard style={styles.section} tint={colors.paperHighlight}>
            <Text style={styles.sectionTitle}>⚠️ Zona peligrosa</Text>
            <Text style={styles.fieldHelp}>
              Reinicia toda tu progresión: fichas, racha, premios e inventario vuelven a cero.
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

      <AppPickerModal
        mode={showAppPicker}
        existing={
          showAppPicker === "block"
            ? state.settings.blockedApps
            : showAppPicker === "allow"
              ? state.settings.allowedApps
              : []
        }
        onClose={() => setShowAppPicker(null)}
        onAdd={(app) => {
          if (showAppPicker === "block") addBlockedApp(app);
          else if (showAppPicker === "allow") addAllowedApp(app);
        }}
      />

      <Modal visible={confirmReset} transparent animationType="fade">
        <View style={styles.confirmBackdrop}>
          <VintageCard tint={colors.vintageRedDark} style={styles.confirmCard}>
            <Text
              style={[styles.sectionTitle, { color: colors.paperHighlight, textAlign: "center" }]}
            >
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

function ToggleRow({
  label,
  help,
  value,
  onToggle,
  testID,
}: {
  label: string;
  help: string;
  value: boolean;
  onToggle: () => void;
  testID?: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldHelp}>{help}</Text>
      </View>
      <Pressable
        onPress={onToggle}
        style={[styles.bigToggle, value && styles.bigToggleOn]}
        testID={testID}
      >
        <View style={[styles.bigToggleKnob, value && styles.bigToggleKnobOn]} />
      </Pressable>
    </View>
  );
}

function AppRow({ app, onRemove }: { app: BlockedApp; onRemove: () => void }) {
  return (
    <View style={styles.appRow}>
      <Text style={styles.appLabel} numberOfLines={1}>
        {app.label}
      </Text>
      <Text style={styles.appPkg} numberOfLines={1}>
        {app.package}
      </Text>
      <Pressable onPress={onRemove} style={styles.removeBtn}>
        <FontAwesome5 name="times" color={colors.vintageRed} size={14} />
      </Pressable>
    </View>
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
    difficulty: 2,
  });

  useEffect(() => {
    if (topic) setDraft({ ...topic });
  }, [topic]);

  if (!topic) return null;

  return (
    <Modal visible={!!topic} transparent animationType="slide">
      <View style={styles.confirmBackdrop}>
        <VintageCard tint={colors.paperHighlight} style={styles.topicModal}>
          <Text style={styles.sectionTitle}>{draft.id ? "Editar tema" : "Nuevo tema"}</Text>
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
          <Text style={styles.fieldLabel}>Dificultad (multiplica fichas)</Text>
          <View style={styles.diffRow}>
            {([1, 2, 3] as Difficulty[]).map((d) => (
              <Pressable
                key={d}
                onPress={() => setDraft({ ...draft, difficulty: d })}
                style={[styles.diffChip, draft.difficulty === d && styles.diffChipActive]}
                testID={`topic-diff-${d}`}
              >
                <Text style={styles.diffEmoji}>{DIFFICULTY_EMOJI[d]}</Text>
                <Text
                  style={[
                    styles.diffLabel,
                    draft.difficulty === d && { color: colors.paperHighlight },
                  ]}
                >
                  {DIFFICULTY_LABEL[d]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Peso (probabilidad en la ruleta)</Text>
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
            <VintageButton label="Cancelar" variant="cream" onPress={onClose} style={{ flex: 1 }} />
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

function AppPickerModal({
  mode,
  existing,
  onClose,
  onAdd,
}: {
  mode: "block" | "allow" | null;
  existing: BlockedApp[];
  onClose: () => void;
  onAdd: (app: BlockedApp) => void;
}) {
  const [manualLabel, setManualLabel] = useState("");
  const [manualPkg, setManualPkg] = useState("");
  const [installed, setInstalled] = useState<{ label: string; package: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInstalled = useCallback(async () => {
    if (!isBlockerAvailable) return;
    setLoading(true);
    try {
      const apps = await getInstalledApps();
      setInstalled(apps);
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (mode) fetchInstalled();
  }, [mode, fetchInstalled]);

  if (!mode) return null;

  const existingPkgs = new Set(existing.map((a) => a.package));
  const filtered = installed.filter((a) => !existingPkgs.has(a.package));

  const submitManual = () => {
    if (!manualLabel.trim() || !manualPkg.trim()) return;
    onAdd({ label: manualLabel.trim(), package: manualPkg.trim() });
    setManualLabel("");
    setManualPkg("");
  };

  return (
    <Modal visible={!!mode} transparent animationType="slide">
      <View style={styles.confirmBackdrop}>
        <VintageCard tint={colors.paperHighlight} style={styles.pickerModal}>
          <Text style={styles.sectionTitle}>
            {mode === "block" ? "Añadir app a bloquear" : "Añadir app permitida"}
          </Text>

          {!isBlockerAvailable && (
            <View style={styles.warningBox}>
              <Text style={styles.warningBody}>
                No se pueden enumerar apps en preview. Añade manualmente por nombre + package id.
                Búscalos en Play Store (parte de la URL después de “id=”).
              </Text>
            </View>
          )}

          <Text style={styles.fieldLabel}>Manual (nombre)</Text>
          <TextInput
            value={manualLabel}
            onChangeText={setManualLabel}
            style={styles.input}
            placeholder="Ej: WhatsApp"
            placeholderTextColor={colors.inkSoft}
          />
          <Text style={styles.fieldLabel}>Package ID</Text>
          <TextInput
            value={manualPkg}
            onChangeText={setManualPkg}
            style={styles.input}
            placeholder="Ej: com.whatsapp"
            placeholderTextColor={colors.inkSoft}
            autoCapitalize="none"
          />
          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <VintageButton
              label="AÑADIR"
              variant="red"
              onPress={submitManual}
              style={{ flex: 1 }}
              testID="picker-add-manual"
            />
            <VintageButton label="Cerrar" variant="cream" onPress={onClose} style={{ flex: 1 }} />
          </View>

          {isBlockerAvailable && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 18 }]}>
                Apps instaladas {loading ? "(cargando...)" : `(${filtered.length})`}
              </Text>
              <ScrollView style={styles.installedList}>
                {filtered.map((a) => (
                  <Pressable
                    key={a.package}
                    onPress={() => onAdd(a)}
                    style={styles.installedRow}
                  >
                    <Text style={styles.appLabel}>{a.label}</Text>
                    <Text style={styles.appPkg}>{a.package}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}

          <Pressable
            onPress={() => Linking.openURL("https://play.google.com/store").catch(() => {})}
            style={{ marginTop: 8, alignItems: "center" }}
          >
            <Text style={styles.linkText}>Buscar package ID en Play Store →</Text>
          </Pressable>
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
  fieldRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(44,30,22,0.15)" },
  fieldHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  fieldLabel: {
    fontFamily: fonts.subheading,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 1,
    flex: 1,
  },
  fieldHelp: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, fontStyle: "italic" },
  input: {
    ...inkBorder(2),
    backgroundColor: colors.paperHighlight,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 14,
    minWidth: 90,
    maxWidth: 200,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  bigToggle: {
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.paperPrimary,
    ...inkBorder(2),
    justifyContent: "center",
    padding: 3,
  },
  bigToggleOn: { backgroundColor: colors.successGreen },
  bigToggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.paperHighlight,
    ...inkBorder(1),
  },
  bigToggleKnobOn: { alignSelf: "flex-end" },
  volumeRow: { marginTop: 10 },
  volumeBtns: { flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" },
  volChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    ...inkBorder(2),
    borderRadius: radii.pill,
    backgroundColor: colors.paperHighlight,
  },
  volChipActive: { backgroundColor: colors.vintageRed },
  volChipText: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 12, letterSpacing: 1 },
  warningBox: {
    ...inkBorder(2),
    backgroundColor: colors.cream,
    padding: 10,
    borderRadius: radii.sm,
    marginTop: 10,
    gap: 6,
  },
  warningTitle: {
    fontFamily: fonts.heading,
    color: colors.vintageRedDark,
    fontSize: 13,
    letterSpacing: 1,
  },
  warningBody: { fontFamily: fonts.body, color: colors.ink, fontSize: 12, lineHeight: 17 },
  accessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  subsection: { marginTop: 12 },
  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  subsectionTitle: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 13, letterSpacing: 2 },
  emptyMini: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    fontStyle: "italic",
    fontSize: 12,
    paddingVertical: 6,
  },
  appRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.1)",
    gap: 8,
  },
  appLabel: {
    fontFamily: fonts.subheading,
    color: colors.ink,
    fontSize: 13,
    flex: 1,
    letterSpacing: 1,
  },
  appPkg: { fontFamily: fonts.body, color: colors.inkSoft, fontSize: 10, flex: 1.5 },
  removeBtn: {
    width: 28,
    height: 28,
    ...inkBorder(2),
    borderRadius: radii.sm,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.15)",
  },
  topicDiff: { fontSize: 18 },
  topicName: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 14, letterSpacing: 1 },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cream,
    borderRadius: radii.sm,
    ...inkBorder(2),
  },
  diffRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  diffChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    ...inkBorder(2),
    borderRadius: radii.sm,
    backgroundColor: colors.paperPrimary,
  },
  diffChipActive: { backgroundColor: colors.vintageRed },
  diffEmoji: { fontSize: 16 },
  diffLabel: { fontFamily: fonts.subheading, color: colors.ink, fontSize: 12, letterSpacing: 1 },
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
  pickerModal: { padding: 18, width: "100%", maxHeight: "85%" },
  installedList: { maxHeight: 200, marginTop: 6 },
  installedRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(44,30,22,0.1)",
  },
  linkText: {
    fontFamily: fonts.body,
    color: colors.vintageRed,
    fontSize: 12,
    textDecorationLine: "underline",
  },
});
