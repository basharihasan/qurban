import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: false,
      toggle: () => {
        const newVal = !get().isDark;
        set({ isDark: newVal });
        if (newVal) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
      init: () => {
        const { isDark } = get();
        if (isDark) {
          document.documentElement.classList.add('dark');
        }
      },
    }),
    { name: 'qurban-theme' }
  )
);
