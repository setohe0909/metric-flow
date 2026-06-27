import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
const dashboardDetail = readFileSync(new URL('../pages/dashboards/detail.tsx', import.meta.url), 'utf8');
const dashboardWidgetRenderer = readFileSync(new URL('../features/dashboards/components/dashboard-widget-renderer.tsx', import.meta.url), 'utf8');
const dashboardStudioPalette = readFileSync(new URL('../features/dashboards/components/dashboard-studio-palette.tsx', import.meta.url), 'utf8');
const dashboardPropertiesPanel = readFileSync(new URL('../features/dashboards/components/dashboard-properties-panel.tsx', import.meta.url), 'utf8');

function extractDarkThemeBlock() {
  const match = css.match(/:root\[data-theme='dark'\]\s*{(?<body>[\s\S]*?)\n}/);
  assert.ok(match?.groups?.body, 'dark theme block should exist');
  return match.groups.body;
}

function getTokenValue(block, tokenName) {
  const escapedName = tokenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = block.match(new RegExp(`${escapedName}:\\s*([^;]+);`));
  assert.ok(match, `${tokenName} should be defined in dark theme`);
  return match[1].trim().toLowerCase();
}

test('dark theme defines dedicated studio surface tokens', () => {
  const darkTheme = extractDarkThemeBlock();
  const requiredTokens = [
    '--color-widget',
    '--color-widget-header',
    '--color-border-strong',
    '--color-border-soft',
    '--color-chart-surface',
    '--color-chart-ink',
    '--color-on-accent',
    '--shadow-retro-strong',
    '--shadow-retro-soft',
  ];

  for (const token of requiredTokens) {
    const value = getTokenValue(darkTheme, token);
    assert.notEqual(value, '#ffffff', `${token} should not be pure white in dark theme`);
    assert.notEqual(value, '#f4f4f0', `${token} should not reuse the light surface in dark theme`);
  }
});

test('dashboard detail uses dark-aware studio tokens for widget surfaces', () => {
  assert.match(dashboardDetail, /var\(--color-widget\)/);
  assert.match(dashboardDetail, /var\(--color-widget-header\)/);
  assert.match(dashboardDetail, /var\(--color-chart-surface\)/);
});


test('dashboard widget renderer uses dark-aware narrative surfaces', () => {
  assert.match(dashboardWidgetRenderer, /var\(--color-chart-surface\)/);
  assert.match(dashboardWidgetRenderer, /var\(--color-border-soft\)/);
});


test('primary accent controls keep dark readable text in dark theme', () => {
  const darkTheme = extractDarkThemeBlock();
  assert.equal(getTokenValue(darkTheme, '--color-on-accent'), '#23251d');
  assert.match(css, /\.btn-retro-primary\s*{[\s\S]*color:\s*var\(--color-on-accent\)/);
});


test('paper-like chart surfaces keep dark ink text', () => {
  const darkTheme = extractDarkThemeBlock();
  assert.equal(getTokenValue(darkTheme, '--color-chart-ink'), '#23251d');
  assert.match(dashboardWidgetRenderer, /var\(--color-chart-ink\)/);
  assert.match(dashboardDetail, /var\(--color-chart-ink\)/);
});


test('studio side panels use shared dark-aware tokens', () => {
  for (const source of [dashboardStudioPalette, dashboardPropertiesPanel]) {
    assert.match(source, /var\(--color-widget\)/);
    assert.match(source, /var\(--color-border-strong\)/);
    assert.match(source, /var\(--color-muted-text\)/);
  }
});
