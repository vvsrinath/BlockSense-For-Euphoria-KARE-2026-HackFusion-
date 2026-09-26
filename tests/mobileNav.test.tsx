// @vitest-environment jsdom
/**
 * The mobile "More" drawer, as a dialog.
 *
 * The drawer sits over the page, so a keyboard user who opens it has to land
 * inside it, stay inside it while tabbing, be able to leave it with Escape and
 * end up back on the button that opened it. None of that is visible in a
 * screenshot, so it is asserted here.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../apps/web/src/components/layout/MobileNav';
import { stubMatchMedia } from './helpers/dom';

beforeAll(() => {
  stubMatchMedia();
});

// React Testing Library only auto-cleans when Vitest runs with `globals`, and
// this suite keeps globals off for the plain node tests, so the drawer would
// otherwise stack up between cases.
afterEach(cleanup);

function renderNav() {
  return render(
    <MemoryRouter>
      <MobileNav />
    </MemoryRouter>
  );
}

describe('MobileNav', () => {
  it('shows the four primary destinations and a More button', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /home/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /analyze/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /more/i })).toBeTruthy();
  });

  it('opens a labelled dialog listing the remaining destinations', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: /more/i }));

    const dialog = await screen.findByRole('dialog', { name: 'More navigation' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    for (const label of ['Watchlist', 'Reports', 'Alerts', 'Settings', 'Help']) {
      expect(screen.getByRole('link', { name: label })).toBeTruthy();
    }
  });

  it('moves focus into the dialog, traps Escape, and restores focus', async () => {
    const user = userEvent.setup();
    renderNav();

    const trigger = screen.getByRole('button', { name: /more/i });
    await user.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'More navigation' });

    // Focus lands inside the dialog rather than staying behind the overlay.
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More navigation' })).toBeNull();
    });
    await waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('closes from the close button', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: /more/i }));
    await screen.findByRole('dialog', { name: 'More navigation' });
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'More navigation' })).toBeNull();
    });
  });
});
