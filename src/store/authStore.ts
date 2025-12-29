import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginUser, User } from '../services/userService';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      login: async (username: string, password: string) => {
        // Try to login with Supabase
        const user = await loginUser(username, password);
        if (user) {
          set({ isAuthenticated: true, user });
          return true;
        }

        // Fallback to hardcoded admin/user if Supabase login fails
        if (username === 'admin' && password === 'admin123') {
          const mockAdmin: User = {
            id: 9999,
            employeeName: 'Admin User',
            department: 'IT',
            phoneNumber: '0000000000',
            employeeCode: 'ADM001',
            username: 'admin',
            pageAccess: 'Admin',
            allowedPages: [], // Admin implies all
            isActive: true
          };
          set({ isAuthenticated: true, user: mockAdmin });
          return true;
        } else if (username === 'user' && password === 'user123') {
          const mockUser: User = {
            id: 8888,
            employeeName: 'Regular User',
            department: 'Operations',
            phoneNumber: '0000000000',
            employeeCode: 'USR001',
            username: 'user',
            pageAccess: 'User',
            allowedPages: ['Dashboard', 'Machines', 'Tasks', 'Daily Report', 'Calendar'],
            isActive: true
          };
          set({ isAuthenticated: true, user: mockUser });
          return true;
        }
        return false;
      },
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },
      setUser: (user: User) => set({ user }),
      refreshUser: async () => {
        const currentUser = get().user;
        if (currentUser && currentUser.id) {
          // Don't try to refresh mock users
          if (currentUser.id === 9999 || currentUser.id === 8888) return;

          try {
            const { getUserById } = await import('../services/userService');
            const updatedUser = await getUserById(currentUser.id);
            if (updatedUser) {
              set({ user: updatedUser });
            }
          } catch (error) {
            console.error("Failed to refresh user:", error);
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;