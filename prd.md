# PRD — Nutri Delight Virtual Rock Paper Scissors

## 1. Product Overview
Nutri Delight Virtual Rock Paper Scissors is a camera-based interactive game where a customer plays Rock Paper Scissors against a virtual mascot called **Buddy**. The player stands in front of a laptop, tablet, kiosk, or mobile camera. The experience should feel as if the player and Buddy are standing next to each other and making their moves together.

The match is first to 2 wins. Draws do not change the score and the round is replayed. If the player wins the match, the application shows a reward celebration placeholder. Actual reward selection, coupon generation, and redemption are outside the MVP.

## 2. Product Goals
- Create a short, fun Nutri Delight brand interaction.
- Make the experience feel like a virtual arcade game, not a webcam demo.
- Detect Rock, Paper, and Scissors reliably in real time.
- Keep the camera smooth on laptops and mobile devices.
- Synchronize countdown, player capture, Buddy move, reveal, reaction, and score.
- Allow voice start where supported, while always providing a Start Game button.
- Keep reward integration modular for later seller requirements.

## 3. Target Platforms
### MVP
- Laptop and desktop browsers with webcam
- Android Chrome
- Tablets
- Fullscreen kiosk displays

### Browser Behavior
- Chrome/Edge: full experience, including voice start when available.
- Safari/iOS: camera game supported; manual Start Game is always available.
- Firefox: manual Start Game path must work fully.

## 4. Target Users
### Customer
A walk-up customer who should be able to understand and complete the game without registration or technical instructions.

### Seller/Staff
Future user role for reward configuration, redemption, limits, and analytics. Not included in MVP.

## 5. Core User Flow
1. Welcome screen displays branding, instructions, Buddy, Start Game, and voice status.
2. User starts the experience and grants camera permission.
3. Camera view opens and the system checks for a visible hand.
4. User says “Start the game” or presses Start Game.
5. Buddy introduces the match: first to 2 wins.
6. Before each round, Buddy’s move is randomly selected and locked.
7. Countdown runs: 1 → 2 → 3 → GO.
8. The stable player gesture is captured at the defined capture moment/window.
9. Player and Buddy moves are revealed nearly simultaneously.
10. Round result is shown and score updates.
11. Draw: score unchanged and round replayed.
12. First side to 2 wins ends the match.
13. Player win: celebration and reward placeholder.
14. Buddy win: playful loss screen.
15. Play Again resets the match without unnecessarily restarting the camera.

## 6. Game Rules
Internal moves:
- `rock`
- `paper`
- `scissors`

Rules:
- Rock beats Scissors.
- Scissors beats Paper.
- Paper beats Rock.
- Same move is a draw.
- Player win: player score +1.
- Buddy win: Buddy score +1.
- Draw: no score change.
- Match ends immediately when either score reaches 2.

## 7. Gesture Recognition Requirements
Recognize:
- Rock: closed fist
- Paper: open palm
- Scissors: index and middle fingers extended

The game must not lock a move from one frame. Reliability pipeline:
1. MediaPipe prediction
2. Confidence filtering
3. Mapping to internal RPS move
4. Temporal prediction buffer
5. Majority vote / stability check
6. Optional landmark geometry validation where testing shows a need
7. Motion settling check to avoid locking transitional poses
8. Stable move lock only during the round capture window

If no reliable move is available:
- Show “Move not detected. Let’s try again!”
- Do not change score.
- Retry the round.

All thresholds must be configurable.

## 8. Fairness Requirement
Buddy’s move must be generated and committed before the player’s final move is read. The system must never choose Buddy’s move after seeing the player’s gesture.

## 9. Voice Requirements
Supported phrases:
- “Start the game”
- “Start game”
- “Let’s play”

Voice is progressive enhancement. The visible Start Game button must always work and must trigger the same game-start action as voice input.

## 10. Buddy Avatar Requirements
Buddy is the Nutri Delight virtual opponent. Required states:
- idle
- listening
- ready
- countdown
- rock
- paper
- scissors
- round win
- round loss
- draw
- match win
- match loss

MVP may use transparent PNG/WebP assets, sprite animation, or simple CSS animation. The game logic must not depend on a specific avatar asset format.

## 11. Audio Requirements
Audio events:
- welcome / introduction
- countdown 1, 2, 3
- GO
- player round win
- Buddy round win
- draw
- move not detected
- player match win
- Buddy match win

Production should use pre-recorded clips. Missing development assets must fail gracefully and never block gameplay.

## 12. Reward Scope
MVP behavior after player match win:
- celebration
- “YOU WIN!”
- “YOU WON A REWARD!”
- generic reward placeholder

Out of scope:
- discount logic
- coupon codes
- QR codes
- reward inventory
- redemption
- seller dashboard
- authentication

## 13. Error States
- Camera permission denied: explain why camera is needed and provide retry.
- Camera unavailable: show recovery guidance.
- Gesture model loading failure: show retry.
- No hand: “Show your hand.”
- Hand too small: “Move closer.”
- Excessive movement: “Keep your hand steady.”
- Unstable/low confidence: “Hold your move.”
- Voice unavailable: silently preserve manual Start Game.
- Gesture timeout: retry round without score change.

## 14. Performance and Privacy
- Video renders directly in the browser.
- All inference runs locally on-device.
- No camera frame upload, recording, or storage.
- Target gesture inference around 10–15 times per second, tuned by testing.
- Do not queue stale frames.
- If inference is still busy, skip the next inference opportunity.
- Avoid React re-rendering on every landmark/frame.
- Pause unnecessary inference outside relevant game phases.

## 15. MVP Scope
- Responsive web app
- Camera permission and preview
- Hand presence detection
- Reliable Rock/Paper/Scissors detection
- Stability filtering
- Voice start where supported
- Manual Start Game
- Countdown
- Pre-committed Buddy move
- Synchronized reveal
- First-to-2 scoring
- Draw replay
- Buddy reactions
- Audio hooks
- Player win screen
- Buddy win screen
- Reward placeholder
- Play Again
- Mobile and landscape responsiveness
- Developer Gesture Lab

## 16. Success Criteria
- A new user understands how to play without staff help.
- Camera starts reliably and remains smooth.
- RPS gestures are stable under reasonable real-world conditions.
- Transitional gestures are not frequently locked.
- Countdown and reveal feel synchronized.
- Buddy and player feel visually present in one shared scene.
- Draws and first-to-2 scoring are correct.
- Manual start works regardless of voice support.
- Play Again fully resets match state.
- Full match works on target laptop and Android browsers.
