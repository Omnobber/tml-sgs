import { create } from "zustand";

const saved = JSON.parse(localStorage.getItem("sgs_auth") || "null");

export const useAuthStore = create((set, get) => ({
  accessToken: saved?.accessToken || "",
  refreshToken: saved?.refreshToken || "",
  user: saved?.user || null,
  selectedModule: "",
  selectedRole: "",

  setSelection: ({ module, role }) => set({ selectedModule: module || "", selectedRole: role || "" }),

  setSession: ({ accessToken, refreshToken, user }) => {
    const payload = { accessToken, refreshToken, user };
    localStorage.setItem("sgs_auth", JSON.stringify(payload));
    set(payload);
  },

  clearSession: () => {
    localStorage.removeItem("sgs_auth");
    set({ accessToken: "", refreshToken: "", user: null, selectedModule: "", selectedRole: "" });
  }
}));
