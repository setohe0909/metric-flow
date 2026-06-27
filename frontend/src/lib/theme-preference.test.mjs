import assert from 'node:assert/strict';
import test from 'node:test';

const themeModulePath = process.env.THEME_MODULE_PATH;
if (!themeModulePath) {
  throw new Error('THEME_MODULE_PATH must point to the compiled theme-preference module');
}

const { isThemeMode, resolveInitialTheme, THEME_STORAGE_KEY } = await import(themeModulePath);

function createStorage(initialValue) {
  return {
    getItem(key) {
      assert.equal(key, THEME_STORAGE_KEY);
      return initialValue;
    },
  };
}

test('accepts only supported theme modes', () => {
  assert.equal(isThemeMode('light'), true);
  assert.equal(isThemeMode('dark'), true);
  assert.equal(isThemeMode('system'), false);
  assert.equal(isThemeMode(''), false);
  assert.equal(isThemeMode(null), false);
});

test('uses the persisted dark theme preference when available', () => {
  const theme = resolveInitialTheme({
    storage: createStorage('dark'),
    prefersDark: () => false,
  });

  assert.equal(theme, 'dark');
});

test('falls back to the system dark preference when storage is empty', () => {
  const theme = resolveInitialTheme({
    storage: createStorage(null),
    prefersDark: () => true,
  });

  assert.equal(theme, 'dark');
});

test('ignores invalid persisted values and falls back to light', () => {
  const theme = resolveInitialTheme({
    storage: createStorage('sepia'),
    prefersDark: () => false,
  });

  assert.equal(theme, 'light');
});
