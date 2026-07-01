import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sidebarSource = readFileSync(new URL('./sidebar.tsx', import.meta.url), 'utf8');

test('sidebar exposes an accessible collapse toggle with explicit expanded state', () => {
  assert.match(sidebarSource, /useState\(false\)/, 'sidebar should keep collapsed state locally and default to expanded');
  assert.match(sidebarSource, /aria-expanded=\{!isCollapsed\}/, 'toggle should expose current expanded state to assistive tech');
  assert.match(sidebarSource, /aria-label=\{isCollapsed \? 'Expandir sidebar' : 'Colapsar sidebar'\}/, 'icon-only toggle needs a stateful accessible label');
});

test('sidebar renders compact labels and controls only when expanded', () => {
  assert.match(sidebarSource, /isCollapsed \? 'w-20' : 'w-64'/, 'sidebar should switch between compact and full widths');
  assert.match(sidebarSource, /\{!isCollapsed && item\.name\}/, 'navigation labels should hide in collapsed mode while icons remain');
  assert.match(sidebarSource, /\{!isCollapsed && \(\s*<div className="px-4 pb-3">/s, 'preference controls should stay out of the compact rail');
});
