import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/endpoints";

const AuthContext = createContext(null);

const TOKEN_KEY = "inquicontrol_token";
const USER_KEY = "inquicontrol_user";

function readStoredAuth() {
  const fromLocal = localStorage.getItem(TOKEN_KEY);
  const fromSession = sessionStorage.getItem(TOKEN_KEY);
  const token = fromLocal || fromSession;
  const rawUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  return { token, user: rawUser ? JSON.parse(rawUser) : null };
}

export function AuthProvider({ children }) {
  const initial = readStoredAuth();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  function persist(result, remember) {
    const store = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    store.setItem(TOKEN_KEY, result.token);
    store.setItem(USER_KEY, JSON.stringify(result.user));
    other.removeItem(TOKEN_KEY);
    other.removeItem(USER_KEY);
  }

  async function login(email, password, remember = true) {
    const result = await authApi.login(email, password);
    persist(result, remember);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }

  async function register(name, email, password) {
    await authApi.register(name, email, password);
    return login(email, password, true);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
