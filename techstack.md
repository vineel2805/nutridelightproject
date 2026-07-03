# TECH_STACK.md — Nutri Delight Virtual Rock Paper Scissors

## 1. Stack Strategy
Use the smallest stack that can deliver reliable detection, synchronized gameplay, and the shared camera/mascot scene. Add heavier rendering or state libraries only when measured complexity requires them.

## 2. Core Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | React | UI composition and screen rendering |
| Language | TypeScript | Typed game, gesture, camera, and configuration contracts |
| Build Tool | Vite | Development server and production build |
| Styling | Tailwind CSS + CSS variables | Responsive UI, HUD, screens, design tokens |
| Computer Vision | `@mediapipe/tasks-vision` | Local hand gesture recognition and landmarks |
| State | Typed `useReducer` | Deterministic MVP game flow |
| Voice Input | Web Speech API | Optional start command on supported browsers |
| Audio | Centralized native Audio Manager | MVP voice clips and SFX |
| Testing | Vitest | Pure game/stability logic tests |
| Deployment | Static/PWA-capable hosting | Browser-first deployment |

## 3. Why Web First
The project needs:
- laptop webcam support
- mobile camera support
- kiosk/fullscreen use
- rapid iteration
- local MediaPipe inference

A responsive web app gives one codebase for all MVP targets. Android packaging can be considered later with Capacitor if distribution requirements justify it. A separate Windows application is not required for MVP.

## 4. Computer Vision Architecture
### MediaPipe
Use MediaPipe Tasks Vision `GestureRecognizer` in VIDEO mode.

Primary mappings:
- `Closed_Fist` → `rock`
- `Open_Palm` → `paper`
- `Victory` → `scissors`

Create a dedicated mapping module. Components must consume normalized internal move types rather than MediaPipe labels.

### Reliability Pipeline
`Video Frame`
→ `MediaPipe Recognition`
→ `Confidence Filter`
→ `RPS Mapping`
→ `Optional Geometry Validation`
→ `Motion Check`
→ `Temporal Buffer`
→ `Majority/Stability Rule`
→ `Stable Gesture`
→ `Game Capture Lock`

### Sampling
- prefer `requestVideoFrameCallback`
- fallback to `requestAnimationFrame`
- throttle inference to a configurable target around 10–15 Hz
- never overlap inference calls
- skip frames instead of queueing stale frames

## 5. State Management
Start with a typed reducer because the MVP flow is manageable and the team benefits from lower conceptual overhead.

Suggested states:
- `idle`
- `cameraSetup`
- `cameraReady`
- `waitingForStart`
- `matchIntro`
- `roundReady`
- `countdown`
- `capture`
- `reveal`
- `roundResult`
- `matchResult`
- `reward`
- `error`

Upgrade to XState only if later reward flows, kiosk recovery, remote configuration, or additional game modes make transitions difficult to reason about.

## 6. Avatar Rendering
MVP recommendation:
- transparent WebP/PNG assets
- CSS transitions/animations
- optional sprite sheets

Potential later upgrade:
- Rive for interactive state-driven character animation
- Lottie for discrete pre-authored animation sequences
- PixiJS only if effects/compositing requirements exceed DOM/CSS performance

Do not make the game engine depend on the renderer. Use an avatar state contract such as:
`idle | listening | ready | countdown | rock | paper | scissors | roundWin | roundLoss | draw | matchWin | matchLoss`.

## 7. Audio
Start with a centralized native Audio Manager that:
- preloads known clips
- unlocks playback after user interaction
- exposes named events
- fails gracefully when an asset is missing
- prevents components from creating unmanaged audio objects

Move to Howler.js only if testing reveals real mobile playback, layering, sprite-audio, or synchronization problems.

## 8. Voice Input
Use feature-detected Web Speech API for:
- “Start the game”
- “Start game”
- “Let’s play”

Rules:
- manual Start Game is always visible
- unsupported browsers do not show broken listening UI
- voice and button dispatch the same game event
- no cloud speech service is required for MVP

## 9. No Backend in MVP
Do not add Firebase, Supabase, Express, authentication, or a database for the core game.

A backend becomes justified when implementing:
- real reward issuance
- unique coupon codes
- redemption validation
- daily reward limits
- seller configuration
- analytics requiring central storage

## 10. Suggested Project Structure
```text
src/
  app/
    App.tsx
    routes.tsx

  camera/
    CameraManager.ts
    useCamera.ts

  gesture/
    GestureRecognizerService.ts
    gestureMapping.ts
    gestureTypes.ts
    gestureConfig.ts
    stabilityBuffer.ts
    motionAnalyzer.ts
    geometryValidator.ts
    useGestureDetection.ts

  game/
    gameTypes.ts
    gameEngine.ts
    gameReducer.ts
    gameConfig.ts

  avatar/
    AvatarController.ts
    avatarTypes.ts

  audio/
    AudioManager.ts
    audioManifest.ts

  voice/
    useVoiceStart.ts
    speechSupport.ts

  components/
    CameraView.tsx
    ScoreHUD.tsx
    CountdownOverlay.tsx
    MoveReveal.tsx
    DetectionPrompt.tsx

  screens/
    WelcomeScreen.tsx
    GestureLab.tsx
    GameScreen.tsx
    PlayerWinScreen.tsx
    BuddyWinScreen.tsx

  assets/
    avatar/
    audio/
    brand/

  config/
    designTokens.ts

  utils/
    geometry.ts
    performance.ts
```

## 11. Configuration
Centralize:
- inference FPS
- confidence threshold
- buffer size
- minimum vote ratio
- minimum consecutive support
- hold duration
- motion threshold
- countdown timing
- capture window
- reveal duration
- result hold duration

Do not scatter timing constants across React components.

## 12. Performance Rules
- video renders directly through `<video>`
- do not put raw landmarks into global React state every frame
- keep recognizer singleton/service lifecycle controlled
- no overlapping inference
- no stale frame queue
- publish meaningful gesture state changes only
- clean up camera tracks and animation callbacks
- lazy-load heavy assets where useful
- reduce decorative effects on weak devices if necessary

## 13. Testing Stack
Use Vitest for:
- RPS winner matrix
- Buddy move validity
- score updates
- first-to-2 completion
- draw behavior
- label mapping
- confidence filtering
- majority voting
- hysteresis/stability switching
- motion threshold pure logic

Hardware camera behavior is tested manually through the Gesture Lab.

## 14. Upgrade Triggers
Add XState when state branching becomes difficult to reason about.

Add Howler.js when native audio shows measured cross-device issues.

Add Rive/Lottie when approved Buddy animation assets require them.

Add PixiJS when particle/effect compositing measurably exceeds DOM/CSS capability.

Add Capacitor when Play Store/native packaging is actually required.

Add backend infrastructure only with concrete reward-management requirements.
