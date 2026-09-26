// @vitest-environment jsdom
/**
 * Searching for an identifier that fits more than one chain.
 *
 * A bare 64-character hex string is a valid Bitcoin txid and a valid TRON id,
 * and an `0x…` address is valid on Ethereum and BNB Chain. The old flow
 * silently opened one of them, so the visitor could read another chain's record
 * for the value they pasted. The search box now offers the alternatives, and
 * the chosen chain travels in the URL.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SearchBox } from '../apps/web/src/components/search/SearchBox';
import { SettingsProvider } from '../apps/web/src/stores/SettingsProvider';
import { stubMatchMedia } from './helpers/dom';

beforeAll(() => {
  stubMatchMedia();
});

// See mobileNav.test.tsx: cleanup is manual because globals are off.
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderSearch() {
  return render(
    <SettingsProvider>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><SearchBox /><LocationProbe /></>} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </SettingsProvider>
  );
}

/** 64 hex characters: a Bitcoin txid and a TRON id by shape alone. */
const AMBIGUOUS_HASH = 'a1b2c3d4'.repeat(8);

function locationText(): string {
  return screen.getByTestId('location').textContent ?? '';
}

describe('ambiguous identifiers', () => {
  it('offers every chain the value could belong to', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('textbox', { name: /search by/i }), AMBIGUOUS_HASH);

    expect(screen.getByText('Also valid on:')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Bitcoin' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'TRON' })).toBeTruthy();
  });

  it('navigates to the picked chain, not to a guess', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('textbox', { name: /search by/i }), AMBIGUOUS_HASH);
    await user.click(screen.getByRole('button', { name: 'TRON' }));

    expect(locationText()).toBe(`/analyze/tx/${AMBIGUOUS_HASH}?chain=tron`);
  });

  it('defaults to the first candidate and says so in the URL', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('textbox', { name: /search by/i }), AMBIGUOUS_HASH);
    // The live suggestion row carries the chain too — it is the affordance
    // most people reach for, and it must not fall back to a guess.
    await user.click(screen.getByRole('button', { name: /Analyze transaction/ }));

    expect(locationText()).toBe(`/analyze/tx/${AMBIGUOUS_HASH}?chain=bitcoin`);
  });

  it('hides the picker once a chain filter is set, and never navigates on typing alone', async () => {
    const user = userEvent.setup();

    // The default chain comes from settings, so pre-seed it to Ethereum: an
    // 0x… address is equally a BNB Chain address, but the visitor has already
    // said which chain they mean and must not be asked again.
    localStorage.setItem('blocksense.settings', JSON.stringify({ defaultChain: 'ethereum' }));
    renderSearch();

    await user.type(screen.getByRole('textbox', { name: /search by/i }), `0x${'ab'.repeat(20)}`);
    expect(screen.queryByText('Also valid on:')).toBeNull();
    // Typing alone never leaves the page.
    expect(locationText()).toBe('/');
  });

  it('reports an unusable value instead of opening something unrelated', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('textbox', { name: /search by/i }), 'notanaddress');
    await user.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(screen.getByText("We couldn't identify this input.")).toBeTruthy();
    expect(locationText()).toBe('/');
  });
});
