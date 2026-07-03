# Implementation Plan — Nutri Delight Virtual Rock Paper Scissors

## Overview
Greenfield build of a camera-based Rock Paper Scissors game where a customer plays against Buddy, a virtual Nutri Delight mascot. The player and Buddy appear together in a shared scene (camera-first). First to 2 wins. MVP ends at a generic reward-success placeholder.

## Proposed Changes

---

### Stage 1 — Project Scaffold

#### [NEW] Vite + React + TypeScript project
- `npm create vite@latest . -- --template react-ts`
- Install: `tailwindcss`, `@tailwindcss/vite`, `@mediapipe/tasks-vision`
- Configure `tailwind.config.ts` with design tokens (brand green, citrus orange, warm cream, dark overlay)
- Configure `vite.config.ts` with WASM/CORP/COEP headers needed for MediaPipe
- Set up `tsconfig.json` with strict mode

---

### Stage 2 — Design System & Tokens

#### [NEW] `src/config/designTokens.ts`
- Brand Green: `#2D7A2D` / `#3A9A3A`
- Citrus Orange: `#E8760A` / `#F4921E`
- Warm Cream: `#FFF8EC`
- Dark Overlay: `rgba(0,0,0,0.65)`
- Typography: Nunito (display), Inter (body) via Google Fonts

#### [NEW] `src/index.css`
- Tailwind base + custom CSS variables
- Font imports, body reset, scroll/overflow behavior

---

### Stage 3 — Types & Configuration

#### [NEW] `src/game/gameTypes.ts`
```
RpsMove = 'rock' | 'paper' | 'scissors'
RoundOutcome = 'playerWin' | 'buddyWin' | 'draw'
GamePhase = 'idle' | 'cameraSetup' | 'cameraReady' | 'waitingForStart' | 
            'matchIntro' | 'roundReady' | 'countdown' | 'capture' | 
            'reveal' | 'roundResult' | 'matchResult' | 'reward' | 'error'
GameState = { phase, playerScore, buddyScore, round, buddyMove, playerMove, outcome, ... }
```

#### [NEW] `src/game/gameConfig.ts`
- Countdown timings, capture window, reveal duration, result hold, draw hold

#### [NEW] `src/gesture/gestureTypes.ts`
- GestureLabel, DetectedGesture, StabilityResult

#### [NEW] `src/gesture/gestureConfig.ts`
- CONFIDENCE_THRESHOLD, BUFFER_SIZE, MIN_VOTE_RATIO, MOTION_THRESHOLD, INFERENCE_FPS

#### [NEW] `src/avatar/avatarTypes.ts`
- AvatarState enum: idle | listening | ready | countdown | rock | paper | scissors | roundWin | roundLoss | draw | matchWin | matchLoss

---

### Stage 4 — Game Logic

#### [NEW] `src/game/gameEngine.ts`
- `determineWinner(player: RpsMove, buddy: RpsMove): RoundOutcome`
- `generateBuddyMove(): RpsMove` — random, committed BEFORE player captured
- Pure functions, fully unit-testable

#### [NEW] `src/game/gameReducer.ts`
- Typed `useReducer` implementing the full state machine
- Actions: START_CAMERA, CAMERA_READY, START_MATCH, COUNTDOWN_TICK, CAPTURE_PLAYER, REVEAL, ROUND_RESULT, PLAY_AGAIN, ERROR

---

### Stage 5 — Gesture Recognition

#### [NEW] `src/gesture/GestureRecognizerService.ts`
- Singleton service wrapping `@mediapipe/tasks-vision` GestureRecognizer
- VIDEO mode, loads model from CDN or local
- Exposes `recognize(videoEl, timestamp): GestureResult`

#### [NEW] `src/gesture/gestureMapping.ts`
- `Closed_Fist` → `rock`, `Open_Palm` → `paper`, `Victory` → `scissors`
- Unknown labels → null

#### [NEW] `src/gesture/stabilityBuffer.ts`
- Rolling buffer of N predictions
- Majority vote + stability check
- Motion settling check (wrist landmark delta between frames)

#### [NEW] `src/gesture/motionAnalyzer.ts`
- Detect excessive hand movement between frames

#### [NEW] `src/gesture/useGestureDetection.ts`
- Custom React hook
- Uses `requestVideoFrameCallback` / `requestAnimationFrame`
- Throttles to configured FPS, never overlaps inference
- Publishes only meaningful state changes (no per-frame React setState)
- Pauses when phase is not active

---

### Stage 6 — Camera

#### [NEW] `src/camera/CameraManager.ts`
- Request `getUserMedia`, manage stream lifecycle
- Expose start/stop/switch
- Handle permission denied, not-found errors

#### [NEW] `src/camera/useCamera.ts`
- Hook that returns `{ videoRef, status, error, startCamera, stopCamera }`
- Status: 'idle' | 'requesting' | 'active' | 'error'

---

### Stage 7 — Audio

#### [NEW] `src/audio/audioManifest.ts`
- Named audio event map: welcome, countdown1/2/3, go, playerRoundWin, buddyRoundWin, draw, noMove, playerMatchWin, buddyMatchWin

#### [NEW] `src/audio/AudioManager.ts`
- Preload clips after first user interaction
- Named `play(event)` method
- Fail gracefully if asset is missing or decode fails

---

### Stage 8 — Voice

