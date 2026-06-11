import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';
export type FontSize = 'small' | 'medium' | 'large';

export interface Settings {
  theme: Theme;
  fontSize: FontSize;
}

const STORAGE_KEY = 'sp-settings';

const FONT_CLASS_MAP: Record<FontSize, string> = {
  small: 'sp-font-sm',
  medium: 'sp-font-md',
  large: 'sp-font-lg',
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme === 'light' ? 'light' : 'dark',
        fontSize: ['medium', 'large'].includes(parsed.fontSize) ? parsed.fontSize : 'small',
      };
    }
  } catch {}
  return { theme: 'dark', fontSize: 'small' };
}

function applyToDOM(settings: Settings) {
  const html = document.documentElement;
  // Theme
  if (settings.theme === 'light') {
    html.classList.add('sp-light');
  } else {
    html.classList.remove('sp-light');
  }
  // Font size
  html.classList.remove('sp-font-sm', 'sp-font-md', 'sp-font-lg');
  html.classList.add(FONT_CLASS_MAP[settings.fontSize]);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    applyToDOM(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const setTheme = (theme: Theme) => setSettings(s => ({ ...s, theme }));
  const setFontSize = (fontSize: FontSize) => setSettings(s => ({ ...s, fontSize }));

  return { settings, setTheme, setFontSize };
}
