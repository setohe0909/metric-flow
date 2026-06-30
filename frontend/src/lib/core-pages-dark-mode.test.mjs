import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sources = {
  sqlEditor: readFileSync(new URL('../pages/queries/editor.tsx', import.meta.url), 'utf8'),
  connectors: readFileSync(new URL('../pages/datasources/manager.tsx', import.meta.url), 'utf8'),
  settings: readFileSync(new URL('../pages/settings/organization.tsx', import.meta.url), 'utf8'),
};

const requiredSurfaceTokens = [
  'var(--color-widget)',
  'var(--color-widget-header)',
  'var(--color-border-strong)',
  'var(--color-muted-text)',
  'var(--color-accent)',
];

for (const [name, source] of Object.entries(sources)) {
  test(`${name} uses shared dark-mode surface tokens`, () => {
    for (const token of requiredSurfaceTokens) {
      assert.ok(source.includes(token), `${name} should include ${token}`);
    }
  });
}

test('SQL editor uses a dark-aware Monaco theme', () => {
  assert.match(sources.sqlEditor, /theme=\{[^}]*editorTheme[^}]*\}/s);
  assert.match(sources.sqlEditor, /data-theme/);
  assert.match(sources.sqlEditor, /vs-dark/);
});

test('core pages avoid the old light-only panel primitives', () => {
  for (const [name, source] of Object.entries(sources)) {
    assert.doesNotMatch(source, /bg-white/,
      `${name} should not use bg-white for route-level surfaces`);
    assert.doesNotMatch(source, /bg-\[#eeefe9\]|bg-\[#f4f4f0\]/,
      `${name} should not use hardcoded cream backgrounds for route-level surfaces`);
    assert.doesNotMatch(source, /border-\[#23251d\]/,
      `${name} should not use hardcoded dark borders for route-level surfaces`);
    assert.doesNotMatch(source, /#23251d|#f7a501|#fff8e6|#f8f8f4|#ffa4a4|#d4f5e1|#fff4d6/,
      `${name} should use theme tokens instead of hardcoded retro colors`);
    assert.doesNotMatch(source, /bg-(red|emerald|amber)-50/,
      `${name} should not use light-only alert backgrounds`);
  }
});

test('accent-filled controls use the on-accent text token', () => {
  for (const [name, source] of Object.entries(sources)) {
    assert.doesNotMatch(source, /bg-\[var\(--color-accent\)\][^'"]*text-\[var\(--color-ink\)\]/,
      `${name} should not put ink text directly on accent-filled controls`);
    assert.doesNotMatch(source, /text-\[var\(--color-ink\)\][^'"]*bg-\[var\(--color-accent\)\]/,
      `${name} should not put ink text directly on accent-filled controls`);
  }
});