#### [NEW] `src/voice/speechSupport.ts`
- `isSpeechRecognitionSupported(): boolean`

#### [NEW] `src/voice/useVoiceStart.ts`
- Feature-detect Web Speech API
- Listen for "Start the game" / "Start game" / "Let's play"
- Dispatch same action as Start Game button
- Silently skip if unsupported

---

### Stage 9 — Buddy Avatar

#### [NEW] `src/avatar/BuddyAvatar.tsx`
- CSS-animated Buddy built with emoji + CSS (fruit emoji stand-in: 🍊)
- State-driven: maps `AvatarState` to visual + animation
- Transparent background, composited over camera
- Move states show large gesture emoji / icon

> **Note:** Since we have no licensed Buddy asset, I will generate a Buddy avatar image using the generate_image tool and use it as the placeholder PNG. The component will be architected so swapping in real Buddy assets requires only replacing image files — no logic changes.

---

### Stage 10 — UI Components

#### [NEW] `src/components/CameraView.tsx`
- Full-bleed `<video>` element, mirrored
- No frame or card — fills the container

#### [NEW] `src/components/ScoreHUD.tsx`
- Fixed top bar: YOU [score] | ROUND N | BUDDY [score]
- Green left, orange right, dark pill center

#### [NEW] `src/components/CountdownOverlay.tsx`
- Centered large number (1 → 2 → 3 → GO)
- Scale + fade animation
- Does not cover lower hand region

#### [NEW] `src/components/MoveReveal.tsx`
- Transient overlay: YOU — [move] VS BUDDY — [move]
- Result banner: YOU WIN THIS ROUND / BUDDY WINS / IT'S A DRAW

#### [NEW] `src/components/DetectionPrompt.tsx`
- Small instruction bubble: "Show your hand", "Hold steady", "Move closer"

#### [NEW] `src/components/BuddyAvatar.tsx`
- Positioned right side, composited into scene

---

### Stage 11 — Screens

#### [NEW] `src/screens/WelcomeScreen.tsx`
- Cream background, Nutri Delight branding
- Title: VIRTUAL ROCK PAPER SCISSORS
- 3 instruction cues (hand gesture, say start, win rewards)
- START THE GAME button
- Voice status indicator (conditional)
- Buddy illustration

#### [NEW] `src/screens/GameScreen.tsx`
- Full-screen camera scene
- Layering model: video → gradient → Buddy → HUD → countdown → reveal → prompts
- Hosts the full game loop with gameReducer

#### [NEW] `src/screens/PlayerWinScreen.tsx`
- YOU WIN! + celebration + generic reward placeholder
- PLAY AGAIN button

#### [NEW] `src/screens/BuddyWinScreen.tsx`
- BUDDY WINS! + "Better luck next time!"
- Strong PLAY AGAIN

#### [NEW] `src/screens/GestureLab.tsx`
- Developer-only route (/lab)
- Live camera + real-time gesture readout
- Shows confidence, buffer, stability, mapped move
- Toggle with ?lab=true or /lab route

---

### Stage 12 — App Shell & Routing

#### [NEW] `src/app/App.tsx`
- Manages top-level screen state (welcome → game → result)
- No router library needed for MVP (simple state switch)
- GestureLab behind `/lab` path check

---

### Stage 13 — Tests

#### [NEW] `src/game/__tests__/gameEngine.test.ts`
- Full RPS winner matrix (9 combinations)
- Buddy move validity
- Score update logic
- First-to-2 completion
- Draw behavior

#### [NEW] `src/gesture/__tests__/stabilityBuffer.test.ts`
- Majority vote cases
- Insufficient votes
- Motion veto

#### [NEW] `src/gesture/__tests__/gestureMapping.test.ts`
- Label mapping
- Confidence filtering
- Unknown label handling

---

## Verification Plan

### Automated Tests
```
npx vitest run
```

### Manual Verification (Gesture Lab at /lab)
1. Camera opens and mirrored preview renders
2. Rock / Paper / Scissors gestures each map correctly
3. Transitional poses do not lock a move
4. Stability buffer requires holding for the configured window

### Full Game Flow
1. Welcome screen shows, Start Game button works
2. Camera opens, Buddy appears beside player
3. Countdown 1→2→3→GO runs
4. Player gesture captured, Buddy move committed before capture
5. Reveal shows both moves + result
6. Score increments correctly
7. Draw replays round, score unchanged
8. First to 2 triggers match result screen
9. Player win shows reward placeholder
10. Play Again resets fully without camera restart

---

## Implementation Order

| Stage | Focus | Milestone |
|-------|-------|-----------|
| 1 | Scaffold | `npm run dev` serves blank React app |
| 2 | Design system | Tailwind tokens + fonts working |
| 3 | Types + config | No compiler errors |
| 4 | Game logic | Unit tests pass |
| 5 | Gesture recognition | Lab shows live mapping |
| 6 | Camera | Camera opens, video plays |
| 7 | Audio | Named events play / fail silently |
| 8 | Voice | Voice start triggers game |
| 9 | Buddy avatar | Buddy state changes render correctly |
| 10 | Components | ScoreHUD, Countdown, MoveReveal render |
| 11 | Screens | Full game loop playable end-to-end |
| 12 | App shell | Routing + screen transitions |
| 13 | Tests | All unit tests pass |
| 14 | Polish | Animations, error states, responsive layout |
