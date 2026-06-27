export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'metricflow_theme';

interface ResolveInitialThemeOptions {
  storage?: Pick<Storage, 'getItem'>;
  prefersDark?: () => boolean;
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

export function resolveInitialTheme({
  storage,
  prefersDark = () => false,
}: ResolveInitialThemeOptions = {}): ThemeMode {
  const storedTheme = storage?.getItem(THEME_STORAGE_KEY);
  if (isThemeMode(storedTheme)) {
    return storedTheme;
  }

  return prefersDark() ? 'dark' : 'light';
}
