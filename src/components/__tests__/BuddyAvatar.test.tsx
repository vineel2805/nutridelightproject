import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuddyAvatar } from '../BuddyAvatar';

describe('BuddyAvatar', () => {
  it('renders move-specific images for rock, paper, and scissors', () => {
    const rockMarkup = renderToStaticMarkup(<BuddyAvatar state="rock" />);
    const paperMarkup = renderToStaticMarkup(<BuddyAvatar state="paper" />);
    const scissorsMarkup = renderToStaticMarkup(<BuddyAvatar state="scissors" />);

    expect(rockMarkup).toContain('/avatar/buddy_rock.png');
    expect(paperMarkup).toContain('/avatar/buddy_paper.png');
    expect(scissorsMarkup).toContain('/avatar/buddy_scissors.png');
  });

  it('uses loss art for player-win states and win art for player-loss states', () => {
    const playerWinMarkup = renderToStaticMarkup(<BuddyAvatar state="roundWin" />);
    const buddyWinMarkup = renderToStaticMarkup(<BuddyAvatar state="roundLoss" />);

    expect(playerWinMarkup).toContain('/avatar/buddy_loss.png');
    expect(buddyWinMarkup).toContain('/avatar/buddy_win.png');
  });

  it('does not render emoji overlays for move states', () => {
    const markup = renderToStaticMarkup(<BuddyAvatar state="rock" />);

    expect(markup).not.toContain('✊');
    expect(markup).not.toContain('✋');
    expect(markup).not.toContain('✌️');
  });
});
