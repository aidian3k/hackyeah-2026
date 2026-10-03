import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "administrator" | "reporter";

export interface AuthAccount {
  username: string;
  password: string;
  role: Role;
  displayName: string;
}

export interface AuthSession {
  username: string;
  role: Role;
  displayName: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  login(username: string, password: string): boolean;
  logout(): void;
}

const AUTH_KEY = "splot_auth_session";

const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  reporter: "Reporter",
};

export const AUTH_ACCOUNTS: AuthAccount[] = [
  { username: "reporter", password: "reporter123", role: "reporter", displayName: "Reporter demo" },
  { username: "admin", password: "admin123", role: "administrator", displayName: "Administrator demo" },
  { username: "ops", password: "ops123", role: "administrator", displayName: "Administrator panelu" },
];

function isRole(value: unknown): value is Role {
  return value === "administrator" || value === "reporter";
}

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const role = (parsed as { role?: unknown }).role;
    const username = (parsed as { username?: unknown }).username;
    const displayName = (parsed as { displayName?: unknown }).displayName;
    if (!isRole(role) || typeof username !== "string" || typeof displayName !== "string") return null;
    return { role, username, displayName };
  } catch {
    return null;
  }
}

function saveSession(session: AuthSession | null): void {
  try {
    if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    // brak dostępu do pamięci — sesja będzie tylko w trakcie bieżącej wizyty
  }
}

function findAccount(username: string, password: string): AuthAccount | null {
  const normalized = username.trim().toLowerCase();
  const account = AUTH_ACCOUNTS.find(
    (item) => item.username.toLowerCase() === normalized && item.password === password,
  );
  return account ?? null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login(username, password) {
        const account = findAccount(username, password);
        if (!account) return false;
        setSession({ username: account.username, role: account.role, displayName: account.displayName });
        return true;
      },
      logout() {
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

export function roleHome(role: Role): string {
  return role === "administrator" ? "/panel" : "/";
}
