import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken } from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const data = await api("/auth/refresh", { method: "POST" });
      setAccessToken(data.accessToken);
      setContext(data.context);
      return data.context;
    } catch {
      setAccessToken(null);
      setContext(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);
  const login = useCallback(async (input) => {
    const data = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setAccessToken(data.accessToken);
    setContext(data.context);
    return data.context;
  }, []);
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      setAccessToken(null);
      setContext(null);
    }
  }, []);
  const value = useMemo(
    () => ({ context, loading, login, logout, refresh }),
    [context, loading, login, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
