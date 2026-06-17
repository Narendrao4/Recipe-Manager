import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  setDark: (isDark: boolean) => void;
  toggle: () => void;
}

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

const prefersDark =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: prefersDark,
      setDark: (isDark) => {
        applyTheme(isDark);
        set({ isDark });
      },
      toggle: () =>
        set((state) => {
          const nextDark = !state.isDark;
          applyTheme(nextDark);
          return { isDark: nextDark };
        }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        applyTheme(state?.isDark ?? prefersDark);
      },
    }
  )
);

applyTheme(useThemeStore.getState().isDark);
