import React from 'react';
import type { RpsMove, RoundOutcome } from '../game/gameTypes';

export function resolveBuddySpeechMessage(
  phase: string,
  buddyMove: RpsMove | null,
  roundOutcome: RoundOutcome | null,
  gestureKind: string | null,
  detectionPrompt: string | null
): string {
  if (phase === 'waitingForStart') return 'Ready when you are!';
  if (phase === 'cameraSetup') return 'Getting ready...';
  if (phase === 'matchIntro') return 'First to win!';
  if (phase === 'roundReady') return 'Show me your move!';
  if (phase === 'countdown') return 'Here we go!';
  if (phase === 'capture') {
    if (gestureKind === 'noHand') return 'I can\'t see your hand yet';
    if (gestureKind === 'moving') return 'Hold it steady!';
    if (detectionPrompt?.includes('Show your move')) return 'Show me your move!';
    return 'My turn is coming...';
  }
  if (phase === 'reveal' || phase === 'roundResult') {
    if (buddyMove === 'rock') return 'Rock!';
    if (buddyMove === 'paper') return 'Paper!';
    if (buddyMove === 'scissors') return 'Scissors!';
    if (roundOutcome === 'playerWin') return 'Nice move!';
    if (roundOutcome === 'buddyWin') return 'Yes! This round is mine!';
    if (roundOutcome === 'draw') return 'Same move! Again?';
  }
  if (phase === 'matchResult') return 'Good game!';
  return 'Ready when you are!';
}

interface BuddySpeechBubbleProps {
  phase: string;
  buddyMove: RpsMove | null;
  roundOutcome: RoundOutcome | null;
  gestureKind: string | null;
  detectionPrompt: string | null;
}

export const BuddySpeechBubble: React.FC<BuddySpeechBubbleProps> = ({
  phase,
  buddyMove,
  roundOutcome,
  gestureKind,
  detectionPrompt,
}) => {
  const message = resolveBuddySpeechMessage(
    phase,
    buddyMove,
    roundOutcome,
    gestureKind,
    detectionPrompt
  );

  return (
    <div className="buddy-speech-bubble" aria-live="polite">
      <span>{message}</span>
    </div>
  );
};
