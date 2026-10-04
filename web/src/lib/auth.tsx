import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Role = "administrator" | "reporter" | "mentor";

export interface AuthAccount {
  username: string;
  password: string;
  role: Role;
  displayName: string;
  /** Tylko rola `mentor`: id eksperta w tabeli `mentors` (Moduł 5). */
  mentorId?: number;
}

export interface AuthSession {
  username: string;
  role: Role;
  displayName: string;
  mentorId?: number;
}

interface AuthContextValue {
  session: AuthSession | null;
  /** Zwraca sesję po udanym logowaniu, `null` przy złym loginie lub haśle. */
  login(username: string, password: string): AuthSession | null;
  logout(): void;
}

const AUTH_KEY = "splot_auth_session";

const ROLE_LABELS: Record<Role, string> = {
  administrator: "Administrator",
  reporter: "Reporter",
  mentor: "Ekspert",
};

export const AUTH_ACCOUNTS: AuthAccount[] = [
  { username: "reporter", password: "reporter123", role: "reporter", displayName: "Reporter demo" },
  { username: "admin", password: "admin123", role: "administrator", displayName: "Administrator demo" },
  { username: "ekspert", password: "ekspert123", role: "mentor", displayName: "Ekspert demo", mentorId: 1 },
];

function isRole(value: unknown): value is Role {
  return value === "administrator" || value === "reporter" || value === "mentor";
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
    const mentorId = (parsed as { mentorId?: unknown }).mentorId;
    if (!isRole(role) || typeof username !== "string" || typeof displayName !== "string") return null;
    return typeof mentorId === "number" ? { role, username, displayName, mentorId } : { role, username, displayName };
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
        if (!account) return null;
        const next: AuthSession = { username: account.username, role: account.role, displayName: account.displayName };
        if (account.mentorId !== undefined) next.mentorId = account.mentorId;
        setSession(next);
        return next;
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
  if (role === "administrator") return "/panel";
  if (role === "mentor") return "/ekspert";
  return "/";
}

/** Ścieżki wymagające roli — po wylogowaniu z nich wracamy na stronę główną. */
export function isProtectedPath(pathname: string): boolean {
  return (
    /^\/(mam-pomysl|moje-zgloszenia|panel|ekspert)(\/|$)/.test(pathname) ||
    // Moduł 5: tworzenie rozmów i ogłoszeń (podgląd rozmowy i tablica są publiczne)
    /^\/(rozmowy\/nowa|partnerzy\/nowe)\/?$/.test(pathname)
  );
}

/** Przyjmuje tylko ścieżki wewnętrzne (`/…`, nie `//…`), żeby `?next=` nie wyprowadzał poza serwis. */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Adres ekranu logowania z powrotem na `path`. */
export function loginHref(path: string): string {
  return path === "/" ? "/login" : `/login?next=${encodeURIComponent(path)}`;
}
