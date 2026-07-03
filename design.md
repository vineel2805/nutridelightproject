# DESIGN.md — Nutri Delight Virtual Rock Paper Scissors

## 1. Design Intent
The provided concept image is **visual inspiration**, not a pixel-perfect implementation contract. Preserve its strongest ideas:
- cream, green, and orange Nutri Delight palette
- playful fruit-brand energy
- large readable score HUD
- camera-first gameplay
- Buddy positioned beside the player
- oversized countdown
- bold move reveal
- celebratory result screens
- rounded, friendly controls

The implementation must not copy accidental details or impossible photographic compositions from the concept image. Real camera framing, device aspect ratios, safe areas, gesture visibility, and performance take priority.

## 2. Experience Principle
The product must feel like a shared virtual scene.

Avoid:
- dashboard layouts
- small webcam cards
- separate “player panel” and “computer panel”
- technical computer-vision UI in production
- excessive glassmorphism
- slow cinematic transitions

Prefer:
- full-bleed camera scene
- Buddy composited into the same visual space
- floating HUD
- clear central countdown
- quick reveal and reaction
- large kiosk-readable typography

## 3. Visual Language
### Brand Mood
Fresh, energetic, healthy, playful, competitive, friendly.

### Color Roles
Use design tokens rather than scattered color literals.

- Brand Green: primary actions, player score, success, positive status.
- Citrus Orange: Buddy score, energy, highlights, opponent move.
- Warm Cream: welcome/result backgrounds and neutral surfaces.
- Dark Overlay: translucent HUD backing and camera-scene readability.
- White: high-contrast text and cards where required.

Exact color values should be derived from the real Nutri Delight brand assets if available. Until then, define provisional tokens centrally and make replacement easy.

## 4. Typography
Use:
- one bold display face for countdown, score, GO, YOU WIN, DRAW
- one clean sans-serif for instructions and controls

Requirements:
- high contrast
- short labels
- large kiosk viewing sizes
- no thin fonts over camera footage
- responsive `clamp()` sizing for major display text

## 5. Screen 1 — Welcome
Inspired by the first panel of the concept image.

Content:
- Nutri Delight branding
- title: VIRTUAL ROCK PAPER SCISSORS
- short subtitle
- three compact instruction cues
- large START THE GAME button
- voice listening indicator only when supported
- Buddy artwork or branded fruit detail

Hierarchy:
1. Brand
2. Game title
3. What to do
4. Start action
5. Voice status

Do not make the reward promise overly specific in MVP. Use wording such as “Play with Buddy and win rewards!” rather than naming a guaranteed juice or discount.

## 6. Screen 2 — Camera Ready
Inspired by the second panel.

Layout:
- camera fills the scene
- mirrored preview
- Buddy on the opposite side of the likely hand-play area
- small instruction bubble: “Show your hand”
- bottom status surface: Camera Ready / Hand Detected / Hold Your Move
- back button in safe area

Production text must be user-friendly. Do not show “model loaded,” “WASM,” “confidence threshold,” or other engineering terms outside debug mode.

## 7. Screen 3 — Countdown
Inspired by the third panel.

Top HUD:
- YOU score on left
- ROUND indicator in center
- BUDDY score on right

Center:
- one large number at a time
- 1 → 2 → 3 → GO
- scale/impact animation
- subtle ring or pulse effect

Bottom:
- short “Get Ready!” prompt if it does not obstruct hands

Critical rule: countdown graphics must not cover the area where the player needs to see their hand.

## 8. Screen 4 — Move Reveal
Inspired by the gameplay reveal panel.

Show:
- player move on green-accented side
- Buddy move on orange-accented side
- VS between them
- result banner below

Example:
YOU — ROCK
VS
BUDDY — SCISSORS
YOU WIN THIS ROUND!

Move cards should be transient overlays, not permanent large cards that hide the camera throughout gameplay.

## 9. Screen 5 — Draw
Inspired by the draw panel.

Show:
- unchanged HUD score
- both moves
- “IT’S A DRAW!”
- “LET’S GO AGAIN!”

Keep this transition shorter than a normal win/loss result because no score changed.

## 10. Screen 6 — Player Match Win
Inspired by the match-win panel.

Show:
- YOU WIN!
- Buddy celebrating/congratulating
- lightweight confetti or fruit particles
- generic reward placeholder
- PLAY AGAIN
- optional CONTINUE/CLAIM action only when real reward behavior is later defined

Do not implement a fake “Claim Reward” workflow in MVP.

## 11. Screen 7 — Buddy Match Win
Inspired by the match-loss panel.

Show:
- BUDDY WINS!
- playful Buddy celebration
- “Better luck next time!”
- strong PLAY AGAIN action

The screen should invite replay rather than feel punishing.

## 12. Help and Voice UI
The concept image includes a dedicated Voice & Help panel. For MVP, this should be a modal, drawer, or help screen rather than part of the main gameplay flow.

Sections:
- supported voice phrases
- how to play
- lighting/hand visibility tip
- first-to-2 rule
- note that manual Start Game is always available

## 13. Responsive Layout
### Laptop/Kiosk Landscape
- full-bleed 16:9-oriented scene
- player visually left, Buddy right when camera framing permits
- HUD across top
- countdown centered
- result banner near lower safe zone

### Mobile Portrait
- camera fills viewport
- HUD compact at top
- Buddy placed in lower corner/side without covering expected hand region
- countdown centered
- move reveal adapts to stacked or compact horizontal layout
- buttons respect bottom safe area

### Mobile Landscape
- use the landscape shared-scene composition
- reduce decorative effects if space is limited

## 14. Motion Design
Suggested configurable starting durations:
- button response: 120–180 ms
- countdown number entrance: 220–300 ms
- move reveal: 300–450 ms
- draw result hold: 900–1300 ms
- normal round result hold: 1500–2000 ms
- screen transition: 250–400 ms

Motion should be quick, readable, and interrupt-safe. Game timing must be controlled by game logic, not CSS animation completion alone.

## 15. Layering Model
Recommended visual layers:
1. live `<video>` camera layer
2. optional camera treatment/gradient for readability
3. Buddy avatar layer
4. lightweight scene effects
5. HUD
6. countdown/reveal overlays
7. modal/error/help layer

Keep high-frequency camera and CV processing independent from decorative rendering.

## 16. Components
Suggested UI components:
- `WelcomeScreen`
- `GameScene`
- `CameraView`
- `BuddyAvatar`
- `ScoreHUD`
- `RoundIndicator`
- `CountdownOverlay`
- `DetectionPrompt`
- `MoveReveal`
- `RoundResultBanner`
- `PlayerWinScreen`
- `BuddyWinScreen`
- `RewardPlaceholder`
- `HelpPanel`
- `CameraError`
- `GestureDebugPanel` (development only)

## 17. Accessibility
- visible manual Start Game
- large tap targets
- visual countdown in addition to audio
- visual result in addition to voice/SFX
- strong contrast over camera feed
- no essential information conveyed by green/orange alone
- reduced-motion behavior for nonessential decorative effects
- readable permission and recovery instructions

## 18. Asset Guidelines
Buddy should have transparent-background assets for:
- idle
- listening
- ready
- countdown
- rock
- paper
- scissors
- happy
- surprised
- disappointed
- draw
- match win
- match loss

Keep avatar state names stable so asset format can change later without changing game logic.

The concept image is a design reference only. Final production assets should use approved Nutri Delight branding and mascot artwork.
