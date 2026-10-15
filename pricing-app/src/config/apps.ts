export type AppCode = "receipt" | "pricing" | "inspection";

export interface AppEntry {
  code: AppCode;
  name: string;
  url: string;
}

function resolveUrl(envValue: string | undefined, fallback: string) {
  const value = (envValue || "").trim();
  if (value) return value.replace(/\/$/, "");
  return fallback.replace(/\/$/, "");
}

export const APP_ENTRIES: AppEntry[] = [
  {
    code: "receipt",
    name: "汽车拆解-收车",
    url: resolveUrl(import.meta.env.VITE_APP_RECEIPT_URL, "http://localhost:5173"),
  },
  {
    code: "pricing",
    name: "汽车拆解_收货议价",
    url: resolveUrl(import.meta.env.VITE_APP_PRICING_URL, "http://localhost:5175"),
  },
  {
    code: "inspection",
    name: "华成攒碳安环巡检",
    url: resolveUrl(import.meta.env.VITE_APP_INSPECTION_URL, "http://localhost:5176"),
  },
];

export function getStoredUser(): {
  id?: number;
  username?: string;
  nickname?: string;
  role?: string;
  department?: string;
  deptIds?: string;
  appPermissions?: string[];
} {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function canAccessApp(code: AppCode, user = getStoredUser()): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return (user.appPermissions || []).includes(code);
}

export function getVisibleApps(user = getStoredUser()): AppEntry[] {
  return APP_ENTRIES.filter((app) => canAccessApp(app.code, user));
}

export function openAppInNewWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
