import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, saveAuth, clearAuth, getStoredUser } from "@/lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("tp_token")) return;
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("tp_user", JSON.stringify(data.user));
    } catch {
      clearAuth();
      setUser(null);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      saveAuth(data.token, data.user);
      setUser(data.user);
      return data.user;
    } finally { setLoading(false); }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      saveAuth(data.token, data.user);
      setUser(data.user);
      return data.user;
    } finally { setLoading(false); }
  };

  const logout = () => { clearAuth(); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, register, logout, refresh, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
