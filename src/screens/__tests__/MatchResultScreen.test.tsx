import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MatchResultScreen } from '../MatchResultScreen';

describe('MatchResultScreen', () => {
  it('renders the match result, score, and action buttons', () => {
    const markup = renderToStaticMarkup(
      <MatchResultScreen
        result="buddyWin"
        playerScore={1}
        buddyScore={3}
        onPlayAgain={() => undefined}
        onExit={() => undefined}
      />
    );

    expect(markup).toContain('BUDDY WINS!');
    expect(markup).toContain('FINAL SCORE');
    expect(markup).toContain('PLAY AGAIN');
    expect(markup).toContain('EXIT GAME');
  });
});
