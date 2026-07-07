import React, { useState } from 'react';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { GameScreen } from '../screens/GameScreen';
import { MatchResultScreen } from '../screens/MatchResultScreen';
import { GestureLab } from '../screens/GestureLab';

type AppScreen =
  | 'welcome'
  | 'game'
  | 'playerWin'
  | 'buddyWin'
  | 'lab';

/**
 * App shell — manages top-level screen transitions.
 * No router library needed for MVP.
 */
export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(() => {
    // Developer lab: /lab path or ?lab=true
    if (
      window.location.pathname === '/lab' ||
      new URLSearchParams(window.location.search).get('lab') === 'true'
    ) {
      return 'lab';
    }
    return 'welcome';
  });

  const [matchSummary, setMatchSummary] = useState<{
    result: 'playerWin' | 'buddyWin' | 'draw';
    playerScore: number;
    buddyScore: number;
  } | null>(null);

  const handleMatchComplete = (
    result: 'playerWin' | 'buddyWin',
    playerScore: number,
    buddyScore: number
  ) => {
    setMatchSummary({ result, playerScore, buddyScore });
    setScreen(result === 'playerWin' ? 'playerWin' : 'buddyWin');
  };

  const handlePlayAgain = () => {
    setScreen('game');
  };

  const handleExit = () => {
    setScreen('welcome');
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#111',
      }}
    >
      {screen === 'welcome' && (
        <WelcomeScreen onStart={() => setScreen('game')} />
      )}

      {screen === 'game' && (
        <GameScreen
          onMatchComplete={handleMatchComplete}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'playerWin' && matchSummary && (
        <MatchResultScreen
          result={matchSummary.result}
          playerScore={matchSummary.playerScore}
          buddyScore={matchSummary.buddyScore}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}

      {screen === 'buddyWin' && matchSummary && (
        <MatchResultScreen
          result={matchSummary.result}
          playerScore={matchSummary.playerScore}
          buddyScore={matchSummary.buddyScore}
          onPlayAgain={handlePlayAgain}
          onExit={handleExit}
        />
      )}

      {screen === 'lab' && (
        <GestureLab onExit={() => setScreen('welcome')} />
      )}
    </div>
  );
};
