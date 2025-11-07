import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";

interface AppState {
    user: User | null;
    loading: boolean;
    setUser: (u: User | null) => void;
    setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null,
            loading: false,
            setUser: (u) => set({ user: u }),
            setLoading: (v) => set({ loading: v }),
        }),
        {
            name: "thpa-auth", // localStorage key
        }
    )
);