import { create } from "zustand";
import type {User} from "./types";

interface AppState {
    user: User | null;
    loading: boolean;
    setUser: (u: User | null) => void;
    setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    loading: false,
    setUser: (u) => set({ user: u }),
    setLoading: (v) => set({ loading: v }),
}));
