import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const sidebarSource = readFileSync(new URL('../components/sidebar.tsx', import.meta.url), 'utf8');

test('protected app chrome keeps preference controls out of the fixed page-action layer', () => {
  assert.match(appSource, /function\s+GlobalPreferenceControls\s*\(/, 'App should isolate floating controls behind route-aware chrome');
  assert.match(appSource, /protectedPreferenceControlPaths/, 'App should identify routes rendered by the protected shell');
  assert.match(appSource, /return\s+null;/, 'Protected routes should not render the fixed top-right controls');
  assert.match(sidebarSource, /<ThemeToggle\s*\/>/, 'Sidebar should expose the theme toggle for protected app routes');
  assert.match(sidebarSource, /<LanguageSwitcher\s*\/>/, 'Sidebar should expose language controls for protected app routes');
});
