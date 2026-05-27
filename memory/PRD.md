# Study Casino — PRD

## Overview
**Study Casino** is a mobile-first Expo Android app that frames studying as the only legal way to earn dopamine. Users complete vintage Pomodoro sessions to win brass coins, gamble them in a 1930s cartoon slot machine, and "cash" hand-crafted real-life rewards (memes, TikTok, coffee, gaming…). The whole experience is dressed as an antique gambling hall: sepia paper, ink outlines, brass coins, jazz-club typography (Rye / Limelight / Bungee / IM Fell English SC).

## User Decisions
- Backend / storage: **local-only AsyncStorage**, offline-first (no Supabase / no FastAPI).
- Auth: **none**.
- Sound: **placeholder / royalty-free** (haptics implemented; audio not in MVP).
- MVP scope: **core loop** — Pomodoro · Coins economy · Slot Machine · Customizable rewards · Topic Roulette.
- Language: **Spanish (Español)**.

## Tech Stack
- React Native + **Expo Router** (file-based, tabs)
- TypeScript
- **AsyncStorage** via `@/src/utils/storage` for all persistence
- **react-native-reanimated** for vintage rubber-hose animations
- **expo-haptics** for tactile feedback
- **expo-font** + Google Fonts (Rye, Limelight, Bungee, IM Fell English SC)
- Vintage media assets bundled locally (worn paper, slot cabinet, brass coin, roulette wheel, locked ticket)

## Architecture
```
/app/frontend/
├── app/
│   ├── _layout.tsx              # font loading + GameStoreProvider
│   ├── index.tsx                # redirect → /(tabs)/inicio
│   └── (tabs)/
│       ├── _layout.tsx          # bottom tab nav (6 screens)
│       ├── inicio.tsx           # Home: balance, streak, quick actions
│       ├── estudio.tsx          # Pomodoro + High-Risk mode
│       ├── ruleta.tsx           # Topic Roulette
│       ├── casino.tsx           # Slot Machine
│       ├── premios.tsx          # Custom rewards CRUD + redeem
│       └── ajustes.tsx          # Economy / rules / topics CRUD / reset
└── src/
    ├── theme/index.ts           # sepia/brass/ink palette + cartoon shadow
    ├── store/
    │   ├── types.ts             # GameState, Topic, Reward, Settings, defaults
    │   └── game-store.tsx       # Context + persisted actions
    ├── hooks/
    │   ├── use-icon-fonts.ts
    │   └── use-vintage-fonts.ts
    └── components/
        ├── PaperBackground.tsx
        ├── VintageButton.tsx
        ├── VintageCard.tsx
        ├── CoinBadge.tsx
        ├── SignTitle.tsx
        └── CasinoClosedBanner.tsx
```

## Core Loop
1. Estudia (Pomodoro) → 2. Gana fichas + bonus + racha → 3. Apuesta en tragamonedas / ruleta → 4. Cobra premios reales con cooldown → 5. Si fallas → casino se cierra, racha perdida.

## Features Implemented
### 1. Pomodoro Vintage (Estudio)
- Duraciones predefinidas (15/25/50/90) + personalizada
- Medidor de presión animado, contador de pausas
- Bonus: sin pausa, sesión larga (≥50m), por racha
- **Modo Alto Riesgo**: apuesta fichas, gana ×N si completas, pierdes apuesta si fallas
- Detección automática de salida de la app (`AppState`) con tolerancia configurable → falla
- Límite de pausas; abandono manual; modal de resultado (jackpot / casino cerrado)

### 2. Casino — Tragamonedas
- Cabinet de madera con 3 reels, símbolos cycle durante el giro y paran escalonados
- 7 símbolos con pesos ponderados y payouts (cereza → jackpot 7️⃣)
- Lógica de **near-miss** (dos iguales + adyacente) para tensión
- Probabilidad de jackpot configurable, payout table visible
- Haptics escalonados (palanca → freno de cada reel)

### 3. Ruleta de Temas
- Rueda vintage rotando con easing cubic (3.5 s, varias vueltas + offset)
- Selección con random ponderado, evita temas recientes (<30 min)
- Activar/desactivar temas con checkbox; pesos editables en Ajustes
- Modal dorado anunciando el tema

