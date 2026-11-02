import { FLAG_MODE, FLAG_SEEN, REMEMBER_SECONDS } from "./flags";

export function setRememberCookie(remember: boolean) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  const maxAge = remember ? `; Max-Age=${REMEMBER_SECONDS}` : ""; // no Max-Age = ends with the browser session
  const now = Math.floor(Date.now() / 1000);
  document.cookie = `${FLAG_MODE}=${remember ? "remember" : "session"}; Path=/${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `${FLAG_SEEN}=${now}; Path=/${maxAge}; SameSite=Lax${secure}`;
}

export function clearRememberCookies() {
  document.cookie = `${FLAG_MODE}=; Path=/; Max-Age=0`;
  document.cookie = `${FLAG_SEEN}=; Path=/; Max-Age=0`;
}