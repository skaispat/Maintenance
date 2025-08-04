import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (username, password) => {
        // Simple authentication logic
        if (username === 'admin' && password === 'admin123') {
          set({ isAuthenticated: true, user: { id: username, role: 'admin' } });
          return true;
        } else if (username === 'user' && password === 'user123') {
          set({ isAuthenticated: true, user: { id: username, role: 'user' } });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;