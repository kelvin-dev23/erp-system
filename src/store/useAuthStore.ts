import { create } from "zustand";
import { persist } from "zustand/middleware";

type User = {
  name: string;
  role?: "admin" | "sales" | "stock";
};

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;

  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      async login(username, password) {
       
        if (username === "kelvin" && password === "123") {
          set({
            isAuthenticated: true,
            user: { name: "Kelvin", role: "admin" },
          });
          return;
        }

        throw new Error("Usuário ou senha inválidos");
      },

      logout() {
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: "erp-auth", 
      version: 1,
    },
  ),
);
