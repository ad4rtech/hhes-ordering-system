export const FLAG_MODE = "hhes_mode";   // "remember" | "session"
export const FLAG_SEEN = "hhes_seen";   // seconds since epoch of last page visit
export const REMEMBER_SECONDS = 30 * 24 * 60 * 60;
export const idleSeconds = () => Math.max(Number(process.env.SESSION_IDLE_MINUTES ?? 120) || 120, 1) * 60;