### 4. Premios (Dopamina ganada)
- 7 premios pre-seed personalizables (memes, café, TikTok, gaming, snack, YouTube, episodio)
- Cada premio: nombre, ícono emoji, rareza (común/raro/épico/legendario), costo, duración, cooldown, límite diario, categoría
- **CRUD completo** + canjear con cooldown visible
- Overlay de ticket bloqueado durante cooldown

### 5. Reward Locking / Casino Cerrado
- Tras fallo: racha = 0, penalización en fichas, casino cerrado X minutos
- Banner rojo parpadeante en todas las pantallas relevantes
- Tragamonedas y ruleta bloqueadas durante el cierre

### 6. Ajustes (Deep Customization)
- 14 parámetros editables: coinsPerMinute, jackpotProbability, slotSpinCost, casinoClosedMin, highRiskMultiplier, appBlurFailSec, etc.
- CRUD de temas (nombre, categoría, peso de probabilidad)
- Zona peligrosa: reiniciar todo

### 7. Home
- Tarjetas FICHAS / RACHA con coin animation
- CTA gigante "EMPEZAR ESTUDIO"
- Quick spin tragamonedas + ruleta
- Premios activos en cooldown
- Pergamino del jugador (6 stats)

## Design System
- **Paleta**: sepia (#E6D5B8), crema (#F4EBD9), tinta (#2C1E16), rojo vintage (#A62C2B), oro antiguo (#D4AF37), madera gastada (#5C3A21)
- **Tipografía**: Rye (títulos), Limelight (subtítulos), Bungee (números), IM Fell English SC (cuerpo)
- **Sombras**: hardcoded offset(4) sin blur — efecto 2D pop-out cartoon
- **Bordes**: 3 px de tinta + frame interior para feel de papel antiguo
- **Animaciones**: squash-stretch en botones, coin bounce, reel cycling, ruleta con deceleración

## Storage Schema (AsyncStorage key `study_casino_state_v1`)
GameState con `coins`, `streak`, `lastStudyDate`, `casinoClosedUntil`, `stats`, `topics[]`, `rewards[]`, `settings`. Soft-merge con defaults al hidratar para soportar actualizaciones futuras.

## Out-of-scope (futuras iteraciones)
- Audio: música ambient de jazz (loop largo) — no incluida en MVP, ya están todos los SFX vintage
- Notificaciones locales (no requerido en MVP)
- Eventos diarios (Lucky Hour, Coin Rush…)
- Animaciones Lottie de mascota rubber-hose
- Migración a deployment Android (APK) — depende de build de usuario

## Iteración 3 — Economía rediseñada + Mascota + Notificaciones + Bloqueador nativo

### Economía rediseñada ✅
- Las **fichas se ganan ESTUDIANDO**, no en el casino: `minutos × coinsPerMinute × multiplicador_dificultad`
- Cada **tema tiene dificultad** (🟢 Fácil ×1.0, 🟡 Medio ×1.5, 🔴 Difícil ×2.2)
- El **tragamonedas y las cajas YA NO PAGAN FICHAS** — pagan **premios reales aleatorios** del catálogo
- Mapeo símbolo → rareza: 🍒🍋→Común · 🔔🍀→Raro · ⭐💎→Épico · 7️⃣→Legendario
- Cajas: distribución de rareza por tier (Bronce 1% legendario, Plata 5%, Oro 15%)
- Solo "2 iguales" devuelve 2 fichas de consolación (mínimo para no farmear)
- Premios tab: tabs "Ganados (N)" + "Catálogo". Inventory con stack badge `×N` cuando ganas el mismo premio múltiples veces
- Selector de tema al inicio del Pomodoro con preview de ficha estimadas

### Mascota animada "Mr. Brass" ✅
- Componente `CasinoMascot.tsx` 100% hecho con Views (sin SVG ni assets externos)
- Compuesto por: sombrero de copa con banda roja, cara de moneda de bronce, ojos animados, boca expresiva, mejillas, traje + corbatín, brazos goma-manguera con manos
- Estados: `idle`, `cheer`, `sad`, `spin`, `wave`
- Aparece en pantalla Estudio idle (waving) + en modales de victoria/derrota
- Animaciones rubber-hose: rebote vertical, brazos rotando con `withRepeat`+`withSequence`, ojos estirándose, boca abriéndose, sparkles ✨ saliendo en cheer

### Notificación persistente con cuenta atrás ✅
- `expo-notifications` integrado con canal `pomodoro` (HIGH importance, PUBLIC visibility)
- Al empezar sesión: notificación **sticky** con `Termina a las HH:MM · Tema`
- Programada notificación de éxito con sonido al cumplirse la duración
- Notificación de fallo cuando abandonas o sales de la app
- Toggles separados en Ajustes: `notificationsEnabled` + `endSessionSound`

### Módulo nativo Android (Accessibility Service) ✅
- Estructura completa de módulo Expo local en `/app/frontend/modules/study-casino-blocker/`
- **Kotlin nativo**:
  - `BlockerAccessibilityService.kt` — escucha `TYPE_WINDOW_STATE_CHANGED`, detecta apps en primer plano, las cierra devolviendo al usuario a Study Casino con Toast
  - `BlocklistStore.kt` — SharedPreferences que sobreviven al cierre del proceso
  - `StudyCasinoBlockerModule.kt` — bridge JS con `getInstalledApps`, `setBlocklist`, `setAllowlist`, `setStrictMode`, `setActive`, `openAccessibilitySettings`
- AndroidManifest.xml con el servicio + `BIND_ACCESSIBILITY_SERVICE`, `QUERY_ALL_PACKAGES`
- Configuración `study_casino_accessibility_config.xml` con timeout 100ms, feedbackGeneric
- JS wrapper con `requireOptionalNativeModule` que degrada a no-op en preview/iOS/Expo Go
- UI en Ajustes: warning visible cuando no hay build nativo, 5 apps bloqueadas por defecto (TikTok, Instagram, YouTube, X, Facebook), toggle modo estricto (whitelist), botón para abrir Settings de Accesibilidad
- Sync automático con `useAppBlockerSync()` cuando cambian settings
- ⚠️ Solo funciona en APK nativo después de Publish + grant manual de permisos

## Out-of-scope futuras iteraciones
- Música ambient de jazz en loop
- Eventos diarios (Lucky Hour, Coin Rush)
- Foreground Service Android para countdown LIVE en notificación (actualmente solo "termina a las HH:MM")

### Audio vintage ✅
- `expo-audio` integrado con preload y volume per-call
- 10 SFX generados con ffmpeg: coin, bell, lever, spinning, jackpot, fail, win, click, tick, box_open
- Hook `useSounds()` respeta `soundsEnabled` y `soundsVolume` del store
- Wiring completo: Estudio (lever/win/fail/jackpot), Casino slot (lever/spinning/tick/jackpot/win/fail), Ruleta (lever/spinning/bell/win), Premios (coin/bell/fail), navegación (click)
- Ajustes: toggle on/off + 5 chips de volumen (20–100%)

### Reward Boxes ✅
- 3 tiers en la pestaña Casino: 📦 Bronce (15🪙), 🎁 Plata (40🪙), 🏆 Oro (100🪙)
- Tabla de pagos ponderada por rareza (común → legendario): de 5🪙 a 1500🪙
- Animación de apertura: suspenso wobble + reveal modal con sunburst rays para legendarios
- Costos editables en Ajustes (`bronzeBoxCost`, `silverBoxCost`, `goldBoxCost`)

### Animaciones más adictivas ✅
- `MarqueeLights`: bombillas chase Vegas-style alrededor del Hero card de Home y del cabinet de tragamonedas
- `CoinShower`: lluvia de monedas/confetti con física variada en jackpots y cajas legendarias
- `SunburstRays`: rayos rotatorios oro/rojo detrás del modal de jackpot
- Box wobble + apertura con escalado y rotación
- Sonidos sincronizados con cada interacción para feedback dopaminérgico

## Estado actual
MVP completo, ejecutándose en Expo (Metro), Spanish UI, sin backend, offline-first. Pendiente: validación end-to-end con `testing_agent`.
